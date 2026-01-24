import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Clock, Check, ChefHat, User, CreditCard, Smartphone, Wallet, X, ChevronRight, UtensilsCrossed, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, onSnapshot, addDoc, serverTimestamp, query, where, orderBy, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const CATEGORY_ICONS: Record<string, string> = {
    "Starters": "🥗",
    "Appetizer": "🍟",
    "Appetizers": "🍟",
    "Main Course": "🍛",
    "Breads": "🫓",
    "Beverages": "🥤",
    "Dessert": "🍰",
    "Desserts": "🍰",
};

const RestaurantApp = () => {
    const { user, userProfile, logout, loading } = useAuth();
    const navigate = useNavigate();

    // Auth protection
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    const [cart, setCart] = useState<any[]>([]);
    const [activeView, setActiveView] = useState('menu');
    const [orders, setOrders] = useState<any[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Check URL params for tableId
    const { tableId } = useParams();

    useEffect(() => {
        if (tableId) {
            sessionStorage.setItem('currentTable', tableId);
        }
    }, [tableId]);

    const tableNumber = tableId || sessionStorage.getItem('currentTable') || "12";


    const [menuData, setMenuData] = useState<any[]>([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'menu'), (snapshot) => {
            const rawItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

            // Group by category
            const grouped = rawItems.reduce((acc: any, item) => {
                const cat = item.category || 'Other';
                if (!acc[cat]) {
                    acc[cat] = {
                        category: cat,
                        icon: CATEGORY_ICONS[cat] || '🍽️',
                        items: []
                    };
                }

                acc[cat].items.push({
                    ...item,
                    price: Number(item.price) || 0, // Ensure price is a number
                    veg: item.veg !== undefined ? item.veg : true, // Default if missing
                    spicy: item.spicy || 0
                });
                return acc;
            }, {});

            setMenuData(Object.values(grouped));
        }, (error) => {
            console.error("Error fetching menu:", error);
        });

        // Listen for User Orders
        let unsubscribeOrders = () => { };
        if (user) {
            const q = query(
                collection(db, 'orders'),
                where('customerId', '==', user.uid)
            );

            unsubscribeOrders = onSnapshot(q, (snapshot) => {
                const fetchedOrders = snapshot.docs.map(doc => {
                    const data = doc.data();
                    // Calculate estimated time based on status or creation time if simple
                    // For now, mock estimated time or derive from logic
                    return {
                        id: doc.id,
                        ...data,
                        time: data.createdAt?.toDate() || new Date(),
                        estimatedTime: 20 // Static for now, or calculate
                    };
                }).sort((a, b) => b.time - a.time);
                setOrders(fetchedOrders);
            }, (error) => {
                console.error("Error fetching orders:", error);
            });
        }

        return () => {
            unsubscribe();
            unsubscribeOrders();
        };
    }, [user]);

    const addToCart = (item: any) => {
        const existing = cart.find(c => c.id === item.id);
        if (existing) {
            setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
    };

    const updateQuantity = (id: number, delta: number) => {
        setCart(cart.map(item =>
            item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        ).filter(item => item.quantity > 0));
    };

    /**
     * Balances load among waiters by finding the one with the fewest active orders.
     */
    const assignWaiter = async (): Promise<{ waiterId: string | null; waiterName: string | null }> => {
        try {
            // STEP 1: Fetch all active waiters
            const waitersQuery = query(collection(db, 'users'), where('role', '==', 'waiter'));
            const waitersSnapshot = await getDocs(waitersQuery);

            if (waitersSnapshot.empty) {
                console.warn("No waiters found in system.");
                return { waiterId: null, waiterName: null };
            }

            const waiters = waitersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as any
            }));

            // STEP 2: Calculate workload for each waiter
            // "Active" means status is NOT 'served' (i.e. in_queue, preparing, ready)
            const workloadPromises = waiters.map(async (waiter) => {
                const q = query(
                    collection(db, 'orders'),
                    where('waiterId', '==', waiter.id)
                );
                const snapshot = await getDocs(q);
                const activeCount = snapshot.docs.filter(d => d.data().status !== 'served').length;
                return {
                    waiter,
                    load: activeCount
                };
            });

            const workloads = await Promise.all(workloadPromises);

            // STEP 3: Determine least-loaded waiter(s)
            const minLoad = Math.min(...workloads.map(w => w.load));
            const eligibleWaiters = workloads.filter(w => w.load === minLoad);

            // STEP 4: Tie-breaker logic (Random selection)
            const selected = eligibleWaiters[Math.floor(Math.random() * eligibleWaiters.length)];
            const selectedWaiter = selected.waiter;

            console.log(`Assigned waiter: ${selectedWaiter.firstName} (Load: ${selected.load})`);

            return {
                waiterId: selectedWaiter.id,
                waiterName: `${selectedWaiter.firstName || ''} ${selectedWaiter.lastName || ''}`.trim()
            };

        } catch (error) {
            console.error("Error assigning waiter:", error);
            // Fallback: don't block order creation
            return { waiterId: null, waiterName: null };
        }
    };

    const placeOrder = async () => {
        if (cart.length === 0 || !user) return;

        try {
            const totalAmount = getTotalPrice();

            // Dynamic Waiter Assignment
            const { waiterId, waiterName } = await assignWaiter();

            // 1. Create the order in Firestore
            await addDoc(collection(db, 'orders'), {
                tableId: tableNumber,
                customerId: user.uid,
                createdBy: user.uid,

                // Assigned Waiter
                waiterId: waiterId,
                waiterName: waiterName,

                status: 'in_queue',
                totalAmount: totalAmount,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                items: cart.map(item => ({
                    itemId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    veg: item.veg ?? true // Preserve veg status for UI
                }))
            });

            // 2. Update table status to occupied (check if not already occupied to save writes if needed, but safe to just update)
            // Query tables to find the doc with tableNumber (assuming tableId in schema refers to the doc ID, but here we only have tableNumber "12")
            // Since we don't know the exact doc ID for "Table 12", we might need to query it or assume a simpler structure. 
            // For now, let's try to query it.
            const tablesQuery = query(collection(db, 'tables'), where('tableNumber', '==', tableNumber));
            const tableDocs = await getDocs(tablesQuery);

            if (!tableDocs.empty) {
                const tableDoc = tableDocs.docs[0];
                await updateDoc(doc(db, 'tables', tableDoc.id), {
                    status: 'occupied'
                });
            } else {
                // Option to create it if it doesn't exist, strictly following instructions to update.
                // If table doesn't exist, we skip for now or could create it. 
                // Let's safe guard.
                console.log("Table document not found, skipping table status update.");
            }

            // 3. Clear cart and UI updates
            setCart([]);
            setShowCart(false);
            setActiveView('orders');
            // No need to setOrders locally, the snapshot listener will handle it

        } catch (error) {
            console.error("Error placing order:", error);
            alert("Failed to place order. Please try again.");
        }
    };

    const completeAllOrders = () => {
        setActiveView('payment');
    };

    const getTotalPrice = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const getAllOrdersTotal = () => {
        return orders.reduce((sum, order) =>
            sum + order.items.reduce((s, item) => s + (item.price * item.quantity), 0), 0
        );
    };

    const getSpicyIndicator = (level: number) => {
        return '🌶️'.repeat(level);
    };

    const handleRazorpayPayment = async () => {
        try {
            const totalAmount = getAllOrdersTotal();
            if (totalAmount === 0) {
                alert("Amount is 0");
                return;
            }

            const response = await fetch(`http://localhost:8080/order?amount=${totalAmount}`);
            const data = await response.json();

            if (!data.orderID) {
                alert("Server error. Are you running the backend?");
                return;
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data.amount,
                currency: "INR",
                name: "Spice Garden",
                description: "Payment for Order",
                order_id: data.orderID,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch("http://localhost:8080/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(response),
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            alert("Payment Successful!");
                            setOrders([]);
                            setActiveView('menu');
                        } else {
                            alert("Payment Verification Failed");
                        }
                    } catch (error) {
                        console.error(error);
                        alert("Verification Error");
                    }
                },
                prefill: {
                    name: userProfile?.firstName || "Guest",
                    email: user?.email || "guest@example.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#F97316"
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Payment Error:", error);
            alert("Payment initialization failed. Make sure the backend server is running on port 8080.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-orange-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-orange-100 shadow-sm">
                <div className="max-w-md mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                                <UtensilsCrossed className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-800">Spice Garden</h1>
                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        Table {tableNumber}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {userProfile?.firstName || 'Guest'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowCart(!showCart)}
                                className="relative p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg hover:shadow-xl transition-all"
                            >
                                <ShoppingCart className="w-5 h-5 text-white" />
                                {cart.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => logout()}
                                className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all text-gray-600"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="sticky top-[73px] z-40 bg-white/80 backdrop-blur-xl border-b border-orange-100">
                <div className="max-w-md mx-auto px-4">
                    <div className="flex gap-2 py-3">
                        <button
                            onClick={() => setActiveView('menu')}
                            className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${activeView === 'menu'
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Menu
                        </button>
                        <button
                            onClick={() => setActiveView('orders')}
                            className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all relative ${activeView === 'orders'
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Orders
                            {orders.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                    {orders.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-md mx-auto px-4 pb-24">
                {activeView === 'menu' && (
                    <div className="py-4 space-y-6">
                        {menuData.map((category, idx) => (
                            <div key={idx} className="space-y-3">
                                <div className="flex items-center gap-2 sticky top-[145px] bg-gradient-to-r from-orange-50 to-red-50 py-2 px-4 rounded-xl backdrop-blur-xl z-30">
                                    <span className="text-2xl">{category.icon}</span>
                                    <h2 className="text-xl font-bold text-gray-800">{category.category}</h2>
                                </div>

                                <div className="space-y-3">
                                    {category.items.map((item) => (
                                        <div key={item.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-orange-100">
                                            <div className="flex gap-3 p-3">
                                                <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-semibold">
                                                        {item.veg ? '🟢' : '🔴'}
                                                    </div>
                                                </div>

                                                <div className="flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-gray-800 text-sm leading-tight">{item.name}</h3>
                                                        {item.spicy > 0 && (
                                                            <div className="text-xs mt-0.5">{getSpicyIndicator(item.spicy)}</div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <span className="text-lg font-bold text-orange-600">₹{item.price}</span>

                                                        {cart.find(c => c.id === item.id) ? (
                                                            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg px-2 py-1">
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, -1)}
                                                                    className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center hover:bg-white/30 transition-all"
                                                                >
                                                                    <Minus className="w-3 h-3 text-white" />
                                                                </button>
                                                                <span className="text-white font-bold text-sm w-6 text-center">
                                                                    {cart.find(c => c.id === item.id).quantity}
                                                                </span>
                                                                <button
                                                                    onClick={() => addToCart(item)}
                                                                    className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center hover:bg-white/30 transition-all"
                                                                >
                                                                    <Plus className="w-3 h-3 text-white" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => addToCart(item)}
                                                                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-1"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                                Add
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeView === 'orders' && (
                    <div className="py-6 space-y-4">
                        {orders.length === 0 ? (
                            <div className="text-center py-12">
                                <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">No orders yet</p>
                                <p className="text-sm text-gray-400 mt-1">Start ordering from the menu</p>
                            </div>
                        ) : (
                            <>
                                {orders.map((order) => (
                                    <div key={order.id} className="bg-white rounded-2xl p-4 shadow-lg border border-orange-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs text-gray-500">
                                                {order.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${order.status === 'in_queue' ? 'bg-yellow-100 text-yellow-700' :
                                                order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                {order.status === 'in_queue' && <Clock className="w-3.5 h-3.5" />}
                                                {order.status === 'preparing' && <ChefHat className="w-3.5 h-3.5" />}
                                                {order.status === 'done' && <Check className="w-3.5 h-3.5" />}
                                                {order.status === 'in_queue' ? 'In Queue' :
                                                    order.status === 'preparing' ? 'Preparing' :
                                                        order.status === 'ready' ? 'Ready' : 'Served'}
                                            </div>
                                        </div>

                                        {(order.status === 'in_queue' || order.status === 'preparing') && (
                                            <div className="mb-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-3">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="w-4 h-4 text-orange-600" />
                                                    <span className="text-gray-700">Estimated time: <span className="font-bold text-orange-600">{order.estimatedTime} mins</span></span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {order.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-700 flex items-center gap-2">
                                                        <span>{item.veg ? '🟢' : '🔴'}</span>
                                                        {item.name} x{item.quantity}
                                                    </span>
                                                    <span className="font-semibold text-gray-800">₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                                            <span className="font-bold text-gray-800">Total</span>
                                            <span className="font-bold text-orange-600 text-lg">
                                                ₹{order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={completeAllOrders}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-6"
                                >
                                    Complete & Pay
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                )}

                {activeView === 'payment' && (
                    <div className="py-6 space-y-4">
                        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl">
                            <div className="text-center">
                                <p className="text-sm opacity-90 mb-2">Total Amount</p>
                                <p className="text-4xl font-bold">₹{getAllOrdersTotal()}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 shadow-lg border border-orange-100">
                            <h3 className="font-bold text-gray-800 mb-3">Order Summary</h3>
                            <div className="space-y-2 text-sm">
                                {orders.map((order) =>
                                    order.items.map((item: any, idx: number) => (
                                        <div key={`${order.id}-${idx}`} className="flex justify-between">
                                            <span className="text-gray-600">{item.name} x{item.quantity}</span>
                                            <span className="font-semibold">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-800 px-1">Payment Method</h3>

                            <button onClick={handleRazorpayPayment} className="w-full bg-white border-2 border-orange-500 rounded-2xl p-4 hover:bg-orange-50 transition-all flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-gray-800">Card Payment</p>
                                    <p className="text-xs text-gray-500">Credit / Debit / UPI</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </button>

                            <button onClick={handleRazorpayPayment} className="w-full bg-white border-2 border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-all flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                                    <Smartphone className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-gray-800">UPI Apps</p>
                                    <p className="text-xs text-gray-500">PhonePe, GPay, Paytm</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </button>

                            <button className="w-full bg-white border-2 border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-all flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                    <Wallet className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-gray-800">Cash</p>
                                    <p className="text-xs text-gray-500">Pay at counter</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Cart Sidebar */}
            {showCart && (
                <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setShowCart(false)}>
                    <div
                        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-500 to-red-500">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <ShoppingCart className="w-6 h-6" />
                                Your Cart
                            </h2>
                            <button
                                onClick={() => setShowCart(false)}
                                className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-all"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cart.length === 0 ? (
                                <div className="text-center py-12">
                                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">Your cart is empty</p>
                                    <p className="text-sm text-gray-400 mt-1">Add items from the menu</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.id} className="bg-gray-50 rounded-xl p-3 flex gap-3 border border-gray-200">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-16 h-16 rounded-lg object-cover"
                                        />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                                            <p className="text-orange-600 font-semibold text-sm">₹{item.price}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="w-6 h-6 bg-gray-300 rounded-md flex items-center justify-center hover:bg-gray-400 transition-all"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-6 h-6 bg-orange-500 text-white rounded-md flex items-center justify-center hover:bg-orange-600 transition-all"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800">₹{item.price * item.quantity}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-4 border-t border-gray-200 space-y-3 bg-white">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-800 text-lg">Total</span>
                                    <span className="font-bold text-orange-600 text-2xl">₹{getTotalPrice()}</span>
                                </div>
                                <button
                                    onClick={placeOrder}
                                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                                >
                                    Place Order
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantApp;
