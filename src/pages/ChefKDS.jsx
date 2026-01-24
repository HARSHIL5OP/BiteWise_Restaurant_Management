import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Clock, Flame, CheckCircle, AlertCircle } from 'lucide-react';

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

// Time formatting for "8 min"
const getTimeElapsed = (timestamp) => {
    if (!timestamp) return 0;
    const diff = Date.now() - timestamp.toDate().getTime();
    return Math.floor(diff / 60000);
};

// --- COMPONENTS ---

const ItemCard = ({ item, status, onAction }) => {
    const elapsed = getTimeElapsed(item.orderCreatedAt);

    // Status visual logic
    const isPreparing = status === 'preparing';
    const isUrgent = elapsed > 20;
    const isLate = elapsed > 30;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            onClick={() => onAction(item, status)}
            className={`
                relative w-full p-4 rounded-xl border-l-4 shadow-sm bg-white cursor-pointer select-none transition-all active:scale-[0.98]
                ${isPreparing
                    ? 'border-l-blue-500 ring-2 ring-blue-500/20'
                    : isLate
                        ? 'border-l-red-500'
                        : isUrgent
                            ? 'border-l-amber-500'
                            : 'border-l-green-500 hover:border-l-green-600'
                }
                mb-3 text-left overflow-hidden group
            `}
        >
            {/* Background progress tint for preparing items */}
            {isPreparing && (
                <div className="absolute inset-0 bg-blue-50/50 -z-0 pointer-events-none" />
            )}

            <div className="relative z-10 flex justify-between items-start">
                <div className="flex-1 pr-2">
                    {/* Item Name */}
                    <h3 className={`text-lg font-bold leading-tight mb-1.5 ${isPreparing ? 'text-blue-900' : 'text-gray-900'}`}>{item.name}</h3>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Table Tag */}
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-xs font-bold tracking-wide border border-gray-200">
                            T-{item.tableId}
                        </span>

                        {/* Veg/Non-Veg */}
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${item.veg ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${item.veg ? 'bg-green-600' : 'bg-red-600'}`} />
                            {item.veg ? 'VEG' : 'NON-VEG'}
                        </span>

                        {/* Quantity Badge if > 1 */}
                        {item.quantity > 1 && (
                            <span className="bg-gray-900 text-white px-2 py-0.5 rounded-md text-xs font-bold">
                                x{item.quantity}
                            </span>
                        )}
                    </div>
                </div>

                {/* Time Indicator */}
                <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-1 text-xs font-bold ${isLate ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-gray-400'}`}>
                        {isLate ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {elapsed}m
                    </div>
                    {/* Status Icon */}
                    <div className="mt-1">
                        {isPreparing ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            >
                                <Flame className="w-5 h-5 text-blue-500 fill-blue-500/20" />
                            </motion.div>
                        ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-200 group-hover:border-green-500 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-green-500 transition-colors" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hint Text (Optional, low opacity) */}
            <div className="absolute bottom-1 right-2 w-full text-right pointer-events-none">
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                    {isPreparing ? 'Tap to Complete' : 'Tap to Start'}
                </span>
            </div>
        </motion.div>
    );
};

const CategoryLane = ({ title, items, itemStates, onAction }) => {
    // Only show icons for known categories to keep it clean
    const icon = getCategoryIcon(title);

    // Sort items: Queued (Started -> Unstarted) then Time
    // However, prompt says "FAIRNESS RULE: sort by orderCreatedAt ASC".
    // We will strictly follow FIFO based on time.
    // We might want separate sub-groups for "Preparing" vs "Queued" at the top?
    // Prompt says "Visual workflow lane". "Sort by orderCreatedAt ASC".
    // We will stick to strict FIFO for fairness, but visually distinguish status.

    return (
        <div className="flex-shrink-0 w-80 md:w-96 bg-gray-50/50 rounded-2xl flex flex-col h-full overflow-hidden border border-gray-100/50">
            {/* Lane Header */}
            <div className="p-3 bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <h2 className="font-bold text-gray-800 text-lg">{title}</h2>
                </div>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {items.length}
                </span>
            </div>

            {/* Lane Content */}
            <div className="p-3 overflow-y-auto flex-1 scrollbar-hide">
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
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle size={20} className="text-gray-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-400">All Clear</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN PAGE ---

const ChefKDS = () => {
    const [orders, setOrders] = useState([]);
    const [menuData, setMenuData] = useState({});

    // Local memory state for item status (queued -> preparing -> ready)
    // Map<virtualItemId, "queued" | "preparing" | "ready">
    const [itemStates, setItemStates] = useState({});

    // 1. Fetch Menu for Categorization
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'menu'), (snapshot) => {
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
        const q = query(
            collection(db, 'orders'),
            where('status', 'in', ['in_queue', 'preparing'])
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setOrders(fetched);
        });
        return () => unsubscribe();
    }, []);

    // 3. Status Action Handler
    const handleItemAction = async (item, currentStatus) => {
        const nextStatus = currentStatus === 'preparing' ? 'ready' : 'preparing';
        const newStates = { ...itemStates, [item.virtualItemId]: nextStatus };

        if (nextStatus === 'ready') {
            // Check if ALL items in this order are now ready
            // To do this, we need to know all virtualItemIds for this order
            const order = orders.find(o => o.id === item.orderId);
            if (order) {
                // Construct check
                const allItems = order.items.map((_, idx) => `${order.id}_${idx}`);
                const allReady = allItems.every(vid => {
                    if (vid === item.virtualItemId) return true; // currently being set to ready
                    return newStates[vid] === 'ready';
                });

                if (allReady) {
                    // Update Order Status in DB
                    try {
                        await updateDoc(doc(db, 'orders', order.id), {
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
            // Move to preparing
            // Optionally update order status to preparing if it was in_queue
            const order = orders.find(o => o.id === item.orderId);
            if (order && order.status === 'in_queue') {
                updateDoc(doc(db, 'orders', order.id), { status: 'preparing' }).catch(console.error);
            }
        }

        setItemStates(newStates);
    };

    // 4. Flatten & Transform Logic (The Core)
    const categoryLanes = useMemo(() => {
        const lanes = {};

        orders.forEach(order => {
            if (!order.items) return;

            order.items.forEach((item, index) => {
                const category = menuData[item.itemId] || "Main Course"; // Fallback to Main Course if unknown matching real world assumption

                // Virtual Item ID
                const virtualItemId = `${order.id}_${index}`;

                // Filter out 'ready' items from UI (Local filtration)
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

        // Sort each lane by FIFO (orderCreatedAt)
        Object.keys(lanes).forEach(cat => {
            lanes[cat].sort((a, b) => {
                const aTime = a.orderCreatedAt?.seconds || 0;
                const bTime = b.orderCreatedAt?.seconds || 0;
                return aTime - bTime;
            });
        });

        // Ensure "Starters" usually comes first in list if possible, but object keys are unordered
        // We will handle lane sorting in render
        return lanes;

    }, [orders, menuData, itemStates]);

    // Sort keys to ensure consistent lane order (Starters -> Mains -> Etc)
    // We can use a predefined priority list
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


    return (
        <div className="flex flex-col h-screen bg-[#F0F1F3] text-gray-800 overflow-hidden font-sans">
            {/* --- TOP HEADER --- */}
            <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-30">
                <div className="flex items-center gap-4">
                    <div className="bg-gray-900 text-white p-2.5 rounded-xl">
                        <ChefHat size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900">KITCHEN DISPLAY</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Service • Item Centric</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-xs font-bold text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Queued
                        <span className="w-2 h-2 rounded-full bg-blue-500 ml-2"></span> Preparing
                        <span className="w-2 h-2 rounded-full bg-amber-500 ml-2"></span> Delayed
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-gray-900 tabular-nums">
                            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                    </div>
                </div>
            </header>

            {/* --- HORIZONTAL LANES CONTAINER --- */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <div className="flex h-full gap-6 min-w-max">
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
                        <div className="w-full flex items-center justify-center flex-col opacity-40">
                            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center animate-pulse">
                                <ChefHat size={64} className="text-gray-400" />
                            </div>
                            <h2 className="mt-8 text-3xl font-bold text-gray-400">Kitchen is Clean</h2>
                            <p className="mt-2 text-gray-500">Waiting for new orders...</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ChefKDS;
