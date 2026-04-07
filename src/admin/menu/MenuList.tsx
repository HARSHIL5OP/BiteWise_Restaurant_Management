import React from 'react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';

const MenuList = ({ menuItems, openEditMenu, handleDeleteMenu, setShowAddMenu, setEditingId, setNewMenuItem, openViewMenu }: any) => {
    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex gap-2 w-full sm:w-auto">
                    <button className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-xl sm:rounded-lg hover:bg-indigo-700 transition active:scale-95 shadow-lg shadow-indigo-500/20 flex items-center justify-center min-h-[44px]" onClick={() => {
                        setEditingId(null);
                        setNewMenuItem({ 
                            name: '', price: '', image: null, category: 'Main Course', newCategory: '',
                            description: '', veg: true, spicyLevel: 0, preparationTime: 0, calories: 0,
                            isAvailable: true, isRecommended: false
                        });
                        setShowAddMenu(true);
                    }}>
                        <Plus size={18} className="mr-2" /> Add Item
                    </button>
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">{menuItems.length} Items Found</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {menuItems.map((item: any) => (
                    <div key={item.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-xl hover:-translate-y-1 relative">
                        {item.isRecommended && (
                            <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white p-1.5 rounded-full shadow-md" title="Recommended">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            </div>
                        )}
                        <div className="h-48 overflow-hidden relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                                    <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    <span className="text-xs font-semibold uppercase tracking-wider">No Image</span>
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-2">
                                {item.veg !== undefined && (
                                    <div className={`px-2 py-1 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-md flex items-center justify-center border ${item.veg ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/50' : 'bg-rose-500/20 text-rose-100 border-rose-500/50'}`}>
                                        <div className={`w-2 h-2 rounded-full mr-1 ${item.veg ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                        {item.veg ? 'VEG' : 'NON-VEG'}
                                    </div>
                                )}
                                <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm flex items-center">
                                    {item.category}
                                </div>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1" title={item.name}>{item.name}</h3>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">${item.price}</span>
                            </div>
                            
                            {/* Detailed Description */}
                            <p className={`text-xs mb-3 line-clamp-2 h-8 ${item.description ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600 italic'}`} title={item.description || 'No description'}>
                                {item.description || 'No description available for this item.'}
                            </p>

                            {/* Attributes row */}
                            <div className="flex flex-wrap gap-2 mb-3 min-h-[24px]">
                                <span className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-md ${item.spicyLevel > 0 ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}`} title={item.spicyLevel > 0 ? `Spiciness: ${item.spicyLevel}/5` : 'Mild'}>
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C12 2 8 6.5 8 11.5C8 14.5376 10.4624 17 13.5 17C14.7351 17 15.864 16.5938 16.7725 15.9189C17.5312 17.5627 18 19.3897 18 21.5C18 21.7761 17.7761 22 17.5 22H6.5C6.22386 22 6 21.7761 6 21.5C6 19.0494 6.78762 16.7909 8.10657 14.9647C6.81249 13.435 6 11.4552 6 9.29413V9C4.89543 9 4 9.89543 4 11V21.5C4 22.8807 5.11929 24 6.5 24H17.5C18.8807 24 20 22.8807 20 21.5C20 18.919 19.3732 16.5367 18.2936 14.5445C19.3621 13.4285 20 11.9056 20 10.2353C20 5.68629 16.4183 2 12 2ZM13.5 15C11.567 15 10 13.433 10 11.5C10 8.5 12 5.5 12 5.5C12 5.5 14 8.5 14 11.5C14 13.433 12.433 15 13.5 15Z" /></svg>
                                    {item.spicyLevel > 0 ? `Level ${item.spicyLevel}` : 'Level 0'}
                                </span>

                                <span className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-md ${item.preparationTime > 0 ? 'text-slate-500 bg-slate-100 dark:bg-slate-800' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}`} title="Prep time">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    {item.preparationTime > 0 ? `${item.preparationTime} min` : '0 min'}
                                </span>
                                
                                <span className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-md ${item.calories > 0 ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}`} title="Calories">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C12 2 6 7.5 6 13C6 16.3137 8.68629 19 12 19C15.3137 19 18 16.3137 18 13C18 7.5 12 2 12 2ZM10.5 16C10.5 16.8284 9.82843 17.5 9 17.5C8.17157 17.5 7.5 16.8284 7.5 16C7.5 14 9.5 12 9.5 12C9.5 12 10.5 14 10.5 16ZM14.5 14C14.5 15.1046 13.6046 16 12.5 16C11.3954 16 10.5 15.1046 10.5 14C10.5 12 13.5 9 13.5 9C13.5 9 14.5 11 14.5 14Z" /></svg>
                                    {item.calories > 0 ? `${item.calories} kcal` : '0 kcal'}
                                </span>
                            </div>

                            <p className="text-slate-500 text-xs mb-4 flex items-center justify-between">
                                <span className={item.isAvailable === false ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>{item.isAvailable === false ? 'Out of Stock' : 'Available'}</span>
                                {item.createdAt && <span className="text-[10px] text-slate-400">Added: {new Date(item.createdAt).toLocaleDateString()}</span>}
                            </p>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button onClick={() => openViewMenu(item)} className="p-2 text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors bg-slate-50 dark:bg-slate-800 rounded-lg" title="View details">
                                    <Eye size={16} />
                                </button>
                                <button onClick={() => openEditMenu(item)} className="p-2 text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors bg-slate-50 dark:bg-slate-800 rounded-lg" title="Edit item">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDeleteMenu(item.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all rounded-lg" title="Delete item">
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
