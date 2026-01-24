import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const WaiterDashboard = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [tables, setTables] = useState([]);
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Simulated real-time data - In production, this would be Firestore real-time listener
    useEffect(() => {
        const mockOrders = [
            { id: 1, tableNumber: 12, items: ["Paneer Tikka", "Butter Naan"], readyAt: new Date(Date.now() - 3 * 60000) },
            { id: 2, tableNumber: 8, items: ["Dal Makhani", "Garlic Naan", "Biryani"], readyAt: new Date(Date.now() - 8 * 60000) },
            { id: 3, tableNumber: 5, items: ["Butter Chicken", "Tandoori Roti"], readyAt: new Date(Date.now() - 15 * 60000) },
            { id: 4, tableNumber: 15, items: ["Spring Rolls"], readyAt: new Date(Date.now() - 1 * 60000) },
            { id: 5, tableNumber: 3, items: ["Gulab Jamun", "Ice Cream"], readyAt: new Date(Date.now() - 5 * 60000) },
            { id: 6, tableNumber: 7, items: ["Kadhai Chicken", "Butter Naan", "Mango Lassi"], readyAt: new Date(Date.now() - 12 * 60000) },
        ];

        // Group by table
        const groupedByTable = mockOrders.reduce((acc: any, order) => {
            const existing = acc.find((t: any) => t.tableNumber === order.tableNumber);
            if (existing) {
                existing.items.push(...order.items);
                existing.readyAt = new Date(Math.min(existing.readyAt, order.readyAt));
            } else {
                acc.push({
                    tableNumber: order.tableNumber,
                    items: order.items,
                    readyAt: order.readyAt,
                    id: order.id
                });
            }
            return acc;
        }, []);

        // Sort by ready time (oldest first)
        groupedByTable.sort((a: any, b: any) => a.readyAt - b.readyAt);
        setTables(groupedByTable);

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getMinutesSince = (readyAt) => {
        const diffMs = currentTime.getTime() - new Date(readyAt).getTime();
        return Math.floor(diffMs / 60000);
    };

    const getUrgencyLevel = (minutes) => {
        if (minutes >= 10) return 'urgent';
        if (minutes >= 5) return 'warning';
        return 'fresh';
    };

    const getTimeStyles = (urgency) => {
        switch (urgency) {
            case 'urgent':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'warning':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            default:
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
    };

    const getCardStyles = (urgency) => {
        switch (urgency) {
            case 'urgent':
                return 'bg-white border-red-200 shadow-lg shadow-red-100/50';
            case 'warning':
                return 'bg-white border-amber-200 shadow-lg shadow-amber-100/50';
            default:
                return 'bg-white border-slate-200 shadow-md';
        }
    };

    const markServed = (tableNumber) => {
        // In production: Update Firestore order status to "served"
        // The real-time listener will automatically remove it from UI
        setTables(tables.filter((t: any) => t.tableNumber !== tableNumber));
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
                                    {tables.length} {tables.length === 1 ? 'Table' : 'Tables'}
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
                {tables.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10 text-slate-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">All Caught Up!</h2>
                        <p className="text-sm text-slate-500">No orders ready to serve right now</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tables.map((table: any) => {
                            const minutes = getMinutesSince(table.readyAt);
                            const urgency = getUrgencyLevel(minutes);

                            return (
                                <div
                                    key={table.tableNumber}
                                    className={`rounded-3xl border-2 overflow-hidden transition-all duration-300 ${getCardStyles(urgency)}`}
                                >
                                    {/* Table Header */}
                                    <div className="p-6 pb-4">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <h2 className="text-4xl font-black text-slate-900">
                                                        {table.tableNumber}
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
                                            {table.items.map((item: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-3 py-2 px-3 bg-slate-50 rounded-xl border border-slate-100"
                                                >
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                    <span className="text-sm font-semibold text-slate-900">{item}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={() => markServed(table.tableNumber)}
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