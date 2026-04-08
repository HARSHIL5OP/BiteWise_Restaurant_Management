import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UtensilsCrossed, LogOut, Heart, ChevronRight, Flame } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    collection, onSnapshot, serverTimestamp, query,
    where, updateDoc, doc, getDocs, setDoc, getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';

import CustomerMenuView from './menu/CustomerMenuView';
import CustomerOrdersView from './orders/CustomerOrdersView';
import CustomerHistoryView from './history/CustomerHistoryView';
import CustomerPaymentView from './payment/CustomerPaymentView';
import CustomerCartModal from './cart/CustomerCartModal';

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
    const tableId = searchParams.get("tableId") || paramsTableId || sessionStorage.getItem('currentTable') || "1";
    const [tableInfo, setTableInfo] = useState<any>(null);

    useEffect(() => {
        const fetchTableDetails = async () => {
            if (!restaurantId || restaurantId === 'DEFAULT_RESTAURANT' || !tableId) return;
            try {
                // First try to fetch by document ID
                const tableRef = doc(db, 'restaurants', restaurantId, 'tables', tableId);
                const tableSnap = await getDoc(tableRef);
                
                if (tableSnap.exists()) {
                    setTableInfo({ id: tableSnap.id, ...tableSnap.data() });
                } else {
                    // If not found by ID, maybe tableId is actually the tableNumber
                    const numericTable = parseInt(tableId);
                    if (!isNaN(numericTable)) {
                        const q = query(collection(db, 'restaurants', restaurantId, 'tables'), where('tableNumber', '==', numericTable));
                        const snap = await getDocs(q);
                        if (!snap.empty) {
                            setTableInfo({ id: snap.docs[0].id, ...snap.docs[0].data() });
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching table details:", error);
            }
        };
        fetchTableDetails();
    }, [restaurantId, tableId]);

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
    }, [user, restaurantId]);

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
            const waitersQuery = query(collection(db, 'staff'), where('restaurantId', '==', restaurantId), where('role', '==', 'waiter'));
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

        if (!restaurantId || !tableId) {
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
                tableId: tableInfo?.id || tableId,
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
            if (tableInfo?.id) {
                await updateDoc(doc(db, 'restaurants', restaurantId, 'tables', tableInfo.id), { status: 'occupied' });
            } else {
                const numericTableNumber = parseInt(tableId);
                if (!isNaN(numericTableNumber)) {
                    const tablesQuery = query(collection(db, 'restaurants', restaurantId, 'tables'), where('tableNumber', '==', numericTableNumber));
                    const tableDocs = await getDocs(tablesQuery);
                    if (!tableDocs.empty) {
                        await updateDoc(doc(db, 'restaurants', restaurantId, 'tables', tableDocs.docs[0].id), { status: 'occupied' });
                    }
                }
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

            const response = await fetch(`https://bitewise-restaurant-management.onrender.com/order?amount=${allOrdersTotal}`);
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
                        const verifyRes = await fetch("https://bitewise-restaurant-management.onrender.com/verify", {
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
                            if (tableInfo?.id) {
                                await updateDoc(doc(db, 'restaurants', restaurantId, 'tables', tableInfo.id), { status: 'available' });
                            } else {
                                const numericTableNumber = parseInt(tableId);
                                if (!isNaN(numericTableNumber)) {
                                    const tablesQuery = query(collection(db, 'restaurants', restaurantId, 'tables'), where('tableNumber', '==', numericTableNumber));
                                    const tableSnapshot = await getDocs(tablesQuery);
                                    if (!tableSnapshot.empty) {
                                        await updateDoc(doc(db, 'restaurants', restaurantId, 'tables', tableSnapshot.docs[0].id), { status: 'available' });
                                    }
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

    // --- BILL GENERATION LOGIC ---
    const generateBill = (order: any, restaurantData: any) => {
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [80, 200]
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 10;

        const addCenteredText = (text: string, yPos: number, size: number = 10, isBold: boolean = false) => {
            doc.setFontSize(size);
            if (isBold) {
                doc.setFont("helvetica", "bold");
            } else {
                doc.setFont("helvetica", "normal");
            }
            const textWidth = doc.getTextWidth(text);
            const xPos = (pageWidth - textWidth) / 2;
            doc.text(text, xPos, yPos);
        };

        const drawDashedLine = (yPos: number) => {
            doc.setLineDashPattern([1, 1], 0);
            doc.line(4, yPos, pageWidth - 4, yPos);
            doc.setLineDashPattern([], 0);
        }

        doc.setTextColor(0, 0, 0);

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
        const dateStr = order.time.toLocaleDateString();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        
        doc.text(`Date: ${dateStr}`, 4, y);
        doc.text(`Bill No. : ${billNo}`, pageWidth / 2 + 5, y);
        y += 5;
        doc.text(`PBoy: COUNTER`, 4, y);
        y += 6;

        // Table Header
        doc.setFont("helvetica", "bold");
        doc.text("Particulars", 4, y);
        doc.text("Qty", 45, y);
        doc.text("Rate", 55, y);
        doc.text("Amount", 68, y);
        y += 1;
        drawDashedLine(y);
        y += 5;

        // Items
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        
        let subTotal = 0;
        let totalItemsQty = 0;

        order.items.forEach((item: any) => {
            const name = (item.name || "").substring(0, 15).toUpperCase();
            const qty = Number(item.quantity) || 1;
            const rate = Number(item.price) || 0;
            const amt = qty * rate;

            doc.text(name, 4, y);
            doc.text(qty.toString(), 46, y);
            doc.text(rate.toFixed(0), 55, y);
            doc.text(amt.toFixed(0), 68, y);
            
            subTotal += amt;
            totalItemsQty += qty;
            y += 5;
        });

        drawDashedLine(y);
        y += 5;

        // Subtotal & GST
        doc.text("Sub Total :", 38, y);
        doc.text(subTotal.toFixed(2), 68, y);
        y += 5;

        const sgst = subTotal * 0.025;
        doc.text(`SGST @2.5% :`, 38, y);
        doc.text(sgst.toFixed(2), 68, y);
        y += 5;

        const cgst = subTotal * 0.025;
        doc.text(`CGST @2.5% :`, 38, y);
        doc.text(cgst.toFixed(2), 68, y);
        y += 5;

        drawDashedLine(y);
        y += 6;

        // Total
        const finalTotal = subTotal + sgst + cgst;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`${totalItemsQty} Item(s)`, 4, y);
        doc.text("Total :", 45, y);
        doc.text(finalTotal.toFixed(0), 68, y);
        y += 3;
        
        drawDashedLine(y);
        y += 6;

        // Footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("FSSAI NO - 11516004000575", 4, y);
        doc.text(`(${order.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`, pageWidth - 25, y);
        y += 5;
        doc.text("E.&O.E.", 4, y);
        doc.text("Thank You", pageWidth / 2 - 8, y);
        doc.text("Visit Again", pageWidth - 22, y);

        doc.save(`bill-${billNo}.pdf`);
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
                                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md">T-{tableInfo ? tableInfo.tableNumber : tableId}</span>
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

            <AnimatePresence mode="wait">
                {activeView === 'menu' && (
                    <CustomerMenuView
                        menuViewMode={menuViewMode}
                        setMenuViewMode={setMenuViewMode}
                        menuData={menuData}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        isVegOnly={isVegOnly}
                        setIsVegOnly={setIsVegOnly}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        categoryScrollRef={categoryScrollRef}
                        cart={cart}
                        addToCart={addToCart}
                        updateQuantity={updateQuantity}
                        currentCategoryData={currentCategoryData}
                        filteredItems={filteredItems}
                        handleCategoryClick={handleCategoryClick}
                        renderSpicy={renderSpicy}
                    />
                )}
                {activeView === 'orders' && (
                    <CustomerOrdersView orders={orders} setActiveView={setActiveView} />
                )}
                {activeView === 'history' && (
                    <CustomerHistoryView history={history} generateBill={generateBill} restaurantInfo={restaurantInfo} />
                )}
                {activeView === 'payment' && (
                    <CustomerPaymentView orders={orders} setActiveView={setActiveView} handleRazorpayPayment={handleRazorpayPayment} />
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

            <CustomerCartModal
                showCart={showCart}
                setShowCart={setShowCart}
                cart={cart}
                cartItemCount={cartItemCount}
                cartTotal={cartTotal}
                updateQuantity={updateQuantity}
                placeOrder={placeOrder}
            />

        </div>
    );
};

export default RestaurantApp;
