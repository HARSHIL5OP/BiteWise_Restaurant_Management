import React, { useState } from 'react';
import { Package, RefreshCcw } from 'lucide-react';
import { InventoryItem, InventoryUnit } from '../../services/inventoryService';

const UNITS: InventoryUnit[] = ['kg', 'g', 'l', 'ml', 'pcs'];

interface Props {
    onAdd: (data: Omit<InventoryItem, 'id' | 'restaurantId' | 'updatedAt' | 'lastRestocked'>) => Promise<void>;
    onRestock: (id: string, currentQty: number, addQty: number) => Promise<void>;
    onUpdate: (id: string, changes: Partial<Pick<InventoryItem, 'quantity' | 'supplier' | 'costPerUnit'>>) => Promise<void>;
    editingItem?: InventoryItem | null;
    isLoading: boolean;
    mode: 'add' | 'edit' | 'restock';
}

const fieldCls = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-colors text-sm";
const labelCls = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider";

const AddInventoryForm: React.FC<Props> = ({ onAdd, onRestock, onUpdate, editingItem, isLoading, mode }) => {
    const [form, setForm] = useState({
        name: editingItem?.name || '',
        quantity: editingItem?.quantity?.toString() || '',
        unit: (editingItem?.unit || 'pcs') as InventoryUnit,
        threshold: editingItem?.threshold?.toString() || '0',
        supplier: editingItem?.supplier || '',
        costPerUnit: editingItem?.costPerUnit?.toString() || '0',
        restockQty: '',
    });
    const [error, setError] = useState('');

    const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async () => {
        setError('');
        try {
            if (mode === 'restock') {
                const addQty = parseFloat(form.restockQty);
                if (!addQty || addQty <= 0) { setError('Enter a positive restock quantity.'); return; }
                await onRestock(editingItem!.id!, editingItem!.quantity, addQty);
                return;
            }
            if (mode === 'edit') {
                await onUpdate(editingItem!.id!, {
                    quantity: parseFloat(form.quantity) || 0,
                    supplier: form.supplier,
                    costPerUnit: parseFloat(form.costPerUnit) || 0,
                });
                return;
            }
            // add
            if (!form.name.trim()) { setError('Name is required.'); return; }
            const qty = parseFloat(form.quantity);
            if (isNaN(qty) || qty < 0) { setError('Quantity must be ≥ 0.'); return; }
            await onAdd({
                name: form.name.trim(),
                quantity: qty,
                unit: form.unit,
                threshold: parseFloat(form.threshold) || 0,
                supplier: form.supplier.trim(),
                costPerUnit: parseFloat(form.costPerUnit) || 0,
            });
        } catch (e: any) {
            setError(e.message || 'Something went wrong.');
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm rounded-lg px-4 py-3">
                    {error}
                </div>
            )}

            {mode === 'restock' ? (
                <>
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{editingItem?.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Current stock: <span className="font-bold text-indigo-600 dark:text-indigo-400">{editingItem?.quantity} {editingItem?.unit}</span></p>
                    </div>
                    <div>
                        <label className={labelCls}>Add Quantity ({editingItem?.unit})</label>
                        <input type="number" min="0.01" step="0.01" className={fieldCls}
                            placeholder="e.g. 5"
                            value={form.restockQty} onChange={e => set('restockQty', e.target.value)} />
                    </div>
                </>
            ) : (
                <>
                    {mode === 'add' && (
                        <div>
                            <label className={labelCls}>Item Name *</label>
                            <input className={fieldCls} placeholder="e.g. Basmati Rice"
                                value={form.name} onChange={e => set('name', e.target.value)} />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Quantity {mode === 'add' ? '*' : ''}</label>
                            <input type="number" min="0" step="0.01" className={fieldCls}
                                placeholder="0"
                                value={form.quantity} onChange={e => set('quantity', e.target.value)} />
                        </div>
                        {mode === 'add' && (
                            <div>
                                <label className={labelCls}>Unit *</label>
                                <select className={fieldCls} value={form.unit} onChange={e => set('unit', e.target.value as InventoryUnit)}>
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        )}
                        {mode === 'edit' && (
                            <div className="flex items-end">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 pb-3">{editingItem?.unit}</span>
                            </div>
                        )}
                    </div>

                    {mode === 'add' && (
                        <div>
                            <label className={labelCls}>Low Stock Threshold</label>
                            <input type="number" min="0" step="0.01" className={fieldCls}
                                placeholder="0.00"
                                value={form.threshold} onChange={e => set('threshold', e.target.value)} />
                        </div>
                    )}

                    <div>
                        <label className={labelCls}>Supplier</label>
                        <input className={fieldCls} placeholder="Supplier name"
                            value={form.supplier} onChange={e => set('supplier', e.target.value)} />
                    </div>

                    <div>
                        <label className={labelCls}>Cost Per Unit (₹)</label>
                        <input type="number" min="0" step="0.01" className={fieldCls}
                            placeholder="0.00"
                            value={form.costPerUnit} onChange={e => set('costPerUnit', e.target.value)} />
                    </div>
                </>
            )}

            <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 mt-2"
            >
                {isLoading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                ) : mode === 'restock' ? (
                    <><RefreshCcw size={16} /> Restock</>
                ) : mode === 'edit' ? (
                    <><Package size={16} /> Update Item</>
                ) : (
                    <><Package size={16} /> Add Item</>
                )}
            </button>
        </div>
    );
};

export default AddInventoryForm;
