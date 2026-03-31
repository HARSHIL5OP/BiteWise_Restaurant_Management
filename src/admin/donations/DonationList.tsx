import React from 'react';
import { Plus, Eye, PackageOpen, CheckCircle, Clock } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

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
    donations: Donation[];
    onAdd: () => void;
    onView: (id: string) => void;
}

const DonationList: React.FC<Props> = ({ donations, onAdd, onView }) => {
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
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={onAdd}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg transition-all shadow-lg flex items-center gap-2 text-sm font-bold"
                >
                    <Plus size={16} /> Add Donation
                </button>
                <p className="text-slate-500 text-sm font-medium">{donations.length} Donation{donations.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Empty state */}
            {donations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <PackageOpen size={48} strokeWidth={1.5} className="mb-4" />
                    <p className="font-semibold text-lg">No donations yet</p>
                    <p className="text-sm mt-1">Click "Add Donation" to help NGOs.</p>
                </div>
            )}

            {/* Table */}
            {donations.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
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
                                                        onClick={() => onView(donation.id)}
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
                </div>
            )}
        </div>
    );
};

export default DonationList;
