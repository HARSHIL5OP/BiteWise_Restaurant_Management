import React, { useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, updateDoc, collection, getDocs, getDoc, runTransaction } from 'firebase/firestore';
import { ShoppingBag, Clock, CheckCircle, ChefHat, ExternalLink, Receipt, X, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

import { usePaginatedQuery } from '../../hooks/usePaginatedQuery';
import { orderBy } from 'firebase/firestore';

const OrderList = ({ restaurantId, tables = [], staff = [] }: any) => {
    const { items: orders, loading, loadingMore, hasMore, loadMore, refetch } = usePaginatedQuery<any>(
        ['restaurants', restaurantId, 'orders'],
        [orderBy('createdAt', 'desc')],
        15
    );
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const deductInventoryForOrder = async (orderId: string) => {
        try {
            const itemsSnap = await getDocs(collection(db, 'restaurants', restaurantId, 'orders', orderId, 'items'));
            if (itemsSnap.empty) return;

            const items = itemsSnap.docs.map(d => d.data());
            
            for (const item of items) {
                // If already served and deducted by ChefKDS, we'd ideally skip, but for now we assume we only deduct here if not already done.
                // Assuming status check to prevent double deduction if required.
                const itemIdToUse = item.itemId || item.menuItemId;
                if (!itemIdToUse) continue;

                const ingredientsSnap = await getDocs(collection(db, 'restaurants', restaurantId, 'menu', itemIdToUse, 'ingredients'));
                if (ingredientsSnap.empty) continue;

                for (const docSnap of ingredientsSnap.docs) {
                    const ingredient = docSnap.data();
                    if (!ingredient.deductOnOrder || !ingredient.inventoryId) continue;

                    const quantityUsed = Number(ingredient.quantityUsed) || 0;
                    const itemQuantity = Number(item.quantity) || 1;
                    const totalUsage = quantityUsed * itemQuantity;

                    if (totalUsage <= 0) continue;

                    await runTransaction(db, async (transaction) => {
                        const inventoryRef = doc(db, 'restaurants', restaurantId, 'inventory', ingredient.inventoryId);
                        const inventoryDoc = await transaction.get(inventoryRef);
                        if (!inventoryDoc.exists()) return;

                        const currentQty = Number(inventoryDoc.data().quantity) || 0;
                        const newQty = Math.max(currentQty - totalUsage, 0);

                        transaction.update(inventoryRef, { quantity: newQty, updatedAt: new Date().toISOString() });
                    });
                }
            }
        } catch (error) {
            console.error("Error deducting inventory on order completion:", error);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        if (!restaurantId || !orderId) return;
        try {
            await updateDoc(doc(db, 'restaurants', restaurantId, 'orders', orderId), {
                status: newStatus
            });
            if (newStatus === 'completed') {
                await deductInventoryForOrder(orderId);
            }
            toast.success(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error("Error updating order status:", error);
            toast.error("Failed to update order status");
        }
    };

    const viewBill = async (order: any) => {
        setSelectedOrder(order);
        try {
            const itemsSnap = await getDocs(collection(db, 'restaurants', restaurantId, 'orders', order.id, 'items'));
            setOrderItems(itemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsBillingModalOpen(true);
        } catch (error) {
            console.error("Error fetching order items:", error);
            toast.error("Failed to fetch order items for billing");
        }
    };

    const printBill = async (order: any) => {
        let restaurantData: any = null;
        try {
            const docSnap = await getDoc(doc(db, "restaurants", restaurantId));
            if (docSnap.exists()) {
                restaurantData = docSnap.data();
            }
        } catch (error) {
            console.error("Error fetching restaurant info:", error);
        }

        const docPDF = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [80, 200]
        });

        const pageWidth = docPDF.internal.pageSize.getWidth();
        let y = 10;

        const addCenteredText = (text: string, yPos: number, size: number = 10, isBold: boolean = false) => {
            docPDF.setFontSize(size);
            if (isBold) {
                docPDF.setFont("helvetica", "bold");
            } else {
                docPDF.setFont("helvetica", "normal");
            }
            const textWidth = docPDF.getTextWidth(text);
            const xPos = (pageWidth - textWidth) / 2;
            docPDF.text(text, xPos, yPos);
        };

        const drawDashedLine = (yPos: number) => {
            docPDF.setLineDashPattern([1, 1], 0);
            docPDF.line(4, yPos, pageWidth - 4, yPos);
            docPDF.setLineDashPattern([], 0);
        }

        docPDF.setTextColor(0, 0, 0);

        // Header
        addCenteredText((restaurantData?.name || "RESTAURANT").toUpperCase(), y, 12, true);
        y += 5;
        
        if (restaurantData?.description) {
            addCenteredText(restaurantData.description.substring(0, 40), y, 9);
            y += 4;
        }
        
        let locStr = "Location details not available";
        if (restaurantData?.location) {
            const loc = restaurantData.location;
            if (loc.address && loc.city) locStr = `${loc.address}, ${loc.city}`;
            else if (loc.address) locStr = loc.address;
            else if (loc.city) locStr = loc.city;
        }
        
        if (locStr.length > 35) {
           addCenteredText(locStr.substring(0, 35), y, 9);
           y += 4;
           if (locStr.length > 35) {
               addCenteredText(locStr.substring(35, 70), y, 9);
               y += 4;
           }
        } else {
           addCenteredText(locStr, y, 9);
           y += 4;
        }
        
        drawDashedLine(y);
        y += 4;
        addCenteredText("TAX INVOICE", y, 10, false);
        y += 2;
        drawDashedLine(y);
        y += 5;

        // Info
        const billNo = order.orderNumber || order.id.slice(0, 5).toUpperCase();
        const dateStr = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString();
        docPDF.setFont("helvetica", "normal");
        docPDF.setFontSize(9);
        
        docPDF.text(`Date: ${dateStr}`, 4, y);
        docPDF.text(`Bill No. : ${billNo}`, pageWidth / 2 + 5, y);
        y += 5;
        docPDF.text(`PBoy: COUNTER`, 4, y);
        y += 6;

        // Table Header
        docPDF.setFont("helvetica", "bold");
        docPDF.text("Particulars", 4, y);
        docPDF.text("Qty", 45, y);
        docPDF.text("Rate", 55, y);
        docPDF.text("Amount", 68, y);
        y += 1;
        drawDashedLine(y);
        y += 5;

        // Items
        docPDF.setFont("helvetica", "normal");
        docPDF.setFontSize(9);
        
        let subTotal = 0;
        let totalItemsQty = 0;

        orderItems.forEach((item: any) => {
            const name = (item.name || "").substring(0, 15).toUpperCase();
            const qty = Number(item.quantity) || 1;
            const rate = Number(item.price) || 0;
            const amt = qty * rate;

            docPDF.text(name, 4, y);
            docPDF.text(qty.toString(), 46, y);
            docPDF.text(rate.toFixed(0), 55, y);
            docPDF.text(amt.toFixed(0), 68, y);
            
            subTotal += amt;
            totalItemsQty += qty;
            y += 5;
        });

        drawDashedLine(y);
        y += 5;

        // Subtotal & GST
        docPDF.text("Sub Total :", 38, y);
        docPDF.text(subTotal.toFixed(2), 68, y);
        y += 5;

        const sgst = subTotal * 0.025;
        docPDF.text(`SGST @2.5% :`, 38, y);
        docPDF.text(sgst.toFixed(2), 68, y);
        y += 5;

        const cgst = subTotal * 0.025;
        docPDF.text(`CGST @2.5% :`, 38, y);
        docPDF.text(cgst.toFixed(2), 68, y);
        y += 5;

        drawDashedLine(y);
        y += 6;

        // Total
        const finalTotal = subTotal + sgst + cgst;
        docPDF.setFont("helvetica", "bold");
        docPDF.setFontSize(11);
        docPDF.text(`${totalItemsQty} Item(s)`, 4, y);
        docPDF.text("Total :", 45, y);
        docPDF.text(finalTotal.toFixed(0), 68, y);
        y += 3;
        
        drawDashedLine(y);
        y += 6;

        // Footer
        docPDF.setFont("helvetica", "normal");
        docPDF.setFontSize(8);
        docPDF.text("FSSAI NO - 11516004000575", 4, y);
        const timeStr = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        docPDF.text(`(${timeStr})`, pageWidth - 25, y);
        y += 5;
        docPDF.text("E.&O.E.", 4, y);
        docPDF.text("Thank You", pageWidth / 2 - 8, y);
        docPDF.text("Visit Again", pageWidth - 22, y);

        docPDF.save(`bill-${billNo}.pdf`);
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
            case 'preparing': return 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
            case 'ready': return 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
            case 'served': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
            case 'completed': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    // Optional: Sort locally just in case, though Firestore orderBy handles it
    const sortedOrders = orders;

    const getTableDisplay = (order: any) => {
        if (order.tableNumber) return order.tableNumber;
        const matchingTable = tables.find((t: any) => t.id === order.tableId || t.tableId === order.tableId);
        return matchingTable?.tableNumber || order.tableId;
    };

    const getWaiterDisplay = (order: any) => {
        if (order.waiterName) return order.waiterName;
        if (!order.waiterId) return 'Unassigned';
        const waiter = staff.find((s: any) => s.userId === order.waiterId || s.id === order.waiterId);
        if (waiter) {
            return waiter.name || `${waiter.firstName || ''} ${waiter.lastName || ''}`.trim() || order.waiterId;
        }
        return order.waiterId;
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        Order Management
                        {loading && <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Loading...</span>}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Track and manage incoming orders.</p>
                </div>
                <button 
                    onClick={refetch}
                    disabled={loading}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 disabled:opacity-50"
                >
                    Refresh
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="p-4 font-semibold text-slate-500 text-sm">Order ID</th>
                                <th className="p-4 font-semibold text-slate-500 text-sm">Table / Waiter</th>
                                <th className="p-4 font-semibold text-slate-500 text-sm">Amount</th>
                                <th className="p-4 font-semibold text-slate-500 text-sm">Time</th>
                                <th className="p-4 font-semibold text-slate-500 text-sm">Status</th>
                                {/* <th className="p-4 font-semibold text-slate-500 text-sm">Action</th> */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {sortedOrders.map((order: any) => (
                                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 font-mono text-sm text-slate-700 dark:text-slate-300">
                                        #{order.id.slice(0, 8)}...
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm font-bold text-slate-800 dark:text-white">Table {getTableDisplay(order)}</div>
                                        <div className="text-xs text-slate-500">{getWaiterDisplay(order)}</div>
                                    </td>
                                    <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">
                                        ₹{Number(order.totalAmount || 0).toFixed(2)}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">
                                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                            {order.status || 'pending'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex items-center gap-2">
                                        {/* <select 
                                            value={order.status || 'pending'}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300 transition-colors"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="preparing">Preparing</option>
                                            <option value="ready">Ready</option>
                                            <option value="served">Served</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select> */}
                                        <button 
                                            onClick={() => viewBill(order)}
                                            className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                            title="View Bill"
                                        >
                                            <Receipt size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sortedOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500">
                                        <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="font-medium">No orders found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls */}
                {hasMore && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-center bg-slate-50 dark:bg-slate-800/30">
                        <button 
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="px-6 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-2 relative overflow-hidden group"
                        >
                            {loadingMore ? 'Loading Data...' : 'Load More Orders'}
                        </button>
                    </div>
                )}
            </div>

            {/* Billing Modal */}
            {isBillingModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                <Receipt className="text-indigo-500" />
                                Order Bill #{selectedOrder.id.slice(0, 8)}
                            </h3>
                            <button onClick={() => setIsBillingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Receipt</h2>
                                <p className="text-sm text-slate-500">Table: {getTableDisplay(selectedOrder)}</p>
                                <p className="text-xs text-slate-400">{selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString() : new Date().toLocaleString()}</p>
                            </div>

                            <div className="border-t border-b border-dashed border-slate-200 dark:border-slate-700 py-4 mb-4 space-y-3">
                                {orderItems.map((item, index) => (
                                    <div key={index} className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                                            <p className="text-xs text-slate-500">{item.quantity} x ₹{Number(item.price).toFixed(2)}</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">₹{(item.quantity * item.price).toFixed(2)}</p>
                                    </div>
                                ))}
                                {orderItems.length === 0 && (
                                    <p className="text-sm text-center text-slate-500">No items found for this order.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                    <span>Subtotal</span>
                                    <span>₹{orderItems.reduce((acc, item) => acc + (item.quantity * item.price), 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                    <span>Tax (Est.)</span>
                                    <span>₹{(orderItems.reduce((acc, item) => acc + (item.quantity * item.price), 0) * 0.05).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-black text-slate-800 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <span>Total</span>
                                    <span>₹{Number(selectedOrder.totalAmount || (orderItems.reduce((acc, item) => acc + (item.quantity * item.price), 0) * 1.05)).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                            <button 
                                onClick={() => printBill(selectedOrder)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors flex justify-center items-center gap-2 text-sm">
                                <Printer size={16} /> Print Bill
                            </button>
                            {/* <button 
                                onClick={() => {
                                    updateOrderStatus(selectedOrder.id, 'completed');
                                    setIsBillingModalOpen(false);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 text-sm"
                            >
                                Settle & Complete
                            </button> */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderList;
