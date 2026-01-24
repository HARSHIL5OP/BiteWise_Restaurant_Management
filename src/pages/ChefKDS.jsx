import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle, ChefHat, Timer, TrendingUp, LogOut, Hash, CheckSquare } from 'lucide-react';
import { collection, onSnapshot, query, where, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- Components ---

const OrderCard = ({ order, progress = {}, onItemClick, onMarkReady, onMarkAllItems }) => {
    // Check completion
    const isOrderComplete = useMemo(() => {
        if (!order.items || order.items.length === 0) return false;
        return order.items.every((item, idx) => {
            const prepared = progress[idx] || 0;
            return prepared >= item.quantity;
        });
    }, [order.items, progress]);

    // Timer
    const [minutesAgo, setMinutesAgo] = useState(0);
    useEffect(() => {
        const calculateTime = () => {
            // Safe check for undefined createdAt
            if (!order.createdAt) return;
            const diff = (new Date() - order.createdAt) / 1000 / 60;
            setMinutesAgo(Math.floor(diff));
        };
        calculateTime();
        const timer = setInterval(calculateTime, 30000);
        return () => clearInterval(timer);
    }, [order.createdAt]);

    const isUrgent = minutesAgo > 20;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
                flex flex-col h-full bg-white rounded-2xl shadow-sm border-2 overflow-hidden relative transition-all duration-300
                ${isOrderComplete
                    ? 'border-emerald-400 shadow-emerald-100'
                    : isUrgent
                        ? 'border-orange-500 shadow-orange-100'
                        : 'border-gray-100 hover:border-orange-200'
                }
            `}
        >
            {/* Header */}
            <div className={`
                p-4 border-b flex justify-between items-start
                ${isOrderComplete ? 'bg-emerald-50 border-emerald-100' : isUrgent ? 'bg-orange-50 border-orange-100' : 'bg-white border-gray-100'}
            `}>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xl font-black tracking-tight ${isUrgent && !isOrderComplete ? 'text-orange-600' : 'text-gray-800'}`}>
                            Table {order.tableId}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                        <Timer size={12} />
                        <span className={isUrgent && !isOrderComplete ? 'text-orange-500' : ''}>{minutesAgo}m ago</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-gray-200">
                        #{order.orderId.slice(-3)}
                    </span>
                </div>
            </div>

            {/* Items List (Original Order) */}
            <div className="p-2 flex-1 overflow-y-auto max-h-[400px]">
                {order.items.map((item, idx) => {
                    const prepared = progress[idx] || 0;
                    const isItemDone = prepared >= item.quantity;

                    return (
                        <div
                            key={idx}
                            onClick={() => onItemClick(order.orderId, idx, item.quantity)}
                            className={`
                                cursor-pointer p-3 mx-1 mb-1 rounded-xl border transition-all duration-200 group relative overflow-hidden
                                ${isItemDone
                                    ? 'bg-emerald-50 border-emerald-100'
                                    : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-sm'
                                }
                            `}
                        >
                            {/* Progress Bar Background */}
                            {!isItemDone && prepared > 0 && (
                                <div
                                    className="absolute left-0 bottom-0 top-0 bg-orange-50 transition-all duration-300 z-0"
                                    style={{ width: `${(prepared / item.quantity) * 100}%` }}
                                />
                            )}

                            <div className="relative z-10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors
                                        ${isItemDone
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : prepared > 0
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'bg-gray-100 text-gray-500 group-hover:bg-orange-50 group-hover:text-orange-600'
                                        }
                                    `}>
                                        {isItemDone ? <CheckCircle size={16} /> : `x${item.quantity}`}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold leading-tight ${isItemDone ? 'text-emerald-800 line-through decoration-emerald-500/50' : 'text-gray-800'}`}>
                                            {item.name}
                                        </h4>
                                        {prepared > 0 && !isItemDone && (
                                            <span className="text-[10px] font-bold text-orange-500">
                                                {prepared} of {item.quantity} prepared
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Action Footer */}
            <div className="p-4 mt-auto border-t border-gray-50">
                {!isOrderComplete ? (
                    <button
                        onClick={() => onMarkAllItems(order.orderId)}
                        className="w-full py-4 rounded-xl font-bold text-base uppercase tracking-wide flex items-center justify-center gap-2 transition-all duration-200 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:shadow-sm"
                    >
                        <CheckSquare size={20} />
                        Mark All Done
                    </button>
                ) : (
                    <button
                        onClick={() => onMarkReady(order.orderId)}
                        className="w-full py-4 rounded-xl font-bold text-base uppercase tracking-wide flex items-center justify-center gap-2 transition-all duration-200 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 animate-pulse-once"
                    >
                        Ready to Serve
                    </button>
                )}
            </div>
        </motion.div>
    );
};

// --- Main Page ---

const ChefKDS = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    // State
    const [orders, setOrders] = useState([]);
    const [localProgress, setLocalProgress] = useState({});
    const [sortBy, setSortBy] = useState('oldest');

    // Auth
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error(error);
        }
    };

    // Firestore Orders
    useEffect(() => {
        const q = query(
            collection(db, 'orders'),
            where('status', 'in', ['in_queue', 'preparing'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                orderId: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
            setOrders(fetched);
        });

        return () => unsubscribe();
    }, []);

    // Sort
    const sortedOrders = useMemo(() => {
        return [...orders].sort((a, b) => {
            switch (sortBy) {
                case 'newest': return b.createdAt - a.createdAt;
                case 'table': return parseInt(a.tableId) - parseInt(b.tableId);
                case 'oldest':
                default: return a.createdAt - b.createdAt;
            }
        });
    }, [orders, sortBy]);

    // Handlers
    const handleItemClick = (orderId, itemIndex, maxQuantity) => {
        setLocalProgress(prev => {
            const orderProgress = prev[orderId] || {};
            const currentCount = orderProgress[itemIndex] || 0;
            let newCount = currentCount + 1;
            if (currentCount >= maxQuantity) newCount = 0; // Reset loop

            return {
                ...prev,
                [orderId]: {
                    ...orderProgress,
                    [itemIndex]: newCount
                }
            };
        });
    };

    const handleMarkAllItems = (orderId) => {
        const order = orders.find(o => o.orderId === orderId);
        if (!order) return;

        const fullProgress = {};
        order.items.forEach((item, idx) => {
            fullProgress[idx] = item.quantity;
        });

        setLocalProgress(prev => ({
            ...prev,
            [orderId]: fullProgress
        }));
    };

    const handleMarkReady = async (orderId) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
                status: 'ready',
                updatedAt: serverTimestamp()
            });
            setLocalProgress(prev => {
                const next = { ...prev };
                delete next[orderId];
                return next;
            });
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-orange-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <div className="max-w-[2000px] mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Branding */}
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-500 rounded-xl p-3 shadow-lg shadow-orange-200">
                                <ChefHat size={28} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                    CHEF<span className="text-orange-500">DISPLAY</span>
                                </h1>
                                <p className="text-sm font-bold text-gray-400">
                                    {orders.length} Active • FIFO Mode
                                </p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3">
                            <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200">
                                {[
                                    { id: 'oldest', label: 'Time', icon: Clock },
                                    { id: 'table', label: 'Table', icon: Hash },
                                    { id: 'newest', label: 'Recent', icon: TrendingUp }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSortBy(opt.id)}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                                            ${sortBy === opt.id
                                                ? 'bg-white text-orange-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-900'
                                            }
                                        `}
                                    >
                                        <opt.icon size={16} />
                                        <span className="hidden sm:inline">{opt.label}</span>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleLogout}
                                className="p-3 bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-gray-200 shadow-sm"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-[2000px] mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 items-start">
                    <AnimatePresence mode="popLayout">
                        {sortedOrders.map(order => (
                            <OrderCard
                                key={order.orderId}
                                order={order}
                                progress={localProgress[order.orderId]}
                                onItemClick={handleItemClick}
                                onMarkAllItems={handleMarkAllItems}
                                onMarkReady={handleMarkReady}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {sortedOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 opacity-50">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle size={40} className="text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-400">Kitchen is Clear</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChefKDS;
