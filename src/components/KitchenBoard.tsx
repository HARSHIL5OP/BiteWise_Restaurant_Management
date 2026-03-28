import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, Clock, User, UtensilsCrossed, CheckCircle, AlertCircle, ChefHat } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// --- TYPES ---

interface OrderItem {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    veg: boolean;
    status: 'in_queue' | 'preparing' | 'ready' | 'served';
    category?: string; // Optional metadata if available
}

interface Order {
    id: string;
    tableId: string;
    waiterId: string;
    waiterName: string;
    createdAt: any; // Firestore Timestamp
    status: string;
    items: OrderItem[];
    paymentId?: string;
    totalAmount: number;
}

interface FlattenedItem extends OrderItem {
    orderId: string;
    tableId: string;
    waiterName: string;
    orderCreatedAt: any;
    uniqueId: string; // composed of orderId + itemIndex for uniqueness
}

// --- CONSTANTS ---

const COLUMNS = [
    { id: 'in_queue', label: 'In Queue', color: 'bg-slate-200', text: 'text-slate-600', icon: Clock },
    { id: 'preparing', label: 'In Progress', color: 'bg-amber-100', text: 'text-amber-600', icon: ChefHat },
    { id: 'ready', label: 'Prepared', color: 'bg-emerald-100', text: 'text-emerald-600', icon: CheckCircle },
    { id: 'served', label: 'Served', color: 'bg-slate-100', text: 'text-slate-400', icon: UtensilsCrossed },
];

// --- COMPONENTS ---

const ItemCard = ({ item, onClick }: { item: FlattenedItem; onClick: () => void }) => {
    // Calculate time elapsed
    const timeAgo = useMemo(() => {
        if (!item.orderCreatedAt) return 'Just now';
        const created = item.orderCreatedAt.toDate ? item.orderCreatedAt.toDate() : new Date(item.orderCreatedAt);
        const diff = Math.floor((new Date().getTime() - created.getTime()) / 60000);
        return diff < 1 ? 'Just now' : `${diff}m ago`;
    }, [item.orderCreatedAt]);

    return (
        <motion.div
            layout // Enable layout animation for smooth transitions between columns
            layoutId={item.uniqueId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.02 }}
            onClick={onClick}
            className={`
                bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer
                hover:shadow-md transition-shadow relative overflow-hidden group
                ${item.status === 'served' ? 'opacity-80 grayscale-[0.3]' : ''}
            `}
        >
            <div className={`absolute top-0 left-0 w-1 h-full 
                ${item.status === 'in_queue' ? 'bg-slate-300' : ''}
                ${item.status === 'preparing' ? 'bg-amber-500' : ''}
                ${item.status === 'ready' ? 'bg-emerald-500' : ''}
                ${item.status === 'served' ? 'bg-slate-300' : ''}
            `} />

            <div className="pl-3">
                <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{item.name}</h4>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        ×{item.quantity}
                    </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 font-medium ${item.veg ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${item.veg ? 'bg-green-600' : 'bg-red-600'}`} />
                        {item.veg ? 'Veg' : 'Non-Veg'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">T-{item.tableId}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 mt-2 pt-2 border-t border-slate-50">
                    <span className="flex items-center gap-1">
                        <User size={10} />  {item.waiterName || 'Unassigned'}
                    </span>
                    <span className="font-medium text-slate-500">{timeAgo}</span>
                </div>
            </div>
        </motion.div>
    );
};

const DetailModal = ({ item, order, onClose }: { item: FlattenedItem | null; order: Order | null; onClose: () => void }) => {
    if (!item || !order) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
                layoutId={`detail-${item.uniqueId}`} // Shared layout ID if we want smooth expansion, removed here to keep standard modal
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-10"
            >
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{item.name}</h2>
                            <p className="text-slate-500 text-sm">Item Details</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Status Tracker */}
                        <div className="flex items-center justify-between px-2">
                            {COLUMNS.map((col, idx) => {
                                const isPassed = COLUMNS.findIndex(c => c.id === item.status) >= idx;
                                const isCurrent = item.status === col.id;
                                return (
                                    <div key={col.id} className="flex flex-col items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCurrent ? `${col.color} ${col.text} ring-4 ring-offset-2 ring-indigo-100` :
                                            isPassed ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'
                                            }`}>
                                            <col.icon size={14} />
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`}>{col.label}</span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Order Metadata */}
                        <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Order Context</h3>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Order ID:</span>
                                <span className="font-mono font-medium text-slate-700">#{item.orderId.slice(0, 8)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Table:</span>
                                <span className="font-bold text-slate-800">T-{item.tableId}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Ordered At:</span>
                                <span className="font-medium text-slate-700">{order.createdAt?.toDate().toLocaleTimeString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Waiter:</span>
                                <span className="font-medium text-slate-700">{order.waiterName || 'N/A'}</span>
                            </div>
                            {order.paymentId && (
                                <div className="flex justify-between text-sm pt-2 border-t border-slate-200 mt-2">
                                    <span className="text-slate-500">Payment ID:</span>
                                    <span className="font-mono text-xs text-slate-600">{order.paymentId}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// --- MAIN BOARD COMPONENT ---

const KitchenBoard = () => {
    const { userProfile } = useAuth();
    const restaurantId = userProfile?.restaurantId || 'DEFAULT_RESTAURANT';
    const [flattenedItems, setFlattenedItems] = useState<FlattenedItem[]>([]);
    const [rawOrders, setRawOrders] = useState<Record<string, Order>>({});
    const [selectedItem, setSelectedItem] = useState<FlattenedItem | null>(null);

    // Live Data Subscription
    useEffect(() => {
        // Query active orders (ignore completed for history, but user asked for "completed" column so we might need recent completed)
        // Adjust query based on volume. Here we fetch all non-archived to show flow.
        // Assuming 'completed' order status means entirely done. But items can be 'served'.
        // Let's fetch where status != 'archived' if that existed, or just orderBy time.

        if (!restaurantId) return;

        const q = query(
            collection(db, 'restaurants', restaurantId, 'orders'),
            orderBy('createdAt', 'desc')
            // limit(50) // Optional performance limit
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const ordersMap: Record<string, Order> = {};
            const allItems: FlattenedItem[] = [];

            await Promise.all(snapshot.docs.map(async (docRef) => {
                const data = docRef.data() as Omit<Order, 'id'>;
                const order = { id: docRef.id, ...data };
                ordersMap[order.id] = order;

                const itemsQuery = query(collection(db, 'restaurants', restaurantId, 'orders', order.id, 'items'));
                const itemsDocs = await getDocs(itemsQuery);
                const itemsData = itemsDocs.docs.map(d => d.data() as OrderItem);

                if (itemsData.length > 0) {
                    itemsData.forEach((item, index) => {
                        let effectiveStatus = item.status;
                        if (!effectiveStatus) {
                            if (order.status === 'completed') effectiveStatus = 'served';
                            else if (['in_queue', 'preparing', 'ready', 'served'].includes(order.status)) {
                                effectiveStatus = order.status as any;
                            } else {
                                effectiveStatus = 'in_queue';
                            }
                        }

                        allItems.push({
                            ...item,
                            status: effectiveStatus,
                            orderId: order.id,
                            tableId: order.tableId,
                            waiterName: order.waiterId, // using waiterId conceptually
                            orderCreatedAt: order.createdAt,
                            uniqueId: `${order.id}-${index}`
                        });
                    });
                }
            }));

            // Re-sort items by order creation time (FIFO)
            // Re-sort items by order creation time (FIFO)
            allItems.sort((a, b) => { // Oldest first for kitchen
                const timeA = a.orderCreatedAt?.seconds ? a.orderCreatedAt.seconds : 0;
                const timeB = b.orderCreatedAt?.seconds ? b.orderCreatedAt.seconds : 0;
                return timeA - timeB;
            });

            setRawOrders(ordersMap);
            setFlattenedItems(allItems);
        });

        return () => unsubscribe();
    }, []);

    // Group items into columns
    const columnsData = useMemo(() => {
        const cols: Record<string, FlattenedItem[]> = {
            in_queue: [],
            preparing: [],
            ready: [],
            served: []
        };

        flattenedItems.forEach(item => {
            if (cols[item.status]) {
                cols[item.status].push(item);
            }
        });
        return cols;
    }, [flattenedItems]);

    return (
        <div className="h-full bg-slate-50 font-sans p-6 overflow-x-auto">
            <div className="flex gap-6 h-full min-w-[1000px]">
                {COLUMNS.map(col => {
                    const items = columnsData[col.id] || [];

                    return (
                        <div key={col.id} className="flex-1 flex flex-col min-w-[280px]">
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-4 px-1">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-md ${col.color} ${col.text}`}>
                                        <col.icon size={16} />
                                    </div>
                                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{col.label}</h3>
                                </div>
                                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-400 border border-slate-200">
                                    {items.length}
                                </span>
                            </div>

                            {/* Column Content */}
                            <div className="flex-1 bg-slate-100/50 rounded-2xl p-3 border border-slate-200/50 overflow-y-auto custom-scrollbar">
                                <div className="space-y-3">
                                    <AnimatePresence mode='popLayout'>
                                        {items.map(item => (
                                            <ItemCard
                                                key={item.uniqueId}
                                                item={item}
                                                onClick={() => setSelectedItem(item)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                    {items.length === 0 && (
                                        <div className="h-32 flex flex-col items-center justify-center text-slate-300 italic text-sm">
                                            <div className="w-12 h-1 bg-slate-200 rounded-full mb-2 opacity-50" />
                                            Nothing here
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <DetailModal
                        item={selectedItem}
                        order={rawOrders[selectedItem.orderId]}
                        onClose={() => setSelectedItem(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default KitchenBoard;
