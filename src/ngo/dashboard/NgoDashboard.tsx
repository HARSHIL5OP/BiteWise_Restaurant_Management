import React from 'react';
import { Heart, Clock, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';

interface Donation {
    id: string;
    restaurantId: string;
    foodName?: string;
    quantity: string;
    expiryDate?: string | null;
    pickupTime: any;
    status: string;
}

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className={`p-2.5 sm:p-3 rounded-xl ${colorClass.bg} ${colorClass.text}`}>
                <Icon size={22} className="sm:w-6 sm:h-6" />
            </div>
        </div>
        <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1 truncate">{title}</h3>
        <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{value}</p>
    </div>
);

const NgoDashboard = () => {
    const { userProfile } = useAuth();
    const [myRequests, setMyRequests] = React.useState<Donation[]>([]);
    const [availableCount, setAvailableCount] = React.useState(0);
    const [restaurants, setRestaurants] = React.useState<Record<string, string>>({});
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!userProfile?.ngoId) return;

        // Fetch Restaurant Names
        const fetchRestaurants = async () => {
            const snap = await getDocs(collection(db, 'restaurants'));
            const map: Record<string, string> = {};
            snap.forEach(doc => map[doc.id] = doc.data().name);
            setRestaurants(map);
        };
        fetchRestaurants();

        // Listen to Active Requests for current NGO
        const qMy = query(
            collection(db, 'food_donations'),
            where('ngoId', '==', userProfile.ngoId)
        );

        const unsubscribeMy = onSnapshot(qMy, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Donation[];
            setMyRequests(data);
            setLoading(false);
        });

        // Listen to count of available donations (for stats/highlight)
        const qAvail = query(
            collection(db, 'food_donations'),
            where('ngoId', '==', null),
            where('status', '==', 'pending')
        );
        const unsubscribeAvail = onSnapshot(qAvail, (snap) => {
            setAvailableCount(snap.size);
        });

        return () => {
            unsubscribeMy();
            unsubscribeAvail();
        };
    }, [userProfile?.ngoId]);

    const stats = {
        total: myRequests.filter(d => d.status === 'completed').length,
        pending: myRequests.filter(d => ['confirmed', 'picked'].includes(d.status)).length,
        completed: myRequests.filter(d => d.status === 'completed').length
    };

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard title="Available Donations" value={availableCount} icon={ShoppingBag} colorClass={{ bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-500' }} />
                <StatCard title="Requests Accepted" value={myRequests.length} icon={Heart} colorClass={{ bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-500' }} />
                <StatCard title="Active Pickups" value={stats.pending} icon={Clock} colorClass={{ bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-500' }} />
                <StatCard title="Donations Completed" value={stats.completed} icon={CheckCircle2} colorClass={{ bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-500' }} />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Recent Activity</h3>
                    <button className="text-sm font-semibold text-indigo-500 hover:text-indigo-600">View All</button>
                </div>
                {/* Mobile Card Layout */}
                <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800 md:hidden p-0">
                    {myRequests.slice(0, 5).map(req => (
                        <div key={req.id} className="py-3 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{restaurants[req.restaurantId] || req.restaurantId}</h4>
                                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{req.foodName || 'Donation'}</p>
                                </div>
                                <span className={`px-2 py-1 text-[10px] font-bold rounded-full capitalize w-max shrink-0 ${
                                    req.status === 'confirmed' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                    req.status === 'picked' ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                                    req.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                    'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}>
                                    {req.status}
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs mt-1">
                                <div className="text-slate-500 dark:text-slate-400 font-medium">
                                    <span className="text-slate-400 mr-1">Qty:</span> {req.quantity}
                                </div>
                                {req.expiryDate && (
                                    <span className="text-rose-500 font-bold bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">
                                        Exp: {req.expiryDate}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                                <Clock size={12} className="shrink-0" />
                                <span>{req.pickupTime?.toDate ? req.pickupTime.toDate().toLocaleString() : 'Scheduling...'}</span>
                            </div>
                        </div>
                    ))}
                    {myRequests.length === 0 && (
                        <div className="py-8 text-center text-slate-500 text-sm">
                            No active donations confirmed yet.
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                                <th className="pb-3 font-medium px-4">Restaurant</th>
                                <th className="pb-3 font-medium px-4">Item Name</th>
                                <th className="pb-3 font-medium px-4">Quantity</th>
                                <th className="pb-3 font-medium px-4">Expiry</th>
                                <th className="pb-3 font-medium px-4">Pickup Status</th>
                                <th className="pb-3 font-medium px-4">Action Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myRequests.slice(0, 5).map(req => (
                                <tr key={req.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="py-4 px-4 font-semibold text-slate-800 dark:text-white">{restaurants[req.restaurantId] || req.restaurantId}</td>
                                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-medium">{req.foodName || 'Donation'}</td>
                                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{req.quantity}</td>
                                    <td className="py-4 px-4">
                                        {req.expiryDate ? (
                                            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded uppercase">
                                                Exp: {req.expiryDate}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-slate-500 text-xs">
                                        {req.pickupTime?.toDate ? req.pickupTime.toDate().toLocaleString() : 'Scheduling...'}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${
                                            req.status === 'confirmed' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                            req.status === 'picked' ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                                            req.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                            'bg-slate-100 dark:bg-slate-800 text-slate-600'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {myRequests.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500">
                                        No active donations confirmed yet. 
                                        <br />
                                        <span className="text-xs">Check available donations to get started.</span>
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

export default NgoDashboard;
