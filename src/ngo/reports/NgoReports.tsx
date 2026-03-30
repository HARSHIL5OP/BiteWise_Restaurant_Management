import React from 'react';
import { Target, TrendingUp, PieChart, Activity } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';

const monthlyDonations = [
    { name: 'Jan', donations: 30 },
    { name: 'Feb', donations: 45 },
    { name: 'Mar', donations: 120 },
    { name: 'Apr', donations: 65 },
    { name: 'May', donations: 80 },
    { name: 'Jun', donations: 100 }
];

const foodTypeData = [
    { name: 'Cooked Food', value: 300, fill: '#6366f1' },
    { name: 'Packaged Food', value: 150, fill: '#10b981' },
    { name: 'Raw Ingredients', value: 80, fill: '#f59e0b' }
];

const StatBadge = ({ icon: Icon, label, value, trend, trendLabel }: any) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
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
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatBadge icon={Target} label="Total Donations" value="1,240 lbs" trend="+12%" trendLabel="compared to last month" />
                <StatBadge icon={PieChart} label="Packaged Meals" value="845" trend="+5%" trendLabel="compared to last month" />
                <StatBadge icon={Activity} label="Active Restaurants" value="12" trend="+2" trendLabel="new partners joined" />
                <StatBadge icon={TrendingUp} label="People Served" value="3,150" trend="+18%" trendLabel="surpassed monthly goal" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Trends Area Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Donations Trend (2026)</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyDonations} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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

                {/* Food Type Bar Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Food Type Breakdown</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={foodTypeData} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.3} />
                                <XAxis type="number" stroke="#64748b" axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} width={120} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(51, 65, 85, 0.4)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {foodTypeData.map((entry, index) => (
                                        <cell key={`cell-${index}`} fill={entry.fill} />
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
