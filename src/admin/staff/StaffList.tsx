import React from 'react';
import { ChefHat, User, DollarSign, X, Plus } from 'lucide-react';

const StaffList = ({ chefs, waiters, cashiers, handleDeleteStaff, setShowAddStaff }: any) => {
    return (
        <div>
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
                            {group.data.map((member: any) => (
                                <div key={member.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4 hover:border-indigo-500/30 hover:shadow-md transition-all">
                                    <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}&background=random`} alt={member.name} className="w-12 h-12 rounded-full ring-2 ring-slate-100 dark:ring-slate-800" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">{member.firstName} {member.lastName}</h4>
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
        </div>
    );
};

export default StaffList;
