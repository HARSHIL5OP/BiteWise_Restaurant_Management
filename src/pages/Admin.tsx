import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, UtensilsCrossed, Settings, Plus, X,
    Search, Trash2, Edit2, ChevronRight, TrendingUp, DollarSign,
    ShoppingBag, Bell, LogOut, ChefHat, User, UserCheck, Upload,
    QrCode, Grid, Download, Printer, Clock, Sun, Moon
} from 'lucide-react';
import QRCode from 'qrcode';
import RestaurantFloorBlueprint from '../components/RestaurantFloorBlueprint';
import KitchenBoard from '../components/KitchenBoard';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, AreaChart, Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, where, setDoc, updateDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../lib/cloudinary';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '../lib/firebase';

// --- Mock Stats Data (Keep for charts for now) ---


// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, className = "" }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${active
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
            } ${className}`}
    >
        <Icon size={20} className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'} transition-colors duration-300`} />
        <span className="font-medium text-sm">{label}</span>
        {active && (
            <motion.div
                layoutId="active-pill"
                className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            />
        )}
    </button>
);

const StatCard = ({ title, value, subtext, icon: Icon, trend }) => (
    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
            <Icon size={80} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Icon size={24} />
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}>
                {trend > 0 ? '+' : ''}{trend}%
            </span>
        </div>
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">{value}</p>
        <p className="text-slate-400 dark:text-slate-500 text-xs">{subtext}</p>
    </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </motion.div>
        </div>
    );
};

// --- Main Component ---

const RestaurantAdmin = () => {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // App State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [restaurantName, setRestaurantName] = useState('Luxe Bistro');
    const [logo, setLogo] = useState('🍽️');
    const [isLoading, setIsLoading] = useState(false);

    // Dashboard Metrics State
    const [orders, setOrders] = useState([]);
    const [revenue, setRevenue] = useState(0);
    const [dailyStats, setDailyStats] = useState([]);
    const [staffCount, setStaffCount] = useState(0);

    // Data State
    const [menuItems, setMenuItems] = useState([]);
    const [staff, setStaff] = useState([]);
    const [categories, setCategories] = useState(['Main Course', 'Appetizer', 'Dessert', 'Beverage']);

    // Modals & Forms State
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [showAddTable, setShowAddTable] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const [newMenuItem, setNewMenuItem] = useState({
        name: '', price: '', quantity: '', image: null, category: 'Main Course',
        newCategory: '' // for adding custom category
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    // Updated initial staff state to match the user's DB schema preferences
    const [newStaff, setNewStaff] = useState({
        firstName: '', lastName: '', email: '', password: '', role: 'waiter', shift: 'Morning'
    });

    const [tables, setTables] = useState([]);
    const [newTable, setNewTable] = useState({ tableNumber: '', capacity: '4' });

    const [tempSettings, setTempSettings] = useState({ name: restaurantName, logo: logo });

    // Computed
    const chefs = staff.filter(s => s.role === 'chef');
    const waiters = staff.filter(s => s.role === 'waiter');
    const cashiers = staff.filter(s => s.role === 'cashier');

    // Fetch Data on Mount
    useEffect(() => {
        const unsubscribeMenu = onSnapshot(collection(db, 'menu'), (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMenuItems(items);

            // Extract unique categories from fetched items to update list
            const fetchedCategories = [...new Set(items.map(i => i.category))];
            if (fetchedCategories.length > 0) {
                setCategories(prev => [...new Set([...prev, ...fetchedCategories])]);
            }
        }, (error) => {
            console.error("Menu fetch error:", error);
        });

        const unsubscribeStaff = onSnapshot(collection(db, 'users'), (snapshot) => {
            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                name: `${doc.data().firstName || ''} ${doc.data().lastName || ''}`.trim()
            }));
            setStaff(users.filter(u => ['chef', 'waiter', 'cashier'].includes(u.role)));
            setStaffCount(users.filter(u => ['chef', 'waiter', 'cashier'].includes(u.data().role)).length);
        }, (error) => {
            console.error("Staff fetch error:", error);
        });

        const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(fetchedOrders);

            // 1. Calculate Total Revenue (Completed Only)
            const totalRevenue = fetchedOrders
                .filter(o => o.status === 'completed')
                .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
            setRevenue(totalRevenue);

            // 2. Calculate Daily Trends
            const statsMap = {};
            fetchedOrders.forEach(order => {
                if (order.createdAt) {
                    const date = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                    const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...

                    if (!statsMap[dayKey]) {
                        statsMap[dayKey] = { name: dayKey, revenue: 0, orders: 0, sortKey: date.getDay() };
                    }

                    statsMap[dayKey].orders += 1;
                    if (order.status === 'completed') {
                        statsMap[dayKey].revenue += (Number(order.totalAmount) || 0);
                    }
                }
            });

            // Sort by day of week
            const sortedStats = Object.values(statsMap).sort((a: any, b: any) => {
                // Adjust for Monday start if needed, currently Sun=0
                return a.sortKey - b.sortKey;
            });

            // If empty, show fallback or empty array
            setDailyStats(sortedStats.length > 0 ? sortedStats : []);

        }, (error) => {
            console.error("Orders fetch error:", error);
        });

        // Fetch Tables
        const unsubscribeTables = onSnapshot(collection(db, 'tables'), (snapshot) => {
            const tablesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort by table number
            tablesData.sort((a: any, b: any) => parseInt(a.tableNumber) - parseInt(b.tableNumber));
            setTables(tablesData);
        }, (error) => {
            console.error("Tables fetch error:", error);
        });

        return () => {
            unsubscribeMenu();
            unsubscribeStaff();
            unsubscribeTables();
            unsubscribeOrders();
        };
    }, []);

    // Data Handlers
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleAddMenu = async () => {
        // Validation
        if (!newMenuItem.name.trim()) {
            alert("Please enter an Item Name");
            return;
        }
        if (!newMenuItem.price || isNaN(Number(newMenuItem.price)) || Number(newMenuItem.price) <= 0) {
            alert("Please enter a valid positive Price");
            return;
        }
        if (newMenuItem.quantity && (isNaN(Number(newMenuItem.quantity)) || Number(newMenuItem.quantity) < 0)) {
            alert("Quantity must be a valid non-negative number (or leave empty for infinite)");
            return;
        }

        setIsLoading(true);

        try {
            let imageUrl = '';
            // Upload image if selected
            if (newMenuItem.image && typeof newMenuItem.image !== 'string') {
                imageUrl = await uploadToCloudinary(newMenuItem.image);
            } else if (typeof newMenuItem.image === 'string') {
                imageUrl = newMenuItem.image;
            }

            // Determine category
            const categoryToSave = newMenuItem.newCategory ? newMenuItem.newCategory : newMenuItem.category;

            const itemData = {
                name: newMenuItem.name,
                price: newMenuItem.price.toString(),
                quantity: newMenuItem.quantity.toString(),
                category: categoryToSave,
                image: imageUrl || 'https://source.unsplash.com/random/800x600/?food',
            };

            if (editingId) {
                await updateDoc(doc(db, 'menu', editingId), {
                    ...itemData,
                    updatedAt: new Date().toISOString()
                });
            } else {
                await addDoc(collection(db, 'menu'), {
                    ...itemData,
                    createdAt: new Date().toISOString()
                });
            }

            // Update local categories if new one added
            if (newMenuItem.newCategory && !categories.includes(newMenuItem.newCategory)) {
                setCategories([...categories, newMenuItem.newCategory]);
            }

            setNewMenuItem({ name: '', price: '', quantity: '', image: null, category: 'Main Course', newCategory: '' });
            setEditingId(null);
            setShowAddMenu(false);
        } catch (error: any) {
            console.error("Error adding/updating menu item: ", error);
            if (error.toString().includes("Failed to fetch") || error.message?.includes("Network")) {
                alert("Network Error: You appear to be offline. Please check your internet connection.");
            } else {
                alert("Failed to save item. " + (error.message || "See console."));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const openEditMenu = (item: any) => {
        setEditingId(item.id);
        setNewMenuItem({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            category: item.category,
            newCategory: ''
        });
        setShowAddMenu(true);
    };

    const handleAddStaff = async () => {
        if (!newStaff.firstName || !newStaff.email || !newStaff.password) {
            alert("Please fill in all required fields (Name, Email, Password)");
            return;
        }
        setIsLoading(true);
        try {
            // 1. Create User in Firebase Auth (using secondary app to avoid logging out admin)
            const secondaryApp = initializeApp(firebaseConfig, "Secondary");
            const secondaryAuth = getAuth(secondaryApp);
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newStaff.email, newStaff.password);
            const { uid } = userCredential.user;

            // Cleanup secondary app
            await signOut(secondaryAuth);
            // Note: deleteApp is not strictly necessary for single operations but good practice if supported, 
            // but typical generic JS SDK cleanup is just letting it GC or `deleteApp(secondaryApp)` if imported.
            // keeping it simple with signOut.

            // 2. Add User Details to Firestore
            const staffData = {
                firstName: newStaff.firstName,
                lastName: newStaff.lastName,
                email: newStaff.email,
                role: newStaff.role,
                shift: newStaff.shift,
                phone: "", // Added default to match schema
                createdAt: new Date().toISOString(),
                // Note: We do NOT store the password in Firestore for security
            };

            // Use setDoc with the UID to link Auth and Firestore
            await setDoc(doc(db, 'users', uid), staffData);

            setNewStaff({ firstName: '', lastName: '', email: '', password: '', role: 'waiter', shift: 'Morning' });
            setShowAddStaff(false);
            alert("Staff member added successfully!");
        } catch (error: any) {
            console.error("Error adding staff: ", error);
            let msg = "Failed to add staff.";
            if (error.code === 'auth/email-already-in-use') msg = "Email is already in use.";
            if (error.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
            alert(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteMenu = async (id) => {
        if (confirm('Are you sure you want to delete this item?')) {
            await deleteDoc(doc(db, 'menu', id));
        }
    };

    const handleDeleteStaff = async (id) => {
        if (confirm('Are you sure you want to remove this staff member?')) {
            await deleteDoc(doc(db, 'users', id));
        }
    };

    const handleDeleteTable = async (id) => {
        if (confirm('Are you sure you want to delete this table?')) {
            await deleteDoc(doc(db, 'tables', id));
        }
    };

    const saveSettings = () => {
        setRestaurantName(tempSettings.name);
        setLogo(tempSettings.logo);
        setShowSettings(false);
    };

    // Helper to convert Data URL to Blob/File for Cloudinary
    const dataURLtoFile = (dataurl, filename) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const handleAddTable = async () => {
        if (!newTable.tableNumber || !newTable.capacity) {
            alert("Please fill all table details");
            return;
        };

        // Check for uniqueness
        if (tables.some(t => t.tableNumber.toString() === newTable.tableNumber.toString())) {
            alert(`Table ${newTable.tableNumber} already exists!`);
            return;
        }

        setIsLoading(true);

        try {
            const tableNum = parseInt(newTable.tableNumber);

            // Uniqueness check again with number type if needed, but the first check covers it string-wise if consistent.
            // But let's rely on the first check.

            // 1. Generate QR Code
            // This URL should point to the customer facing menu/order page with table param
            // User Request: "just be scanned and show table number" -> switching to simple JSON/text for verification "for now"
            // 1. Generate QR Code
            // This URL points to the customer facing home page with table number at the end
            // User requested: https://odoo-cafe-project-eight.vercel.app/home/<tablenumber>
            const qrData = `https://odoo-cafe-project-eight.vercel.app/home/${tableNum}`;
            const qrDataUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

            // 2. Convert to File for Cloudinary
            const qrFile = dataURLtoFile(qrDataUrl, `qr-table-${tableNum}.png`);

            // 3. Upload to Cloudinary
            const qrUrl = await uploadToCloudinary(qrFile);

            // 4. Save to Firestore
            const tableData = {
                tableNumber: tableNum,
                capacity: parseInt(newTable.capacity),
                status: 'available',
                qrUrl: qrUrl,
                createdAt: new Date().toISOString()
            };

            // Using table number as ID for easier lookup/deduplication if needed, or auto-id
            // Requirement says tableNumber must be unique. Let's use auto-ID but we already checked uniqueness.
            await addDoc(collection(db, 'tables'), tableData);

            setNewTable({ tableNumber: '', capacity: '4' });
            setShowAddTable(false);
            alert(`Table ${tableNum} added successfully!`);
        } catch (error) {
            console.error("Error adding table:", error);
            alert("Failed to add table. Check console.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-indigo-500/30 transition-colors duration-300">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col z-40 lg:flex hidden transition-colors duration-300">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <span className="text-3xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500 font-bold drop-shadow-sm">
                        {logo}
                    </span>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{restaurantName}</h1>
                </div>

                <div className="space-y-1 flex-1">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <SidebarItem icon={ChefHat} label="Kitchen Live" active={activeTab === 'kitchen'} onClick={() => setActiveTab('kitchen')} />
                    <SidebarItem icon={Grid} label="Tables" active={activeTab === 'tables'} onClick={() => setActiveTab('tables')} />
                    <SidebarItem icon={UtensilsCrossed} label="Menu" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
                    <SidebarItem icon={Users} label="Staff" active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} />
                    <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setTempSettings({ name: restaurantName, logo }); }} />
                    <SidebarItem icon={LogOut} label="Logout" active={false} onClick={handleLogout} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 mt-10" />
                </div>

                <div className="mt-auto">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 transition-colors duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                                JD
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">John Doe</p>
                                <p className="text-xs text-slate-500">Super Admin</p>
                            </div>
                        </div>
                    </div>
                    {/* Platform Identity */}
                    <div className="text-center">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">Powered by Bitewise</span>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar (Simplified) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-4 flex justify-around z-50 transition-colors duration-300">
                <LayoutDashboard onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
                <UtensilsCrossed onClick={() => setActiveTab('menu')} className={activeTab === 'menu' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
                <Users onClick={() => setActiveTab('staff')} className={activeTab === 'staff' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
                <Settings onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
            </div>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 capitalize tracking-tight">{activeTab}</h2>
                        <p className="text-slate-500 text-sm">Welcome back, here's what's happening today.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all w-64 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl relative hover:border-indigo-500/50 hover:text-indigo-500 transition-all group shadow-sm dark:shadow-none"
                        >
                            {theme === 'light' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-400" />}
                        </button>

                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

                        <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl relative hover:border-indigo-500/50 hover:text-indigo-500 transition-all shadow-sm dark:shadow-none">
                            <Bell size={20} className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-500" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                        </button>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {/* TABLES TAB */}
                    {activeTab === 'tables' && (
                        <motion.div
                            key="tables"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-8"
                        >
                            <div className="flex justify-between items-center">
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Table Management</h1>
                                <button
                                    onClick={() => {
                                        const maxNum = tables.reduce((max, t) => Math.max(max, parseInt(t.tableNumber) || 0), 0);
                                        setNewTable({ ...newTable, tableNumber: (maxNum + 1).toString(), capacity: '4' });
                                        setShowAddTable(true);
                                    }}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <Plus size={20} /> Add Table
                                </button>
                            </div>

                            {/* Table Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4 transition-colors duration-300 shadow-sm dark:shadow-none">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                                        <Grid size={24} />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Tables</p>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{tables.length}</h3>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4 transition-colors duration-300 shadow-sm dark:shadow-none">
                                    <div className="p-3 bg-slate-100 dark:bg-white/10 rounded-lg text-slate-600 dark:text-white">
                                        <div className="w-6 h-6 rounded-full border-2 border-slate-400 dark:border-white/50" />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Available</p>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{tables.filter(t => t.status === 'available').length}</h3>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4 transition-colors duration-300 shadow-sm dark:shadow-none">
                                    <div className="p-3 bg-rose-50 dark:bg-red-500/10 rounded-lg text-rose-600 dark:text-red-400">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Occupied</p>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{tables.filter(t => t.status === 'occupied').length}</h3>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4 transition-colors duration-300 shadow-sm dark:shadow-none">
                                    <div className="p-3 bg-amber-50 dark:bg-orange-500/10 rounded-lg text-amber-600 dark:text-orange-400">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Reserved</p>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{tables.filter(t => t.status === 'reserved').length}</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Table Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {tables.map(table => (
                                    <div
                                        key={table.id}
                                        className={`
                                            relative bg-white dark:bg-slate-900 border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl group
                                            ${table.status === 'available' ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600' : ''}
                                            ${table.status === 'occupied' ? 'border-rose-100 dark:border-red-500/20 bg-rose-50/50 dark:bg-red-500/5' : ''}
                                            ${table.status === 'reserved' ? 'border-amber-100 dark:border-orange-500/20 bg-amber-50/50 dark:bg-orange-500/5' : ''}
                                        `}
                                    >
                                        {/* Delete Button (visible on hover) */}
                                        <button
                                            onClick={() => handleDeleteTable(table.id)}
                                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete Table"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">T-{table.tableNumber}</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
                                                    <Users size={14} /> {table.capacity} Seats
                                                </p>
                                            </div>
                                            <div className={`
                                                px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                                ${table.status === 'available' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : ''}
                                                ${table.status === 'occupied' ? 'bg-rose-100 text-rose-600 dark:bg-red-500 dark:text-white' : ''}
                                                ${table.status === 'reserved' ? 'bg-amber-100 text-amber-600 dark:bg-orange-500 dark:text-white' : ''}
                                            `}>
                                                {table.status}
                                            </div>
                                        </div>

                                        {/* QR Code Preview */}
                                        <div className="bg-slate-50 dark:bg-white p-3 rounded-xl w-fit mx-auto mb-4 group-hover:scale-105 transition-transform duration-300 shadow-inner">
                                            <img
                                                src={table.qrUrl}
                                                alt={`QR T-${table.tableNumber}`}
                                                className="w-24 h-24 object-contain opacity-90 group-hover:opacity-100 mix-blend-multiply dark:mix-blend-normal"
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            <a
                                                href={table.qrUrl}
                                                download={`Table-${table.tableNumber}-QR.png`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Download size={14} /> PNG
                                            </a>
                                            <button
                                                onClick={() => {
                                                    const printWindow = window.open('', '_blank');
                                                    printWindow.document.write(`
                                                        <html>
                                                            <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
                                                                <h1>Table ${table.tableNumber}</h1>
                                                                <img src="${table.qrUrl}" width="300" />
                                                                <p>Scan to Order</p>
                                                            </body>
                                                        </html>
                                                    `);
                                                    printWindow.document.close();
                                                    printWindow.print();
                                                }}
                                                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Printer size={14} /> Print
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Floor Plan Blueprint */}
                            <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8">
                                <RestaurantFloorBlueprint tables={tables} />
                            </div>
                        </motion.div>
                    )}

                    {/* DASHBOARD TAB */}
                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard title="Total Revenue" value={`$${revenue.toLocaleString()}`} subtext="Lifetime Earnings" trend={12} icon={DollarSign} />
                                <StatCard title="Total Orders" value={orders.length} subtext="All time" trend={8} icon={ShoppingBag} />
                                <StatCard title="Active Staff" value={staff.length} subtext="Registered Staff" trend={0} icon={Users} />
                                <StatCard title="Avg Order Value" value={`$${orders.length > 0 ? Math.round(revenue / orders.filter(o => o.status === 'completed').length || 1) : 0}`} subtext="Per completed order" trend={5} icon={TrendingUp} />
                            </div>

                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm dark:shadow-none transition-colors duration-300">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 tracking-tight">Revenue Analysis</h3>
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={dailyStats}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? "#e2e8f0" : "#1e293b"} />
                                                <XAxis dataKey="name" stroke="#64748b" />
                                                <YAxis stroke="#64748b" prefix="$" />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
                                                        borderColor: theme === 'light' ? '#e2e8f0' : '#1e293b',
                                                        color: theme === 'light' ? '#0f172a' : '#fff',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                    }}
                                                    itemStyle={{ color: theme === 'light' ? '#0f172a' : '#fff' }}
                                                />
                                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm dark:shadow-none transition-colors duration-300">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 tracking-tight">Popular Categories</h3>
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={dailyStats}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? "#e2e8f0" : "#1e293b"} />
                                                <XAxis dataKey="name" stroke="#64748b" />
                                                <Tooltip
                                                    cursor={{ fill: theme === 'light' ? '#f1f5f9' : '#1e293b' }}
                                                    contentStyle={{
                                                        backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
                                                        borderColor: theme === 'light' ? '#e2e8f0' : '#1e293b',
                                                        color: theme === 'light' ? '#0f172a' : '#fff',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                    }}
                                                />
                                                <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* KITCHEN LIVE TAB */}
                    {activeTab === 'kitchen' && (
                        <motion.div
                            key="kitchen"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="h-[calc(100vh-140px)]"
                        >
                            <KitchenBoard />
                        </motion.div>
                    )}

                    {/* MENU TAB */}
                    {activeTab === 'menu' && (
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition active:scale-95 shadow-lg shadow-indigo-500/20" onClick={() => {
                                        setEditingId(null);
                                        setNewMenuItem({ name: '', price: '', quantity: '', image: null, category: 'Main Course', newCategory: '' });
                                        setShowAddMenu(true);
                                    }}>
                                        <Plus size={18} className="inline mr-2" /> Add Item
                                    </button>
                                </div>
                                <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">{menuItems.length} Items Found</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                {menuItems.map(item => (
                                    <div key={item.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-xl hover:-translate-y-1">
                                        <div className="h-48 overflow-hidden relative">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
                                                {item.category}
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">{item.name}</h3>
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400">${item.price}</span>
                                            </div>
                                            <p className="text-slate-500 text-sm mb-4">Stock: <span className={item.quantity === '0' ? 'text-rose-500 font-bold' : ''}>{item.quantity || '∞'}</span></p>
                                            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <button onClick={() => openEditMenu(item)} className="p-2 text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteMenu(item.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all rounded-lg">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* STAFF TAB */}
                    {activeTab === 'staff' && (
                        <motion.div
                            key="staff"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/25 flex items-center active:scale-95" onClick={() => setShowAddStaff(true)}>
                                    <Plus size={18} className="mr-2" /> Add Staff Member
                                </button>
                            </div>

                            <div className="space-y-8">
                                {[
                                    { title: 'Chefs', data: chefs, icon: ChefHat, color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/10' },
                                    { title: 'Waiters', data: waiters, icon: User, color: 'text-blue-600 dark:text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10' },
                                    { title: 'Cashiers', data: cashiers, icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/10' }
                                ].map((group) => (
                                    <div key={group.title}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`p-2 rounded-lg ${group.bg} ${group.color}`}>
                                                <group.icon size={20} />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{group.title} <span className="text-slate-500 text-sm font-normal">({group.data.length})</span></h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {group.data.map(member => (
                                                <div key={member.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4 hover:border-indigo-500/30 hover:shadow-md transition-all">
                                                    <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}&background=random`} alt={member.name} className="w-12 h-12 rounded-full ring-2 ring-slate-100 dark:ring-slate-800" />
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-slate-900 dark:text-white">{member.name}</h4>
                                                        <p className="text-xs text-slate-500 capitalize">{member.shift} Shift</p>
                                                    </div>
                                                    <button onClick={() => handleDeleteStaff(member.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            {group.data.length === 0 && (
                                                <div className="col-span-full py-8 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-slate-500">
                                                    No {group.title.toLowerCase()} added yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="max-w-2xl"
                        >
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm dark:shadow-none transition-colors duration-300">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">General Settings</h3>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Restaurant Name</label>
                                        <input
                                            value={tempSettings.name}
                                            onChange={e => setTempSettings({ ...tempSettings, name: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Logo / Icon (Emoji)</label>
                                        <div className="flex gap-4">
                                            <input
                                                value={tempSettings.logo}
                                                onChange={e => setTempSettings({ ...tempSettings, logo: e.target.value })}
                                                className="w-20 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-2xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                            />
                                            <div className="flex-1 flex items-center text-sm text-slate-500">
                                                Enter an emoji or character to represent your brand.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                                        <button
                                            onClick={saveSettings}
                                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/25 active:scale-95"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Modals */}
            <Modal isOpen={showAddMenu} onClose={() => {
                setShowAddMenu(false);
                setEditingId(null);
                setNewMenuItem({ name: '', price: '', quantity: '', image: null, category: 'Main Course', newCategory: '' });
            }} title={editingId ? "Edit Menu Item" : "Add New Menu Item"}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Item Name</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-colors"
                            placeholder="e.g. Spicy Ramen"
                            value={newMenuItem.name} onChange={e => setNewMenuItem({ ...newMenuItem, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Price ($)</label>
                            <input type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-colors"
                                placeholder="0.00"
                                value={newMenuItem.price} onChange={e => setNewMenuItem({ ...newMenuItem, price: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Quantity</label>
                            <input type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-colors"
                                placeholder="e.g. 50 servings"
                                value={newMenuItem.quantity} onChange={e => setNewMenuItem({ ...newMenuItem, quantity: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none mb-2 transition-colors"
                            value={newMenuItem.category} onChange={e => setNewMenuItem({ ...newMenuItem, category: e.target.value, newCategory: '' })}>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="new">+ Add New Category</option>
                        </select>
                        {newMenuItem.category === 'new' && (
                            <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none animate-in fade-in slide-in-from-top-2 transition-colors"
                                placeholder="Enter new category name..."
                                value={newMenuItem.newCategory} onChange={e => setNewMenuItem({ ...newMenuItem, newCategory: e.target.value })} />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Item Image</label>
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center hover:border-indigo-500/50 transition-colors cursor-pointer relative group bg-slate-50 dark:bg-slate-950/50">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setNewMenuItem({ ...newMenuItem, image: e.target.files[0] })}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-indigo-500">
                                {newMenuItem.image ? (
                                    <span className="text-sm font-medium text-emerald-500">
                                        {typeof newMenuItem.image === 'object' ? newMenuItem.image.name : 'Image Selected'}
                                    </span>
                                ) : (
                                    <>
                                        <Upload size={24} />
                                        <span className="text-sm">Click to upload image</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleAddMenu}
                        disabled={isLoading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        {isLoading ? 'Saving...' : (editingId ? 'Update Item' : 'Add Item')}
                    </button>
                </div>
            </Modal>

            <Modal isOpen={showAddStaff} onClose={() => setShowAddStaff(false)} title="Add Staff Member">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">First Name</label>
                            <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                                placeholder="John"
                                value={newStaff.firstName} onChange={e => setNewStaff({ ...newStaff, firstName: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Last Name</label>
                            <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                                placeholder="Doe"
                                value={newStaff.lastName} onChange={e => setNewStaff({ ...newStaff, lastName: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Role</label>
                            <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                                value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}>
                                <option value="waiter">Waiter</option>
                                <option value="chef">Chef</option>
                                <option value="cashier">Cashier</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Shift</label>
                            <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                                value={newStaff.shift} onChange={e => setNewStaff({ ...newStaff, shift: e.target.value })}>
                                <option>Morning</option>
                                <option>Evening</option>
                                <option>Full Day</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                            placeholder="email@example.com"
                            value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Password</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                            type="password"
                            placeholder="••••••••"
                            value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} />
                    </div>
                    <button
                        onClick={handleAddStaff}
                        disabled={isLoading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition mt-4 disabled:opacity-50 shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        {isLoading ? 'Adding...' : 'Add Staff'}
                    </button>
                </div>
            </Modal>

            {/* Add Table Modal */}
            <Modal isOpen={showAddTable} onClose={() => setShowAddTable(false)} title="Add New Table">
                <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 transition-colors">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://odoo-cafe-project-eight.vercel.app/home/${newTable.tableNumber || ''}`}
                                alt="QR Preview"
                                className="w-16 h-16"
                            />
                        </div>
                        <div>
                            <p className="text-slate-900 dark:text-white font-bold text-sm">Auto-Generated QR</p>
                            <p className="text-slate-500 text-xs">Based on unique Table ID</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Table Number</label>
                        <input
                            type="number"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none font-mono text-lg transition-colors"
                            placeholder="e.g. 12"
                            value={newTable.tableNumber}
                            onChange={e => setNewTable({ ...newTable, tableNumber: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Seating Capacity</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[2, 4, 6, 8].map(cap => (
                                <button
                                    key={cap}
                                    onClick={() => setNewTable({ ...newTable, capacity: cap.toString() })}
                                    className={`py-2 rounded-lg font-bold border transition-all ${newTable.capacity === cap.toString()
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-500 dark:hover:border-slate-600 hover:text-indigo-600 dark:hover:text-white'
                                        }`}
                                >
                                    {cap}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleAddTable}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition mt-4 shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        Create Table
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default RestaurantAdmin;