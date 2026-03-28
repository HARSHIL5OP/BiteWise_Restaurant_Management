import React from 'react';
import { Plus, Grid, User, Clock, Trash2, Users, Download, Printer } from 'lucide-react';
import RestaurantFloorBlueprint from '../../components/RestaurantFloorBlueprint';

const TableList = ({ tables, handleDeleteTable, setShowAddTable, setNewTable, newTable }: any) => {
    return (
        <div>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Table Management</h1>
                <button
                    onClick={() => {
                        const maxNum = tables.reduce((max: number, t: any) => Math.max(max, parseInt(t.tableNumber) || 0), 0);
                        setNewTable({ ...newTable, tableNumber: (maxNum + 1).toString(), capacity: '4' });
                        setShowAddTable(true);
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95"
                >
                    <Plus size={20} /> Add Table
                </button>
            </div>

            {/* Table Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
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
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{tables.filter((t: any) => t.status === 'available').length}</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4 transition-colors duration-300 shadow-sm dark:shadow-none">
                    <div className="p-3 bg-rose-50 dark:bg-red-500/10 rounded-lg text-rose-600 dark:text-red-400">
                        <User size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Occupied</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{tables.filter((t: any) => t.status === 'occupied').length}</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4 transition-colors duration-300 shadow-sm dark:shadow-none">
                    <div className="p-3 bg-amber-50 dark:bg-orange-500/10 rounded-lg text-amber-600 dark:text-orange-400">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Reserved</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{tables.filter((t: any) => t.status === 'reserved').length}</h3>
                    </div>
                </div>
            </div>

            {/* Table Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                {tables.map((table: any) => (
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
            </div>

            {/* Floor Plan Blueprint */}
            <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8">
                <RestaurantFloorBlueprint tables={tables} />
            </div>
        </div>
    );
};

export default TableList;
