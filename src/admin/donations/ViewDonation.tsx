import React, { useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { MapPin, Clock, Info, CheckCircle, Store, ArrowRight, AlertCircle } from 'lucide-react';
import { Donation } from './DonationList';

interface Props {
    donation: Donation;
    onClose: () => void;
}

const ViewDonation: React.FC<Props> = ({ donation, onClose }) => {
    const [ngoDetails, setNgoDetails] = useState<any>(null);

    React.useEffect(() => {
        const fetchNgo = async () => {
            if (!donation.ngoId) return;
            try {
                const snap = await getDoc(doc(db, 'ngos', donation.ngoId));
                if (snap.exists()) {
                    setNgoDetails(snap.data());
                }
            } catch (error) {
                console.error("Failed to fetch NGO details");
            }
        };
        fetchNgo();
    }, [donation.ngoId]);

    return (
        <div className="space-y-6 text-slate-800 dark:text-slate-200">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs uppercase font-bold text-slate-500 mb-1 flex items-center gap-1"><Store size={14}/> NGO</p>
                    <p className="font-semibold">
                        {donation.ngoId ? (ngoDetails ? ngoDetails.name : 'Loading...') : <span className="text-amber-500 italic font-normal text-xs">Waiting for acceptance...</span>}
                    </p>
                    {ngoDetails?.phone && <p className="text-xs text-slate-500 mt-1">{ngoDetails.phone}</p>}
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs uppercase font-bold text-slate-500 mb-1 flex items-center gap-1"><Info size={14}/> Quantity</p>
                    <p className="font-semibold text-indigo-600 dark:text-indigo-400">{donation.quantity}</p>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex gap-3">
                    <Clock size={16} className="text-slate-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pickup Time</p>
                        <p className="text-sm text-slate-500">
                            {donation.pickupTime?.toDate ? donation.pickupTime.toDate().toLocaleString() : donation.pickupTime ? new Date(donation.pickupTime).toLocaleString() : '—'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <MapPin size={16} className="text-slate-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Location</p>
                        <p className="text-sm text-slate-500">{donation.location?.address || 'N/A'}</p>
                    </div>
                </div>
                {donation.expiryDate && (
                    <div className="flex gap-3 py-2 px-3 bg-rose-50 dark:bg-rose-500/10 rounded-lg border border-rose-100 dark:border-rose-500/20">
                        <AlertCircle size={16} className="text-rose-500 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Item Expiry Date</p>
                            <p className="text-sm text-rose-500">{donation.expiryDate}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Donation Status</p>
                    <span className={`uppercase text-xs font-bold px-3 py-1 rounded-lg ${
                        donation.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                        donation.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                        'bg-blue-100 text-blue-600'
                    }`}>
                        {donation.status}
                    </span>
                </div>
                
                {donation.status === 'completed' && (
                    <div className="mt-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center justify-center gap-2 font-bold border border-emerald-200 dark:border-emerald-500/20">
                        <CheckCircle size={20} /> Donation Successfully Completed
                    </div>
                )}
                
                {donation.status !== 'completed' && (
                    <p className="mt-4 text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
                        Awaiting NGO Actions
                    </p>
                )}
            </div>
        </div>
    );
};

export default ViewDonation;
