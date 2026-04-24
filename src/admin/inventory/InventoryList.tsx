import React from 'react';
import { Plus, Edit2, RefreshCcw, AlertTriangle, Package } from 'lucide-react';
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery';
import { orderBy, limit } from 'firebase/firestore';

interface Props {
    restaurantId: string;
    onAdd: () => void;
    onEdit: (item: InventoryItem) => void;
    onRestock: (item: InventoryItem) => void;
}

const InventoryList: React.FC<Props> = ({ restaurantId, onAdd, onEdit, onRestock }) => {
    const { items, loading, loadingMore, hasMore, loadMore, refetch } = usePaginatedQuery<InventoryItem>(
        ['restaurants', restaurantId, 'inventory'],
        [orderBy('name', 'asc')],
        15
    );

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={onAdd}
                        className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl sm:rounded-lg transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm font-bold min-h-[44px]"
                    >
                        <Plus size={16} /> Add Item
                    </button>
                </div>
                </div>
                <div className="flex gap-4 items-center">
                    {loading && <span className="text-sm text-slate-500">Loading...</span>}
                    <button 
                        onClick={refetch}
                        disabled={loading}
                        className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCcw size={18} />
                    </button>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{items.length} Loaded</p>
                </div>
            </div>

            {/* Empty state */}
            {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
                    <Package size={48} strokeWidth={1.5} className="mb-4" />
                    <p className="font-semibold text-lg">No inventory items yet</p>
                    <p className="text-sm mt-1">Click "Add Item" to get started.</p>
                </div>
            )}

            {/* Mobile Card Layout */}
            {items.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {items.map(item => {
                        const isLow = item.quantity <= item.threshold;
                        
                        let expiryStatus = null;
                        if (item.isPerishable) {
                            let targetDate = null;
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
                            <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col gap-3">
                                {isLow && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />}
                                {expiryStatus === 'expired' && <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />}
                                {expiryStatus === 'near_expiry' && <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />}

                                <div className="flex justify-between items-start pl-2">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white capitalize">{item.name}</h3>
                                        <p className="text-xs text-slate-500 mt-1">Supplier: {item.supplier || '—'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-lg ${isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {item.quantity} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.unit}</span>
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 pl-2">
                                    {isLow && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
                                            <AlertTriangle size={10} /> Low
                                        </span>
                                    )}
                                    {expiryStatus === 'expired' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
                                            Expired
                                        </span>
                                    )}
                                    {expiryStatus === 'near_expiry' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
                                            Near Expiry
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => onRestock(item)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm min-h-[44px]"
                                    >
                                        <RefreshCcw size={16} /> Restock
                                    </button>
                                    <button
                                        onClick={() => onEdit(item)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-sm min-h-[44px]"
                                    >
                                        <Edit2 size={16} /> Edit
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Desktop Table */}
            {items.length > 0 && (
                <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Name</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Stock</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Unit</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Threshold</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Supplier</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Expiry</th>
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
                                        <tr 
                                            key={item.id} 
                                            className={`transition-colors border-l-4 ${
                                                expiryStatus === 'expired' ? 'bg-rose-50/50 dark:bg-rose-900/10 border-l-rose-500 hover:bg-rose-100/50' :
                                                expiryStatus === 'near_expiry' ? 'bg-orange-50/50 dark:bg-orange-900/10 border-l-orange-500 hover:bg-orange-100/50' :
                                                isLow ? 'bg-amber-50/50 dark:bg-amber-900/10 border-l-amber-500 hover:bg-amber-100/50' :
                                                'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30'
                                            }`}
                                        >
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
                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-xs">
                                                {(() => {
                                                    let targetDate: Date | null = null;
                                                    if (item.expiryDate) {
                                                        targetDate = new Date(item.expiryDate);
                                                    } else if (item.shelfLifeDays) {
                                                        const lastRestocked = item.lastRestocked ? new Date(item.lastRestocked) : new Date();
                                                        targetDate = new Date(lastRestocked.getTime() + item.shelfLifeDays * 86400000);
                                                    }
                                                    return targetDate ? targetDate.toLocaleDateString() : '—';
                                                })()}
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

            {/* Pagination Controls */}
            {hasMore && (
                <div className="mt-4 p-4 flex justify-center">
                    <button 
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:shadow-md transition-all disabled:opacity-50"
                    >
                        {loadingMore ? 'Loading Items...' : 'Load More Inventory'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default InventoryList;
