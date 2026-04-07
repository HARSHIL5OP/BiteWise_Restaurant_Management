import React, { useState } from 'react';
import { Users, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';

// Static blueprint data defining positions
const BLUEPRINT_LAYOUT = [
    // Window side - 2 seaters
    { tableId: "T1", capacity: 2, position: { x: 50, y: 80 } },
    { tableId: "T2", capacity: 2, position: { x: 50, y: 200 } },
    { tableId: "T3", capacity: 2, position: { x: 50, y: 320 } },
    { tableId: "T4", capacity: 2, position: { x: 50, y: 440 } },

    // Middle section - 4 seaters
    { tableId: "T5", capacity: 4, position: { x: 200, y: 80 } },
    { tableId: "T6", capacity: 4, position: { x: 200, y: 220 } },
    { tableId: "T7", capacity: 4, position: { x: 200, y: 360 } },

    { tableId: "T8", capacity: 4, position: { x: 380, y: 80 } },
    { tableId: "T9", capacity: 4, position: { x: 380, y: 220 } },
    { tableId: "T10", capacity: 4, position: { x: 380, y: 360 } },

    // Right side - 4 seaters
    { tableId: "T11", capacity: 4, position: { x: 560, y: 80 } },
    { tableId: "T12", capacity: 4, position: { x: 560, y: 220 } },
    { tableId: "T13", capacity: 4, position: { x: 560, y: 360 } },

    // Back corner - 6 seaters
    { tableId: "T14", capacity: 6, position: { x: 740, y: 140 } },
    { tableId: "T15", capacity: 6, position: { x: 740, y: 320 } },

    // VIP Section - 8 seater
    { tableId: "T16", capacity: 8, position: { x: 380, y: 500 } },
];

const RestaurantFloorBlueprint = ({ tables: propTables = [], isCustomerView = false, onBookTable }: any) => {
    const { theme } = useTheme();
    const [selectedTable, setSelectedTable] = useState<any>(null);
    const [hoveredTable, setHoveredTable] = useState(null);

    // Merge propTables with BLUEPRINT_LAYOUT
    const tables = React.useMemo(() => {
        if (!propTables || propTables.length === 0) {
            return BLUEPRINT_LAYOUT.map(t => ({ ...t, status: 'available' }));
        }

        return propTables.map(realTable => {
            const tableId = `T${realTable.tableNumber}`;
            const layout = BLUEPRINT_LAYOUT.find(l => l.tableId === tableId);

            return {
                ...realTable,
                tableId: tableId,
                // Fallback to coordinates from db if layout isn't found
                position: layout ? layout.position : { 
                    x: realTable.blueprintX !== undefined ? realTable.blueprintX : 50, 
                    y: realTable.blueprintY !== undefined ? realTable.blueprintY : 50 
                },
                capacity: realTable.capacity || (layout ? layout.capacity : 4)
            };
        });
    }, [propTables]);

    const getStatusColor = (status) => {
        if (theme === 'dark') {
            if (status === 'available') return { table: '#ffffff', chair: '#e2e8f0', border: '#cbd5e1' };
            if (status === 'reserved') return { table: '#fed7aa', chair: '#fdba74', border: '#fb923c' };
            if (status === 'occupied') return { table: '#fecaca', chair: '#fca5a5', border: '#f87171' };
            return { table: '#ffffff', chair: '#e2e8f0', border: '#cbd5e1' };
        } else {
            // Light mode colors
            if (status === 'available') return { table: '#f8fafc', chair: '#cbd5e1', border: '#94a3b8' }; // Off-white table, grey chairs
            if (status === 'reserved') return { table: '#fff7ed', chair: '#fdba74', border: '#f97316' }; // Orange tint
            if (status === 'occupied') return { table: '#fef2f2', chair: '#fca5a5', border: '#ef4444' }; // Red tint
            return { table: '#f8fafc', chair: '#cbd5e1', border: '#94a3b8' };
        }
    };

    const getSelectedColor = () => ({ table: '#3b82f6', chair: '#60a5fa', border: '#2563eb' });

    const handleTableClick = (table: any) => {
        if (table.status === 'available') {
            setSelectedTable(selectedTable?.tableId === table.tableId ? null : table);
        } else if (isCustomerView) {
            toast.error("This table is currently not available.");
        }
    };

    const getStatusText = (status) => {
        if (status === 'available') return 'Available';
        if (status === 'reserved') return 'Reserved';
        if (status === 'occupied') return 'Occupied';
        return status;
    };

    const getStatusBadgeColor = (status) => {
        if (status === 'available') return 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20';
        if (status === 'reserved') return 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-500/20';
        if (status === 'occupied') return 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/20';
        return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400 border-gray-300 dark:border-slate-700';
    };

    // Component to render table with chairs
    const TableWithChairs = ({ table }) => {
        const isHovered = hoveredTable?.tableId === table.tableId;
        const isSelected = selectedTable?.tableId === table.tableId;
        const isClickable = table.status === 'available';
        const colors = isSelected ? getSelectedColor() : getStatusColor(table.status);

        const renderChairs = () => {
            const chairs = [];
            const chairSize = 16;
            const spacing = 8;

            // Helper to create chair div
            const Chair = ({ style, keyVal }) => (
                <div key={keyVal} className="absolute" style={style}>
                    <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                </div>
            );

            if (table.capacity === 2) {
                chairs.push(
                    <Chair keyVal="top" style={{ left: '50%', top: -spacing - chairSize, transform: 'translateX(-50%)' }} />,
                    <Chair keyVal="bottom" style={{ left: '50%', bottom: -spacing - chairSize, transform: 'translateX(-50%)' }} />
                );
            } else if (table.capacity === 4) {
                chairs.push(
                    <Chair keyVal="top" style={{ left: '50%', top: -spacing - chairSize, transform: 'translateX(-50%)' }} />,
                    <Chair keyVal="bottom" style={{ left: '50%', bottom: -spacing - chairSize, transform: 'translateX(-50%)' }} />,
                    <Chair keyVal="left" style={{ left: -spacing - chairSize, top: '50%', transform: 'translateY(-50%)' }} />,
                    <Chair keyVal="right" style={{ right: -spacing - chairSize, top: '50%', transform: 'translateY(-50%)' }} />
                );
            } else if (table.capacity === 6) {
                chairs.push(
                    <Chair keyVal="top1" style={{ left: '30%', top: -spacing - chairSize, transform: 'translateX(-50%)' }} />,
                    <Chair keyVal="top2" style={{ left: '70%', top: -spacing - chairSize, transform: 'translateX(-50%)' }} />,
                    <Chair keyVal="bottom1" style={{ left: '30%', bottom: -spacing - chairSize, transform: 'translateX(-50%)' }} />,
                    <Chair keyVal="bottom2" style={{ left: '70%', bottom: -spacing - chairSize, transform: 'translateX(-50%)' }} />,
                    <Chair keyVal="left" style={{ left: -spacing - chairSize, top: '50%', transform: 'translateY(-50%)' }} />,
                    <Chair keyVal="right" style={{ right: -spacing - chairSize, top: '50%', transform: 'translateY(-50%)' }} />
                );
            } else if (table.capacity === 8) {
                chairs.push(
                    <Chair keyVal="top" style={{ left: '50%', top: -spacing - chairSize, transform: 'translateX(-50%)' }} />,
                    <Chair keyVal="bottom" style={{ left: '50%', bottom: -spacing - chairSize, transform: 'translateX(-50%)' }} />,
                    <Chair keyVal="left1" style={{ left: -spacing - chairSize, top: '25%', transform: 'translateY(-50%)' }} />,
                    <Chair keyVal="left2" style={{ left: -spacing - chairSize, top: '50%', transform: 'translateY(-50%)' }} />,
                    <Chair keyVal="left3" style={{ left: -spacing - chairSize, top: '75%', transform: 'translateY(-50%)' }} />,
                    <Chair keyVal="right1" style={{ right: -spacing - chairSize, top: '25%', transform: 'translateY(-50%)' }} />,
                    <Chair keyVal="right2" style={{ right: -spacing - chairSize, top: '50%', transform: 'translateY(-50%)' }} />,
                    <Chair keyVal="right3" style={{ right: -spacing - chairSize, top: '75%', transform: 'translateY(-50%)' }} />
                );
            }
            return chairs;
        };

        const tableSize = table.capacity === 2 ? 50 : table.capacity === 4 ? 70 : table.capacity === 6 ? 90 : 120;
        const tableHeight = table.capacity === 8 ? 70 : tableSize;

        return (
            <div
                className="absolute"
                style={{
                    left: `${table.position.x}px`,
                    top: `${table.position.y}px`,
                }}
            >
                <div
                    className={`relative transition-all duration-300 ease-out ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                        } ${isHovered && isClickable ? 'scale-110 -translate-y-1' : ''} ${isSelected ? 'scale-105' : ''}`}
                    onClick={() => handleTableClick(table)}
                    onMouseEnter={() => setHoveredTable(table)}
                    onMouseLeave={() => setHoveredTable(null)}
                >
                    {/* Chairs */}
                    {renderChairs()}

                    {/* Table Surface */}
                    <div
                        className="relative flex flex-col items-center justify-center rounded-2xl shadow-lg transition-all duration-300"
                        style={{
                            width: `${tableSize}px`,
                            height: `${tableHeight}px`,
                            backgroundColor: colors.table,
                            border: `3px solid ${colors.border}`,
                            boxShadow: isHovered ? '0 10px 30px rgba(0,0,0,0.2)' : '0 4px 15px rgba(0,0,0,0.1)',
                        }}
                    >
                        {/* Table Number */}
                        <div className={`text-sm font-bold transition-colors ${isSelected ? 'text-white' : (theme === 'dark' ? 'text-slate-800' : 'text-slate-700')}`}>
                            T-{table.tableNumber}
                        </div>

                        {/* Capacity */}
                        <div className={`flex items-center gap-1 text-xs font-medium transition-colors ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                            <Users className="w-3 h-3" />
                            <span>{table.capacity}</span>
                        </div>

                        {/* Selection Ring */}
                        {isSelected && (
                            <div className="absolute inset-0 rounded-2xl border-4 border-blue-400 animate-pulse" style={{ borderColor: '#60a5fa' }}></div>
                        )}
                    </div>

                    {/* Hover Tooltip */}
                    {isHovered && (
                        <div className="absolute left-1/2 -translate-x-1/2 -top-20 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="px-4 py-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 min-w-[140px]">
                                <div className="text-sm font-bold mb-1">T-{table.tableNumber}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-300 mb-2">Capacity: {table.capacity} guests</div>
                                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border ${getStatusBadgeColor(table.status)
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${table.status === 'available' ? 'bg-emerald-500' :
                                        table.status === 'reserved' ? 'bg-orange-500' :
                                            'bg-red-500'
                                        }`}></div>
                                    {getStatusText(table.status)}
                                </div>
                                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-700 rotate-45"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const availableCount = tables.filter(t => t.status === 'available').length;
    const reservedCount = tables.filter(t => t.status === 'reserved').length;
    const occupiedCount = tables.filter(t => t.status === 'occupied').length;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 p-6 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Restaurant Floor Plan</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Select an available table to proceed</p>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-3">
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                                <div className="text-xs text-slate-500 mb-0.5">Available</div>
                                <div className="text-2xl font-bold text-emerald-500">{availableCount}</div>
                            </div>
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                                <div className="text-xs text-slate-500 mb-0.5">Reserved</div>
                                <div className="text-2xl font-bold text-orange-500">{reservedCount}</div>
                            </div>
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                                <div className="text-xs text-slate-500 mb-0.5">Occupied</div>
                                <div className="text-2xl font-bold text-red-500">{occupiedCount}</div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-6 px-6 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 w-fit transition-colors">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-white dark:bg-white border-2 border-slate-300 rounded shadow-sm"></div>
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded shadow-sm"></div>
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Reserved</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded shadow-sm"></div>
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Occupied</span>
                        </div>
                    </div>
                </div>

                {/* Floor Blueprint */}
                <div className="bg-slate-100 dark:bg-slate-900/50 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 relative overflow-hidden transition-colors">
                    {/* Floor Pattern */}
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                        style={{
                            backgroundImage: `repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 40px),
                                    repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 40px)`
                        }}>
                    </div>
                    {/* Dark mode pattern overrides */}
                    <div className="absolute inset-0 opacity-0 dark:opacity-[0.05] pointer-events-none transition-opacity"
                        style={{
                            backgroundImage: `repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px),
                                    repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)`
                        }}>
                    </div>

                    {/* Restaurant Layout */}
                    <div className="relative" style={{ height: '650px' }}>
                        {/* Area Labels */}
                        <div className="absolute top-0 left-0 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Window Side</span>
                        </div>
                        <div className="absolute top-0 right-0 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Premium Corner</span>
                        </div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50 shadow-sm">
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-500">VIP Section</span>
                        </div>

                        {/* Tables with Chairs */}
                        {tables.length > 0 ? tables.map((table) => (
                            <TableWithChairs key={table.tableId} table={table} />
                        )) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                                <p>No tables configured for floor plan view.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected Table Info */}
                {selectedTable && (
                    <div className="mt-6 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl border border-blue-500 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                                        <span className="text-2xl font-bold">T-{selectedTable.tableNumber}</span>
                                    </div>
                                    <div>
                                        <div className="text-sm opacity-90 mb-1">Selected Table</div>
                                        <div className="text-2xl font-bold">{selectedTable.capacity} Guests</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        if (isCustomerView && onBookTable) {
                                            onBookTable(selectedTable);
                                            setSelectedTable(null);
                                        } else {
                                            toast.success("Table Booking Flow Coming Soon!");
                                        }
                                    }}
                                    className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                                >
                                    Proceed to Book
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
        </div>
    );
};

export default RestaurantFloorBlueprint;
