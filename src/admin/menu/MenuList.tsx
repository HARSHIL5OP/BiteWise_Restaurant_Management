import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const MenuList = ({ menuItems, openEditMenu, handleDeleteMenu, setShowAddMenu, setEditingId, setNewMenuItem }: any) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition active:scale-95 shadow-lg shadow-indigo-500/20" onClick={() => {
                        setEditingId(null);
                        setNewMenuItem({ name: '', price: '', image: null, category: 'Main Course', newCategory: '' });
                        setShowAddMenu(true);
                    }}>
                        <Plus size={18} className="inline mr-2" /> Add Item
                    </button>
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">{menuItems.length} Items Found</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {menuItems.map((item: any) => (
                    <div key={item.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-xl hover:-translate-y-1">
                        <div className="h-48 overflow-hidden relative">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
                                {item.category}
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">{item.name}</h3>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">${item.price}</span>
                            </div>
                            <p className="text-slate-500 text-sm mb-4"><span className={item.isAvailable === false ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>{item.isAvailable === false ? 'Out of Stock' : 'Available'}</span></p>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button onClick={() => openEditMenu(item)} className="p-2 text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDeleteMenu(item.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all rounded-lg">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MenuList;
