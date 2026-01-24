import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Flame, CheckCircle, ChefHat, Users, ArrowUp, LogOut } from 'lucide-react';
import { collection, onSnapshot, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- Components ---

const ProgressBar = ({ current, total }) => {
    const progress = Math.min(100, (current / total) * 100);
    return (
        <div className="h-4 bg-slate-800 rounded-full overflow-hidden w-full mt-3 border border-slate-700">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className={`h-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'} transition-all duration-300`}
            />
        </div>
    );
};

const AggregatedItemCard = ({ item, preparedCount, onIncrement, onMarkAll, onDispatch }) => {
    const isComplete = preparedCount >= item.totalQuantity;
    const isUrgent = (new Date() - item.oldestOrderAt) > 1000 * 60 * 15; // 15 mins

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
                relative overflow-hidden rounded-2xl border-2 p-5 flex flex-col justify-between h-full min-h-[280px]
                ${isComplete
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-emerald-500/20'
                    : isUrgent
                        ? 'bg-slate-900/90 border-rose-500/50 shadow-rose-900/20'
                        : 'bg-slate-900/90 border-slate-700 shadow-xl'
                }
            `}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white leading-tight mb-1">{item.name}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Clock size={14} />
                        <span>Oldest: {item.oldestOrderAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
                <div className={`
                    text-4xl font-black tabular-nums tracking-tighter
                    ${isComplete ? 'text-emerald-400' : 'text-indigo-400'}
                `}>
                    {preparedCount}<span className="text-2xl text-slate-600">/{item.totalQuantity}</span>
                </div>
            </div>

            {/* Tables */}
            <div className="flex flex-wrap gap-2 mb-4">
                {item.tableNumbers.map(t => (
                    <span key={t} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-bold border border-slate-700">
                        T-{t}
                    </span>
                ))}
                {item.tableNumbers.length > 5 && (
                    <span className="px-2 py-1 text-slate-500 text-xs">+ {item.tableNumbers.length - 5} more</span>
                )}
            </div>

            {/* Progress */}
            <ProgressBar current={preparedCount} total={item.totalQuantity} />

            {/* Actions */}
            <div className="mt-auto pt-6 grid grid-cols-2 gap-3">
                {!isComplete ? (
                    <>
                        <button
                            onClick={() => onIncrement(item.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl text-lg transition-colors border border-slate-700 active:scale-95 touch-manipulation"
                        >
                            +1 Ready
                        </button>
                        <button
                            onClick={() => onMarkAll(item.id, item.totalQuantity)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl text-lg transition-colors shadow-lg shadow-indigo-500/30 active:scale-95 touch-manipulation"
                        >
                            All Ready
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => onDispatch(item)}
                        className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl text-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 animate-pulse-once"
                    >
                        <CheckCircle size={24} />
                        Dispatch to Waiters
                    </button>
                )}
            </div>

            {isUrgent && !isComplete && (
                <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full animate-ping m-4" />
            )}
        </motion.div>
    );
};

// --- Main Page ---

const ChefKDS = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Data State
    const [orders, setOrders] = useState([]);
    const [preparedState, setPreparedState] = useState({}); // { [menuId]: count }
    const [sortBy, setSortBy] = useState('urgency'); // urgency | quantity | tables

    // Auth Logout
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error(error);
        }
    };

    // 1. Live Firestore Listener
    useEffect(() => {
        // Query active orders only
        const q = query(
            collection(db, 'orders'),
            where('status', 'in', ['in_queue', 'preparing'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedOrders = snapshot.docs.map(doc => ({
                orderId: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
            setOrders(loadedOrders);
        });

        return () => unsubscribe();
    }, []);

    // 2. Aggregation Logic (Memoized)
    const aggregatedItems = useMemo(() => {
        const groups = {};

        orders.forEach(order => {
            if (!order.items || !Array.isArray(order.items)) return;

            order.items.forEach(item => {
                // Key could be menuId or item Name as fallback (schema guarantees menuId exists usually)
                const key = item.menuId || item.name;

                if (!groups[key]) {
                    groups[key] = {
                        id: key,
                        name: item.name,
                        totalQuantity: 0,
                        tableNumbers: new Set(),
                        oldestOrderAt: order.createdAt,
                        involvedOrderIds: new Set(),
                        originalItems: [] // To track which specific item lines belong here
                    };
                }

                const group = groups[key];
                group.totalQuantity += parseInt(item.quantity) || 1;
                if (order.tableId) group.tableNumbers.add(order.tableId); // Assuming tableId is the number
                if (order.createdAt < group.oldestOrderAt) group.oldestOrderAt = order.createdAt;
                group.involvedOrderIds.add(order.orderId);
            });
        });

        return Object.values(groups).map(g => ({
            ...g,
            tableNumbers: Array.from(g.tableNumbers).sort((a, b) => a - b),
            involvedOrderIds: Array.from(g.involvedOrderIds)
        }));
    }, [orders]);

    // 3. Sorting Logic
    const sortedItems = useMemo(() => {
        return [...aggregatedItems].sort((a, b) => {
            if (sortBy === 'urgency') return a.oldestOrderAt - b.oldestOrderAt;
            if (sortBy === 'quantity') return b.totalQuantity - a.totalQuantity;
            if (sortBy === 'tables') return b.tableNumbers.length - a.tableNumbers.length;
            return 0;
        });
    }, [aggregatedItems, sortBy]);

    // 4. Action Handlers

    const handleIncrement = (id) => {
        setPreparedState(prev => {
            const current = prev[id] || 0;
            // Cap at total? Aggregation recalculates on every render? 
            // Better to just increment. Visuals handle the cap check.
            return { ...prev, [id]: current + 1 };
        });
    };

    const handleMarkAll = (id, total) => {
        setPreparedState(prev => ({ ...prev, [id]: total }));
    };

    const handleDispatch = async (item) => {
        // Optimistic UI updates could happen here, but we rely on Firestore live sync.

        // 1. Identify Orders to Update
        // "Dispatch" implies the chef is done with this batch. 
        // We will update involved orders to 'ready'. 
        // NOTE: This might mark an order ready even if other items (drinks?) are not done. 
        // In a strict KDS, we'd check partials, but per instructions, we focus on Chef Workload.
        // We'll update involved orders.

        const updates = item.involvedOrderIds.map(orderId => {
            const orderDoc = doc(db, 'orders', orderId);
            return updateDoc(orderDoc, {
                status: 'ready',
                updatedAt: serverTimestamp()
            });
        });

        try {
            await Promise.all(updates);

            // Clear local state for this item
            setPreparedState(prev => {
                const next = { ...prev };
                delete next[item.id];
                return next;
            });

        } catch (err) {
            console.error("Dispatch Failed", err);
            alert("Failed to update orders. Check console.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 pb-20">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 max-w-[2000px] mx-auto">
                <div>
                    <h1 className="text-4xl font-black text-white flex items-center gap-3">
                        <Flame className="text-orange-500 fill-orange-500" size={32} />
                        CHEF STATION
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        {orders.length} Active Orders • {aggregatedItems.length} Unique Items to Cook
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                        {[
                            { id: 'urgency', label: 'Oldest', icon: Clock },
                            { id: 'quantity', label: 'Qty', icon: ArrowUp },
                            { id: 'tables', label: 'Tables', icon: Users }
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setSortBy(opt.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all
                                    ${sortBy === opt.id
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }
                                `}
                            >
                                <opt.icon size={16} />
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-4 bg-slate-900 hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 rounded-xl border border-slate-800 hover:border-rose-900/50 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-[2000px] mx-auto">
                <AnimatePresence>
                    {sortedItems.map(item => (
                        <AggregatedItemCard
                            key={item.id}
                            item={item}
                            preparedCount={preparedState[item.id] || 0}
                            onIncrement={handleIncrement}
                            onMarkAll={handleMarkAll}
                            onDispatch={handleDispatch}
                        />
                    ))}
                </AnimatePresence>

                {sortedItems.length === 0 && (
                    <div className="col-span-full py-20 text-center opacity-50">
                        <ChefHat size={64} className="mx-auto mb-4 text-slate-600" />
                        <h2 className="text-2xl font-bold text-slate-500">All Clear! No Active Orders.</h2>
                    </div>
                )}
            </div>

            {/* Explanation / Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 p-2 text-center text-xs text-slate-600 z-50">
                KDS Aggregation Logic • Groups unique items • Tracks local prep • Bulk updates Status to Ready
            </div>
        </div>
    );
};

export default ChefKDS;
