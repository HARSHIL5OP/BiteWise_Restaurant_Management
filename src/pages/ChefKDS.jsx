import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Clock, Flame, CheckCircle, AlertCircle, LogOut, Sun, Moon, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

// --- CONSTANTS & UTILS ---

const CATEGORY_ICONS = {
    "Starters": "🥗",
    "Appetizer": "🍟",
    "Appetizers": "🍟",
    "Main Course": "🍛",
    "Breads": "🫓",
    "Beverages": "🥤",
    "Dessert": "🍰",
    "Desserts": "🍰",
    "Biryani": "🍚",
    "Rice": "🍚",
    "Soup": "🥣",
    "Tandoori": "🍗",
    "Other": "🍽️"
};

const getCategoryIcon = (cat) => CATEGORY_ICONS[cat] || CATEGORY_ICONS["Other"];

// Time formatting for logic
const getTimeElapsed = (timestamp) => {
    if (!timestamp) return 0;
    const diff = Date.now() - timestamp.toDate().getTime();
    return Math.floor(diff / 60000);
};

// --- COMPONENTS ---

// 1. Operational Instruction Bar
const InstructionBar = () => (
    <div className="mx-8 mt-6 mb-2 px-6 py-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors duration-300">
        <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Info size={16} className="text-indigo-500" />
                Kitchen Workflow Guide
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Follow the three-stage workflow. Sort by FIFO (First-In, First-Out).
            </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
                <div className="w-1 h-8 rounded-full bg-emerald-500"></div>
                <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Queued</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500">Awaiting prep</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-1 h-8 rounded-full bg-indigo-500 ring-4 ring-indigo-500/10"></div>
                <div>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Preparing</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500">Tap to start</p>
                </div>
            </div>
            <div className="flex items-center gap-3 opacity-50">
                <div className="w-1 h-8 rounded-full bg-slate-400 border border-dashed border-slate-500"></div>
                <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Ready</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500">Tap to complete</p>
                </div>
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block"></div>

            <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Delayed &gt; 20m
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded border border-rose-200 dark:border-rose-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Late &gt; 30m
                </span>
            </div>
        </div>
    </div>
);

const ItemCard = ({ item, status, onAction }) => {
    const [elapsed, setElapsed] = useState(getTimeElapsed(item.orderCreatedAt));

    // Update time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(getTimeElapsed(item.orderCreatedAt));
        }, 60000);
        return () => clearInterval(interval);
    }, [item.orderCreatedAt]);

    // Status visual logic
    const isPreparing = status === 'preparing';
    const isUrgent = elapsed > 20;
    const isLate = elapsed > 30;

    // Premium Border & Ring Logic
    const getStatusColorClasses = () => {
        if (isLate) return 'border-l-rose-500 dark:border-l-rose-500 ring-rose-500/20';
        if (isUrgent) return 'border-l-amber-500 dark:border-l-amber-500';
        if (isPreparing) return 'border-l-indigo-500 dark:border-l-indigo-500 ring-indigo-500/20';
        return 'border-l-emerald-500 dark:border-l-emerald-500'; // Queued
    };

    const getStatusGlow = () => {
        if (isPreparing) return 'ring-2';
        if (isLate) return 'ring-2';
        return '';
    };

    const getTimeColor = () => {
        if (isLate) return 'text-rose-500 font-bold';
        if (isUrgent) return 'text-amber-500 font-bold';
        return 'text-slate-400 dark:text-slate-500';
    };

    const tooltipText = isPreparing ? "Preparing – Tap again to mark as Ready" : "Tap to start preparation";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            onClick={() => onAction(item, status)}
            className={`
                relative w-full p-4 rounded-xl border-l-[4px] border-y border-r border-slate-200 dark:border-slate-800 
                bg-white dark:bg-slate-900 shadow-sm hover:shadow-md
                cursor-pointer select-none transition-all duration-200
                hover:border-indigo-500/30 dark:hover:border-indigo-500/30
                mb-3 text-left overflow-hidden group
                ${getStatusColorClasses()}
                ${getStatusGlow()}
            `}
            title={tooltipText}
        >
            {/* Subtle background flash for preparing */}
            {isPreparing && (
                <div className="absolute inset-0 bg-indigo-50/50 dark:bg-indigo-500/5 -z-0 pointer-events-none" />
            )}

            <div className="relative z-10 flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    {/* Item Name */}
                    <h3 className={`text-lg font-bold leading-snug mb-2 truncate ${isPreparing ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-white'}`}>
                        {item.name}
                    </h3>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Table Tag */}
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md text-xs font-bold tracking-wide border border-slate-200 dark:border-slate-700">
                            T-{item.tableId}
                        </span>

                        {/* Veg/Non-Veg Minimal Dot */}
                        <div className={`w-2 h-2 rounded-full ${item.veg ? 'bg-emerald-500' : 'bg-rose-500'}`} title={item.veg ? 'Veg' : 'Non-Veg'} />

                        {/* Quantity Badge if > 1 */}
                        {item.quantity > 1 && (
                            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm shadow-indigo-500/20">
                                x{item.quantity}
                            </span>
                        )}
                    </div>
                </div>

                {/* Time & Action */}
                <div className="flex flex-col items-end gap-2 text-right">
                    <div className={`flex items-center gap-1.5 text-sm tabular-nums font-mono ${getTimeColor()}`}>
                        {isLate ? <AlertCircle size={14} /> : <Clock size={14} />}
                        {elapsed}m
                    </div>

                    {/* Action Icon / Status Indicator */}
                    <div className="mt-auto">
                        {isPreparing ? (
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 rounded-full text-indigo-600 dark:text-indigo-400">
                                <Flame size={18} fill="currentColor" className="opacity-80" />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 group-hover:border-emerald-500 dark:group-hover:border-emerald-500 flex items-center justify-center transition-colors">
                                <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-emerald-500 transition-colors" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hint Overlay (Hover) */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors pointer-events-none" />
        </motion.div>
    );
};

const CategoryLane = ({ title, items, itemStates, onAction }) => {
    const icon = getCategoryIcon(title);

    return (
        <div className="flex-1 min-w-[320px] bg-white dark:bg-slate-900 rounded-2xl flex flex-col h-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Lane Header */}
            <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="text-lg opacity-80 grayscale-[0.5]">{icon}</span>
                    <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base">{title}</h2>
                </div>
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-slate-300 dark:border-slate-700">
                    {items.length}
                </span>
            </div>

            {/* Lane Content - Refined spacing */}
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                        <ItemCard
                            key={item.virtualItemId}
                            item={item}
                            status={itemStates[item.virtualItemId] || 'queued'}
                            onAction={onAction}
                        />
                    ))}
                </AnimatePresence>

                {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle size={20} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kitchen Clear</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN PAGE ---

const ChefKDS = () => {
    const { logout, userProfile } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const restaurantId = localStorage.getItem('restaurantId') || userProfile?.restaurantId || 'DEFAULT_RESTAURANT';
    const [orders, setOrders] = useState([]);
    const [menuData, setMenuData] = useState({});
    const [itemStates, setItemStates] = useState({});
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time for the header clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 1. Fetch Menu for Categorization
    useEffect(() => {
        if (!restaurantId) return;
        const unsubscribe = onSnapshot(collection(db, 'restaurants', restaurantId, 'menu'), (snapshot) => {
            const menuMap = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                menuMap[doc.id] = data.category || "Other";
            });
            setMenuData(menuMap);
        });
        return () => unsubscribe();
    }, []);

    // 2. Fetch Active Orders
    useEffect(() => {
        if (!restaurantId) return;
        const q = query(
            collection(db, 'restaurants', restaurantId, 'orders'),
            where('status', 'in', ['in_queue', 'preparing'])
        );
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const fetchedOrdersPromises = snapshot.docs.map(async (docRef) => {
                const data = docRef.data();
                const itemsSnap = await getDocs(collection(db, 'restaurants', restaurantId, 'orders', docRef.id, 'items'));
                const items = itemsSnap.docs.map(i => i.data());

                return {
                    id: docRef.id,
                    ...data,
                    items
                };
            });
            const fetched = await Promise.all(fetchedOrdersPromises);
            setOrders(fetched);
        });
        return () => unsubscribe();
    }, []);

    // 3. Status Action Handler
    const handleItemAction = async (item, currentStatus) => {
        const nextStatus = currentStatus === 'preparing' ? 'ready' : 'preparing';
        const newStates = { ...itemStates, [item.virtualItemId]: nextStatus };

        if (nextStatus === 'ready') {
            const order = orders.find(o => o.id === item.orderId);
            if (order) {
                const allItems = order.items.map((_, idx) => `${order.id}_${idx}`);
                const allReady = allItems.every(vid => {
                    if (vid === item.virtualItemId) return true;
                    return newStates[vid] === 'ready';
                });

                if (allReady) {
                    try {
                        await updateDoc(doc(db, 'restaurants', restaurantId, 'orders', order.id), {
                            status: 'ready',
                            updatedAt: serverTimestamp()
                        });
                        console.log("Order marked ready:", order.id);
                    } catch (err) {
                        console.error("Failed to update order status", err);
                    }
                }
            }
        } else if (currentStatus === 'queued') {
            const order = orders.find(o => o.id === item.orderId);
            if (order && order.status === 'in_queue') {
                updateDoc(doc(db, 'restaurants', restaurantId, 'orders', order.id), { status: 'preparing' }).catch(console.error);
            }
        }

        setItemStates(newStates);
    };

    // 4. Flatten & Transform Logic
    const categoryLanes = useMemo(() => {
        const lanes = {};
        orders.forEach(order => {
            if (!order.items) return;
            order.items.forEach((item, index) => {
                const category = menuData[item.itemId] || "Main Course";
                const virtualItemId = `${order.id}_${index}`;
                if (itemStates[virtualItemId] === 'ready') return;

                const virtualItem = {
                    virtualItemId,
                    itemId: item.itemId,
                    name: item.name,
                    quantity: item.quantity,
                    veg: item.veg ?? true,
                    tableId: order.tableId,
                    orderId: order.id,
                    orderCreatedAt: order.createdAt,
                    category
                };

                if (!lanes[category]) lanes[category] = [];
                lanes[category].push(virtualItem);
            });
        });

        // FIFO Sort
        Object.keys(lanes).forEach(cat => {
            lanes[cat].sort((a, b) => (a.orderCreatedAt?.seconds || 0) - (b.orderCreatedAt?.seconds || 0));
        });

        return lanes;
    }, [orders, menuData, itemStates]);

    const sortedCategories = useMemo(() => {
        const priority = ["Starters", "Appetizers", "Soup", "Main Course", "Breads", "Biryani", "Rice", "Dessert", "Beverages"];
        return Object.keys(categoryLanes).sort((a, b) => {
            const idxA = priority.indexOf(a);
            const idxB = priority.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [categoryLanes]);

    // Calculate Counts
    const queuedCount = Object.values(categoryLanes).flat().filter(item => (itemStates[item.virtualItemId] || 'queued') === 'queued').length;
    const preparingCount = Object.values(categoryLanes).flat().filter(item => itemStates[item.virtualItemId] === 'preparing').length;

    return (
        <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 overflow-hidden font-sans transition-colors duration-300">

            {/* --- TOP HEADER --- */}
            <header className="flex-shrink-0 bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm z-30 transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                        <ChefHat size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">KITCHEN DISPLAY</h1>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Live Order Execution
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Live Stats */}
                    <div className="hidden md:flex items-center gap-4 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{queuedCount} Queued</span>
                        </div>
                        <div className="w-px h-3 bg-slate-300 dark:bg-slate-600"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{preparingCount} Preparing</span>
                        </div>
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500/50 hover:text-indigo-500 transition-all text-slate-600 dark:text-slate-400"
                    >
                        {theme === 'light' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-400" />}
                    </button>

                    <div className="text-right pl-4 border-l border-slate-200 dark:border-slate-800">
                        <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight font-mono">
                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                    </div>

                    <button
                        onClick={async () => {
                            try {
                                await logout();
                            } catch (error) {
                                console.error("Logout failed", error);
                            }
                        }}
                        className="p-3 bg-red-50 dark:bg-rose-500/10 hover:bg-red-100 dark:hover:bg-rose-500/20 text-red-500 hover:text-red-600 rounded-xl transition-all border border-transparent dark:border-rose-500/20"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Instruction Bar */}
            <InstructionBar />

            {/* --- AUTO-GRID LANES CONTAINER --- */}
            <main className="flex-1 overflow-hidden px-8 pb-8 pt-2">
                <div className="flex h-full gap-6">
                    {/* Render Lanes */}
                    {sortedCategories.length > 0 ? (
                        sortedCategories.map(cat => (
                            <CategoryLane
                                key={cat}
                                title={cat}
                                items={categoryLanes[cat]}
                                itemStates={itemStates}
                                onAction={handleItemAction}
                            />
                        ))
                    ) : (
                        // Empty State
                        <div className="w-full flex items-center justify-center flex-col opacity-50">
                            <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-300 dark:border-slate-700">
                                <ChefHat size={40} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-500 dark:text-slate-400">Kitchen is Clean</h2>
                            <p className="mt-2 text-slate-400 dark:text-slate-500 font-medium">Awaiting new orders to process...</p>
                        </div>
                    )}
                </div>
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.3);
                    border-radius: 20px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(71, 85, 105, 0.4);
                }
            `}</style>
        </div>
    );
};

export default ChefKDS;
