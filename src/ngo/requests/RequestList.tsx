import React, { useState, useEffect } from 'react';
import { Check, Truck, CheckCircle2, Calendar, MapPin, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs, Timestamp } from 'firebase/firestore';

interface Donation {
    id: string;
    restaurantId: string;
    foodName?: string;
    quantity: string;
    pickupTime: any;
    expiryDate: string | null;
    status: 'pending' | 'confirmed' | 'picked' | 'completed';
    ngoId?: string | null;
    location?: { address: string };
}

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
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'available' | 'my-requests'>('available');
    const [availableDonations, setAvailableDonations] = useState<Donation[]>([]);
    const [myRequests, setMyRequests] = useState<Donation[]>([]);
    const [restaurants, setRestaurants] = React.useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const [pickupTime, setPickupTime] = useState('');

    useEffect(() => {
        if (!userProfile?.ngoId) return;

        // Fetch Restaurant Names
        const fetchRestaurants = async () => {
            const snap = await getDocs(collection(db, 'restaurants'));
            const map: Record<string, string> = {};
            snap.forEach(doc => map[doc.id] = doc.data().name);
            setRestaurants(map);
        };
        fetchRestaurants();

        // Listen to Available Donations (ngoId is null and status is pending)
        const qAvailable = query(
            collection(db, 'food_donations'),
            where('ngoId', '==', null),
            where('status', '==', 'pending')
        );

        const unsubscribeAvailable = onSnapshot(qAvailable, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Donation[];
            setAvailableDonations(data);
            setLoading(false);
        });

        // Listen to My Requests
        const qMy = query(
            collection(db, 'food_donations'),
            where('ngoId', '==', userProfile.ngoId)
        );

        const unsubscribeMy = onSnapshot(qMy, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Donation[];
            setMyRequests(data.sort((a, b) => {
                const dateA = a.pickupTime?.seconds || 0;
                const dateB = b.pickupTime?.seconds || 0;
                return dateB - dateA;
            }));
        });

        return () => {
            unsubscribeAvailable();
            unsubscribeMy();
        };
    }, [userProfile?.ngoId]);

    const handleAccept = async () => {
        if (!acceptingId || !pickupTime) return;
        try {
            const docRef = doc(db, 'food_donations', acceptingId);
            await updateDoc(docRef, {
                ngoId: userProfile.ngoId,
                status: 'confirmed',
                pickupTime: Timestamp.fromDate(new Date(pickupTime))
            });
            setAcceptingId(null);
            setPickupTime('');
        } catch (error) {
            console.error("Failed to accept donation", error);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const docRef = doc(db, 'food_donations', id);
            await updateDoc(docRef, { status: newStatus });
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    const currentData = activeTab === 'available' ? availableDonations : myRequests;

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-max">
                <button
                    onClick={() => setActiveTab('available')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'available' 
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    Available Donations ({availableDonations.length})
                </button>
                <button
                    onClick={() => setActiveTab('my-requests')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'my-requests' 
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    My Requests ({myRequests.length})
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:p-6 shadow-sm overflow-hidden md:overflow-visible">
                {/* Mobile Card Layout */}
                <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800 md:hidden p-0">
                    {currentData.map(req => (
                        <div key={req.id} className="p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white capitalize">{req.foodName || 'Food Donation'}</p>
                                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{restaurants[req.restaurantId] || req.restaurantId}</p>
                                </div>
                                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full capitalize w-max shrink-0 ${getStatusColor(req.status)}`}>
                                    {req.status}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-slate-500 dark:text-slate-500">Qty:</span> {req.quantity}
                                </div>
                                <div className="flex items-center gap-1.5 justify-end">
                                    <MapPin size={12} className="shrink-0" />
                                    <span className="truncate">{req.location?.address || 'Pickup Point'}</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs mt-1">
                                {req.pickupTime ? (
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Clock size={12} className="shrink-0" />
                                        <span>{req.pickupTime?.toDate ? req.pickupTime.toDate().toLocaleString() : req.pickupTime}</span>
                                    </div>
                                ) : (
                                    <span className="text-slate-400">Not scheduled</span>
                                )}
                                {req.expiryDate && (
                                    <div className="flex items-center gap-1 text-rose-500 font-bold bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md">
                                        <AlertCircle size={10} className="shrink-0" />
                                        Exp: {req.expiryDate}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                                {activeTab === 'available' && (
                                    <button 
                                        onClick={() => setAcceptingId(req.id)}
                                        className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 min-h-[40px]"
                                    >
                                        <Check size={16} /> Accept Donation
                                    </button>
                                )}
                                {activeTab === 'my-requests' && (
                                    <>
                                        {req.status === 'confirmed' && (
                                            <button onClick={() => handleUpdateStatus(req.id, 'picked')} className="flex-1 sm:flex-none px-4 py-2 flex items-center justify-center gap-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-xl text-sm font-bold transition-colors min-h-[40px]">
                                                <Truck size={16} /> Mark Picked
                                            </button>
                                        )}
                                        {req.status === 'picked' && (
                                            <button onClick={() => handleUpdateStatus(req.id, 'completed')} className="flex-1 sm:flex-none px-4 py-2 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-xl text-sm font-bold transition-colors min-h-[40px]">
                                                <CheckCircle2 size={16} /> Complete
                                            </button>
                                        )}
                                        {req.status === 'completed' && (
                                            <span className="w-full text-center px-3 py-2 text-sm font-bold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
                                                <CheckCircle2 size={16} /> Received
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {currentData.length === 0 && (
                        <div className="py-12 text-center text-slate-500 dark:text-slate-400 p-4">
                            <Calendar size={40} className="mx-auto mb-4 opacity-20" />
                            <p>No {activeTab === 'available' ? 'donations available right now' : 'active requests detected'}.</p>
                        </div>
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                                <th className="pb-4 font-medium px-4">Donation Details</th>
                                <th className="pb-4 font-medium px-4">Quantity</th>
                                <th className="pb-4 font-medium px-4">Location</th>
                                <th className="pb-4 font-medium px-4">Expiry Date</th>
                                <th className="pb-4 font-medium px-4">Status</th>
                                <th className="pb-4 font-medium px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map(req => (
                                <tr key={req.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="py-4 px-4">
                                        <p className="font-semibold text-slate-800 dark:text-white">{req.foodName || 'Food Donation'}</p>
                                        <p className="text-xs text-slate-500">{restaurants[req.restaurantId] || req.restaurantId}</p>
                                    </td>
                                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-medium">{req.quantity}</td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                                            <MapPin size={12} />
                                            {req.location?.address || 'Pickup Point'}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        {req.expiryDate ? (
                                            <div className="flex items-center gap-1 text-rose-500 text-xs font-bold bg-rose-50 dark:bg-rose-500/10 w-max px-2 py-1 rounded-md">
                                                <AlertCircle size={12} />
                                                Exp: {req.expiryDate}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize w-max ${getStatusColor(req.status)}`}>
                                            {req.status}
                                        </span>
                                        {req.pickupTime && (
                                            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                                <Clock size={10} />
                                                {req.pickupTime?.toDate ? req.pickupTime.toDate().toLocaleString() : req.pickupTime}
                                            </p>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {activeTab === 'available' && (
                                                <button 
                                                    onClick={() => setAcceptingId(req.id)}
                                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
                                                >
                                                    <Check size={14} /> Accept Donation
                                                </button>
                                            )}
                                            {activeTab === 'my-requests' && (
                                                <>
                                                    {req.status === 'confirmed' && (
                                                        <button onClick={() => handleUpdateStatus(req.id, 'picked')} className="px-3 py-1.5 flex items-center gap-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-lg text-xs font-bold transition-colors">
                                                            <Truck size={14} /> Mark Picked
                                                        </button>
                                                    )}
                                                    {req.status === 'picked' && (
                                                        <button onClick={() => handleUpdateStatus(req.id, 'completed')} className="px-3 py-1.5 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition-colors">
                                                            <CheckCircle2 size={14} /> Complete
                                                        </button>
                                                    )}
                                                    {req.status === 'completed' && (
                                                        <span className="px-3 py-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 justify-end">
                                                            <CheckCircle2 size={14} /> Received
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {currentData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                        <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                                        No {activeTab === 'available' ? 'donations available right now' : 'active requests detected'}.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Accept Confirmation Modal */}
            {acceptingId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setAcceptingId(null)}
                    />
                    <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col p-4 md:p-6 w-full max-w-md max-h-[90vh] shadow-2xl overflow-y-auto custom-scrollbar">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 md:mb-4">Accept Donation</h3>
                        <p className="text-sm text-slate-500 mb-6 font-medium">Please select your preferred pickup time to confirm this request.</p>
                        
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Pickup Date & Time</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                                    value={pickupTime}
                                    onChange={(e) => setPickupTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setAcceptingId(null)}
                                className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleAccept}
                                disabled={!pickupTime}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                            >
                                Confirm Pickup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestList;
