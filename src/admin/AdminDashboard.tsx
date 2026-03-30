import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, UtensilsCrossed, Settings, Plus, X,
    Search, Trash2, Edit2, ChevronRight, TrendingUp, DollarSign,
    ShoppingBag, Bell, LogOut, ChefHat, User, UserCheck, Upload,
    QrCode, Grid, Download, Printer, Clock, Sun, Moon, Boxes
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
import { collection, addDoc, getDocs, getDoc, deleteDoc, doc, onSnapshot, query, where, setDoc, updateDoc } from 'firebase/firestore';
import { saveMenuIngredients, IngredientEntry, getMenuIngredients } from '../services/inventoryService';
import { uploadToCloudinary } from '../lib/cloudinary';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '../lib/firebase';

import StaffList from './staff/StaffList';
import AddStaffForm from './staff/AddStaffForm';
import MenuList from './menu/MenuList';
import AddMenuForm from './menu/AddMenuForm';
import ViewMenuItem from './menu/ViewMenuItem';
import TableList from './tables/TableList';
import AddTableForm from './tables/AddTableForm';
import OrderList from './orders/OrderList';
import AdminSettings from './settings/AdminSettings';
import InventoryList from './inventory/InventoryList';
import AddInventoryForm from './inventory/AddInventoryForm';
import {
    InventoryItem,
    addInventoryItem,
    getInventoryItems,
    updateInventoryItem,
    restockInventoryItem
} from '../services/inventoryService';

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

const AdminDashboard = () => {
    const { logout, userProfile } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const restaurantId = userProfile?.restaurantId;

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

    // Inventory State
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [showAddInventory, setShowAddInventory] = useState(false);
    const [inventoryMode, setInventoryMode] = useState<'add' | 'edit' | 'restock'>('add');
    const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
    const [isInventoryLoading, setIsInventoryLoading] = useState(false);

    // Modals & Forms State
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [showAddTable, setShowAddTable] = useState(false);

    const [newMenuItem, setNewMenuItem] = useState({
        name: '', price: '', image: null as any, category: 'Main Course',
        newCategory: '' // for adding custom category
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
    const [menuIngredientsForEdit, setMenuIngredientsForEdit] = useState<any[]>([]);

    const [showViewMenu, setShowViewMenu] = useState(false);
    const [viewingItem, setViewingItem] = useState<any>(null);
    const [viewingIngredients, setViewingIngredients] = useState<any[]>([]);
    const [isViewingLoading, setIsViewingLoading] = useState(false);

    // Updated initial staff state to match the user's DB schema preferences
    const [newStaff, setNewStaff] = useState({
        firstName: '', lastName: '', email: '', password: '', role: 'waiter', shift: 'Morning'
    });

    const [tables, setTables] = useState([]);
    const [newTable, setNewTable] = useState({ tableNumber: '', capacity: '4' });

    // Computed
    const chefs = staff.filter(s => s.role === 'chef');
    const waiters = staff.filter(s => s.role === 'waiter');
    const cashiers = staff.filter(s => s.role === 'cashier');

    // Fetch Data on Mount
    useEffect(() => {
        if (!restaurantId) return;

        const unsubscribeMenu = onSnapshot(collection(db, 'restaurants', restaurantId, 'menu'), (snapshot) => {
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

        const unsubscribeStaff = onSnapshot(collection(db, 'restaurants', restaurantId, 'staff'), async (snapshot) => {
            try {
                const staffPromises = snapshot.docs.map(async (docSnap) => {
                    const staffData = docSnap.data();
                    const userRef = doc(db, 'users', staffData.userId);
                    const userSnap = await getDoc(userRef);
                    const userData = userSnap.exists() ? userSnap.data() : {};
                    
                    return {
                        id: docSnap.id,
                        ...staffData,
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                        email: userData.email || '',
                        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
                    };
                });
                
                const resolvedStaff = await Promise.all(staffPromises);
                const filteredStaff = resolvedStaff.filter((u: any) => ['chef', 'waiter', 'cashier'].includes(u.role));
                
                setStaff(filteredStaff);
                setStaffCount(filteredStaff.length);
            } catch (err) {
                console.error("Error resolving user data for staff:", err);
            }
        }, (error) => {
            console.error("Staff fetch error:", error);
        });

        const unsubscribeOrders = onSnapshot(collection(db, 'restaurants', restaurantId, 'orders'), (snapshot) => {
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
        const unsubscribeTables = onSnapshot(collection(db, 'restaurants', restaurantId, 'tables'), (snapshot) => {
            const tablesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            tablesData.sort((a: any, b: any) => parseInt(a.tableNumber) - parseInt(b.tableNumber));
            setTables(tablesData);
        }, (error) => {
            console.error("Tables fetch error:", error);
        });

        // Fetch Inventory (real-time)
        const unsubscribeInventory = onSnapshot(
            collection(db, 'restaurants', restaurantId, 'inventory'),
            (snapshot) => {
                const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
                setInventoryItems(items);
            },
            (error) => console.error('Inventory fetch error:', error)
        );

        // Fetch Restaurant details
        const unsubscribeRestaurant = onSnapshot(doc(db, 'restaurants', restaurantId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.name) setRestaurantName(data.name);
                if (data.logoUrl || data.logo) {
                    setLogo(data.logoUrl || data.logo);
                }
            }
        }, (error) => {
             console.error("Restaurant fetch error:", error);
        });

        return () => {
            unsubscribeMenu();
            unsubscribeStaff();
            unsubscribeTables();
            unsubscribeOrders();
            unsubscribeRestaurant();
            unsubscribeInventory();
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

    const handleAddMenu = async (ingredients: IngredientEntry[] = []) => {
        // Enforce rigid subcollection security
        if (!restaurantId || restaurantId === 'DEFAULT_RESTAURANT') {
            alert("Security Error: No valid restaurant ID found for your user context.");
            return;
        }

        if (!newMenuItem.name.trim()) {
            alert("Please enter an Item Name");
            return;
        }
        if (!newMenuItem.price || isNaN(Number(newMenuItem.price)) || Number(newMenuItem.price) <= 0) {
            alert("Please enter a valid positive Price");
            return;
        }

        setIsLoading(true);

        try {
            let imageUrl = '';
            if (newMenuItem.image && typeof newMenuItem.image !== 'string') {
                imageUrl = await uploadToCloudinary(newMenuItem.image);
            } else if (typeof newMenuItem.image === 'string') {
                imageUrl = newMenuItem.image;
            }

            const categoryToSave = newMenuItem.newCategory ? newMenuItem.newCategory : newMenuItem.category;

            const menuItemRef = editingId
                ? doc(db, 'restaurants', restaurantId, 'menu', editingId)
                : doc(collection(db, 'restaurants', restaurantId, 'menu'));

            const itemData = {
                menuItemId: menuItemRef.id,
                restaurantId: restaurantId,
                name: newMenuItem.name,
                description: "",
                price: parseFloat(newMenuItem.price) || 0,
                category: categoryToSave,
                image: imageUrl || 'https://source.unsplash.com/random/800x600/?food',
                veg: true,
                spicyLevel: 0,
                preparationTime: 15,
                calories: 0,
                isAvailable: true,
                isRecommended: false,
            };

            if (editingId) {
                await updateDoc(menuItemRef, itemData);
            } else {
                await setDoc(menuItemRef, { ...itemData, createdAt: new Date().toISOString() });
            }

            // Save ingredients subcollection if any were provided
            if (ingredients.length > 0) {
                try {
                    await saveMenuIngredients(restaurantId, menuItemRef.id, ingredients);
                } catch (ingErr: any) {
                    console.warn('Ingredients saved partially:', ingErr.message);
                }
            }

            if (newMenuItem.newCategory && !categories.includes(newMenuItem.newCategory)) {
                setCategories([...categories, newMenuItem.newCategory]);
            }

            setNewMenuItem({ name: '', price: '', image: null, category: 'Main Course', newCategory: '' });
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

    const openEditMenu = async (item: any) => {
        setEditingId(item.id);
        setNewMenuItem({
            name: item.name,
            price: item.price,
            image: item.image,
            category: item.category,
            newCategory: ''
        });
        
        try {
            const ings = await getMenuIngredients(restaurantId, item.id);
            setMenuIngredientsForEdit(ings.map(i => ({
                inventoryId: i.inventoryId,
                name: i.name,
                unit: i.unit,
                quantityUsed: String(i.quantityUsed)
            })));
        } catch (e) {
            console.error("Failed to fetch ingredients", e);
            setMenuIngredientsForEdit([]);
        }

        setShowAddMenu(true);
    };

    const openViewMenu = async (item: any) => {
        setViewingItem(item);
        setShowViewMenu(true);
        setIsViewingLoading(true);
        setViewingIngredients([]); // reset
        try {
            const ings = await getMenuIngredients(restaurantId, item.id);
            setViewingIngredients(ings);
        } catch (e) {
            console.error("Failed to fetch ingredients", e);
        } finally {
            setIsViewingLoading(false);
        }
    };

    const openEditStaff = (member: any) => {
        setEditingStaffId(member.id);
        setNewStaff({
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            password: '',
            role: member.role,
            shift: member.shift || 'Morning'
        });
        setShowAddStaff(true);
    };

    const handleAddStaff = async () => {
        // Enforce rigid subcollection security
        if (!restaurantId || restaurantId === 'DEFAULT_RESTAURANT') {
            alert("Security Error: No valid restaurant ID found for your user context.");
            return;
        }

        if (editingStaffId) {
            if (!newStaff.firstName || !newStaff.email) {
                alert("Please fill in first name and email");
                return;
            }
            setIsLoading(true);
            try {
                await updateDoc(doc(db, 'users', editingStaffId), {
                    firstName: newStaff.firstName,
                    lastName: newStaff.lastName,
                });
                await updateDoc(doc(db, 'restaurants', restaurantId, 'staff', editingStaffId), {
                    role: newStaff.role,
                    shift: newStaff.shift,
                });
                setNewStaff({ firstName: '', lastName: '', email: '', password: '', role: 'waiter', shift: 'Morning' });
                setEditingStaffId(null);
                setShowAddStaff(false);
                alert("Staff member updated successfully!");
            } catch (error: any) {
                console.error("Error updating staff: ", error);
                alert("Failed to update staff.");
            } finally {
                setIsLoading(false);
            }
            return;
        }

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
            const userFirestoreData = {
                firstName: newStaff.firstName,
                lastName: newStaff.lastName,
                email: newStaff.email,
                phone: "",
                role: "staff",
                profileImage: "",
                loyaltyPoints: 0,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                isVerified: false
            };

            const staffFirestoreData = {
                userId: uid,
                restaurantId: restaurantId,
                role: newStaff.role,
                permissions: ["user"],
                shift: newStaff.shift,
                salary: 0,
                status: "active",
                joinedAt: new Date().toISOString()
            };

            // Use setDoc with the UID to link Auth and Firestore (global user root)
            await setDoc(doc(db, 'users', uid), userFirestoreData);
            
            // Also store in restaurant subcollection
            await setDoc(doc(db, 'restaurants', restaurantId, 'staff', uid), staffFirestoreData);

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
            await deleteDoc(doc(db, 'restaurants', restaurantId, 'menu', id));
        }
    };

    // ─── Inventory Handlers ───────────────────────────────────────────────────

    const openAddInventory = () => {
        setInventoryMode('add');
        setEditingInventoryItem(null);
        setShowAddInventory(true);
    };

    const openEditInventory = (item: InventoryItem) => {
        setInventoryMode('edit');
        setEditingInventoryItem(item);
        setShowAddInventory(true);
    };

    const openRestockInventory = (item: InventoryItem) => {
        setInventoryMode('restock');
        setEditingInventoryItem(item);
        setShowAddInventory(true);
    };

    const handleAddInventory = async (data: any) => {
        if (!restaurantId) return;
        setIsInventoryLoading(true);
        try {
            await addInventoryItem(restaurantId, data);
            setShowAddInventory(false);
        } catch (e: any) {
            alert(e.message || 'Failed to add inventory item.');
        } finally {
            setIsInventoryLoading(false);
        }
    };

    const handleUpdateInventory = async (id: string, changes: any) => {
        if (!restaurantId) return;
        setIsInventoryLoading(true);
        try {
            await updateInventoryItem(restaurantId, id, changes);
            setShowAddInventory(false);
        } catch (e: any) {
            alert(e.message || 'Failed to update inventory item.');
        } finally {
            setIsInventoryLoading(false);
        }
    };

    const handleRestockInventory = async (id: string, currentQty: number, addQty: number) => {
        if (!restaurantId) return;
        setIsInventoryLoading(true);
        try {
            await restockInventoryItem(restaurantId, id, currentQty, addQty);
            setShowAddInventory(false);
        } catch (e: any) {
            alert(e.message || 'Failed to restock inventory item.');
        } finally {
            setIsInventoryLoading(false);
        }
    };

    const handleDeleteStaff = async (id) => {
        if (confirm('Are you sure you want to remove this staff member?')) {
            await deleteDoc(doc(db, 'restaurants', restaurantId, 'staff', id));
            await deleteDoc(doc(db, 'users', id)); // Optional: also remove from global collection
        }
    };

    const handleDeleteTable = async (id) => {
        if (confirm('Are you sure you want to delete this table?')) {
            await deleteDoc(doc(db, 'restaurants', restaurantId, 'tables', id));
        }
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
        // Enforce rigid subcollection security
        if (!restaurantId || restaurantId === 'DEFAULT_RESTAURANT') {
            alert("Security Error: No valid restaurant ID found for your user context.");
            return;
        }

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
            const tableRef = doc(collection(db, 'restaurants', restaurantId, 'tables'));
            const tableData = {
                tableId: tableRef.id,
                restaurantId: restaurantId,
                tableNumber: tableNum,
                capacity: parseInt(newTable.capacity),
                status: 'available',
                qrUrl: qrUrl,
                floor: 1,
                blueprintX: 0,
                blueprintY: 0,
                lastOccupiedAt: null
            };

            await setDoc(tableRef, tableData);

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
                        {logo.startsWith('http') || logo.startsWith('data:') ? (
                            <img src={logo} alt="Logo" className="w-10 h-10 object-cover rounded-full" />
                        ) : (
                            logo
                        )}
                    </span>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{restaurantName}</h1>
                </div>

                <div className="space-y-1 flex-1">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <SidebarItem icon={ChefHat} label="Kitchen Live" active={activeTab === 'kitchen'} onClick={() => setActiveTab('kitchen')} />
                    <SidebarItem icon={Grid} label="Tables" active={activeTab === 'tables'} onClick={() => setActiveTab('tables')} />
                    <SidebarItem icon={UtensilsCrossed} label="Menu" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
                    <SidebarItem icon={Boxes} label="Inventory" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
                    <SidebarItem icon={Users} label="Staff" active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} />
                    <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                    <SidebarItem icon={LogOut} label="Logout" active={false} onClick={handleLogout} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 mt-10" />
                </div>

                <div className="mt-auto">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 transition-colors duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                                {userProfile?.firstName?.charAt(0) || 'U'}{userProfile?.lastName?.charAt(0) || ''}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                                  {userProfile?.firstName || 'User'} {userProfile?.lastName || ''}
                                </p>
                                <p className="text-xs text-slate-500 capitalize">
                                  {userProfile?.role === 'restaurant_admin' ? 'Restaurant Admin' : userProfile?.role || 'Admin'}
                                </p>
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
                <Boxes onClick={() => setActiveTab('inventory')} className={activeTab === 'inventory' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
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
                            <TableList
                                tables={tables}
                                handleDeleteTable={handleDeleteTable}
                                setShowAddTable={setShowAddTable}
                                setNewTable={setNewTable}
                                newTable={newTable}
                            />
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
                                                <YAxis stroke="#64748b" />
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
                            <MenuList
                                menuItems={menuItems}
                                openEditMenu={openEditMenu}
                                handleDeleteMenu={handleDeleteMenu}
                                setShowAddMenu={setShowAddMenu}
                                setEditingId={setEditingId}
                                setNewMenuItem={setNewMenuItem}
                                openViewMenu={openViewMenu}
                            />
                        </motion.div>
                    )}

                    {/* INVENTORY TAB */}
                    {activeTab === 'inventory' && (
                        <motion.div
                            key="inventory"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            className="space-y-6"
                        >
                            {/* Summary cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                                        <Boxes size={22} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Items</p>
                                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{inventoryItems.length}</p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                                    <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                                        <ShoppingBag size={22} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock</p>
                                        <p className="text-2xl font-bold text-amber-500">
                                            {inventoryItems.filter(i => i.quantity <= i.threshold).length}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                                        <TrendingUp size={22} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Value</p>
                                        <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                            ₹{inventoryItems.reduce((sum, i) => sum + (i.quantity * i.costPerUnit), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Inventory table */}
                            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                                <InventoryList
                                    items={inventoryItems}
                                    onAdd={openAddInventory}
                                    onEdit={openEditInventory}
                                    onRestock={openRestockInventory}
                                />
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
                            <StaffList
                                chefs={chefs}
                                waiters={waiters}
                                cashiers={cashiers}
                                handleDeleteStaff={handleDeleteStaff}
                                setShowAddStaff={setShowAddStaff}
                                openEditStaff={openEditStaff}
                            />
                        </motion.div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="max-w-5xl"
                        >
                            <AdminSettings />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Modals */}
            <Modal isOpen={showViewMenu} onClose={() => {
                setShowViewMenu(false);
                setViewingItem(null);
            }} title="View Menu Item">
                <ViewMenuItem
                    item={viewingItem}
                    ingredients={viewingIngredients}
                    isLoading={isViewingLoading}
                />
            </Modal>

            <Modal isOpen={showAddMenu} onClose={() => {
                setShowAddMenu(false);
                setEditingId(null);
                setNewMenuItem({ name: '', price: '', image: null, category: 'Main Course', newCategory: '' });
                setMenuIngredientsForEdit([]);
            }} title={editingId ? "Edit Menu Item" : "Add New Menu Item"}>
                <AddMenuForm
                    newMenuItem={newMenuItem}
                    setNewMenuItem={setNewMenuItem}
                    handleAddMenu={handleAddMenu}
                    categories={categories}
                    isLoading={isLoading}
                    editingId={editingId}
                    inventoryItems={inventoryItems}
                    initialIngredients={menuIngredientsForEdit}
                />
            </Modal>

            <Modal isOpen={showAddStaff} onClose={() => {
                setShowAddStaff(false);
                setEditingStaffId(null);
                setNewStaff({ firstName: '', lastName: '', email: '', password: '', role: 'waiter', shift: 'Morning' });
            }} title={editingStaffId ? "Edit Staff Member" : "Add Staff Member"}>
                <AddStaffForm
                    newStaff={newStaff}
                    setNewStaff={setNewStaff}
                    handleAddStaff={handleAddStaff}
                    isLoading={isLoading}
                    editingStaffId={editingStaffId}
                />
            </Modal>

            {/* Add Table Modal */}
            <Modal isOpen={showAddTable} onClose={() => setShowAddTable(false)} title="Add New Table">
                <AddTableForm
                    newTable={newTable}
                    setNewTable={setNewTable}
                    handleAddTable={handleAddTable}
                />
            </Modal>

            {/* Inventory Modal */}
            <Modal
                isOpen={showAddInventory}
                onClose={() => { setShowAddInventory(false); setEditingInventoryItem(null); }}
                title={
                    inventoryMode === 'add' ? 'Add Inventory Item'
                    : inventoryMode === 'restock' ? `Restock — ${editingInventoryItem?.name}`
                    : `Edit — ${editingInventoryItem?.name}`
                }
            >
                <AddInventoryForm
                    mode={inventoryMode}
                    editingItem={editingInventoryItem}
                    isLoading={isInventoryLoading}
                    onAdd={handleAddInventory}
                    onUpdate={handleUpdateInventory}
                    onRestock={handleRestockInventory}
                />
            </Modal>
        </div>
    );
};

export default AdminDashboard;