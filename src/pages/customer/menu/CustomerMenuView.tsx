import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Filter, ArrowDownAz, Flame, Plus, Minus, UtensilsCrossed } from 'lucide-react';

interface CustomerMenuViewProps {
    menuViewMode: 'overview' | 'items';
    setMenuViewMode: (mode: 'overview' | 'items') => void;
    menuData: any[];
    selectedCategory: string | null;
    setSelectedCategory: (cat: string) => void;
    isVegOnly: boolean;
    setIsVegOnly: (veg: boolean) => void;
    sortBy: 'default' | 'price_low';
    setSortBy: (sort: 'default' | 'price_low' | ((prev: 'default' | 'price_low') => 'default' | 'price_low')) => void;
    categoryScrollRef: React.RefObject<HTMLDivElement>;
    cart: any[];
    addToCart: (item: any) => void;
    updateQuantity: (id: string, delta: number) => void;
    currentCategoryData: any;
    filteredItems: any[];
    handleCategoryClick: (cat: string) => void;
    renderSpicy: (level: number) => React.ReactNode;
    currentUserName: string;
}

const CustomerMenuView: React.FC<CustomerMenuViewProps> = ({
    menuViewMode, setMenuViewMode, menuData, selectedCategory,
    isVegOnly, setIsVegOnly, sortBy, setSortBy, categoryScrollRef,
    cart, addToCart, updateQuantity, currentCategoryData, filteredItems,
    handleCategoryClick, renderSpicy, currentUserName
}) => {
    return (
        <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
        >
            {/* --- CATEGORY OVERVIEW (Grid) --- */}
            {menuViewMode === 'overview' && (
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Menu Categories</h2>
                        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">{menuData.length} Collections</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {menuData.map((cat, idx) => (
                            <motion.button
                                key={cat.category}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => handleCategoryClick(cat.category)}
                                className="relative h-44 rounded-2xl overflow-hidden shadow-md group active:scale-95 transition-all"
                            >
                                <img
                                    src={cat.items[0]?.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
                                    alt={cat.category}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                                <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                                    <div className="text-2xl mb-1">{cat.icon}</div>
                                    <h3 className="font-bold text-white text-lg leading-none mb-1">{cat.category}</h3>
                                    <p className="text-xs text-gray-300 font-medium">{cat.items.length} Items</p>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

            {/* --- CATEGORY ITEMS (List) --- */}
            {menuViewMode === 'items' && selectedCategory && (
                <div className="min-h-full">
                    {/* Sticky Categories Bar */}
                    <div className="sticky top-[105px] z-40 bg-white/95 backdrop-blur shadow-sm py-2">
                        <div
                            className="flex overflow-x-auto no-scrollbar gap-2 px-4 items-center"
                            ref={categoryScrollRef}
                        >
                            <button
                                onClick={() => setMenuViewMode('overview')}
                                className="min-w-[36px] h-9 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 mr-1 active:bg-gray-200"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>

                            {menuData.map((cat) => (
                                <button
                                    key={cat.category}
                                    onClick={() => handleCategoryClick(cat.category)}
                                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all flex items-center gap-2 ${selectedCategory === cat.category
                                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md transform scale-105'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <span>{cat.icon}</span>
                                    {cat.category}
                                </button>
                            ))}
                        </div>

                        {/* Filter / Sort Bar */}
                        <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-50 bg-white">
                            <button
                                onClick={() => setIsVegOnly(!isVegOnly)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${isVegOnly ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${isVegOnly ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                Veg Only
                            </button>

                            <button
                                onClick={() => setSortBy(prev => prev === 'default' ? 'price_low' : 'default')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${sortBy !== 'default' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-500'}`}
                            >
                                {sortBy === 'default' ? <Filter className="w-3 h-3" /> : <ArrowDownAz className="w-3 h-3" />}
                                {sortBy === 'default' ? 'Sort' : 'Low Price'}
                            </button>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="p-4 space-y-4">
                        {filteredItems.map((item) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={item.id}
                                className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-4 overflow-hidden relative"
                            >
                                {/* Left: Image */}
                                <div className="relative w-28 h-28 flex-shrink-0">
                                    <img
                                        src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
                                        alt={item.name}
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                    <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-md rounded px-1.5 py-0.5 shadow-sm">
                                        {item.veg ? (
                                            <div className="w-3 h-3 border border-green-600 rounded-sm flex items-center justify-center p-[1px]">
                                                <div className="w-full h-full bg-green-600 rounded-[1px]" />
                                            </div>
                                        ) : (
                                            <div className="w-3 h-3 border border-red-600 rounded-sm flex items-center justify-center p-[1px]">
                                                <div className="w-full h-full bg-red-600 rounded-[1px]" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Content */}
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-800 text-[15px] leading-tight line-clamp-2">{item.name}</h3>
                                        </div>
                                        {item.spicy > 0 && (
                                            <div className="mt-1">{renderSpicy(item.spicy)}</div>
                                        )}
                                    </div>

                                    <div className="flex items-end justify-between mt-2">
                                        <div className="font-bold text-gray-900 text-lg">₹{item.price}</div>

                                        {/* Add Button */}
                                        {(() => {
                                            const myCartItem = cart.find(c => c.id === item.id && c.addedBy === currentUserName);
                                            return myCartItem ? (
                                                <div className="flex items-center bg-white shadow-md border border-orange-100 rounded-lg overflow-hidden h-9">
                                                    <button
                                                        onClick={() => updateQuantity(myCartItem.cartDocId, -1)}
                                                        className="w-8 h-full flex items-center justify-center text-orange-600 hover:bg-orange-50 active:bg-orange-100"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-sm text-gray-800">
                                                        {myCartItem.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(myCartItem.cartDocId, 1)}
                                                        className="w-8 h-full flex items-center justify-center text-orange-600 hover:bg-orange-50 active:bg-orange-100"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => addToCart(item)}
                                                    className="h-9 px-6 bg-white border border-gray-200 text-orange-600 font-bold text-sm rounded-lg shadow-sm uppercase tracking-wide hover:bg-orange-50 active:scale-95 transition-all"
                                                >
                                                    ADD
                                                </button>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {filteredItems.length === 0 && (
                            <div className="text-center py-20 text-gray-400">
                                <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No items found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default CustomerMenuView;
