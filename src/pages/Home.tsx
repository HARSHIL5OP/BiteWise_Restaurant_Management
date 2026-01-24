import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Clock, Check, ChefHat, User, CreditCard, Smartphone, Wallet, X, ChevronRight, UtensilsCrossed, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

    const tableNumber = "12";

    const menuData = [
        {
            category: "Starters",
            icon: "🥗",
            items: [
                { id: 1, name: "Paneer Tikka", price: 280, image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop", veg: true, spicy: 2 },
                { id: 2, name: "Chicken Wings", price: 320, image: "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400&h=300&fit=crop", veg: false, spicy: 3 },
                { id: 3, name: "Spring Rolls", price: 200, image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=400&h=300&fit=crop", veg: true, spicy: 1 },
                { id: 4, name: "Fish Fingers", price: 340, image: "https://images.unsplash.com/photo-1580217593608-61931cefc821?w=400&h=300&fit=crop", veg: false, spicy: 1 }
            ]
        },
        {
            category: "Main Course",
            icon: "🍛",
            items: [
                { id: 5, name: "Butter Chicken", price: 450, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop", veg: false, spicy: 2 },
                { id: 6, name: "Dal Makhani", price: 280, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop", veg: true, spicy: 1 },
                { id: 7, name: "Biryani", price: 380, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop", veg: false, spicy: 3 },
                { id: 8, name: "Paneer Butter Masala", price: 320, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop", veg: true, spicy: 2 },
                { id: 9, name: "Kadhai Chicken", price: 420, image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400&h=300&fit=crop", veg: false, spicy: 3 }
            ]
        },
        {
            category: "Breads",
            icon: "🫓",
            items: [
                { id: 10, name: "Butter Naan", price: 60, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop", veg: true, spicy: 0 },
                { id: 11, name: "Garlic Naan", price: 70, image: "https://images.unsplash.com/photo-1619887209025-e0c93a3d85d2?w=400&h=300&fit=crop", veg: true, spicy: 0 },
                { id: 12, name: "Tandoori Roti", price: 40, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop", veg: true, spicy: 0 }
            ]
        },
        {
            category: "Beverages",
            icon: "🥤",
            items: [
                { id: 13, name: "Fresh Lime Soda", price: 80, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop", veg: true, spicy: 0 },
                { id: 14, name: "Mango Lassi", price: 120, image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=300&fit=crop", veg: true, spicy: 0 },
                { id: 15, name: "Cold Coffee", price: 140, image: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=300&fit=crop", veg: true, spicy: 0 }
            ]
        },
        {
            category: "Desserts",
            icon: "🍰",
            items: [
                { id: 16, name: "Gulab Jamun", price: 100, image: "https://images.unsplash.com/photo-1589119908995-c6b8b1d85728?w=400&h=300&fit=crop", veg: true, spicy: 0 },
                { id: 17, name: "Ice Cream", price: 120, image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop", veg: true, spicy: 0 },
                { id: 18, name: "Brownie", price: 150, image: "https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=400&h=300&fit=crop", veg: true, spicy: 0 }
            ]
        }
    ];

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

    const placeOrder = () => {
        if (cart.length === 0) return;
        const newOrder = {
            id: Date.now(),
            items: [...cart],
            status: 'queue',
            time: new Date(),
            estimatedTime: Math.floor(Math.random() * 20) + 15
        };
        setOrders([...orders, newOrder]);
        setCart([]);
        setShowCart(false);
        setActiveView('orders');
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
                                            <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${order.status === 'queue' ? 'bg-yellow-100 text-yellow-700' :
                                                    order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-green-100 text-green-700'
                                                }`}>
                                                {order.status === 'queue' && <Clock className="w-3.5 h-3.5" />}
                                                {order.status === 'preparing' && <ChefHat className="w-3.5 h-3.5" />}
                                                {order.status === 'done' && <Check className="w-3.5 h-3.5" />}
                                                {order.status === 'queue' ? 'In Queue' :
                                                    order.status === 'preparing' ? 'Preparing' : 'Ready'}
                                            </div>
                                        </div>

                                        {(order.status === 'queue' || order.status === 'preparing') && (
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

                            <button className="w-full bg-white border-2 border-orange-500 rounded-2xl p-4 hover:bg-orange-50 transition-all flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-gray-800">Card Payment</p>
                                    <p className="text-xs text-gray-500">Credit / Debit / UPI</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </button>

                            <button className="w-full bg-white border-2 border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-all flex items-center gap-4">
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
