import React from 'react';
import { Upload } from 'lucide-react';

const AddMenuForm = ({ newMenuItem, setNewMenuItem, handleAddMenu, categories, isLoading, editingId }: any) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Item Name</label>
                <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-colors"
                    placeholder="e.g. Spicy Ramen"
                    value={newMenuItem.name} onChange={e => setNewMenuItem({ ...newMenuItem, name: e.target.value })} />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Price ($)</label>
                <input type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-colors"
                    placeholder="0.00"
                    value={newMenuItem.price} onChange={e => setNewMenuItem({ ...newMenuItem, price: e.target.value })} />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
                <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none mb-2 transition-colors"
                    value={newMenuItem.category} onChange={e => setNewMenuItem({ ...newMenuItem, category: e.target.value, newCategory: '' })}>
                    {categories.map((cat: string) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="new">+ Add New Category</option>
                </select>
                {newMenuItem.category === 'new' && (
                    <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none animate-in fade-in slide-in-from-top-2 transition-colors"
                        placeholder="Enter new category name..."
                        value={newMenuItem.newCategory} onChange={e => setNewMenuItem({ ...newMenuItem, newCategory: e.target.value })} />
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Item Image</label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center hover:border-indigo-500/50 transition-colors cursor-pointer relative group bg-slate-50 dark:bg-slate-950/50">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, image: e.target?.files?.[0] || null })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
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
            <button
                onClick={handleAddMenu}
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
            >
                {isLoading ? 'Saving...' : (editingId ? 'Update Item' : 'Add Item')}
            </button>
        </div>
    );
};

export default AddMenuForm;
