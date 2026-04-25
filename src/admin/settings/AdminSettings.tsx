import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, Save, RotateCcw, Building2, MapPin, Clock, DollarSign, Image as ImageIcon, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { MapPicker } from '../../components/MapPicker';

const AdminSettings = () => {
    const { userProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const restaurantId = userProfile?.restaurantId;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        logoUrl: '' as any,
        bannerImage: '' as any,
        location: {
            address: '',
            city: '',
            lat: 0,
            lng: 0,
        },
        cuisineType: '',
        restaurantType: 'Veg',
        priceRangeMin: 200,
        priceRangeMax: 500,
        operatingHours: {
            open: '09:00',
            close: '22:00',
        },
        floors: 1
    });

    const [originalData, setOriginalData] = useState<any>(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchRestaurant = async () => {
            if (!restaurantId || restaurantId === 'DEFAULT_RESTAURANT') return;
            try {
                const docRef = doc(db, 'restaurants', restaurantId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const initialData = {
                        name: data.name || '',
                        description: data.description || '',
                        logoUrl: data.logoUrl || data.logo || '', // Fallback to existing logo emoji/string if needed initially
                        bannerImage: data.bannerImage || '',
                        location: {
                            address: data.location?.address || '',
                            city: data.location?.city || '',
                            lat: data.location?.lat || 0,
                            lng: data.location?.lng || 0,
                        },
                        cuisineType: Array.isArray(data.cuisineType) ? data.cuisineType.join(', ') : (data.cuisineType || ''),
                        restaurantType: data.restaurantType || 'Veg',
                        priceRangeMin: data.priceRange ? parseInt(data.priceRange.split('-')[0]) || 200 : 200,
                        priceRangeMax: data.priceRange ? parseInt(data.priceRange.split('-')[1]) || 500 : 500,
                        operatingHours: {
                            open: data.operatingHours?.open || '09:00',
                            close: data.operatingHours?.close || '22:00',
                        },
                        floors: data.floors || 1
                    };
                    setFormData(initialData);
                    setOriginalData(initialData);
                }
            } catch (error) {
                console.error('Error fetching restaurant:', error);
                setMessage({ type: 'error', text: 'Failed to load restaurant details.' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestaurant();
    }, [restaurantId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev as any)[parent],
                    [child]: name.includes('lat') || name.includes('lng') ? parseFloat(value) || 0 : value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

    const handleSave = async () => {
        if (!restaurantId || restaurantId === 'DEFAULT_RESTAURANT') {
            setMessage({ type: 'error', text: 'Invalid restaurant context.' });
            return;
        }

        if (!formData.name.trim() || !formData.location.city.trim() || !formData.operatingHours.open || !formData.operatingHours.close) {
            setMessage({ type: 'error', text: 'Please fill all required fields.' });
            return;
        }

        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            let finalLogoUrl = formData.logoUrl;
            if (formData.logoUrl && typeof formData.logoUrl === 'object') {
                finalLogoUrl = await uploadToCloudinary(formData.logoUrl);
            }

            let finalBannerImage = formData.bannerImage;
            if (formData.bannerImage && typeof formData.bannerImage === 'object') {
                finalBannerImage = await uploadToCloudinary(formData.bannerImage);
            }

            const updatedFields = {
                name: formData.name,
                description: formData.description,
                logoUrl: finalLogoUrl,
                bannerImage: finalBannerImage,
                location: formData.location,
                cuisineType: formData.cuisineType.split(',').map((c: string) => c.trim()).filter(Boolean),
                restaurantType: formData.restaurantType,
                priceRange: `${formData.priceRangeMin}-${formData.priceRangeMax}`,
                operatingHours: formData.operatingHours,
                floors: parseInt(formData.floors as any) || 1,
                updatedAt: serverTimestamp()
            };

            await updateDoc(doc(db, 'restaurants', restaurantId), updatedFields);
            
            setOriginalData(formData);
            setMessage({ type: 'success', text: 'Restaurant settings updated successfully.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error('Error updating Settings:', error);
            setMessage({ type: 'error', text: 'Failed to save settings.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (originalData) {
            setFormData(originalData);
            setMessage({ type: '', text: '' });
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl space-y-8 pb-12"
        >
            {hasChanges && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between text-amber-800 dark:text-amber-200">
                    <p className="text-sm font-medium">You have unsaved changes!</p>
                    <div className="flex gap-3">
                        <button onClick={handleReset} className="text-sm font-medium hover:underline text-amber-700 dark:text-amber-300">
                            Reset
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg transition-colors">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}

            {message.text && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Fields */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-white">
                            <Building2 size={20} className="text-indigo-500" />
                            <h3 className="text-lg font-bold tracking-tight">Basic Information</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Restaurant Name <span className="text-rose-500">*</span></label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Number of Floors <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="number"
                                        name="floors"
                                        min="1"
                                        value={formData.floors}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-white">
                            <MapPin size={20} className="text-indigo-500" />
                            <h3 className="text-lg font-bold tracking-tight">Location Details</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Street Address <span className="text-rose-500">*</span></label>
                                <input
                                    name="location.address"
                                    value={formData.location.address}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                    placeholder="e.g. 123 Main St"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">City <span className="text-rose-500">*</span></label>
                                <input
                                    name="location.city"
                                    value={formData.location.city}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                />
                            </div>
                            <MapPicker 
                                lat={formData.location.lat}
                                lng={formData.location.lng}
                                onChange={(lat, lng, address) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        location: {
                                            ...prev.location,
                                            lat,
                                            lng,
                                            address: address ? address : prev.location.address
                                        }
                                    }));
                                }}
                            />
                        </div>
                    </div>

                    {/* Details & Cuisine */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                                <DollarSign size={20} className="text-indigo-500" />
                                <h3 className="text-lg font-bold tracking-tight">Cuisine & Pricing</h3>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Cuisine Types (comma separated)</label>
                                <input
                                    name="cuisineType"
                                    value={formData.cuisineType}
                                    placeholder="e.g. Italian, Fast Food, Indian"
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                />
                            </div>
                            {(() => {
                                const isVeg = formData.restaurantType === "Veg" || formData.restaurantType === "Both";
                                const isNonVeg = formData.restaurantType === "Non-Veg" || formData.restaurantType === "Both";

                                const handleToggle = (type: 'veg' | 'non-veg') => {
                                    let newValue = formData.restaurantType;
                                    if (type === 'veg') {
                                        if (isVeg && isNonVeg) newValue = "Non-Veg";
                                        else if (!isVeg && isNonVeg) newValue = "Both";
                                        else if (!isVeg && !isNonVeg) newValue = "Veg"; // Should not be reached
                                    } else {
                                        if (isNonVeg && isVeg) newValue = "Veg";
                                        else if (!isNonVeg && isVeg) newValue = "Both";
                                        else if (!isNonVeg && !isVeg) newValue = "Non-Veg";
                                    }
                                    setFormData(prev => ({ ...prev, restaurantType: newValue }));
                                };

                                return (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Dietary Service</label>
                                        <div className="flex gap-4">
                                            <div 
                                                onClick={() => { if (isVeg && !isNonVeg) return; handleToggle('veg'); }}
                                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-[11px] rounded-xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${isVeg ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                            >
                                                <div className={`w-4 h-4 border-[1.5px] rounded-[4px] flex items-center justify-center transition-colors ${isVeg ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                                {isVeg && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                                </div>
                                                <span className="font-bold text-sm tracking-wide">Veg</span>
                                            </div>
                                            
                                            <div 
                                                onClick={() => { if (isNonVeg && !isVeg) return; handleToggle('non-veg'); }}
                                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-[11px] rounded-xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${isNonVeg ? 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)]' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                            >
                                                <div className={`w-4 h-4 border-[1.5px] rounded-[4px] flex items-center justify-center transition-colors ${isNonVeg ? 'border-rose-500 bg-rose-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                                {isNonVeg && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                                </div>
                                                <span className="font-bold text-sm tracking-wide">Non-Veg</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Price (Lower) for 2 Persons</label>
                                    <input
                                        type="number"
                                        name="priceRangeMin"
                                        value={formData.priceRangeMin}
                                        onChange={handleChange}
                                        placeholder="200"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Price (Upper) for 2 Persons</label>
                                    <input
                                        type="number"
                                        name="priceRangeMax"
                                        value={formData.priceRangeMax}
                                        onChange={handleChange}
                                        placeholder="300"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operating Hours */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-white">
                            <Clock size={20} className="text-indigo-500" />
                            <h3 className="text-lg font-bold tracking-tight">Operating Hours</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Opening Time <span className="text-rose-500">*</span></label>
                                <input
                                    type="time"
                                    name="operatingHours.open"
                                    value={formData.operatingHours.open}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Closing Time <span className="text-rose-500">*</span></label>
                                <input
                                    type="time"
                                    name="operatingHours.close"
                                    value={formData.operatingHours.close}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar (Media & Save Actions) */}
                <div className="space-y-6">
                    {/* Media */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-white">
                            <ImageIcon size={20} className="text-indigo-500" />
                            <h3 className="text-lg font-bold tracking-tight">Media</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Logo</label>
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center hover:border-indigo-500/50 transition-colors cursor-pointer relative group bg-slate-50 dark:bg-slate-950/50">
                                    <input type="file" accept="image/*"
                                        onChange={e => setFormData({ ...formData, logoUrl: e.target?.files?.[0] || formData.logoUrl })}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-indigo-500">
                                        {formData.logoUrl ? (
                                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm mx-auto">
                                                {typeof formData.logoUrl === 'string' ? (
                                                    formData.logoUrl.startsWith('http') || formData.logoUrl.startsWith('data:')
                                                        ? <img src={formData.logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                                                        : <span className="text-3xl flex items-center justify-center h-full bg-slate-100 dark:bg-slate-800">{formData.logoUrl}</span>
                                                ) : (
                                                    <img src={URL.createObjectURL(formData.logoUrl)} alt="Logo upload preview" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <Upload size={24} />
                                                <span className="text-sm">Click to upload logo image</span>
                                            </>
                                        )}
                                        {formData.logoUrl && typeof formData.logoUrl === 'object' && (
                                            <span className="text-xs font-medium text-emerald-500 mt-1">Image Selected</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Banner Image</label>
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center hover:border-indigo-500/50 transition-colors cursor-pointer relative group bg-slate-50 dark:bg-slate-950/50">
                                    <input type="file" accept="image/*"
                                        onChange={e => setFormData({ ...formData, bannerImage: e.target?.files?.[0] || formData.bannerImage })}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    
                                    <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-indigo-500 relative">
                                        {formData.bannerImage ? (
                                            <div className="w-full h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                                                {typeof formData.bannerImage === 'string' ? (
                                                    <img src={formData.bannerImage} alt="Banner preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={URL.createObjectURL(formData.bannerImage)} alt="Banner upload preview" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="py-4">
                                                <ImageIcon size={24} className="mx-auto mb-2 opacity-50" />
                                                <span className="text-sm">Click to upload banner image</span>
                                            </div>
                                        )}
                                        {formData.bannerImage && typeof formData.bannerImage === 'object' && (
                                            <span className="text-xs font-medium text-emerald-500 mt-1">Banner Image Selected</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Preview Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hidden md:block">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 tracking-tight uppercase text-slate-500">Card Preview</h3>
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm relative group">
                             <div className="h-24 w-full bg-slate-200 dark:bg-slate-700 relative">
                                {formData.bannerImage && (
                                    <img src={typeof formData.bannerImage === 'string' ? formData.bannerImage : URL.createObjectURL(formData.bannerImage)} className="w-full h-full object-cover" alt="Banner" />
                                )}
                                <div className="absolute -bottom-4 left-4 w-12 h-12 rounded-full border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-700 flex items-center justify-center overflow-hidden text-2xl">
                                    {formData.logoUrl && (typeof formData.logoUrl === 'string' ? formData.logoUrl.startsWith('http') : true) ? (
                                         <img src={typeof formData.logoUrl === 'string' ? formData.logoUrl : URL.createObjectURL(formData.logoUrl)} className="w-full h-full object-cover" alt="Logo" />
                                    ) : (
                                        typeof formData.logoUrl === 'string' ? formData.logoUrl : '🍽️'
                                    )}
                                </div>
                             </div>
                             <div className="p-4 pt-6">
                                 <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">{formData.name || 'Restaurant Name'}</h4>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{formData.cuisineType || 'Cuisine Types'}</p>
                                 <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400 justify-between">
                                     <span className="flex items-center gap-1"><MapPin size={12}/> {formData.location.city || 'City'}</span>
                                     <span className="font-medium text-slate-700 dark:text-slate-300">₹{formData.priceRangeMin} - ₹{formData.priceRangeMax}</span>
                                 </div>
                             </div>
                        </div>
                    </div>

                    <div className="sticky top-8 space-y-4">
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-all shadow-lg ${
                                hasChanges && !isSaving
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 active:scale-[0.98]'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                            }`}
                        >
                            {isSaving ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminSettings;
