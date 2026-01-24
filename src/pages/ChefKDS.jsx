import React, { useState, useEffect } from 'react';
import { Clock, Flame, AlertCircle } from 'lucide-react';

import { collection, onSnapshot, query, where, orderBy, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const ChefKDS = () => {
    const [items, setItems] = useState([]);
    const [menuMap, setMenuMap] = useState({});
    const [currentTime, setCurrentTime] = useState(new Date());

    // Fetch Menu for Category Mapping
    useEffect(() => {
        const fetchMenu = async () => {
            const querySnapshot = await getDocs(collection(db, "menu"));
            const mapping = {};
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                mapping[data.name] = data.category; // Map by name as fallback or ID if possible. Schema has name/price/category.
                // Ideally we map by ID, but order items stores itemId. Let's try to map by ID if possible.
                mapping[doc.id] = data.category;
            });
            setMenuMap(mapping);
        };
        fetchMenu();

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Real-time Orders Listener
    useEffect(() => {
        const q = query(
            collection(db, 'orders'),
            where('status', '!=', 'served'),
            orderBy('status'), // Constraint: if filtering by inequality, first sort must be same field. 
            // Wait, firebase requires index for 'status then createdAt' if we sort by createdAt. 
            // Let's just filter status != served. We can sort client side since active orders won't be massive.
            // orderBy('createdAt', 'asc') // This might require an index. Let's do client side sort for safety.
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const activeItems = [];
            snapshot.forEach(doc => {
                const order = doc.data();
                order.items.forEach((item, index) => {
                    // Flatten items
                    activeItems.push({
                        id: `${doc.id}_${index}`,
                        originalOrderId: doc.id,
                        name: item.name,
                        // Try to find category by ID, else name, else default
                        category: menuMap[item.itemId] || menuMap[item.name] || 'Other',
                        tableNumber: order.tableId || '?',
                        createdAt: order.createdAt?.toDate() || new Date(),
                        status: order.status, // Item status inherits order status 
                        // Note: Prompt implies item status tracking, but implementation updates *parent order* status.
                        // So all items in an order share status. 
                    });
                });
            });

            // Sort by creation time (FIFO)
            activeItems.sort((a, b) => a.createdAt - b.createdAt);
            setItems(activeItems);
        });

        return () => unsubscribe();
    }, [menuMap]); // Re-run when menuMap loads to ensure categories populate

    // Computed Categories (so empty categories don't show, or show all fixed? Prompt says "grouped category-wise")
    // We'll stick to fixed + any new ones found to keep UI stable but flexible.
    const baseCategories = ["Starters", "Main Course", "Breads", "Desserts"];
    const foundCategories = [...new Set(items.map(i => i.category))];
    const categories = [...new Set([...baseCategories, ...foundCategories])];

    const getTimeSinceOrder = (createdAt) => {
        const diffMs = currentTime - new Date(createdAt);
        return Math.floor(diffMs / 60000);
    };

    const getUrgencyLevel = (minutes) => {
        if (minutes >= 20) return 'critical'; // Adjusted for real world
        if (minutes >= 10) return 'warning';
        return 'normal';
    };

    const getUrgencyStyles = (urgency, status) => {
        if (status === 'ready') return 'bg-emerald-500/10 border-emerald-500/30';

        switch (urgency) {
            case 'critical':
                return 'bg-red-500/5 border-red-500/40 shadow-red-500/20 animate-pulse-slow';
            case 'warning':
                return 'bg-amber-500/5 border-amber-500/30 shadow-amber-500/10';
            default:
                return 'bg-slate-800/40 border-slate-700/50';
        }
    };

    const getTimeColor = (urgency) => {
        switch (urgency) {
            case 'critical': return 'text-red-400';
            case 'warning': return 'text-amber-400';
            default: return 'text-slate-500';
        }
    };

    const changeStatus = async (itemId) => {
        // Find item to get Active Order ID
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        let newStatus = 'in_queue';
        if (item.status === 'in_queue') newStatus = 'preparing';
        else if (item.status === 'preparing') newStatus = 'ready';

        // Allow reverting? Prompt flow: queue -> preparing -> ready -> served.

        try {
            await updateDoc(doc(db, 'orders', item.originalOrderId), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const dismissItem = async (itemId) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        try {
            await updateDoc(doc(db, 'orders', item.originalOrderId), {
                status: 'served',
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Failed to dismiss order", err);
        }
    };

    const getItemsByCategory = (category) => {
        return items
            .filter(item => item.category === category)
            // Already sorted in listener, but sort again to be safe
            .sort((a, b) => a.createdAt - b.createdAt);
    };

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'in_queue': return { text: 'Queue', color: 'bg-slate-600' };
            case 'preparing': return { text: 'Cooking', color: 'bg-blue-500' };
            case 'ready': return { text: 'Ready', color: 'bg-emerald-500' };
            default: return { text: status, color: 'bg-slate-600' };
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Starters': return '🥗';
            case 'Main Course': return '🍛';
            case 'Breads': return '🫓';
            case 'Desserts': return '🍰';
            default: return '🍽️';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4">
            {/* Header */}
            <div className="max-w-[2000px] mx-auto mb-6">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            Kitchen Display
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Live orders • Category view</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-300">
                                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/30">
                            <Flame className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-blue-300">
                                {items.filter(i => i.status !== 'ready').length} Active
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Lanes */}
            <div className="max-w-[2000px] mx-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                {categories.map((category) => {
                    const categoryItems = getItemsByCategory(category);
                    const hasCritical = categoryItems.some(item =>
                        getUrgencyLevel(getTimeSinceOrder(item.createdAt)) === 'critical'
                    );

                    return (
                        <div key={category} className="flex flex-col h-full">
                            {/* Category Header */}
                            <div className={`sticky top-0 z-10 backdrop-blur-xl bg-slate-900/80 border rounded-2xl p-4 mb-3 transition-all duration-500 ${hasCritical ? 'border-red-500/50 shadow-lg shadow-red-500/20' : 'border-slate-700/50'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center text-2xl">
                                            {getCategoryIcon(category)}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold tracking-tight">{category}</h2>
                                            <p className="text-xs text-slate-500">
                                                {categoryItems.filter(i => i.status !== 'ready').length} in queue
                                            </p>
                                        </div>
                                    </div>
                                    {hasCritical && (
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                    )}
                                </div>
                            </div>

                            {/* Items Stream */}
                            <div className="flex-1 space-y-3">
                                {categoryItems.length === 0 ? (
                                    <div className="h-40 border border-dashed border-slate-700/50 rounded-2xl flex items-center justify-center">
                                        <p className="text-sm text-slate-600">No orders</p>
                                    </div>
                                ) : (
                                    categoryItems.map((item, index) => {
                                        const minutes = getTimeSinceOrder(item.createdAt);
                                        const urgency = getUrgencyLevel(minutes);
                                        const status = getStatusDisplay(item.status);
                                        const isFirst = index === 0 && item.status !== 'ready';
                                        const isReady = item.status === 'ready';

                                        return (
                                            <div
                                                key={item.id}
                                                className={`relative group transition-all duration-700 ease-out ${isFirst ? 'scale-[1.02]' : ''
                                                    }`}
                                                style={{
                                                    transformOrigin: 'top center',
                                                }}
                                            >
                                                <div
                                                    className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-700 ${getUrgencyStyles(urgency, item.status)
                                                        } ${isFirst && !isReady ? 'shadow-2xl ring-2 ring-white/10' : 'shadow-xl'
                                                        }`}
                                                >
                                                    {/* AI Suggestion Glow for First Item */}
                                                    {isFirst && !isReady && (
                                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 animate-gradient"></div>
                                                    )}

                                                    {/* Urgency Indicator */}
                                                    {urgency === 'critical' && !isReady && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-orange-500 to-red-500"></div>
                                                    )}

                                                    <div className="relative p-5">
                                                        {/* Item Header */}
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1 pr-4">
                                                                <h3 className={`font-bold tracking-tight transition-all duration-300 ${isFirst && !isReady ? 'text-2xl' : 'text-xl'
                                                                    }`}>
                                                                    {item.name}
                                                                </h3>
                                                                <div className="flex items-center gap-3 mt-2">
                                                                    <span className="text-xs text-slate-500 font-medium">
                                                                        Table {item.tableNumber}
                                                                    </span>
                                                                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${getTimeColor(urgency)}`}>
                                                                        <Clock className="w-3 h-3" />
                                                                        {minutes}m
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Status Badge */}
                                                            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${status.color} transition-all duration-300`}>
                                                                {status.text}
                                                            </div>
                                                        </div>

                                                        {/* Time Pressure Bar */}
                                                        {!isReady && (
                                                            <div className="mb-4">
                                                                <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full transition-all duration-1000 rounded-full ${urgency === 'critical' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                                                                            urgency === 'warning' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                                                                                'bg-gradient-to-r from-blue-500 to-cyan-500'
                                                                            }`}
                                                                        style={{
                                                                            width: `${Math.min(100, (minutes / 15) * 100)}%`
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Action Buttons */}
                                                        <div className="flex gap-2">
                                                            {item.status === 'queued' && (
                                                                <button
                                                                    onClick={() => changeStatus(item.id)}
                                                                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-blue-500/50 active:scale-95"
                                                                >
                                                                    Start Cooking
                                                                </button>
                                                            )}
                                                            {item.status === 'preparing' && (
                                                                <button
                                                                    onClick={() => changeStatus(item.id)}
                                                                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-emerald-500/50 active:scale-95"
                                                                >
                                                                    Mark Ready
                                                                </button>
                                                            )}
                                                            {item.status === 'ready' && (
                                                                <button
                                                                    onClick={() => dismissItem(item.id)}
                                                                    className="flex-1 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg active:scale-95"
                                                                >
                                                                    Dismiss
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* AI Next Best Item Indicator */}
                                                        {isFirst && !isReady && (
                                                            <div className="mt-3 flex items-center gap-2 text-xs text-blue-400/80 animate-pulse-slow">
                                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                                                <span className="font-medium">AI suggests: Cook this next</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Floating Stats */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3">
                {items.filter(i => getUrgencyLevel(getTimeSinceOrder(i.createdAt)) === 'critical' && i.status !== 'ready').length > 0 && (
                    <div className="px-4 py-3 bg-red-500/20 backdrop-blur-xl border border-red-500/50 rounded-xl shadow-2xl shadow-red-500/20 animate-pulse-slow">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-bold text-red-300">
                                {items.filter(i => getUrgencyLevel(getTimeSinceOrder(i.createdAt)) === 'critical' && i.status !== 'ready').length} Critical
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
        </div>
    );
};

export default ChefKDS;
