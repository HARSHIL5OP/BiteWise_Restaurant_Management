import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    ShoppingCart, Plus, Minus, Clock, Check, ChefHat, User,
    CreditCard, Smartphone, Wallet, X, ChevronRight, UtensilsCrossed,
    LogOut, Filter, ArrowLeft, Flame, Search, ChevronDown, ArrowDownAz, Heart
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    collection, onSnapshot, addDoc, serverTimestamp, query,
    where, updateDoc, doc, getDocs, setDoc, getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_ICONS: Record<string, string> = {
    "Starters": "🥗",
    "Appetizer": "🍟",
    "Appetizers": "🍟",
    "Main Course": "🍛",
    "Breads": "🫓",
    "Beverages": "🥤",
    "Dessert": "🍰",
    "Desserts": "🍰",
    "Biryani": "🍚",
    "Rice": "🍚",
    "Soup": "🥣",
    "Tandoori": "🍗"
};

const RestaurantApp = () => {
    const { user, userProfile, logout, loading } = useAuth();
    const navigate = useNavigate();
    const { tableId: paramsTableId } = useParams();
    const [searchParams] = useSearchParams();

    // --- STATE MANAGEMENT ---
    const [cart, setCart] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('cart_items');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('cart_items', JSON.stringify(cart));
    }, [cart]);

    const [activeView, setActiveView] = useState<'menu' | 'orders' | 'history' | 'payment'>('menu');
    const [menuViewMode, setMenuViewMode] = useState<'overview' | 'items'>('overview');
    const [orders, setOrders] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [menuData, setMenuData] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Filters
    const [isVegOnly, setIsVegOnly] = useState(false);
    const [sortBy, setSortBy] = useState<'default' | 'price_low'>('default');

    // Refs
    const categoryScrollRef = useRef<HTMLDivElement>(null);

    // --- AUTH & INITIALIZATION ---
    useEffect(() => {
        const urlRestro = searchParams.get("restaurantId");
        const urlTable = searchParams.get("tableId") || paramsTableId;
        if (urlRestro) sessionStorage.setItem('currentRestaurant', urlRestro);
        if (urlTable) sessionStorage.setItem('currentTable', urlTable);
    }, [searchParams, paramsTableId]);

    const restaurantId = searchParams.get("restaurantId") || sessionStorage.getItem('currentRestaurant') || 'DEFAULT_RESTAURANT';
    const tableNumber = searchParams.get("tableId") || paramsTableId || sessionStorage.getItem('currentTable') || "1";

    const [restaurantInfo, setRestaurantInfo] = useState<any>(null);

    useEffect(() => {
        const fetchRestro = async () => {
            if (!restaurantId || restaurantId === 'DEFAULT_RESTAURANT') return;
            const docSnap = await getDoc(doc(db, "restaurants", restaurantId));
            if (docSnap.exists()) {
                setRestaurantInfo(docSnap.data());
            }
        };
        fetchRestro();
    }, [restaurantId]);

    // --- DATA FETCHING ---
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'restaurants', restaurantId, 'menu'), (snapshot) => {
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
                    price: Number(item.price) || 0,
                    veg: item.veg !== undefined ? item.veg : true,
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
                collection(db, 'restaurants', restaurantId, 'orders'),
                where('customerId', '==', user.uid)
            );

            unsubscribeOrders = onSnapshot(q, async (snapshot) => {
                const fetchedOrdersPromises = snapshot.docs.map(async (docRef) => {
                    const data = docRef.data() as any;
                    const itemsSnap = await getDocs(collection(db, 'restaurants', restaurantId, 'orders', docRef.id, 'items'));
                    const items = itemsSnap.docs.map(i => i.data());

                    return {
                        id: docRef.id,
                        ...data,
                        items,
                        time: data.createdAt?.toDate() || new Date(),
                        estimatedTime: 20
                    };
                });
                
                const fetchedOrders = (await Promise.all(fetchedOrdersPromises))
                    .sort((a, b) => b.time.getTime() - a.time.getTime());

                setOrders(fetchedOrders.filter(o => o.status !== 'completed'));
                setHistory(fetchedOrders.filter(o => o.status === 'completed'));
            }, (error) => {
                console.error("Error fetching orders:", error);
            });
        }

        return () => {
            unsubscribe();
            unsubscribeOrders();
        };
    }, [user]);

    // --- CART LOGIC ---
    const addToCart = (item: any) => {
        const existing = cart.find(c => c.id === item.id);
        if (existing) {
            setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(cart.map(item =>
            item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        ).filter(item => item.quantity > 0));
    };

    const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
    const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

    // --- ORDER LOGIC ---
    const assignWaiter = async (): Promise<{ waiterId: string | null; waiterName: string | null }> => {
        try {
            const waitersQuery = query(collection(db, 'restaurants', restaurantId, 'staff'), where('role', '==', 'waiter'));
            const waitersSnapshot = await getDocs(waitersQuery);

            if (waitersSnapshot.empty) {
                return { waiterId: null, waiterName: null };
            }

            const waiters = waitersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as any
            }));

            const workloadPromises = waiters.map(async (waiter) => {
                const q = query(collection(db, 'restaurants', restaurantId, 'orders'), where('waiterId', '==', waiter.id));
                const snapshot = await getDocs(q);
                const activeCount = snapshot.docs.filter(d => d.data().status !== 'served').length;
                return { waiter, load: activeCount };
            });

            const workloads = await Promise.all(workloadPromises);
            const minLoad = Math.min(...workloads.map(w => w.load));
            const eligibleWaiters = workloads.filter(w => w.load === minLoad);
            const selected = eligibleWaiters[Math.floor(Math.random() * eligibleWaiters.length)];
            const selectedWaiter = selected.waiter;

            return {
                waiterId: selectedWaiter.id,
                waiterName: `${selectedWaiter.firstName || ''} ${selectedWaiter.lastName || ''}`.trim()
            };

        } catch (error) {
            console.error("Error assigning waiter:", error);
            return { waiterId: null, waiterName: null };
        }
    };

    const placeOrder = async () => {
        if (!user) {
            const confirmLogin = window.confirm("You must be logged in to place an order. Would you like to login now?");
            if (confirmLogin) {
                navigate('/login');
            }
            return;
        }

        if (!restaurantId || !tableNumber) {
            alert("Missing restaurant or table info");
            return;
        }

        if (cart.length === 0) {
            alert("Cart is empty");
            return;
        }

        try {
            // 🔥 CALCULATIONS
            const subtotal = cartTotal;
            const tax = subtotal * 0.05; // 5% tax
            const discount = 0;
            const totalAmount = subtotal + tax - discount;

            const { waiterId } = await assignWaiter();

            // 🔥 CREATE ORDER
            const orderRef = doc(collection(db, 'restaurants', restaurantId, 'orders'));
            await setDoc(orderRef, {
                orderId: orderRef.id,
                tableId: tableNumber,
                orderNumber: Math.floor(1000 + Math.random() * 9000).toString(),
                customerId: user.uid,
                waiterId: waiterId || null,
                restaurantId: restaurantId,
                status: 'pending',
                orderSource: 'QR',
                subtotal: subtotal,
                tax: tax,
                discount: discount,
                totalAmount: totalAmount,
                paymentStatus: 'pending',
                paymentId: null,
                notes: "",
                createdAt: serverTimestamp(),
                preparedAt: null,
                servedAt: null,
                completedAt: null
            });

            // 🔥 SAVE ORDER ITEMS
            for (const item of cart) {
               const itemRef = doc(collection(db, 'restaurants', restaurantId, 'orders', orderRef.id, 'items'));
               await setDoc(itemRef, {
                   itemId: itemRef.id,
                   orderId: orderRef.id,
                   menuItemId: item.id,
                   name: item.name,
                   price: item.price,
                   quantity: item.quantity,
                   total: item.price * item.quantity,
                   notes: '',
                   status: 'pending'
               });
            }

            // Update table status
            const numericTableNumber = parseInt(tableNumber);
            if (!isNaN(numericTableNumber)) {
                const tablesQuery = query(collection(db, 'restaurants', restaurantId, 'tables'), where('tableNumber', '==', numericTableNumber));
                const tableDocs = await getDocs(tablesQuery);
                if (!tableDocs.empty) {
                    await updateDoc(doc(db, 'restaurants', restaurantId, 'tables', tableDocs.docs[0].id), { status: 'occupied' });
                }
            } else {
                console.warn("Could not parse table number for status update:", tableNumber);
            }

            // 🔥 CLEAR CART
            setCart([]);
            setShowCart(false);
            setActiveView('orders');
            
            alert("Order placed successfully!");

        } catch (error) {
            console.error("Order failed:", error);
            alert("Failed to place order. Please try again.");
        }
    };

    // --- PAYMENT LOGIC ---
    const handleRazorpayPayment = async () => {
        try {
            const allOrdersTotal = orders.reduce((sum, order) =>
                sum + order.items.reduce((s: number, item: any) => s + (item.price * item.quantity), 0), 0
            );

            if (allOrdersTotal === 0) {
                alert("Amount is 0");
                return;
            }

            const response = await fetch(`http://localhost:8080/order?amount=${allOrdersTotal}`);
            const data = await response.json();

            if (!data.orderID) {
                alert("Server error. Are you running the backend?");
                return;
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data.amount,
                currency: "INR",
                name: restaurantInfo?.name || "Restaurant",
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
                            const updatePromises = orders.map(order =>
                                updateDoc(doc(db, 'restaurants', restaurantId, 'orders', order.id), {
                                    status: 'completed',
                                    paymentId: response.razorpay_payment_id,
                                    updatedAt: serverTimestamp()
                                })
                            );
                            await Promise.all(updatePromises);

                            // Update table status to available
                            const numericTableNumber = parseInt(tableNumber);
                            if (!isNaN(numericTableNumber)) {
                                const tablesQuery = query(collection(db, 'restaurants', restaurantId, 'tables'), where('tableNumber', '==', numericTableNumber));
                                const tableSnapshot = await getDocs(tablesQuery);
                                if (!tableSnapshot.empty) {
                                    await updateDoc(doc(db, 'restaurants', restaurantId, 'tables', tableSnapshot.docs[0].id), { status: 'available' });
                                }
                            }

                            alert("Payment Successful! Orders moved to history.");
                            setActiveView('history');
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
                theme: { color: "#F97316" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Payment Error:", error);
            alert("Payment initialization failed. Make sure the backend server is running.");
        }
    };

    // --- MENU DISPLAY LOGIC ---

    const currentCategoryData = useMemo(() => {
        if (!selectedCategory) return null;
        return menuData.find(c => c.category === selectedCategory);
    }, [menuData, selectedCategory]);

    const filteredItems = useMemo(() => {
        if (!currentCategoryData) return [];
        let items = [...currentCategoryData.items];

        if (isVegOnly) {
            items = items.filter(item => item.veg);
        }

        if (sortBy === 'price_low') {
            items.sort((a, b) => a.price - b.price);
        }

        return items;
    }, [currentCategoryData, isVegOnly, sortBy]);

    const handleCategoryClick = (categoryName: string) => {
        setSelectedCategory(categoryName);
        setMenuViewMode('items');
        setIsVegOnly(false); // Reset filters when changing category
        setSortBy('default');
    };

    const renderSpicy = (level: number) => {
        if (!level || level === 0) return null;
        return (
            <div className="flex gap-0.5" title={`Spicy Level: ${level}`}>
                {Array.from({ length: level }).map((_, i) => (
                    <Flame key={i} className="w-3 h-3 text-red-500 fill-red-500" />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-orange-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-[#FDFBF7] font-sans pb-24 max-w-md mx-auto shadow-2xl overflow-hidden relative">

            {/* --- HEADER --- */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm transition-all">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg transform active:scale-95 transition-transform">
                            <UtensilsCrossed className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800 leading-tight">{restaurantInfo?.name || "Restaurant"}</h1>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md">T-{tableNumber}</span>
                                <span>{userProfile?.firstName || 'Guest'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/social-impact')}
                            className="p-2 text-green-500 hover:text-green-600 transition-colors"
                            title="Social Impact - Food Wastage Control"
                        >
                            <Heart className="w-5 h-5 fill-green-500" />
                        </button>
                        <button
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* --- NAVIGATION TABS --- */}
                <div className="px-4 pb-0 flex border-b border-gray-100 overflow-x-auto no-scrollbar gap-6">
                    {['menu', 'orders', 'history'].map((view) => (
                        <button
                            key={view}
                            onClick={() => {
                                setActiveView(view as any);
                                if (view === 'menu') setMenuViewMode('overview'); // Reset to overview
                            }}
                            className={`pb-3 text-sm font-semibold capitalize relative transition-colors whitespace-nowrap ${activeView === view
                                ? 'text-orange-600'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {view}
                            {activeView === view && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-t-full"
                                />
                            )}
                            {view === 'orders' && orders.length > 0 && (
                                <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                    {orders.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </header>

            {/* --- MENU VIEW --- */}
            <AnimatePresence mode="wait">
                {activeView === 'menu' && (
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

                                    {/* Filter / Sort Bar (Optional) */}
                                    <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-50 bg-white">
                                        <button
                                            onClick={() => setIsVegOnly(!isVegOnly)}
                                            className={`flex  items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${isVegOnly ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500'}`}
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
                                                    {cart.find(c => c.id === item.id) ? (
                                                        <div className="flex items-center bg-white shadow-md border border-orange-100 rounded-lg overflow-hidden h-9">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, -1)}
                                                                className="w-8 h-full flex items-center justify-center text-orange-600 hover:bg-orange-50 active:bg-orange-100"
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </button>
                                                            <span className="w-8 text-center font-bold text-sm text-gray-800">
                                                                {cart.find(c => c.id === item.id).quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => addToCart(item)}
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
                                                    )}
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
                )}

                {/* --- ORDERS VIEW --- */}
                {activeView === 'orders' && (
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
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider ${order.status === 'in_queue' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                                order.status === 'preparing' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                    'bg-green-50 text-green-700 border border-green-200'
                                                }`}>
                                                {order.status === 'in_queue' && <Clock className="w-3 h-3" />}
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
                                        <div className="flex justify-between items-center bg-gray-50 -mx-5 -mb-5 p-4 mt-2">
                                            <span className="text-gray-500 text-sm">Total Bill</span>
                                            <span className="text-xl font-bold text-gray-900">₹{order.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0)}</span>
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
                )}

                {/* --- HISTORY VIEW --- */}
                {activeView === 'history' && (
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
                                    <div className="border-t border-dashed border-gray-200 mt-3 pt-2 text-right">
                                        <span className="font-bold text-gray-800">Paid: ₹{order.totalAmount}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* --- PAYMENT VIEW (Simplified) --- */}
                {activeView === 'payment' && (
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
                )}
            </AnimatePresence>

            {/* --- FLOATING CART BAR --- */}
            <AnimatePresence>
                {cart.length > 0 && activeView === 'menu' && (
                    <motion.div
                        initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                        className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
                    >
                        <button
                            onClick={() => setShowCart(true)}
                            className="w-full bg-[#1C1C1C] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between group hover:scale-[1.02] transition-transform"
                        >
                            <div className="flex flex-col items-start">
                                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{cartItemCount} ITEMS</span>
                                <span className="text-lg font-bold">₹{cartTotal} <span className="text-xs font-normal text-gray-400 opacity-60 ml-1">plus taxes</span></span>
                            </div>
                            <div className="flex items-center gap-2 font-bold text-sm bg-white/10 px-4 py-2 rounded-xl group-hover:bg-white/20 transition-all">
                                View Cart <ChevronRight className="w-4 h-4" />
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- FULL SCREEN CART MODAL --- */}
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
                                            <img src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} className="w-full h-full object-cover" />
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

        </div>
    );
};

export default RestaurantApp;