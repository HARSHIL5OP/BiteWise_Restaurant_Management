import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, Sparkles, LogOut, CheckCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

// --- HELPERS ---

// Flatten Logic: Orders from DB -> Virtual Ready Items for UI
const transformOrdersToVirtualItems = (orders: any[]) => {
    const virtualItems: any[] = [];
    orders.forEach(order => {
        if (!order.items) return;
        order.items.forEach((item: any, idx: number) => {
            // In a real item-level system, each ITEM would be marked ready.
            // Since our schema is Order-level, we rely on the order status 'ready'.
            // In the ChefKDS we mark the whole order ready when all items are done.
            // So here, we display ALL items of a 'ready' order.
            // Future-proofing: If we had item-level readiness, we'd filter here.
            virtualItems.push({
                uniqueId: `${order.id}_${idx}`,
                orderId: order.id,
                tableId: order.tableId,
                name: item.name,
                quantity: item.quantity,
                veg: item.veg,
                readyAt: order.updatedAt || order.createdAt // Best proxy for "Chef finished" time
            });
        });
    });
    return virtualItems.sort((a, b) => a.readyAt.seconds - b.readyAt.seconds); // FIFO: Oldest Ready First
};

const WaiterDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Ready Orders
    useEffect(() => {
        if (!user) return;

        // Listen to orders assigned to me AND status is ready
        const q = query(
            collection(db, 'orders'),
            where('waiterId', '==', user.uid),
            where('status', '==', 'ready')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                updatedAt: doc.data().updatedAt || doc.data().createdAt // Fallback
            }));
            setOrders(fetched);
        });
        return () => unsubscribe();
    }, [user]);

    // Derived Virtual Items
    const readyItems = useMemo(() => transformOrdersToVirtualItems(orders), [orders]);

    // Actions
    const handleMarkServed = async (virtualItem: any) => {
        // Optimistic Removal? We can do it, but db listener is fast enough.
        // Waiter serves one plate. Since our DB is order-level, 
        // we check if this is the LAST item of the order to mark order served?
        // Constraint: "status = 'served' only when all items of that order are served"
        // Since we don't have item-level status in DB, we have a limitation.
        // BUT, since the Chef marks the WHOLE order ready only when ALL items are ready...
        // ... ALL items for this order appear at once here.
        // So the waiter likely serves the whole table's ready food.

        // Compromise for this schema:
        // If waiter taps one item, we can't persist "item served" in DB (schema restriction).
        // Solution: Waiter taps "Mark Served" -> Local State hides it.
        // When ALL local items for that order are hidden -> Update DB order to 'served'.

        // Implementing Local Hiding
        // Actually, simpler UX for now with this schema:
        // Group by Table/Order visually, but keep item cards separate?
        // Or just let them clear the whole order?

        // Let's stick to the prompt: "Waiter serves items individually".
        // But since we can't save that state, if they refresh, it comes back. 
        // That's acceptable for an ephemeral waiter UI.

        // HOWEVER, to be truly useful, let's just mark the WHOLE order served 
        // if they tap any item? NO, that breaks the "Individual" flow.

        // BETTER: We will assume the "Ready" state implies "sitting on the pass".
        // When waiter takes it, they mark it served.
        // Since we can't flag individual items in DB, we will update the ORDER status 
        // to 'served' ONLY when the waiter clears the last item?
        // No, that's complex without local storage.

        // Let's go with: Tapping an item marks the ORDER as served?
        // The ChefKDS groups items. The Waiter usually carries a tray.
        // If there are 5 items ready for Table 12, chef puts them on pass.
        // Waiter takes all 5.
        // So a "Serve All for Table 12" button or individual tapping that clears all?

        // Let's implement individual tapping for the visual "Checking off", 
        // and when the last one is tapped, we fire the DB update.

        // Since I can't persist partials, I'll use a local 'servedItems' set.

        markItemLocallyServed(virtualItem);
    };

    const [servedVirtualIds, setServedVirtualIds] = useState<Set<string>>(new Set());

    const markItemLocallyServed = async (item: any) => {
        // 1. Add to local hidden set
        const newSet = new Set(servedVirtualIds);
        newSet.add(item.uniqueId);
        setServedVirtualIds(newSet);

        // 2. Check if all items for this order are now served
        const orderItems = readyItems.filter(i => i.orderId === item.orderId);
        const allServed = orderItems.every(i => newSet.has(i.uniqueId) || i.uniqueId === item.uniqueId);

        if (allServed) {
            // Update Backend
            try {
                await updateDoc(doc(db, 'orders', item.orderId), {
                    status: 'served',
                    updatedAt: serverTimestamp()
                });
                // Local set clean up for this order not strictly needed as order disappears from 'ready' query
            } catch (err) {
                console.error("Failed to serve order", err);
            }
        }
    };

    const handleLogout = async () => {
        try { await logout(); navigate('/login'); } catch (e) { console.error(e); }
    };

    // Filter out locally served items
    const visibleItems = readyItems.filter(i => !servedVirtualIds.has(i.uniqueId));

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-20">
            {/* --- HEADER --- */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 py-4 mb-2">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                            <Sparkles className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-none text-slate-900">Waiter</h1>
                            <p className="text-xs font-semibold text-slate-500 mt-1">
                                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-100 flex items-center gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                            {visibleItems.length} Ready
                        </div>
                        <button onClick={handleLogout} className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:bg-slate-200">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* --- LIST --- */}
            <div className="max-w-md mx-auto px-4 space-y-3">
                {visibleItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-24 h-24 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                            <CheckCheck className="w-10 h-10 text-slate-300" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-400">All Served</h2>
                        <p className="text-sm text-slate-400 mt-1 max-w-[200px]">Great job! Waiting for Chef to finish more items.</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {visibleItems.map((item) => {
                            // Time Logic
                            const diffMins = Math.floor((currentTime.getTime() - (item.readyAt.seconds * 1000 || Date.now())) / 60000);

                            // Visual State
                            let statusColor = "border-emerald-500";
                            let bgColor = "bg-white";
                            let textColor = "text-slate-600";
                            let timeBadge = "bg-emerald-50 text-emerald-700";

                            if (diffMins >= 10) {
                                statusColor = "border-red-500 animate-pulse";
                                timeBadge = "bg-red-50 text-red-700";
                            } else if (diffMins >= 5) {
                                statusColor = "border-amber-500";
                                timeBadge = "bg-amber-50 text-amber-700";
                            }

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                                    key={item.uniqueId}
                                    className={`relative rounded-2xl p-4 shadow-sm border-l-4 ${statusColor} ${bgColor} flex flex-col gap-3 group active:scale-[0.98] transition-transform select-none`}
                                >
                                    {/* Top Row: Table & Time */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Table</span>
                                            <span className="text-4xl font-black text-slate-900 leading-none">{item.tableId}</span>
                                        </div>
                                        <div className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 ${timeBadge}`}>
                                            <Clock size={12} />
                                            {diffMins}m Ago
                                        </div>
                                    </div>

                                    {/* Middle: Item Details */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-4 h-4 rounded-sm flex items-center justify-center border ${item.veg ? 'border-green-600' : 'border-red-600'}`}>
                                                <div className={`w-2 h-2 rounded-full ${item.veg ? 'bg-green-600' : 'bg-red-600'}`} />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 leading-tight">{item.name}</h3>
                                        </div>
                                        {item.quantity > 1 && (
                                            <div className="inline-block bg-slate-900 text-white text-xs px-2 py-0.5 rounded font-bold">
                                                x{item.quantity} Servings
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom: Action (Full Width Tap Target logic overlay) */}
                                    <button
                                        onClick={() => handleMarkServed(item)}
                                        className="mt-2 w-full py-3 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 font-bold rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors flex items-center justify-center gap-2 uppercase text-sm tracking-wide"
                                    >
                                        <CheckCircle2 size={18} />
                                        Mark Served
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default WaiterDashboard;