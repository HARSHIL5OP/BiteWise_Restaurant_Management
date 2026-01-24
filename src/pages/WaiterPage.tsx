
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, ClipboardList, Utensils, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const WaiterPage = () => {
    const { userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('orders');

    // Dummy data for visualization
    const tables = [
        { id: '1', number: 1, status: 'occupied', guests: 2 },
        { id: '2', number: 2, status: 'available', guests: 0 },
        { id: '3', number: 3, status: 'reserved', guests: 4 },
        { id: '4', number: 4, status: 'occupied', guests: 3 },
    ];

    const orders = [
        { id: '101', tableNumber: 1, status: 'preparing', items: ['Pizza', 'Coke'], time: '12:30 PM' },
        { id: '102', tableNumber: 4, status: 'ready', items: ['Pasta', 'Water'], time: '12:35 PM' },
    ];

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 text-white p-2 rounded-lg">
                        <Utensils size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Waiter Dashboard</h1>
                        <p className="text-sm text-slate-500">Welcome, {userProfile?.firstName || 'Staff'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </header>

            {/* Main Content */}
            <main className="p-6 max-w-7xl mx-auto space-y-8">

                {/* Stats / Status Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Active Orders</p>
                            <h3 className="text-2xl font-bold text-slate-800">{orders.length}</h3>
                        </div>
                    </div>
                    {/* Add more stats as needed */}
                </div>

                {/* Main Views */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Tables Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">Table Status</h2>
                            <div className="flex gap-2">
                                <span className="flex items-center gap-1 text-xs font-medium text-slate-500"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available</span>
                                <span className="flex items-center gap-1 text-xs font-medium text-slate-500"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Occupied</span>
                                <span className="flex items-center gap-1 text-xs font-medium text-slate-500"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Reserved</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {tables.map(table => (
                                <div key={table.id} className={`
                                    p-6 rounded-xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105
                                    ${table.status === 'occupied' ? 'bg-rose-50 border-rose-200 hover:border-rose-400' : ''}
                                    ${table.status === 'available' ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400' : ''}
                                    ${table.status === 'reserved' ? 'bg-amber-50 border-amber-200 hover:border-amber-400' : ''}
                                `}>
                                    <h3 className="text-2xl font-bold text-slate-700">T-{table.number}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                        ${table.status === 'occupied' ? 'bg-rose-200 text-rose-700' : ''}
                                        ${table.status === 'available' ? 'bg-emerald-200 text-emerald-700' : ''}
                                        ${table.status === 'reserved' ? 'bg-amber-200 text-amber-700' : ''}
                                    `}>
                                        {table.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Orders Queue Side Panel */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="font-bold text-slate-800">Ready for Service</h2>
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">Live</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {orders.map(order => (
                                <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-slate-800">Table {order.tableNumber}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full 
                                            ${order.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
                                        `}>
                                            {order.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-2">{order.items.join(', ')}</p>
                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                        <Clock size={12} />
                                        <span>{order.time}</span>
                                    </div>
                                    {order.status === 'ready' && (
                                        <button className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                            <CheckCircle size={16} /> Mark Served
                                        </button>
                                    )}
                                </div>
                            ))}
                            {orders.length === 0 && (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    No active orders
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default WaiterPage;
