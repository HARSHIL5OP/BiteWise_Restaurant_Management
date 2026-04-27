import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, Sparkles, LogOut, CheckCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

// --- HELPERS ---

// Flatten Logic: Orders from DB -> Virtual Ready Items for UI
const transformOrdersToVirtualItems = (orders: any[], tablesMap: Record<string, any>, currentUserId: string) => {
    const virtualItems: any[] = [];
    orders.forEach(order => {
        if (!order.items) return;
        order.items.forEach((item: any) => {
            // Include item if it is ready AND assigned to the current waiter
            // (or fallback to order-level assignment if no item-level assignment exists for backward compatibility)
            const isAssignedToMe = item.waiterId === currentUserId || (!item.waiterId && order.waiterId === currentUserId);
            if (item.status === 'ready' && isAssignedToMe) {
                virtualItems.push({
                    uniqueId: item.id || `${order.id}_${item.name}`,
                    itemId: item.id,
                    orderId: order.id,
                    tableId: order.tableId,
                    tableNumber: tablesMap[order.tableId] || order.tableId,
                    name: item.name,
                    quantity: item.quantity,
                    veg: item.veg,
                    readyAt: item.updatedAt || order.updatedAt || order.createdAt
                });
            }
        });
    });
    // FIFO Sort: Oldest Ready First
    return virtualItems.sort((a, b) => (a.readyAt?.seconds || 0) - (b.readyAt?.seconds || 0));
};

// Group logic: By Table -> then by Time
const groupItemsByTable = (items: any[]) => {
    const groups: Record<string, any[]> = {};
    items.forEach(item => {
        const displayTable = item.tableNumber || item.tableId;
        const tableLabel = `Table ${displayTable}`;
        if (!groups[tableLabel]) groups[tableLabel] = [];
        groups[tableLabel].push(item);
    });
    return groups;
};


const WaiterDashboard = () => {
    const { user, userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const restaurantId = userProfile?.restaurantId;
    const [currentTime, setCurrentTime] = useState(new Date());
    const [orders, setOrders] = useState<any[]>([]);
    const [orderItemsMap, setOrderItemsMap] = useState<Record<string, any[]>>({});
    const [tablesMap, setTablesMap] = useState<Record<string, any>>({});

    // Performance: Analytics state
    const [completedCount, setCompletedCount] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 5000); // 5s update is sufficient for minute-level UI
        return () => clearInterval(timer);
    }, []);

    // Fetch Ready Orders
    useEffect(() => {
        if (!user || !restaurantId) return;

        // Fetch all active orders (we will filter items by waiterId locally)
        const q = query(
            collection(db, 'restaurants', restaurantId, 'orders'),
            where('status', '!=', 'completed')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(docRef => ({
                id: docRef.id,
                ...docRef.data()
            }));
            setOrders(fetchedOrders);
        });
        return () => unsubscribe();
    }, [user, restaurantId]);

    // Fetch Tables for Number Mapping
    useEffect(() => {
        if (!restaurantId) return;
        const unsubscribe = onSnapshot(collection(db, 'restaurants', restaurantId, 'tables'), (snapshot) => {
            const mapping: Record<string, any> = {};
            snapshot.docs.forEach(doc => {
                mapping[doc.id] = doc.data().tableNumber;
            });
            setTablesMap(mapping);
        });
        return () => unsubscribe();
    }, [restaurantId]);

    useEffect(() => {
        if (!restaurantId || orders.length === 0) return;
        
        const unsubs = orders.map(order => 
            onSnapshot(collection(db, 'restaurants', restaurantId, 'orders', order.id, 'items'), (snap) => {
                setOrderItemsMap(prev => ({
                     ...prev,
                     [order.id]: snap.docs.map(d => ({ id: d.id, ...d.data() }))
                }));
            })
        );
        return () => unsubs.forEach(unsub => unsub());
    }, [orders.map(o => o.id).join(','), restaurantId]);

    const fullOrders = useMemo(() => orders.map(o => ({ ...o, items: orderItemsMap[o.id] || [], updatedAt: o.updatedAt || o.createdAt })), [orders, orderItemsMap]);

    // Derived Virtual Items
    const readyItems = useMemo(() => transformOrdersToVirtualItems(fullOrders, tablesMap, user?.uid || ''), [fullOrders, tablesMap, user]);

    // Local Hidden State for Optimistic UI
    const [servedVirtualIds, setServedVirtualIds] = useState<Set<string>>(new Set());

    // Filter out served
    const visibleItems = useMemo(() => readyItems.filter(i => !servedVirtualIds.has(i.uniqueId)), [readyItems, servedVirtualIds]);

    // Group By Table
    const tableGroups = useMemo(() => groupItemsByTable(visibleItems), [visibleItems]);
    const sortedTables = useMemo(() => Object.keys(tableGroups).sort(), [tableGroups]);


    // Action Handler
    const handleMarkServed = async (virtualItem: any) => {
        // Optimistic update
        const newSet = new Set(servedVirtualIds);
        newSet.add(virtualItem.uniqueId);
        setServedVirtualIds(newSet);
        setCompletedCount(prev => prev + 1);

        if (restaurantId && virtualItem.itemId) {
            try {
                // Update item status
                const itemRef = doc(db, 'restaurants', restaurantId, 'orders', virtualItem.orderId, 'items', virtualItem.itemId);
                await updateDoc(itemRef, { status: 'served' });

                // Check if all items for order are served
                const allItems = orderItemsMap[virtualItem.orderId] || [];
                const updatedItems = allItems.map(i => i.id === virtualItem.itemId ? { ...i, status: 'served' } : i);
                const allServed = updatedItems.length > 0 && updatedItems.every(i => i.status === 'served');

                // Always update the parent order so the customer app's onSnapshot triggers
                let orderUpdates: any = {
                    updatedAt: serverTimestamp()
                };

                if (allServed) {
                    orderUpdates.completedAt = serverTimestamp();
                    orderUpdates.status = 'served';
                }

                await updateDoc(doc(db, 'restaurants', restaurantId, 'orders', virtualItem.orderId), orderUpdates);
            } catch (err) {
                console.error("Failed to serve item", err);
            }
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    // Analytics Calc
    const avgWait = useMemo(() => {
        if (visibleItems.length === 0) return 0;
        const totalMin = visibleItems.reduce((acc, i) => {
            return acc + Math.floor((currentTime.getTime() - (i.readyAt.seconds * 1000)) / 60000);
        }, 0);
        return Math.floor(totalMin / visibleItems.length);
    }, [visibleItems, currentTime]);

    const delayedCount = useMemo(() => {
        return visibleItems.filter(i => {
            const diff = Math.floor((currentTime.getTime() - (i.readyAt.seconds * 1000)) / 60000);
            return diff > 10;
        }).length;
    }, [visibleItems, currentTime]);


    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-32">

            {/* --- HEADER --- */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-all duration-300">
                <div className="max-w-xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <span className="text-white font-bold text-lg">W</span>
                            </div>
                            <div>
                                <h1 className="font-bold text-lg text-slate-900 leading-tight">Waitstaff Display</h1>
                                <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Online • Shift Active
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <h2 className="text-2xl font-mono font-bold text-slate-900 tracking-tight leading-none">
                                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </h2>
                            <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wide">Live Service</p>
                        </div>
                    </div>

                    {/* Analytics Strip */}
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200 shadow-sm min-w-max">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span className="text-xs font-bold text-slate-700">{visibleItems.length} Ready Items</span>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200 shadow-sm min-w-max">
                            <TrendingUp size={12} className="text-slate-500" />
                            <span className="text-xs font-bold text-slate-700">{avgWait}m Avg Wait</span>
                        </div>

                        {delayedCount > 0 && (
                            <div className="flex items-center gap-2 bg-rose-50 rounded-lg px-3 py-1.5 border border-rose-100 shadow-sm min-w-max">
                                <AlertTriangle size={12} className="text-rose-500" />
                                <span className="text-xs font-bold text-rose-600">{delayedCount} Delayed</span>
                            </div>
                        )}

                        <button onClick={handleLogout} className="ml-auto p-2 text-slate-400 hover:text-rose-500 transition-colors">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </header>

            {/* --- CONTENT --- */}
            <div className="max-w-xl mx-auto px-4 mt-6 space-y-8">
                <AnimatePresence mode="popLayout">
                    {sortedTables.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                <div className="w-24 h-24 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center relative z-10">
                                    <Sparkles className="w-10 h-10 text-emerald-500" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mt-6">All Caught Up!</h2>
                            <p className="text-slate-500 mt-2 max-w-[240px] leading-relaxed">
                                Excellent work. Waiting for the kitchen to prepare new orders.
                            </p>
                        </motion.div>
                    ) : (
                        sortedTables.map(tableKey => {
                            const items = tableGroups[tableKey];
                            // Get oldest time for header
                            const oldestSeconds = Math.min(...items.map(i => i.readyAt.seconds));
                            const elapsedHead = Math.floor((currentTime.getTime() - (oldestSeconds * 1000)) / 60000);

                            // Urgency Header Color
                            let headerColor = "text-slate-500";
                            let timerBg = "bg-slate-100 text-slate-600";
                            if (elapsedHead > 10) { headerColor = "text-rose-600"; timerBg = "bg-rose-100 text-rose-700"; }
                            else if (elapsedHead > 5) { headerColor = "text-amber-600"; timerBg = "bg-amber-100 text-amber-700"; }

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
                                    key={tableKey}
                                    className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
                                >
                                    {/* --- TABLE HEADER --- */}
                                    <div className="bg-slate-50/50 border-b border-slate-100 p-4 flex justify-between items-center sticky top-0 backdrop-blur-md">
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Table Service</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-black text-slate-800 tracking-tight">{tableKey.replace('Table ', '')}</span>
                                                <span className="text-sm font-bold text-slate-400">/ {items.length} Items</span>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-lg text-sm font-bold font-mono ${timerBg} flex items-center gap-2`}>
                                            <Clock size={14} />
                                            {elapsedHead}m
                                        </div>
                                    </div>

                                    {/* --- ITEMS LIST --- */}
                                    <div className="p-2">
                                        <AnimatePresence mode="popLayout">
                                            {items.map(item => {
                                                const diff = Math.floor((currentTime.getTime() - (item.readyAt.seconds * 1000 || Date.now())) / 60000);

                                                // Item Urgency
                                                let borderClass = "border-l-4 border-slate-200";
                                                let urgencyIcon = null;

                                                if (diff > 15) {
                                                    borderClass = "border-l-4 border-rose-500 bg-rose-50/10";
                                                    urgencyIcon = <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded font-bold uppercase tracking-wide">Priority</span>;
                                                } else if (diff > 10) {
                                                    borderClass = "border-l-4 border-rose-400";
                                                } else if (diff > 5) {
                                                    borderClass = "border-l-4 border-amber-400";
                                                }
                                                // Else standard green-ish handled by default or specific class

                                                return (
                                                    <motion.div
                                                        layout
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                        key={item.uniqueId}
                                                        className={`relative flex items-center p-3 mb-2 bg-white rounded-xl border border-slate-100 shadow-sm ${borderClass} group overflow-hidden`}
                                                    >
                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0 pr-4">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className={`w-3 h-3 rounded-full border-2 ${item.veg ? 'border-emerald-500' : 'border-rose-500'} flex items-center justify-center`}>
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                                </div>
                                                                {urgencyIcon}
                                                            </div>
                                                            <h4 className="text-base font-bold text-slate-800 leading-tight truncate">{item.name}</h4>
                                                            {item.quantity > 1 && (
                                                                <span className="inline-block mt-1 text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                                    x{item.quantity} Servings
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Check Action - Tap to Serve */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkServed(item);
                                                            }}
                                                            className="w-12 h-12 rounded-full bg-slate-50 hover:bg-emerald-500 border border-slate-200 hover:border-emerald-600 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm active:scale-90"
                                                        >
                                                            <CheckCheck size={20} />
                                                        </button>
                                                    </motion.div>
                                                )
                                            })}
                                        </AnimatePresence>
                                    </div>

                                    {/* Footer Banner */}
                                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Verify Before Serving
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Floating Quick Stats - Bottom */}
            <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none z-40">
                <div className="bg-slate-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-4 border border-slate-700 pointer-events-auto transition-transform hover:scale-105 cursor-default">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session</span>
                    <div className="w-px h-3 bg-slate-700"></div>
                    <span className="text-sm font-bold text-emerald-400">{completedCount} Served</span>
                </div>
            </div>
        </div>
    );
};

export default WaiterDashboard;
