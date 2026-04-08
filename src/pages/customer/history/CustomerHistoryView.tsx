import React from 'react';
import { Clock, Download } from 'lucide-react';

interface CustomerHistoryViewProps {
    history: any[];
    generateBill: (order: any, restaurantData: any) => void;
    restaurantInfo: any;
}

const CustomerHistoryView: React.FC<CustomerHistoryViewProps> = ({ history, generateBill, restaurantInfo }) => {
    return (
        <div className="p-4 space-y-4 pb-24">
            <h2 className="font-bold text-lg text-gray-800 mb-4 px-1">Order History</h2>
            {history.length === 0 ? (
                <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No past orders</p>
                </div>
            ) : (
                history.map((order) => (
                    <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs text-gray-500">{order.time.toLocaleString()}</span>
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Completed</span>
                        </div>
                        <div className="space-y-1">
                            {order.items.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm text-gray-600">
                                    <span>{item.quantity} x {item.name}</span>
                                    <span>₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-dashed border-gray-200 mt-3 pt-2 flex justify-between items-center">
                            <button
                                onClick={() => generateBill(order, restaurantInfo)}
                                className="text-[11px] font-bold text-gray-700 border border-gray-300 rounded px-2.5 py-1 hover:bg-gray-100 transition-colors uppercase tracking-wide bg-gray-50 flex items-center gap-1.5"
                            >
                                <Download className="w-3.5 h-3.5" /> Download Bill
                            </button>
                            <span className="font-bold text-gray-800">Paid: ₹{order.totalAmount}</span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default CustomerHistoryView;
