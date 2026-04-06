import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, PieChart, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';

interface Donation {
    id: string;
    restaurantId: string;
    foodType?: string;
    quantity: string;
    pickupTime: any;
    status: string;
    createdAt: any;
}

const StatBadge = ({ icon: Icon, label, value, trend, trendLabel }: any) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all text-left">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Icon size={24} />
            </div>
            {trend && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                    <TrendingUp size={12} /> {trend}
                </span>
            )}
        </div>
        <div>
            <p className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{value}</p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</p>
            {trendLabel && <p className="text-xs text-slate-400 mt-2">{trendLabel}</p>}
        </div>
    </div>
);

const NgoReports = () => {
    const { userProfile } = useAuth();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [typeData, setTypeData] = useState<any[]>([]);
    const [activeRestoshit, setActiveRestoshit] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            if (!userProfile?.ngoId) return;
            try {
                const q = query(
                    collection(db, 'food_donations'),
                    where('ngoId', '==', userProfile.ngoId)
                );
                const snap = await getDocs(q);
                const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Donation[];
                setDonations(data);

                // Group by Month
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthlyMap: Record<string, number> = {};
                months.forEach(m => monthlyMap[m] = 0);

                data.forEach(d => {
                    const date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
                    const monthName = months[date.getMonth()];
                    monthlyMap[monthName]++;
                });

                setMonthlyData(months.map(m => ({ name: m, donations: monthlyMap[m] })));

                // Group by Type
                const typeMap: Record<string, number> = {
                    'Cooked': 0,
                    'Packaged': 0,
                    'Raw': 0,
                    'Other': 0
                };

                data.forEach(d => {
                    const type = d.foodType || 'Other';
                    if (typeMap[type] !== undefined) typeMap[type]++;
                    else typeMap['Other']++;
                });

                setTypeData([
                    { name: 'Cooked', value: typeMap['Cooked'], fill: '#6366f1' },
                    { name: 'Packaged', value: typeMap['Packaged'], fill: '#10b981' },
                    { name: 'Raw', value: typeMap['Raw'], fill: '#f59e0b' },
                    { name: 'Other', value: typeMap['Other'], fill: '#64748b' }
                ]);

                // Count unique restaurants
                const uniqueRestos = new Set(data.map(d => d.restaurantId));
                setActiveRestoshit(uniqueRestos.size);

            } catch (error) {
                console.error("Failed to fetch reports data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userProfile?.ngoId]);

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    const completedDonations = donations.filter(d => d.status === 'completed').length;

    return (
        <div className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-left">
                <StatBadge icon={Target} label="Completed Donations" value={completedDonations} trendLabel="All-time goal tracking" />
                <StatBadge icon={PieChart} label="Total Requests" value={donations.length} trendLabel="Including pending & cancelled" />
                <StatBadge icon={Activity} label="Active Partners" value={activeRestoshit} trendLabel="Restaurants you've worked with" />
                <StatBadge icon={TrendingUp} label="Total Volume" value={donations.length > 0 ? "Active" : "None"} trendLabel="Donation rescue health" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 md:mb-6">Donations Trend ({new Date().getFullYear()})</h3>
                    <div className="h-56 md:h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="donations" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDonations)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 md:mb-6">Food Type Breakdown</h3>
                    <div className="h-56 md:h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={typeData} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.3} />
                                <XAxis type="number" stroke="#64748b" axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} width={100} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(51, 65, 85, 0.4)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {typeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NgoReports;
