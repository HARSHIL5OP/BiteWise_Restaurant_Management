import React from 'react';
import { Plus, Edit2, RefreshCcw, AlertTriangle, Package } from 'lucide-react';
import { InventoryItem } from '../../services/inventoryService';

interface Props {
    items: InventoryItem[];
    onAdd: () => void;
    onEdit: (item: InventoryItem) => void;
    onRestock: (item: InventoryItem) => void;
}

const InventoryList: React.FC<Props> = ({ items, onAdd, onEdit, onRestock }) => {
    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={onAdd}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-sm font-bold"
                    >
                        <Plus size={16} /> Add Item
                    </button>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{items.length} Item{items.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Empty state */}
            {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
                    <Package size={48} strokeWidth={1.5} className="mb-4" />
                    <p className="font-semibold text-lg">No inventory items yet</p>
                    <p className="text-sm mt-1">Click "Add Item" to get started.</p>
                </div>
            )}

            {/* Table */}
            {items.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Name</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Stock</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Unit</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Threshold</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Supplier</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Cost/Unit</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Last Restocked</th>
                                    <th className="px-5 py-3.5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {items.map(item => {
                                    const isLow = item.quantity <= item.threshold;
                                    
                                    // Calculate expiry status
                                    let expiryStatus: 'fresh' | 'near_expiry' | 'expired' | null = null;
                                    if (item.isPerishable) {
                                        let targetDate: Date | null = null;
                                        if (item.expiryDate) {
                                            targetDate = new Date(item.expiryDate);
                                        } else if (item.shelfLifeDays) {
                                            const lastRestocked = item.lastRestocked ? new Date(item.lastRestocked) : new Date();
                                            targetDate = new Date(lastRestocked.getTime() + item.shelfLifeDays * 86400000);
                                        }
                                        
                                        if (targetDate) {
                                            const now = new Date();
                                            const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / 86400000);
                                            const threshold = item.expiryAlertThreshold || 2;
                                            
                                            if (diffDays <= 0) expiryStatus = 'expired';
                                            else if (diffDays <= threshold) expiryStatus = 'near_expiry';
                                            else expiryStatus = 'fresh';
                                        }
                                    }

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <span className="font-semibold text-slate-800 dark:text-white capitalize whitespace-nowrap">{item.name}</span>
                                                    {isLow && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-100/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full border border-amber-200 dark:border-amber-500/20 uppercase tracking-wide">
                                                            <AlertTriangle size={10} /> Low
                                                        </span>
                                                    )}
                                                    {expiryStatus === 'expired' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full border border-rose-200 dark:border-rose-500/20 uppercase tracking-wide">
                                                             Expired
                                                        </span>
                                                    )}
                                                    {expiryStatus === 'near_expiry' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold rounded-full border border-orange-200 dark:border-orange-500/20 uppercase tracking-wide">
                                                             Near Expiry
                                                        </span>
                                                    )}
                                                    {expiryStatus === 'fresh' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-200 dark:border-emerald-500/20 uppercase tracking-wide">
                                                             Fresh
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`font-bold ${isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{item.unit}</td>
                                            <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{item.threshold}</td>
                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{item.supplier || '—'}</td>
                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                ₹{Number(item.costPerUnit).toFixed(2)}
                                            </td>
                                            <td className="px-5 py-4 text-slate-400 text-xs">
                                                {item.lastRestocked
                                                    ? new Date(item.lastRestocked).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                    : '—'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <button
                                                        onClick={() => onRestock(item)}
                                                        title="Restock"
                                                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                                                    >
                                                        <RefreshCcw size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => onEdit(item)}
                                                        title="Edit"
                                                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                                                    >
                                                        <Edit2 size={15} />
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

export default InventoryList;
