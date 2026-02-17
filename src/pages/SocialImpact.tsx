import React, { useState } from 'react';
import { ArrowLeft, Heart, Leaf, Building2, Phone, Mail, MapPin, Send, HandHeart, Utensils, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

const ngoPartners = [
    {
        name: "Feeding India (Zomato)",
        description: "Redistributes surplus food from restaurants to those in need across India.",
        contact: "+91 98765 43210",
        email: "contact@feedingindia.org",
        area: "Pan India",
        logo: "🍽️"
    },
    {
        name: "Robin Hood Army",
        description: "Volunteer organization that serves surplus food to the less fortunate.",
        contact: "+91 91234 56789",
        email: "hello@robinhoodarmy.com",
        area: "Pan India",
        logo: "🏹"
    },
    {
        name: "No Food Waste",
        description: "Collects excess food from events and redistributes to orphanages and shelters.",
        contact: "+91 87654 32100",
        email: "info@nofoodwaste.org",
        area: "Chennai, Tamil Nadu",
        logo: "♻️"
    }
];

const SocialImpact = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [donationForm, setDonationForm] = useState({
        foodType: '',
        quantity: '',
        pickupTime: '',
        notes: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!donationForm.foodType || !donationForm.quantity || !donationForm.pickupTime) {
            alert('Please fill in all required fields.');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'food_donations'), {
                ...donationForm,
                userId: user?.uid || 'anonymous',
                status: 'pending',
                createdAt: serverTimestamp()
            });
            setSubmitted(true);
            setDonationForm({ foodType: '', quantity: '', pickupTime: '', notes: '' });
        } catch (error) {
            console.error('Error submitting donation:', error);
            alert('Failed to submit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative pb-10">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate('/home')} className="p-2 bg-white/20 rounded-xl backdrop-blur-sm active:scale-95 transition-transform">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold leading-tight flex items-center gap-2">
                            <Leaf className="w-5 h-5" /> Social Impact
                        </h1>
                        <p className="text-xs text-green-100 font-medium">Food Wastage Control via NGO Integration</p>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Heart className="w-5 h-5 fill-white" />
                    </div>
                </div>
            </header>

            {/* Impact Stats */}
            <div className="p-4">
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { icon: <Utensils className="w-5 h-5 text-orange-500" />, value: '120+', label: 'Meals Saved' },
                        { icon: <HandHeart className="w-5 h-5 text-pink-500" />, value: '3', label: 'NGO Partners' },
                        { icon: <TrendingDown className="w-5 h-5 text-green-500" />, value: '45kg', label: 'Waste Cut' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center"
                        >
                            <div className="flex justify-center mb-1">{stat.icon}</div>
                            <div className="text-lg font-bold text-gray-800">{stat.value}</div>
                            <div className="text-[10px] text-gray-500 font-medium">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Donate Surplus Food Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6"
                >
                    <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                        <Send className="w-4 h-4 text-green-600" /> Donate Surplus Food
                    </h2>
                    <p className="text-xs text-gray-500 mb-4">Schedule a pickup for leftover food from your café</p>

                    {submitted ? (
                        <div className="text-center py-6">
                            <div className="text-4xl mb-2">🎉</div>
                            <h3 className="font-bold text-green-700 text-lg">Thank You!</h3>
                            <p className="text-sm text-gray-500 mt-1">Your donation request has been submitted. An NGO partner will coordinate pickup.</p>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="mt-4 px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-bold"
                            >
                                Donate Again
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Food Type *</label>
                                <select
                                    value={donationForm.foodType}
                                    onChange={e => setDonationForm({ ...donationForm, foodType: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-300"
                                >
                                    <option value="">Select food type</option>
                                    <option value="cooked_meals">Cooked Meals</option>
                                    <option value="raw_ingredients">Raw Ingredients</option>
                                    <option value="packaged_food">Packaged Food</option>
                                    <option value="beverages">Beverages</option>
                                    <option value="desserts">Desserts / Bakery</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Quantity (servings) *</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 20"
                                    value={donationForm.quantity}
                                    onChange={e => setDonationForm({ ...donationForm, quantity: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-300"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Preferred Pickup Time *</label>
                                <input
                                    type="datetime-local"
                                    value={donationForm.pickupTime}
                                    onChange={e => setDonationForm({ ...donationForm, pickupTime: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-300"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Notes (optional)</label>
                                <textarea
                                    placeholder="Any special instructions..."
                                    value={donationForm.notes}
                                    onChange={e => setDonationForm({ ...donationForm, notes: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Submitting...' : '🤝 Schedule Donation Pickup'}
                            </button>
                        </form>
                    )}
                </motion.div>

                {/* NGO Partners */}
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" /> NGO Partners
                </h2>
                <div className="space-y-3">
                    {ngoPartners.map((ngo, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + idx * 0.1 }}
                            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                                    {ngo.logo}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-800 text-sm">{ngo.name}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ngo.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                            <MapPin className="w-3 h-3" /> {ngo.area}
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                            <Phone className="w-3 h-3" /> {ngo.contact}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SocialImpact;
