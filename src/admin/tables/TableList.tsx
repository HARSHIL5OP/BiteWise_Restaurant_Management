import React from 'react';
import { Plus, Grid, User, Clock, Trash2, Users, Download, Printer } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import RestaurantFloorBlueprint from '../../components/RestaurantFloorBlueprint';
import { toast } from 'sonner';

const TableList = ({ tables, handleDeleteTable, setShowAddTable, setNewTable, newTable, floors, selectedFloor, setSelectedFloor, restaurantId }: any) => {
    const filteredTables = tables.filter((t: any) => (parseInt(t.floor) || 0) === selectedFloor);

    const updateTableStatus = async (tableId: string, newStatus: string) => {
        if (!restaurantId || !tableId) return;
        try {
            await updateDoc(doc(db, 'restaurants', restaurantId, 'tables', tableId), {
                status: newStatus
            });
            toast.success(`Table status updated to ${newStatus}`);
        } catch (error) {
            console.error("Error updating table status:", error);
            toast.error("Failed to update status");
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Table Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and monitor all tables across floors</p>
                </div>
                <button
                    onClick={() => {
                        // Logic based on selected floor
                        const floorTables = tables.filter((t: any) => (parseInt(t.floor) || 0) === selectedFloor);
                        let nextTableNum = '';
                        if (selectedFloor === 0) {
                            const maxNum = floorTables.reduce((max: number, t: any) => Math.max(max, parseInt(t.tableNumber) || 0), 0);
                            nextTableNum = (maxNum + 1).toString();
                        } else {
                            const prefix = selectedFloor * 100;
                            const suffixes = floorTables.map((t: any) => parseInt(t.tableNumber) % 100);
                            const maxSuffix = suffixes.length > 0 ? Math.max(...suffixes, 0) : 0;
                            nextTableNum = (prefix + maxSuffix + 1).toString();
                        }
                        
                        setNewTable({ ...newTable, floor: selectedFloor.toString(), tableNumber: nextTableNum, capacity: '4' });
                        setShowAddTable(true);
                    }}
                    className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 min-h-[44px]"
                >
                    <Plus size={20} /> Add Table
                </button>
            </div>

            {/* Floor Selector Tabs */}
            <div className="mt-8 flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
                {Array.from({ length: floors }).map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setSelectedFloor(idx)}
                        className={`
                            px-6 py-2 rounded-lg text-sm font-bold transition-all
                            ${selectedFloor === idx 
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }
                        `}
                    >
                        {idx === 0 ? 'Ground Floor' : `Floor ${idx}`}
                    </button>
                ))}
            </div>

            {/* Table Stats (Filtered for current floor) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4 shadow-sm dark:shadow-none">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Grid size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Floor Tables</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{filteredTables.length}</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4 shadow-sm dark:shadow-none">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <div className="w-6 h-6 rounded-full border-2 border-emerald-400 dark:border-emerald-400/50" />
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Available</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{filteredTables.filter((t: any) => t.status === 'available').length}</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4 shadow-sm dark:shadow-none">
                    <div className="p-3 bg-rose-50 dark:bg-red-500/10 rounded-lg text-rose-600 dark:text-red-400">
                        <User size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Occupied</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{filteredTables.filter((t: any) => t.status === 'occupied').length}</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4 shadow-sm dark:shadow-none">
                    <div className="p-3 bg-amber-50 dark:bg-orange-500/10 rounded-lg text-amber-600 dark:text-orange-400">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Reserved</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{filteredTables.filter((t: any) => t.status === 'reserved').length}</h3>
                    </div>
                </div>
            </div>

            {/* Table Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                {filteredTables.map((table: any) => (
                    // ... existing item card mapping ...
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
                            <select
                                value={table.status}
                                onChange={(e) => updateTableStatus(table.id, e.target.value)}
                                className={`
                                    appearance-none cursor-pointer outline-none px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                    ${table.status === 'available' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : ''}
                                    ${table.status === 'occupied' ? 'bg-rose-100 text-rose-600 dark:bg-red-500 dark:text-white' : ''}
                                    ${table.status === 'reserved' ? 'bg-amber-100 text-amber-600 dark:bg-orange-500 dark:text-white' : ''}
                                `}
                            >
                                <option value="available">Available</option>
                                <option value="occupied">Occupied</option>
                                <option value="reserved">Reserved</option>
                            </select>
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
                                    printWindow?.document.write(`
                                        <html>
                                            <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
                                                <h1>Table ${table.tableNumber}</h1>
                                                <img src="${table.qrUrl}" width="300" />
                                                <p>Scan to Order</p>
                                            </body>
                                        </html>
                                    `);
                                    printWindow?.document.close();
                                    printWindow?.print();
                                }}
                                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <Printer size={14} /> Print
                            </button>
                        </div>
                    </div>
                ))}
                {filteredTables.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <Grid size={48} className="mb-4 opacity-20" />
                        <p className="font-bold">No tables on this floor yet</p>
                        <button 
                            onClick={() => setShowAddTable(true)}
                            className="mt-4 text-indigo-600 font-bold hover:underline"
                        >
                            Add your first table for {selectedFloor === 0 ? 'Ground Floor' : `Floor ${selectedFloor}`}
                        </button>
                    </div>
                )}
            </div>

            {/* Floor Plan Blueprint */}
            <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Floor Blueprint</h3>
                    <p className="text-sm text-slate-500">Visual layout of tables for {selectedFloor === 0 ? 'Ground Floor' : `Floor ${selectedFloor}`}</p>
                </div>
                <RestaurantFloorBlueprint tables={filteredTables} />
            </div>
        </div>
    );
};

export default TableList;
