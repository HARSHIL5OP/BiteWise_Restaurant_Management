import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Clock, Check, UtensilsCrossed, ChevronRight } from 'lucide-react';

interface CustomerOrdersViewProps {
    orders: any[];
    setActiveView: (view: 'menu' | 'orders' | 'history' | 'payment') => void;
}

const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({ orders, setActiveView }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-4 space-y-4 pb-32"
        >
            {orders.length === 0 ? (
                <div className="text-center py-20">
                    <ChefHat className="w-20 h-20 text-orange-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-800">No active orders</h3>
                    <p className="text-gray-500 mt-2">Hungry? Go to menu and order something delicious!</p>
                    <button
                        onClick={() => setActiveView('menu')}
                        className="mt-6 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all"
                    >
                        Browse Menu
                    </button>
                </div>
            ) : (
                <>
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-2xl p-5 shadow-lg border border-orange-100 relative overflow-hidden">
                            {/* Status Header */}
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider ${order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                    order.status === 'preparing' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                        'bg-green-50 text-green-700 border border-green-200'
                                    }`}>
                                    {order.status === 'pending' && <Clock className="w-3 h-3" />}
                                    {order.status === 'preparing' && <ChefHat className="w-3 h-3" />}
                                    {order.status === 'ready' && <Check className="w-3 h-3" />}
                                    {order.status === 'served' && <UtensilsCrossed className="w-3 h-3" />}
                                    {order.status.replace('_', ' ')}
                                </div>
                                <span className="text-xs text-gray-400 font-medium">#{order.id.slice(0, 6)}</span>
                            </div>

                            {/* Items */}
                            <div className="space-y-3 mb-4">
                                {order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-start text-sm">
                                        <div className="flex items-start gap-2">
                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${item.veg ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <div>
                                                <span className="font-semibold text-gray-800">{item.name}</span>
                                                <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                                            </div>
                                        </div>
                                        <span className="font-medium text-gray-700">₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="bg-gray-50 -mx-5 -mb-5 p-4 mt-2 space-y-2">
                                <div className="flex justify-between items-center text-gray-500 text-xs">
                                    <span>Subtotal</span>
                                    <span>₹{order.subtotal?.toFixed(1) || order.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0).toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-500 text-xs">
                                    <span>Taxes (5%)</span>
                                    <span>₹{order.tax?.toFixed(1) || (order.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0) * 0.05).toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                    <span className="text-gray-900 font-bold">Total Bill</span>
                                    <span className="text-xl font-bold text-gray-900">₹{order.totalAmount?.toFixed(1) || (order.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0) * 1.05).toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-40">
                        <button
                            onClick={() => setActiveView('payment')}
                            className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white p-4 rounded-2xl font-bold shadow-xl shadow-green-200 flex items-center justify-between group"
                        >
                            <span className="flex flex-col text-left">
                                <span className="text-xs font-normal opacity-90">Total Payable</span>
                                <span className="text-xl">₹{orders.reduce((sum, o) => sum + o.totalAmount, 0)}</span>
                            </span>
                            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl group-hover:bg-white/30 transition-all">
                                Pay Now <ChevronRight className="w-5 h-5" />
                            </div>
                        </button>
                    </div>
                </>
            )}
        </motion.div>
    );
};

export default CustomerOrdersView;
