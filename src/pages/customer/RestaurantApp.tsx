import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UtensilsCrossed, LogOut, Heart, ChevronRight, Flame, Share2, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    collection, onSnapshot, serverTimestamp, query,
    where, updateDoc, doc, getDocs, setDoc, getDoc, deleteDoc
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
    const [cart, setCart] = useState<any[]>([]);
    
    const [activeView, setActiveView] = useState<'menu' | 'orders' | 'history' | 'payment'>('menu');
    const [menuViewMode, setMenuViewMode] = useState<'overview' | 'items'>('overview');
    const [orders, setOrders] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [menuData, setMenuData] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [inventory, setInventory] = useState<any[]>([]);

    // Shared Session States
    const [showShareModal, setShowShareModal] = useState(false);
    const [guestNameModal, setGuestNameModal] = useState(false);
    const [guestNameInput, setGuestNameInput] = useState('');
    const [currentUserName, setCurrentUserName] = useState('');
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        const isShared = searchParams.get('shared') === 'true';
        setIsGuest(isShared);
        if (isShared) {
            const storedName = sessionStorage.getItem('guestName');
            if (storedName) {
                setCurrentUserName(storedName);
            } else {
                setGuestNameModal(true);
            }
        } else {
            if (userProfile?.firstName) {
                setCurrentUserName(userProfile.firstName);
            }
        }
    }, [searchParams, userProfile]);

    const handleJoinGuest = () => {
        if (guestNameInput.trim()) {
            sessionStorage.setItem('guestName', guestNameInput.trim());
            setCurrentUserName(guestNameInput.trim());
            setGuestNameModal(false);
        }
    };

    // Filters
    const [isVegOnly, setIsVegOnly] = useState(false);
    const [isJainOnly, setIsJainOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
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

        const unsubscribeInventory = onSnapshot(collection(db, 'restaurants', restaurantId, 'inventory'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInventory(data);
        });

        return () => {
            unsubscribe();
            unsubscribeOrders();
            unsubscribeInventory();
        };
    }, [user, restaurantId]);

    // Firestore synced cart
    useEffect(() => {
        if (!restaurantId || !tableId) return;
        const resolvedTableId = tableInfo?.id || tableId;
        const cartRef = collection(db, 'restaurants', restaurantId, 'tables', resolvedTableId, 'cart');
        
        const unsub = onSnapshot(cartRef, (snap) => {
            const items = snap.docs.map(doc => ({ ...doc.data(), cartDocId: doc.id }));
            setCart(items);
        });
        return () => unsub();
    }, [restaurantId, tableId, tableInfo]);

    // --- CART LOGIC ---
    const addToCart = async (item: any) => {
        const resolvedTableId = tableInfo?.id || tableId;
        const userNameToUse = currentUserName || (userProfile?.firstName) || "Guest";
        
        if (!restaurantId || !resolvedTableId || !userNameToUse) return;
        
        const safeName = userNameToUse.replace(/\s+/g, '_');
        const docId = `${item.id}_${safeName}`;
        const itemRef = doc(db, 'restaurants', restaurantId, 'tables', resolvedTableId, 'cart', docId);

        const existing = cart.find(c => c.cartDocId === docId);
        const currentQty = existing ? existing.quantity : 0;
        const newQty = currentQty + 1;

        // --- INVENTORY CHECK ---
        try {
            const ingsSnap = await getDocs(collection(db, 'restaurants', restaurantId, 'menu', item.id, 'ingredients'));
            const ings = ingsSnap.docs.map(d => d.data());

            for (const ing of ings) {
                if (!ing.deductOnOrder) continue;
                const invItem = inventory.find(i => i.id === ing.inventoryId);
                if (!invItem) continue;

                // Total quantity of this ingredient needed for ALL items in the cart
                // (Simplified: just check for this menu item's total across the whole table's cart)
                const totalQtyNeeded = cart.reduce((sum, cartItem) => {
                    // This is tricky because we don't know the ingredients of OTHER items in the cart here without fetching them.
                    // For now, let's just check if the inventory is enough for THIS specific menu item's total quantity at this table.
                    if (cartItem.id === item.id) {
                        return sum + (cartItem.quantity * ing.quantityUsed);
                    }
                    return sum;
                }, 0) + (1 * ing.quantityUsed);

                if (invItem.quantity < totalQtyNeeded) {
                    alert(`Sorry, we don't have enough ingredients to add another ${item.name}. (Insufficient ${ing.name})`);
                    return;
                }
            }
        } catch (e) {
            console.error("Inventory check failed", e);
        }

        if (existing) {
            await updateDoc(itemRef, { quantity: newQty });
        } else {
            await setDoc(itemRef, {
                ...item,
                quantity: 1,
                addedBy: userNameToUse
            });
        }
    };

    const updateQuantity = async (cartDocId: string, delta: number) => {
        const resolvedTableId = tableInfo?.id || tableId;
        if (!restaurantId || !resolvedTableId) return;
        
        const itemRef = doc(db, 'restaurants', restaurantId, 'tables', resolvedTableId, 'cart', cartDocId);
        const item = cart.find(c => c.cartDocId === cartDocId);
        if (!item) return;

        const newQty = item.quantity + delta;

        if (newQty <= 0) {
            await deleteDoc(itemRef);
        } else if (delta > 0) {
            // --- INVENTORY CHECK FOR INCREMENT ---
            try {
                const ingsSnap = await getDocs(collection(db, 'restaurants', restaurantId, 'menu', item.id, 'ingredients'));
                const ings = ingsSnap.docs.map(d => d.data());

                for (const ing of ings) {
                    if (!ing.deductOnOrder) continue;
                    const invItem = inventory.find(i => i.id === ing.inventoryId);
                    if (!invItem) continue;

                    const totalQtyNeeded = cart.reduce((sum, cartItem) => {
                        if (cartItem.id === item.id) {
                            return sum + (cartItem.quantity * ing.quantityUsed);
                        }
                        return sum;
                    }, 0) + (delta * ing.quantityUsed);

                    if (invItem.quantity < totalQtyNeeded) {
                        alert(`Sorry, we don't have enough ingredients for more ${item.name}.`);
                        return;
                    }
                }
            } catch (e) {
                console.error("Inventory check failed", e);
            }
            await updateDoc(itemRef, { quantity: newQty });
        } else {
            await updateDoc(itemRef, { quantity: newQty });
        }
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

            const resolvedTableId = tableInfo?.id || tableId;
            const activeOrder = orders.find(o => o.tableId === resolvedTableId && o.status !== 'completed');

            let orderRefId = "";

            if (activeOrder) {
                // 🔥 APPEND TO EXISTING ORDER
                orderRefId = activeOrder.id;
                
                const newSubtotal = (activeOrder.subtotal || 0) + subtotal;
                const newTax = (activeOrder.tax || 0) + tax;
                const newTotalAmount = (activeOrder.totalAmount || 0) + totalAmount;

                await updateDoc(doc(db, 'restaurants', restaurantId, 'orders', orderRefId), {
                    subtotal: newSubtotal,
                    tax: newTax,
                    totalAmount: newTotalAmount,
                    status: 'pending', // Reset status back to pending so the chef sees updates
                    updatedAt: serverTimestamp()
                });
            } else {
                // 🔥 CREATE NEW ORDER
                const { waiterId } = await assignWaiter();
                const orderRef = doc(collection(db, 'restaurants', restaurantId, 'orders'));
                orderRefId = orderRef.id;
                
                await setDoc(orderRef, {
                    orderId: orderRef.id,
                    tableId: resolvedTableId,
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
            }

            // 🔥 SAVE ORDER ITEMS
            for (const item of cart) {
                const itemRef = doc(collection(db, 'restaurants', restaurantId, 'orders', orderRefId, 'items'));
                await setDoc(itemRef, {
                    itemId: itemRef.id,
                    orderId: orderRefId,
                    menuItemId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    total: item.price * item.quantity,
                    notes: '',
                    status: 'pending',
                    addedBy: item.addedBy || 'Guest'
                });
                
                // Clear out from structured cart
                await deleteDoc(doc(db, 'restaurants', restaurantId, 'tables', resolvedTableId, 'cart', item.cartDocId));
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

        if (searchQuery.trim()) {
            items = items.filter(item => item.name?.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (isVegOnly) {
            items = items.filter(item => item.veg);
        }

        if (isJainOnly) {
            items = items.filter(item => item.jain);
        }

        if (sortBy === 'price_low') {
            items.sort((a, b) => a.price - b.price);
        }

        return items;
    }, [currentCategoryData, isVegOnly, isJainOnly, sortBy, searchQuery]);

    const handleCategoryClick = (categoryName: string) => {
        setSelectedCategory(categoryName);
        setMenuViewMode('items');
        setIsVegOnly(false); // Reset filters when changing category
        setIsJainOnly(false);
        setSearchQuery('');
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
        <div className="min-h-screen bg-[#FDFBF7] font-sans pb-24 max-w-md mx-auto shadow-2xl overflow-hidden relative text-black">

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
                                <span>{currentUserName || 'Guest'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isGuest && user && (
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="p-2 text-blue-500 hover:text-blue-600 transition-colors bg-blue-50 rounded-full"
                                title="Share Cart Link"
                            >
                                <Share2 className="w-4 h-4 fill-blue-500" />
                            </button>
                        )}
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
                        isJainOnly={isJainOnly}
                        setIsJainOnly={setIsJainOnly}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
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
                        currentUserName={currentUserName}
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
                isGuest={isGuest}
            />

            {/* --- SHARE MODAL --- */}
            {showShareModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4 text-center">Share Table Cart</h2>
                        <p className="text-sm text-gray-500 text-center mb-6">Let your friends browse the menu and add items directly to your cart!</p>
                        
                        <div className="flex justify-center mb-6">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + window.location.pathname + "?restaurantId=" + restaurantId + "&tableId=" + tableId + "&shared=true")}`}
                                alt="QR Code"
                                className="w-40 h-40 border border-gray-100 rounded-lg shadow-sm"
                            />
                        </div>

                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.origin + window.location.pathname + "?restaurantId=" + restaurantId + "&tableId=" + tableId + "&shared=true");
                                alert('Link copied to clipboard!');
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <Copy className="w-5 h-5" /> Copy Shareable Link
                        </button>
                    </div>
                </div>
            )}

            {/* --- GUEST NAME MODAL --- */}
            {guestNameModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white/95 rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-white/20">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                            <UtensilsCrossed className="w-8 h-8 text-orange-500" />
                        </div>
                        <h2 className="text-2xl font-black mb-2 text-center text-gray-800">Join Table</h2>
                        <p className="text-sm text-gray-500 text-center mb-6">Enter your name to add items to the table's shared cart.</p>
                        <input 
                            type="text" 
                            placeholder="Your Name" 
                            className="w-full border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 p-3 rounded-xl mb-4 font-medium transition-all outline-none"
                            value={guestNameInput}
                            onChange={e => setGuestNameInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleJoinGuest();
                            }}
                        />
                        <button 
                            onClick={handleJoinGuest}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/30 transform active:scale-95 transition-all"
                        >
                            Start Browsing
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default RestaurantApp;
