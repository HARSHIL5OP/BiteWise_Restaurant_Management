import React, { useState } from 'react';
import { Check, X, Truck, CheckCircle2 } from 'lucide-react';

const STATIC_REQUESTS = [
    { id: 1, restaurantName: "Spice Garden", foodType: "cooked", quantity: "20 servings", pickupTime: "2026-03-31 21:00", status: "pending" },
    { id: 2, restaurantName: "Bistro 101", foodType: "packaged", quantity: "5 boxes", pickupTime: "2026-03-31 16:00", status: "confirmed" },
    { id: 3, restaurantName: "Golden Plate", foodType: "raw", quantity: "10 kg vegetables", pickupTime: "2026-03-31 18:00", status: "picked" },
    { id: 4, restaurantName: "Fresh Bakery", foodType: "packaged", quantity: "15 loaves", pickupTime: "2026-03-30 09:00", status: "completed" }
];

const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending': return 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400';
        case 'confirmed': return 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400';
        case 'picked': return 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400';
        case 'completed': return 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
        default: return 'bg-slate-100 text-slate-600';
    }
};

const RequestList = () => {
    const [requests, setRequests] = useState(STATIC_REQUESTS);

    const handleAction = (id: number, newStatus: string) => {
        setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Donation Requests</h3>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {requests.length} Requests Found
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                                <th className="pb-4 font-medium px-4">Restaurant</th>
                                <th className="pb-4 font-medium px-4">Food Type</th>
                                <th className="pb-4 font-medium px-4">Quantity</th>
                                <th className="pb-4 font-medium px-4">Pickup Time</th>
                                <th className="pb-4 font-medium px-4">Status</th>
                                <th className="pb-4 font-medium px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="py-4 px-4 font-semibold text-slate-800 dark:text-white">{req.restaurantName}</td>
                                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 capitalize">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs font-semibold">
                                            {req.foodType}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-medium">{req.quantity}</td>
                                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{req.pickupTime}</td>
                                    <td className="py-4 px-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize w-max ${getStatusColor(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {req.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleAction(req.id, 'confirmed')} className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors" title="Accept">
                                                        <Check size={16} />
                                                    </button>
                                                    <button onClick={() => handleAction(req.id, 'rejected')} className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition-colors" title="Reject">
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            )}
                                            {req.status === 'confirmed' && (
                                                <button onClick={() => handleAction(req.id, 'picked')} className="px-3 py-1.5 flex items-center gap-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-lg text-xs font-bold transition-colors">
                                                    <Truck size={14} /> Mark Picked
                                                </button>
                                            )}
                                            {req.status === 'picked' && (
                                                <button onClick={() => handleAction(req.id, 'completed')} className="px-3 py-1.5 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition-colors">
                                                    <CheckCircle2 size={14} /> Complete
                                                </button>
                                            )}
                                            {req.status === 'completed' && (
                                                <span className="px-3 py-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 justify-end">
                                                    <CheckCircle2 size={14} /> Done
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                                        No donation requests found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RequestList;
