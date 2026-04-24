import React from 'react';
import { Plus, Eye, PackageOpen, CheckCircle, Clock } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery';

export interface Donation {
    id: string;
    restaurantId: string;
    managerId: string;
    ngoId?: string | null;
    foodName?: string;
    quantity: string;
    expiryDate?: string | null;
    pickupTime: any; // Could be ISO string or Firestore Timestamp
    status: "pending" | "confirmed" | "picked" | "completed";
    location: { address: string };
    createdAt: any;
    completedAt?: any;
}

interface Props {
    restaurantId: string;
    onAdd: () => void;
    onView: (donation: Donation) => void;
}

const DonationList: React.FC<Props> = ({ restaurantId, onAdd, onView }) => {
    const { items: donations, loading, loadingMore, hasMore, loadMore, refetch } = usePaginatedQuery<Donation>(
        ['food_donations'],
        [where('restaurantId', '==', restaurantId), orderBy('createdAt', 'desc')],
        10
    );
    const [ngoMap, setNgoMap] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, 'ngos'), where('isVerified', '==', true)), (snapshot) => {
            const map: Record<string, string> = {};
            snapshot.forEach(doc => {
                map[doc.id] = doc.data().name;
            });
            setNgoMap(map);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <button
                    onClick={onAdd}
                    className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl sm:rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 text-sm font-bold min-h-[44px]"
                >
                    <Plus size={16} /> Add Donation
                </button>
                <div className="flex gap-4 items-center">
                    {loading && <span className="text-sm text-slate-500">Loading...</span>}
                    <button 
                        onClick={refetch}
                        disabled={loading}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-sm font-semibold"
                    >
                        Refresh
                    </button>
                    <p className="text-slate-500 text-sm font-medium">{donations.length} Loaded</p>
                </div>
            </div>

            {/* Empty state */}
            {donations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <PackageOpen size={48} strokeWidth={1.5} className="mb-4" />
                    <p className="font-semibold text-lg">No donations yet</p>
                    <p className="text-sm mt-1">Click "Add Donation" to help NGOs.</p>
                </div>
            )}

            {/* Mobile Card Layout */}
            {donations.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {donations.map(donation => {
                        return (
                            <div key={donation.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">{donation.foodName || 'Donation'}</h3>
                                        <p className="text-xs text-slate-500 mt-1 uppercase font-bold">NGO: {donation.ngoId ? (ngoMap[donation.ngoId] || donation.ngoId) : 'None'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-lg text-slate-800 dark:text-white">
                                            {donation.quantity}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Clock size={12} />
                                    <span>{donation.pickupTime?.toDate ? donation.pickupTime.toDate().toLocaleString() : donation.pickupTime ? new Date(donation.pickupTime).toLocaleString() : '—'}</span>
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                        ${donation.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                          donation.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 
                                          donation.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                          'bg-indigo-50 text-indigo-600 border border-indigo-200'}
                                    `}>
                                        {donation.status === 'completed' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                        {donation.status}
                                    </span>
                                    <button
                                        onClick={() => onView(donation)}
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm min-h-[36px]"
                                    >
                                        <Eye size={14} /> View
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Desktop Table */}
            {donations.length > 0 && (
                <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wider text-xs">Item</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wider text-xs">Quantity</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wider text-xs">Pickup Time</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                                    <th className="px-5 py-3.5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {donations.map(donation => {
                                    const isPending = donation.status === 'pending';
                                    const isCompleted = donation.status === 'completed';

                                    return (
                                        <tr key={donation.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-800 dark:text-white leading-none">{donation.foodName || 'Donation'}</p>
                                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">NGO: {donation.ngoId ? (ngoMap[donation.ngoId] || donation.ngoId) : 'None'}</p>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                {donation.quantity}
                                            </td>
                                            <td className="px-5 py-4 text-slate-500">
                                                {donation.pickupTime?.toDate ? donation.pickupTime.toDate().toLocaleString() : donation.pickupTime ? new Date(donation.pickupTime).toLocaleString() : '—'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                                    ${donation.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                                      donation.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 
                                                      donation.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                                      'bg-indigo-50 text-indigo-600 border border-indigo-200'}
                                                `}>
                                                    {donation.status === 'completed' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                    {donation.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <button
                                                        onClick={() => onView(donation)}
                                                        title="View"
                                                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-800 transition-all"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                </div>
            )}

            {/* Pagination Controls */}
            {hasMore && (
                <div className="mt-4 p-4 flex justify-center">
                    <button 
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:shadow-md transition-all disabled:opacity-50"
                    >
                        {loadingMore ? 'Loading...' : 'Load More Donations'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default DonationList;
