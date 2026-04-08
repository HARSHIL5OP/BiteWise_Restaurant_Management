import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Wallet, ChevronRight } from 'lucide-react';

interface CustomerPaymentViewProps {
    orders: any[];
    setActiveView: (view: 'menu' | 'orders' | 'history' | 'payment') => void;
    handleRazorpayPayment: () => void;
}

const CustomerPaymentView: React.FC<CustomerPaymentViewProps> = ({ orders, setActiveView, handleRazorpayPayment }) => {
    return (
        <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="flex flex-col h-full bg-gray-50 min-h-[80vh]"
        >
            <div className="p-6">
                <button onClick={() => setActiveView('orders')} className="mb-4 flex items-center text-gray-500 gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Back to Orders</button>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment</h2>

                <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100 text-center">
                    <div className="text-gray-500 text-sm mb-1">Total Amount Due</div>
                    <div className="text-4xl font-bold text-gray-900">₹{orders.reduce((sum, o) => sum + o.items.reduce((s: any, i: any) => s + (i.price * i.quantity), 0), 0)}</div>
                </div>

                <div className="space-y-3">
                    <button onClick={handleRazorpayPayment} className="w-full bg-white p-4 rounded-xl border border-orange-200 flex items-center gap-4 hover:shadow-md transition-all group">
                        <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-100">
                            <CreditCard className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="text-left flex-1">
                            <div className="font-bold text-gray-800">Pay Online</div>
                            <div className="text-xs text-gray-500">Credit Card, UPI, Netbanking</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                    </button>

                    <button className="w-full bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4 hover:shadow-md transition-all group grayscale opacity-70">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="text-left flex-1">
                            <div className="font-bold text-gray-800">Cash / Counter</div>
                            <div className="text-xs text-gray-500">Pay directly at the counter</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default CustomerPaymentView;
