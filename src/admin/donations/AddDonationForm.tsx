import React, { useState, useEffect } from 'react';
import { Package, Heart, RefreshCcw, AlertCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, getDoc, doc, updateDoc } from 'firebase/firestore';
import { InventoryItem } from '../../services/inventoryService';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
    restaurantId: string;
    onClose: () => void;
    initialInventoryId?: string;
}

const fieldCls = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-colors text-sm";
const labelCls = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider";

const AddDonationForm: React.FC<Props> = ({ restaurantId, onClose, initialInventoryId }) => {
    const [form, setForm] = useState({
        inventoryId: initialInventoryId || '',
        quantityText: '',
        locationAddress: '',
    });
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchValidInventory = async () => {
            const snap = await getDocs(collection(db, 'restaurants', restaurantId, 'inventory'));
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
            
            // Filter: quantity > 0 and expiryDate > currentDate (if perishable and date exists)
            const validItems = items.filter(item => {
                if (item.quantity <= 0) return false;
                if (item.isPerishable && item.expiryDate) {
                    const expiry = typeof item.expiryDate === 'object' && 'seconds' in (item.expiryDate as any)
                        ? new Date((item.expiryDate as any).seconds * 1000)
                        : new Date(item.expiryDate);
                    const now = new Date();
                    if (expiry < now) return false; // Expired
                }
                return true;
            });
            setInventoryItems(validItems);
            
            if (initialInventoryId) {
                const preItem = validItems.find(i => i.id === initialInventoryId);
                if (preItem) {
                    setForm(prev => ({ ...prev, inventoryId: initialInventoryId, quantityText: preItem.quantity.toString() }));
                }
            }
        };

        const fetchRestaurantAddress = async () => {
            try {
                const restSnap = await getDoc(doc(db, 'restaurants', restaurantId));
                if (restSnap.exists()) {
                    const data = restSnap.data();
                    if (data.location?.address) {
                        setForm(prev => ({ ...prev, locationAddress: data.location.address }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch restaurant address", err);
            }
        };
        fetchValidInventory();
        fetchRestaurantAddress();
    }, [restaurantId]);

    const selectedItem = inventoryItems.find(i => i.id === form.inventoryId);
    
    // Auto-calculate expiry if explicit expiryDate is missing but shelfLifeDays exists
    const calculatedExpiry = React.useMemo(() => {
        if (!selectedItem) return null;
        if (selectedItem.expiryDate) {
            if (typeof selectedItem.expiryDate === 'object' && 'seconds' in (selectedItem.expiryDate as any)) {
                return new Date((selectedItem.expiryDate as any).seconds * 1000).toISOString().split('T')[0];
            }
            return String(selectedItem.expiryDate);
        }
        if (selectedItem.shelfLifeDays) {
            return new Date(Date.now() + selectedItem.shelfLifeDays * 86400000).toISOString().split('T')[0];
        }
        return null;
    }, [selectedItem]);

    const handleSubmit = async () => {
        setError('');
        if (!form.inventoryId || !form.locationAddress || !form.quantityText) {
            setError('Please fill all fields');
            return;
        }

        const inputQty = parseFloat(form.quantityText);
        if (selectedItem && inputQty > selectedItem.quantity) {
            setError(`Cannot donate more than available quantity (${selectedItem.quantity} ${selectedItem.unit})`);
            return;
        }

        if (inputQty <= 0) {
            setError('Quantity must be greater than zero');
            return;
        }

        setIsLoading(true);
        try {
            await addDoc(collection(db, "food_donations"), {
                restaurantId,
                managerId: user?.uid || "manager_auto",
                ngoId: null,
                quantity: `${form.quantityText} ${selectedItem?.unit || ''}`.trim(),
                foodName: selectedItem?.name || '',
                expiryDate: calculatedExpiry,
                pickupTime: null,
                status: "pending",
                location: {
                    address: form.locationAddress
                },
                createdAt: serverTimestamp()
            });

            // 2. Decrease Inventory
            if (selectedItem && form.inventoryId) {
                const inventoryRef = doc(db, 'restaurants', restaurantId, 'inventory', form.inventoryId);
                const newQty = selectedItem.quantity - inputQty;
                await updateDoc(inventoryRef, {
                    quantity: Number(newQty.toFixed(2)), // Handle decimal precision
                    updatedAt: serverTimestamp()
                });
            }
            onClose();
        } catch (e: any) {
            setError(e.message || 'Error adding donation');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg px-4 py-3">
                    {error}
                </div>
            )}

            <div>
                <label className={labelCls}>Select Valid Inventory Item</label>
                <select 
                    className={fieldCls} 
                    value={form.inventoryId} 
                    onChange={e => {
                        const val = e.target.value;
                        const item = inventoryItems.find(i => i.id === val);
                        setForm({ 
                            ...form, 
                            inventoryId: val,
                            quantityText: item ? item.quantity.toString() : '' 
                        });
                    }}
                >
                    <option value="">-- Choose Item --</option>
                    {inventoryItems.map(item => {
                        let expDisplay = '';
                        if (item.expiryDate) {
                            if (typeof item.expiryDate === 'object' && 'seconds' in (item.expiryDate as any)) {
                                expDisplay = new Date((item.expiryDate as any).seconds * 1000).toISOString().split('T')[0];
                            } else {
                                expDisplay = String(item.expiryDate);
                            }
                        }
                        return (
                            <option key={item.id} value={item.id}>
                                {item.name} - {item.quantity} {item.unit} {expDisplay ? `(Exp: ${expDisplay})` : ''}
                            </option>
                        );
                    })}
                </select>
            </div>

            <div>
                <label className={labelCls}>Quantity {selectedItem ? `(${selectedItem.unit})` : ''}</label>
                <div className="relative">
                    <input 
                        type="number"
                        step="any"
                        min="0.01"
                        max={selectedItem?.quantity}
                        className={fieldCls} 
                        value={form.quantityText} 
                        onChange={e => setForm({ ...form, quantityText: e.target.value })}
                        placeholder="Enter quantity..." 
                    />
                    {selectedItem && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            {selectedItem.unit}
                        </div>
                    )}
                </div>
            </div>

            {calculatedExpiry && (
                <div>
                    <label className={labelCls}>Item Expiry (Auto-calculated)</label>
                    <div className="w-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-900/30 rounded-lg p-3 text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center gap-2">
                        <AlertCircle size={14} /> Exp: {calculatedExpiry}
                        {!selectedItem?.expiryDate && selectedItem?.shelfLifeDays && (
                            <span className="text-[10px] text-rose-400 font-medium ml-2">(Based on {selectedItem.shelfLifeDays}-day shelf life)</span>
                        )}
                    </div>
                </div>
            )}



            <div>
                <label className={labelCls}>Pickup Location Address</label>
                <input 
                    className={fieldCls} 
                    value={form.locationAddress} 
                    onChange={e => setForm({ ...form, locationAddress: e.target.value })}
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg mt-2"
            >
                {isLoading ? (
                    <RefreshCcw className="animate-spin" size={16} />
                ) : (
                    <><Heart size={16} /> Create Donation</>
                )}
            </button>
        </div>
    );
};

export default AddDonationForm;
