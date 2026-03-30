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
                <div className="w-full h-48 rounded-xl overflow-hidden relative shadow-md">
                    <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
                        {item.category}
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">{item.name}</h3>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">₹{item.price}</p>
                <div className="mt-2 flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.isAvailable !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                        {item.isAvailable !== false ? 'Available' : 'Out of Stock'}
                    </span>
                    {item.veg !== undefined && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.veg ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                            {item.veg ? 'Veg' : 'Non-Veg'}
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
