import React from 'react';
import { IngredientEntry } from '../../services/inventoryService';

interface ViewMenuItemProps {
    item: any;
    ingredients: IngredientEntry[];
    isLoading: boolean;
}

const ViewMenuItem: React.FC<ViewMenuItemProps> = ({ item, ingredients, isLoading }) => {
    if (!item) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-center">
                <div className="w-full h-48 rounded-xl overflow-hidden relative shadow-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {item.image ? (
                        <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            <span className="text-sm font-semibold uppercase tracking-widest">No Image Provided</span>
                        </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
                        {item.category}
                    </div>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">{item.name}</h3>
                        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">₹{item.price}</p>
                    </div>
                    {item.isRecommended && (
                        <span className="flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            Recommended
                        </span>
                    )}
                </div>

                {item.description && (
                    <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm leading-relaxed">
                        {item.description}
                    </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.isAvailable !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                        {item.isAvailable !== false ? 'Available' : 'Out of Stock'}
                    </span>
                    {item.veg !== undefined && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.veg ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'}`}>
                            {item.veg ? '🟢 Veg' : '🔴 Non-Veg'}
                        </span>
                    )}
                    {item.spicyLevel > 0 && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 flex items-center gap-1">
                            🌶️ Level {item.spicyLevel}
                        </span>
                    )}
                    {item.preparationTime > 0 && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                            ⏱️ {item.preparationTime} min
                        </span>
                    )}
                    {item.calories > 0 && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 flex items-center gap-1">
                            🔥 {item.calories} kcal
                        </span>
                    )}
                </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 p-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    🥗 Ingredients Recipe
                </h4>
                
                {isLoading ? (
                    <p className="text-xs text-slate-400 animate-pulse">Loading ingredients...</p>
                ) : ingredients.length > 0 ? (
                    <ul className="space-y-2">
                        {ingredients.map((ing, idx) => (
                            <li key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50 shadow-sm">
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{ing.name}</span>
                                <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    {ing.quantityUsed} {ing.unit}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-xs text-slate-400 bg-white dark:bg-slate-800 p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-center">
                        No ingredients added for this piece.
                    </p>
                )}
            </div>
            
        </div>
    );
};

export default ViewMenuItem;
