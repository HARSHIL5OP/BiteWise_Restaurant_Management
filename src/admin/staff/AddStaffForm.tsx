import React from 'react';

const AddStaffForm = ({ newStaff, setNewStaff, handleAddStaff, isLoading, editingStaffId }: any) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    disabled={!!editingStaffId}
                    value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} />
            </div>
            {!editingStaffId && (
                <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Password</label>
                    <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                        type="password"
                        placeholder="••••••••"
                        value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} />
                </div>
            )}
            <button
                onClick={handleAddStaff}
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition mt-4 disabled:opacity-50 shadow-lg shadow-indigo-500/20 active:scale-95"
            >
                {isLoading ? 'Saving...' : (editingStaffId ? 'Update Staff' : 'Add Staff')}
            </button>
        </div>
    );
};

export default AddStaffForm;
