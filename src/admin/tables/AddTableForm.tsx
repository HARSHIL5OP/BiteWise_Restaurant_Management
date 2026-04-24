import React from 'react';

const AddTableForm = ({ newTable, setNewTable, handleAddTable, floors, tables }: any) => {
    const handleFloorChange = (floor: number) => {
        const floorTables = tables.filter((t: any) => parseInt(t.floor) === floor);
        let nextTableNum = '';

        if (floor === 0) {
            const maxNum = floorTables.reduce((max: number, t: any) => Math.max(max, parseInt(t.tableNumber) || 0), 0);
            nextTableNum = (maxNum + 1).toString();
        } else {
            const prefix = floor * 100;
            const suffixes = floorTables.map((t: any) => parseInt(t.tableNumber) % 100);
            const maxSuffix = suffixes.length > 0 ? Math.max(...suffixes, 0) : 0;
            nextTableNum = (prefix + maxSuffix + 1).toString();
        }

        setNewTable({ ...newTable, floor: floor.toString(), tableNumber: nextTableNum });
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 transition-colors">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://bitewise-srms.vercel.app/home/${newTable.tableNumber || ''}`}
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
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Select Floor</label>
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: floors }).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleFloorChange(idx)}
                            className={`px-4 py-2 rounded-lg font-bold border transition-all ${parseInt(newTable.floor) === idx
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-500 dark:hover:border-slate-600 hover:text-indigo-600 dark:hover:text-white'
                                }`}
                        >
                            {idx === 0 ? 'Ground' : `Floor ${idx}`}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Table Number (Auto-generated)</label>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
    );
};

export default AddTableForm;
