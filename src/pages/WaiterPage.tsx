import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';


import { collection, onSnapshot, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const WaiterDashboard = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [orders, setOrders] = useState<any[]>([]);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Import Firestore functions inside component (or ensure imports exist)
    // Assuming imports from previous context or file start:
    // import { collection, onSnapshot, query, where, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
    // import { db } from '../lib/firebase';
    // Let's rely on the file header imports if they are there, or add them.
    // Since I am replacing the COMPONENT, I need to make sure imports are handled.
    // The previous file content had imports at the top. 
    // I'll add the necessary Firestore imports to the top of the file in a separate edit if needed, 
    // or assume they are added. Wait, the tool 'replace_file_content' replaces a block.
    // I will replace the whole component `WaiterDashboard`.

    useEffect(() => {
        if (!user) return;

        // Query: Assigned to me + Status is Ready
        const q = query(
            collection(db, 'orders'),
            where('waiterId', '==', user.uid),
            where('status', '==', 'ready'),
            // orderBy('updatedAt', 'asc') // Oldest ready first. NOTE: Requires composite index probably.
            // If index error, we can sort client side. Let's sort client side to be safe and robust.
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Ensure dates are converted
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    // Fallback to createdAt if updatedAt is missing
                    readyAt: data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date()
                };
            });

            // Client-side sort: Oldest Ready First
            fetchedOrders.sort((a, b) => a.readyAt.getTime() - b.readyAt.getTime());

            setOrders(fetchedOrders);
        }, (error) => {
            console.error("Error fetching waiter orders:", error);
        });

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => {
            unsubscribe();
            clearInterval(timer);
        };
    }, [user]);

    const getMinutesSince = (readyAt: Date) => {
        const diffMs = currentTime.getTime() - readyAt.getTime();
        return Math.floor(diffMs / 60000);
    };

    const getUrgencyLevel = (minutes: number) => {
        if (minutes >= 10) return 'urgent';
        if (minutes >= 5) return 'warning';
        return 'fresh';
    };

    const getTimeStyles = (urgency: string) => {
        switch (urgency) {
            case 'urgent':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'warning':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            default:
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
    };

    const getCardStyles = (urgency: string) => {
        switch (urgency) {
            case 'urgent':
                return 'bg-white border-red-200 shadow-lg shadow-red-100/50';
            case 'warning':
                return 'bg-white border-amber-200 shadow-lg shadow-amber-100/50';
            default:
                return 'bg-white border-slate-200 shadow-md';
        }
    };

    const markServed = async (orderId: string) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
                status: 'served',
                updatedAt: serverTimestamp()
            });
            // UI updates automatically via listener
        } catch (error) {
            console.error("Error marking served:", error);
            alert("Failed to update status. details in console.");
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900">Ready to Serve</h1>
                                <p className="text-xs text-slate-500">
                                    {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-200/50">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span className="text-sm font-bold text-white">
                                    {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
                {orders.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10 text-slate-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">All Caught Up!</h2>
                        <p className="text-sm text-slate-500">No orders ready to serve right now</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const minutes = getMinutesSince(order.readyAt);
                            const urgency = getUrgencyLevel(minutes);

                            return (
                                <div
                                    key={order.id}
                                    className={`rounded-3xl border-2 overflow-hidden transition-all duration-300 ${getCardStyles(urgency)}`}
                                >
                                    {/* Order Header with Table Info */}
                                    <div className="p-6 pb-4">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <h2 className="text-4xl font-black text-slate-900">
                                                        {order.tableId}
                                                    </h2>
                                                    <span className="text-sm font-semibold text-slate-500">TABLE</span>
                                                </div>
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getTimeStyles(urgency)}`}>
                                                    <Clock className="w-3 h-3" />
                                                    {minutes === 0 ? 'Just now' : `${minutes} min ago`}
                                                </div>
                                            </div>

                                            {/* Urgency Indicator */}
                                            {urgency === 'urgent' && (
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                                    <span className="text-xs font-bold text-red-600">Priority</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Items List */}
                                        <div className="space-y-2 mb-5">
                                            {order.items.map((item: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl border border-slate-100"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                        <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                                                    </div>
                                                    {item.quantity > 1 && (
                                                        <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">x{item.quantity}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={() => markServed(order.id)}
                                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-emerald-200/50 transition-all duration-200 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            Mark as Served
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bottom Safe Area */}
            <div className="fixed bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        </div>
    );
};

export default WaiterDashboard;