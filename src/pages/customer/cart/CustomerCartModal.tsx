import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ChevronRight } from 'lucide-react';

interface CustomerCartModalProps {
    showCart: boolean;
    setShowCart: (show: boolean) => void;
    cart: any[];
    cartItemCount: number;
    cartTotal: number;
    updateQuantity: (id: string, delta: number) => void;
    placeOrder: () => void;
}

const CustomerCartModal: React.FC<CustomerCartModalProps> = ({
    showCart, setShowCart, cart, cartItemCount, cartTotal, updateQuantity, placeOrder
}) => {
    return (
        <AnimatePresence>
            {showCart && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center"
                    onClick={() => setShowCart(false)}
                >
                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        className="bg-white w-full max-w-md h-[85vh] sm:h-auto sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl relative"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Draggable Handle for mobile feel */}
                        <div className="w-full h-1.5 absolute top-3 flex justify-center opacity-20 pointer-events-none">
                            <div className="w-12 bg-gray-900 rounded-full" />
                        </div>

                        <div className="p-5 border-b border-gray-100 flex items-center justify-between mt-2">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                Your Cart
                                <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">{cartItemCount}</span>
                            </h2>
                            <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200" onClick={() => setShowCart(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {cart.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                        <img src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} alt={item.name} className="w-full h-full object-cover" />
                                        <div className={`absolute top-0 right-0 p-0.5 bg-white/90 rounded-bl-md`}>
                                            <div className={`w-2 h-2 rounded-full ${item.veg ? 'bg-green-500' : 'bg-red-500'}`} />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-800 line-clamp-1">{item.name}</h4>
                                        <p className="text-sm font-medium text-gray-900">₹{item.price * item.quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-3 h-8 bg-white border border-gray-200 rounded-lg px-2">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="text-orange-600">
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="text-orange-600">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-5 bg-gray-50 space-y-4">
                            <div className="space-y-2 text-sm text-gray-600 border-b border-gray-200 pb-4">
                                <div className="flex justify-between">
                                    <span>Item Total</span>
                                    <span>₹{cartTotal}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Taxes (5%)</span>
                                    <span>₹{Math.round(cartTotal * 0.05)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                                <span>Grand Total</span>
                                <span>₹{Math.round(cartTotal * 1.05)}</span>
                            </div>
                            <button
                                onClick={placeOrder}
                                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold shadow-xl shadow-orange-200 transform transition-transform active:scale-95"
                            >
                                Place Order To Kitchen
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CustomerCartModal;
