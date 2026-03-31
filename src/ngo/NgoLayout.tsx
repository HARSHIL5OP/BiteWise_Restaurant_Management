import React, { useState, useEffect } from 'react';
import { LayoutDashboard, HandHeart, FileBarChart, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import NgoDashboard from './dashboard/NgoDashboard';
import RequestList from './requests/RequestList';
import NgoReports from './reports/NgoReports';
import NgoSettings from './settings/NgoSettings';

const SidebarItem = ({ icon: Icon, label, active, onClick, className = "" }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
            active
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
        } ${className}`}
    >
        <Icon size={20} className={`${active ? 'text-white' : 'text-slate-400'} transition-colors duration-300`} />
        <span className="font-medium text-sm">{label}</span>
    </button>
);

const NgoLayout = () => {
    const { logout, userProfile } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col z-40 lg:flex hidden transition-colors duration-300">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <span className="text-3xl bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500 font-bold drop-shadow-sm">
                        🤝
                    </span>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">NGO Portal</h1>
                </div>

                <div className="space-y-1 flex-1">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <SidebarItem icon={HandHeart} label="Requests" active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} />
                    <SidebarItem icon={FileBarChart} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                    <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                    
                    <SidebarItem icon={LogOut} label="Logout" active={false} onClick={handleLogout} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 mt-10" />
                </div>

                <div className="mt-auto">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 transition-colors duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-md uppercase">
                                {userProfile?.firstName?.charAt(0) || 'N'}{userProfile?.lastName?.charAt(0) || ''}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate uppercase tracking-tight">
                                    {userProfile?.ngoName || 'NGO Partner'}
                                </p>
                                <p className="text-xs text-slate-500 truncate capitalize">
                                    {userProfile?.firstName} {userProfile?.lastName}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-4 flex justify-around z-50">
                <LayoutDashboard onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                <HandHeart onClick={() => setActiveTab('requests')} className={activeTab === 'requests' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                <FileBarChart onClick={() => setActiveTab('reports')} className={activeTab === 'reports' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                <Settings onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
            </div>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 p-8 overflow-y-auto pb-24 lg:pb-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize tracking-tight">{activeTab}</h2>
                        <p className="text-slate-500 text-sm">Manage your food rescue operations.</p>
                    </div>
                </header>

                <div>
                    {activeTab === 'dashboard' && <NgoDashboard />}
                    {activeTab === 'requests' && <RequestList />}
                    {activeTab === 'reports' && <NgoReports />}
                    {activeTab === 'settings' && <NgoSettings />}
                </div>
            </main>
        </div>
    );
};

export default NgoLayout;
