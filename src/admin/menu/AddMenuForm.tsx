import React, { useState } from 'react';
import { Upload, Plus, Trash2, ChevronDown } from 'lucide-react';
import { InventoryItem, IngredientEntry } from '../../services/inventoryService';

interface Props {
    newMenuItem: any;
    setNewMenuItem: (v: any) => void;
    handleAddMenu: (ingredients: IngredientEntry[]) => Promise<void>;
    categories: string[];
    isLoading: boolean;
    editingId: string | null;
    inventoryItems: InventoryItem[];
    initialIngredients?: DraftIngredient[];
    restaurantType: string;
}

const fieldCls = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-colors text-sm";
const labelCls = "block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1";

type DraftIngredient = {
    inventoryId: string;
    name: string;
    unit: string;
    quantityUsed: string;
    deductOnOrder: boolean;
};

const emptyIngredient = (): DraftIngredient => ({ inventoryId: '', name: '', unit: '', quantityUsed: '', deductOnOrder: true });

const AddMenuForm: React.FC<Props> = ({
    newMenuItem, setNewMenuItem, handleAddMenu, categories, isLoading, editingId, inventoryItems, initialIngredients, restaurantType
}) => {
    const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);
    const [showIngredients, setShowIngredients] = useState(false);
    const [ingError, setIngError] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    React.useEffect(() => {
        if (initialIngredients && initialIngredients.length > 0) {
            setIngredients(initialIngredients);
            setShowIngredients(true);
        } else {
            setIngredients([]);
            setShowIngredients(false);
        }
    }, [initialIngredients]);

    const handleAiSuggest = async () => {
        if (!newMenuItem.name) {
            setIngError("Please enter an Item Name first to get AI suggestions.");
            setShowIngredients(true);
            return;
        }
        
        setIsAiLoading(true);
        setIngError('');
        try {
            const res = await fetch("http://localhost:8080/api/ai/suggest-ingredients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dishName: newMenuItem.name })
            });
            
            if (!res.ok) throw new Error("AI request failed");
            
            const aiIngredients = await res.json();
            
            if (!Array.isArray(aiIngredients) || aiIngredients.length === 0) {
                setIngError("AI returned no ingredients. Try manually adding them.");
                setShowIngredients(true);
                return;
            }

            const newIngredients: DraftIngredient[] = [];
            
            aiIngredients.forEach((aiIng: any) => {
                // Try to find a matching inventory item
                const aiName = (aiIng.name || "").toLowerCase();
                const matchedInv = inventoryItems.find(inv => inv.name.toLowerCase() === aiName) 
                                 || inventoryItems.find(inv => inv.name.toLowerCase().includes(aiName) || aiName.includes(inv.name.toLowerCase()));
                
                newIngredients.push({
                    inventoryId: matchedInv ? matchedInv.id : "",
                    name: matchedInv ? matchedInv.name : aiIng.name || "",
                    unit: matchedInv ? matchedInv.unit : "",
                    quantityUsed: parseFloat(aiIng.quantity) ? parseFloat(aiIng.quantity).toString() : "1",
                    deductOnOrder: true
                });
            });
            
            setIngredients(newIngredients);
            setShowIngredients(true);
            
        } catch (err) {
            console.error("AI Suggestion error:", err);
            setIngError("Failed to get AI suggestions.");
            setShowIngredients(true);
        } finally {
            setIsAiLoading(false);
        }
    };

    const addIngredientRow = () => setIngredients(prev => [...prev, emptyIngredient()]);

    const removeIngredientRow = (idx: number) =>
        setIngredients(prev => prev.filter((_, i) => i !== idx));

    const updateIngredient = (idx: number, key: keyof DraftIngredient, value: string) => {
        setIngredients(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [key]: value };

            // Auto-fill name & unit when inventory item is selected
            if (key === 'inventoryId') {
                const inv = inventoryItems.find(i => i.id === value);
                if (inv) {
                    next[idx].name = inv.name;
                    next[idx].unit = inv.unit;
                }
            }
            return next;
        });
    };

    const buildIngredients = (): IngredientEntry[] | null => {
        setIngError('');
        const result: IngredientEntry[] = [];
        for (const ing of ingredients) {
            if (!ing.inventoryId) { setIngError('Select an inventory item for each ingredient.'); return null; }
            const qty = parseFloat(ing.quantityUsed);
            if (!qty || qty <= 0) { setIngError(`Enter a valid quantity for "${ing.name}".`); return null; }
            result.push({
                inventoryId: ing.inventoryId,
                name: ing.name,
                quantityUsed: qty,
                unit: ing.unit as any,
                deductOnOrder: ing.deductOnOrder !== undefined ? ing.deductOnOrder : true,
            });
        }
        return result;
    };

    const onSubmit = async () => {
        const builtIngredients = buildIngredients();
        if (builtIngredients === null) return;
        await handleAddMenu(builtIngredients);
    };

    return (
        <div className="space-y-4">
            {/* Name */}
            <div>
                <label className={labelCls}>Item Name</label>
                <input className={fieldCls} placeholder="e.g. Spicy Ramen"
                    value={newMenuItem.name} onChange={e => setNewMenuItem({ ...newMenuItem, name: e.target.value })} />
            </div>

            {/* Price */}
            <div>
                <label className={labelCls}>Price (₹)</label>
                <input type="text" className={fieldCls} placeholder="0.00"
                    value={newMenuItem.price} onChange={e => setNewMenuItem({ ...newMenuItem, price: e.target.value })} />
            </div>

            {/* Category */}
            <div>
                <label className={labelCls}>Category</label>
                <select className={fieldCls}
                    value={newMenuItem.category}
                    onChange={e => setNewMenuItem({ ...newMenuItem, category: e.target.value, newCategory: '' })}>
                    {categories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="new">+ Add New Category</option>
                </select>
                {newMenuItem.category === 'new' && (
                    <input className={`${fieldCls} mt-2`} placeholder="Enter new category name..."
                        value={newMenuItem.newCategory}
                        onChange={e => setNewMenuItem({ ...newMenuItem, newCategory: e.target.value })} />
                )}
            </div>

            {/* Image Upload */}
            <div>
                <label className={labelCls}>Item Image</label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center hover:border-indigo-500/50 transition-colors cursor-pointer relative group bg-slate-50 dark:bg-slate-950/50">
                    <input type="file" accept="image/*"
                        onChange={e => setNewMenuItem({ ...newMenuItem, image: e.target?.files?.[0] || null })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-indigo-500">
                        {newMenuItem.image ? (
                            <span className="text-sm font-medium text-emerald-500">
                                {typeof newMenuItem.image === 'object' ? newMenuItem.image.name : 'Image Selected'}
                            </span>
                        ) : (
                            <>
                                <Upload size={24} />
                                <span className="text-sm">Click to upload image</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className={labelCls}>Description</label>
                <textarea className={`${fieldCls} resize-none`} placeholder="Item description..." rows={3}
                    value={newMenuItem.description || ''} onChange={e => setNewMenuItem({ ...newMenuItem, description: e.target.value })} />
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Spicy Level */}
                <div>
                    <label className={labelCls}>Spiciness (1-5)</label>
                    <input type="number" min="1" max="5" className={fieldCls} placeholder="1"
                        value={newMenuItem.spicyLevel || ''} onChange={e => setNewMenuItem({ ...newMenuItem, spicyLevel: parseInt(e.target.value) || 1 })} />
                </div>
                {/* Preparation Time */}
                <div>
                    <label className={labelCls}>Prep Time (mins)</label>
                    <input type="number" min="0" className={fieldCls} placeholder="15"
                        value={newMenuItem.preparationTime || ''} onChange={e => setNewMenuItem({ ...newMenuItem, preparationTime: parseInt(e.target.value) || 0 })} />
                </div>
                {/* Calories */}
                <div>
                    <label className={labelCls}>Calories</label>
                    <input type="number" min="0" className={fieldCls} placeholder="350"
                        value={newMenuItem.calories || ''} onChange={e => setNewMenuItem({ ...newMenuItem, calories: parseInt(e.target.value) || 0 })} />
                </div>
            </div>

            {/* Checkboxes Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className={`flex items-center gap-2 ${restaurantType === 'Veg' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                    <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        checked={restaurantType === 'Veg' ? true : (newMenuItem.veg ?? false)}
                        disabled={restaurantType === 'Veg'}
                        onChange={e => setNewMenuItem({ ...newMenuItem, veg: e.target.checked })} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Vegetarian</span>
                </label>
                {(restaurantType === 'Veg' || newMenuItem.veg) && (
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                            checked={newMenuItem.isJain ?? false} onChange={e => setNewMenuItem({ ...newMenuItem, isJain: e.target.checked })} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Jain Friendly</span>
                    </label>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        checked={newMenuItem.isAvailable ?? true} onChange={e => setNewMenuItem({ ...newMenuItem, isAvailable: e.target.checked })} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        checked={newMenuItem.isRecommended ?? false} onChange={e => setNewMenuItem({ ...newMenuItem, isRecommended: e.target.checked })} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Recommended</span>
                </label>
            </div>

            {/* ─── Ingredients Section ─────────────────────────────────── */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
                    <button
                        type="button"
                        onClick={() => setShowIngredients(v => !v)}
                        className="flex-1 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors text-left"
                    >
                        🥗 Ingredients
                        {ingredients.length > 0 && (
                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full">
                                {ingredients.length}
                            </span>
                        )}
                    </button>
                    <div className="flex items-center gap-3">
                        <button 
                            type="button" 
                            onClick={handleAiSuggest}
                            disabled={isAiLoading}
                            className="text-xs font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                            {isAiLoading ? "Thinking..." : "✨ AI Suggest"}
                        </button>
                        <button type="button" onClick={() => setShowIngredients(v => !v)}>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform ${showIngredients ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {showIngredients && (
                    <div className="p-4 space-y-3">
                        {inventoryItems.length === 0 ? (
                            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-3">
                                No inventory items found. Add inventory first.
                            </p>
                        ) : (
                            <>
                                {ingError && (
                                    <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">
                                        {ingError}
                                    </p>
                                )}

                                {ingredients.map((ing, idx) => (
                                    <React.Fragment key={idx}>
                                    <div className="grid grid-cols-[1fr_80px_32px_32px] gap-2 items-end">
                                        {/* Inventory Picker */}
                                        <div className="relative">
                                            {idx === 0 && <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Ingredient</label>}
                                            <select
                                                className={fieldCls}
                                                value={ing.inventoryId}
                                                onChange={e => updateIngredient(idx, 'inventoryId', e.target.value)}
                                            >
                                                <option value="">Select ingredient</option>
                                                {inventoryItems.map(inv => (
                                                    <option key={inv.id} value={inv.id}>
                                                        {inv.name} ({inv.unit})
                                                    </option>
                                                ))}
                                            </select>
                                            {(!ing.inventoryId && ing.name) && (
                                                <div className="absolute top-full left-0 mt-0.5 text-[10px] text-amber-500 font-medium whitespace-nowrap">
                                                    ⚠️ AI: {ing.name} (Unmatched)
                                                </div>
                                            )}
                                        </div>

                                        {/* Quantity Used */}
                                        <div>
                                            {idx === 0 && <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Qty / Serving</label>}
                                            <input
                                                type="number" min="0.01" step="0.01"
                                                className={fieldCls}
                                                placeholder="Qty"
                                                value={ing.quantityUsed}
                                                onChange={e => updateIngredient(idx, 'quantityUsed', e.target.value)}
                                            />
                                        </div>

                                        {/* Auto-Deduct */}
                                        <div className="flex items-center h-full pb-3 justify-center">
                                            <label className="flex items-center cursor-pointer" title="Auto deduct on order">
                                                <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                    checked={ing.deductOnOrder} onChange={e => updateIngredient(idx, 'deductOnOrder', e.target.checked as any)} />
                                            </label>
                                        </div>

                                        {/* Remove */}
                                        <button
                                            type="button"
                                            onClick={() => removeIngredientRow(idx)}
                                            className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all mb-0.5"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="h-4"></div> {/* Spacer for absolute unmatched text */}
                                    </React.Fragment>
                                ))}

                                <button
                                    type="button"
                                    onClick={addIngredientRow}
                                    className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:border-indigo-500/50 hover:text-indigo-500 transition-colors"
                                >
                                    <Plus size={14} /> Add Ingredient
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Submit */}
            <button
                onClick={onSubmit}
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
            >
                {isLoading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                ) : (editingId ? 'Update Item' : 'Add Item')}
            </button>
        </div>
    );
};

export default AddMenuForm;
