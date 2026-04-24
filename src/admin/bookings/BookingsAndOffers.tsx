import React, { useState, useEffect } from 'react';
import { 
    Clock, Plus, Trash2, Edit2, Save, X, 
    Calendar, CheckCircle, Info, Tag, 
    DollarSign, Users, Percent, ToggleLeft, ToggleRight
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { 
    collection, addDoc, onSnapshot, query, 
    orderBy, doc, updateDoc, deleteDoc, 
    serverTimestamp 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Slot {
    id: string;
    startTime: string;
    endTime: string;
    category: 'breakfast' | 'lunch' | 'dinner';
    pricePerGuest: number;
    discountPercent: number;
    maxCapacity: number;
    isActive: boolean;
    createdAt?: any;
}

const BookingsAndOffers = ({ restaurantId }: { restaurantId: string }) => {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingSlot, setEditingSlot] = useState<Slot | null>(null);

    const [formData, setFormData] = useState({
        startTime: '12:00',
        endTime: '14:00',
        pricePerGuest: 25,
        discountPercent: 10,
        maxCapacity: 50,
        isActive: true
    });

    useEffect(() => {
        if (!restaurantId) return;

        const q = query(
            collection(db, 'restaurants', restaurantId, 'slots'),
            orderBy('startTime')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedSlots = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Slot[];
            setSlots(fetchedSlots);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching slots:", error);
            toast.error("Failed to fetch booking slots");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [restaurantId]);

    const getCategory = (startTime: string) => {
        const hour = parseInt(startTime.split(':')[0]);
        if (hour < 12) return 'breakfast';
        if (hour < 18) return 'lunch';
        return 'dinner';
    };

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'breakfast':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
            case 'lunch':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-500/20';
            case 'dinner':
                return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic Validation
        if (formData.endTime <= formData.startTime) {
            toast.error("End time must be after start time");
            return;
        }

        // Overlap Check (Simple check for exact duplicates or overlapping same-start-time)
        const isDuplicate = slots.some(s => 
            s.id !== editingSlot?.id && 
            s.startTime === formData.startTime && 
            s.endTime === formData.endTime
        );
        if (isDuplicate) {
            toast.error("A slot with this time range already exists");
            return;
        }

        setIsLoading(true);
        try {
            const slotData = {
                startTime: formData.startTime,
                endTime: formData.endTime,
                category: getCategory(formData.startTime),
                pricePerGuest: Number(formData.pricePerGuest),
                discountPercent: Number(formData.discountPercent),
                maxCapacity: Number(formData.maxCapacity),
                isActive: formData.isActive,
                updatedAt: serverTimestamp()
            };

            if (editingSlot) {
                await updateDoc(doc(db, 'restaurants', restaurantId, 'slots', editingSlot.id), slotData);
                toast.success("Booking slot updated!");
            } else {
                await addDoc(collection(db, 'restaurants', restaurantId, 'slots'), {
                    ...slotData,
                    createdAt: serverTimestamp()
                });
                toast.success("New booking slot added!");
            }

            // Reset
            setFormData({
                startTime: '12:00',
                endTime: '14:00',
                pricePerGuest: 25,
                discountPercent: 10,
                maxCapacity: 50,
                isActive: true
            });
            setShowAddForm(false);
            setEditingSlot(null);
        } catch (error) {
            console.error("Error saving slot:", error);
            toast.error("Failed to save booking slot");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (slot: Slot) => {
        setEditingSlot(slot);
        setFormData({
            startTime: slot.startTime,
            endTime: slot.endTime,
            pricePerGuest: slot.pricePerGuest,
            discountPercent: slot.discountPercent,
            maxCapacity: slot.maxCapacity,
            isActive: slot.isActive
        });
        setShowAddForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this booking slot?")) return;

        try {
            await deleteDoc(doc(db, 'restaurants', restaurantId, 'slots', id));
            toast.success("Slot deleted successfully");
        } catch (error) {
            console.error("Error deleting slot:", error);
            toast.error("Failed to delete slot");
        }
    };

    const toggleStatus = async (slot: Slot) => {
        try {
            await updateDoc(doc(db, 'restaurants', restaurantId, 'slots', slot.id), {
                isActive: !slot.isActive
            });
        } catch (error) {
            console.error("Error toggling status:", error);
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Booking Slots & Offers</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage time slots, pricing and promotional discounts for customers.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingSlot(null);
                        setFormData({
                            startTime: '12:00',
                            endTime: '14:00',
                            pricePerGuest: 25,
                            discountPercent: 10,
                            maxCapacity: 50,
                            isActive: true
                        });
                        setShowAddForm(true);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all font-semibold"
                >
                    <Plus size={18} />
                    Add New Slot
                </button>
            </div>

            {/* Empty State */}
            {!isLoading && slots.length === 0 && !showAddForm && (
                <div className="bg-white dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <Clock size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Booking Slots Configured</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">Start by adding time slots and defining prices to allow customers to pre-book tables.</p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                        Create your first slot
                    </button>
                </div>
            )}

            {/* Add/Edit Form Overlay/Section */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {editingSlot ? 'Edit Booking Slot' : 'Add New Timing Slot'}
                            </h3>
                            <button onClick={() => { setShowAddForm(false); setEditingSlot(null); }} className="text-slate-400 hover:text-slate-600 p-2">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Start Time</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-indigo-500 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">End Time</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-indigo-500 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Price per Guest (₹)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number"
                                        value={formData.pricePerGuest}
                                        onChange={(e) => setFormData({ ...formData, pricePerGuest: parseInt(e.target.value) })}
                                        placeholder="25"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-indigo-500 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Discount Percent (%)</label>
                                <div className="relative">
                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number"
                                        value={formData.discountPercent}
                                        onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
                                        placeholder="10"
                                        max="100"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-indigo-500 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Max Capacity (Guests)</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number"
                                        value={formData.maxCapacity}
                                        onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
                                        placeholder="50"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-indigo-500 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex items-end pb-1.5">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                        className={`p-1 rounded-lg transition-colors ${formData.isActive ? 'text-emerald-500' : 'text-slate-400'}`}
                                    >
                                        {formData.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                    </button>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        Slot is {formData.isActive ? 'Active' : 'Disabled'}
                                    </span>
                                </label>
                            </div>

                            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddForm(false); setEditingSlot(null); }}
                                    className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    {editingSlot ? 'Update Slot' : 'Create Slot'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {slots.map((slot) => (
                    <motion.div
                        layout
                        key={slot.id}
                        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all hover:shadow-lg relative overflow-hidden group ${!slot.isActive && 'opacity-60'}`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getCategoryStyles(slot.category)}`}>
                                {slot.category}
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => handleEdit(slot)}
                                    className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(slot.id)}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                                    {slot.startTime} — {slot.endTime}
                                </h4>
                                <p className="text-xs text-slate-500 font-medium tracking-wide">AVAILABLE EVERY DAY</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Pricing</p>
                                <div className="flex items-center gap-1">
                                    <span className="text-lg font-bold text-slate-800 dark:text-white">₹{slot.pricePerGuest}</span>
                                    <span className="text-[10px] text-slate-500">/ guest</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Capacity</p>
                                <div className="flex items-center gap-1">
                                    <Users size={14} className="text-slate-400" />
                                    <span className="text-lg font-bold text-slate-800 dark:text-white">{slot.maxCapacity}</span>
                                </div>
                            </div>
                        </div>

                        {slot.discountPercent > 0 && (
                            <div className="absolute top-0 right-0">
                                <div className="bg-rose-500 text-white text-[10px] font-black px-6 py-1 transform rotate-45 translate-x-4 translate-y-3 shadow-md">
                                    {slot.discountPercent}% OFF
                                </div>
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-between">
                            <span className={`text-xs font-bold ${slot.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {slot.isActive ? 'Visible to Customers' : 'Currently Hidden'}
                            </span>
                            <button
                                onClick={() => toggleStatus(slot)}
                                className={`w-8 h-4 rounded-full relative transition-colors ${slot.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${slot.isActive ? 'left-4.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default BookingsAndOffers;
