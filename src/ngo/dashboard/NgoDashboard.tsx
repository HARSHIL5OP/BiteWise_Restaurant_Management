import React from 'react';
import { Heart, Clock, CheckCircle2 } from 'lucide-react';

const mockRequests = [
    { id: 1, restaurantName: "Spice Garden", foodType: "cooked", quantity: "20 servings", pickupTime: "2026-03-31 21:00", status: "pending" },
    { id: 2, restaurantName: "Bistro 101", foodType: "packaged", quantity: "5 boxes", pickupTime: "2026-03-31 16:00", status: "confirmed" },
    { id: 3, restaurantName: "Fresh Bakery", foodType: "raw", quantity: "15 kg", pickupTime: "2026-03-30 09:00", status: "completed" }
];

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${colorClass.bg} ${colorClass.text}`}>
                <Icon size={24} />
            </div>
        </div>
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{value}</p>
    </div>
);

const NgoDashboard = () => {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Donations Received" value="120" icon={Heart} colorClass={{ bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-500' }} />
                <StatCard title="Pending Requests" value="4" icon={Clock} colorClass={{ bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-500' }} />
                <StatCard title="Completed Pickups" value="85" icon={CheckCircle2} colorClass={{ bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-500' }} />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Recent Requests</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                                <th className="pb-3 font-medium px-4">Restaurant</th>
                                <th className="pb-3 font-medium px-4">Food Type</th>
                                <th className="pb-3 font-medium px-4">Quantity</th>
                                <th className="pb-3 font-medium px-4">Pickup Time</th>
                                <th className="pb-3 font-medium px-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockRequests.map(req => (
                                <tr key={req.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="py-4 px-4 font-semibold text-slate-800 dark:text-white">{req.restaurantName}</td>
                                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 capitalize">{req.foodType}</td>
                                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{req.quantity}</td>
                                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{req.pickupTime}</td>
                                    <td className="py-4 px-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                            req.status === 'pending' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                            req.status === 'confirmed' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                            req.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                            'bg-slate-100 dark:bg-slate-800 text-slate-600'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default NgoDashboard;
