import React, { useState } from 'react';
import { Users, Info } from 'lucide-react';

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

const RestaurantFloorBlueprint = ({ tables: propTables = [] }) => {
    const [selectedTable, setSelectedTable] = useState(null);
    const [hoveredTable, setHoveredTable] = useState(null);

    // Merge propTables with BLUEPRINT_LAYOUT
    // We map propTables (real data) to the blueprint layout positions
    const tables = React.useMemo(() => {
        // If no props passed (standalone usage), return mock blueprint
        if (!propTables || propTables.length === 0) {
            // Return layout with default status for preview
            return BLUEPRINT_LAYOUT.map(t => ({ ...t, status: 'available' }));
        }

        // Map real tables to layout
        return propTables.map(realTable => {
            // Find corresponding layout position by ID
            // Assuming tableNumber 1 -> T1
            const tableId = `T${realTable.tableNumber}`;
            const layout = BLUEPRINT_LAYOUT.find(l => l.tableId === tableId);

            if (layout) {
                return {
                    ...realTable,
                    ...layout,
                    // Prefer real data capacity if available, else layout capacity
                    capacity: realTable.capacity || layout.capacity,
                    // Use real tableId string for display
                    tableId: tableId
                };
            }
            return null;
        }).filter(Boolean);
    }, [propTables]);

    const getStatusColor = (status) => {
        if (status === 'available') return { table: '#ffffff', chair: '#e2e8f0', border: '#cbd5e1' };
        if (status === 'reserved') return { table: '#fed7aa', chair: '#fdba74', border: '#fb923c' };
        if (status === 'occupied') return { table: '#fecaca', chair: '#fca5a5', border: '#f87171' };
        return { table: '#ffffff', chair: '#e2e8f0', border: '#cbd5e1' }; // Default
    };

    const getSelectedColor = () => ({ table: '#3b82f6', chair: '#60a5fa', border: '#2563eb' });

    const handleTableClick = (table) => {
        if (table.status === 'available') {
            setSelectedTable(selectedTable?.tableId === table.tableId ? null : table);
        }
    };

    const getStatusText = (status) => {
        if (status === 'available') return 'Available';
        if (status === 'reserved') return 'Reserved';
        if (status === 'occupied') return 'Occupied';
        return status;
    };

    const getStatusBadgeColor = (status) => {
        if (status === 'available') return 'bg-emerald-100 text-emerald-700 border-emerald-300';
        if (status === 'reserved') return 'bg-orange-100 text-orange-700 border-orange-300';
        if (status === 'occupied') return 'bg-red-100 text-red-700 border-red-300';
        return 'bg-gray-100 text-gray-700 border-gray-300';
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

            if (table.capacity === 2) {
                // 2 chairs - top and bottom
                chairs.push(
                    <div key="top" className="absolute" style={{ left: '50%', top: -spacing - chairSize, transform: 'translateX(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="bottom" className="absolute" style={{ left: '50%', bottom: -spacing - chairSize, transform: 'translateX(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>
                );
            } else if (table.capacity === 4) {
                // 4 chairs - all sides
                chairs.push(
                    <div key="top" className="absolute" style={{ left: '50%', top: -spacing - chairSize, transform: 'translateX(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="bottom" className="absolute" style={{ left: '50%', bottom: -spacing - chairSize, transform: 'translateX(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="left" className="absolute" style={{ left: -spacing - chairSize, top: '50%', transform: 'translateY(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="right" className="absolute" style={{ right: -spacing - chairSize, top: '50%', transform: 'translateY(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>
                );
            } else if (table.capacity === 6) {
                // 6 chairs - 2 on each side
                chairs.push(
                    <div key="top1" className="absolute" style={{ left: '30%', top: -spacing - chairSize, transform: 'translateX(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="top2" className="absolute" style={{ left: '70%', top: -spacing - chairSize, transform: 'translateX(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="bottom1" className="absolute" style={{ left: '30%', bottom: -spacing - chairSize, transform: 'translateX(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="bottom2" className="absolute" style={{ left: '70%', bottom: -spacing - chairSize, transform: 'translateX(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="left" className="absolute" style={{ left: -spacing - chairSize, top: '50%', transform: 'translateY(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="right" className="absolute" style={{ right: -spacing - chairSize, top: '50%', transform: 'translateY(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>
                );
            } else if (table.capacity === 8) {
                // 8 chairs - 3 on long sides, 1 on short sides
                // Note: User code had unique positioning for 8
                chairs.push(
                    <div key="top" className="absolute" style={{ left: '50%', top: -spacing - chairSize, transform: 'translateX(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="bottom" className="absolute" style={{ left: '50%', bottom: -spacing - chairSize, transform: 'translateX(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="left1" className="absolute" style={{ left: -spacing - chairSize, top: '25%', transform: 'translateY(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="left2" className="absolute" style={{ left: -spacing - chairSize, top: '50%', transform: 'translateY(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="left3" className="absolute" style={{ left: -spacing - chairSize, top: '75%', transform: 'translateY(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="right1" className="absolute" style={{ right: -spacing - chairSize, top: '25%', transform: 'translateY(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="right2" className="absolute" style={{ right: -spacing - chairSize, top: '50%', transform: 'translateY(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>,
                    <div key="right3" className="absolute" style={{ right: -spacing - chairSize, top: '75%', transform: 'translateY(-50%)' }}>
                        <div style={{ width: chairSize, height: chairSize, backgroundColor: colors.chair, borderRadius: '4px', border: `2px solid ${colors.border}` }} />
                    </div>
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
                        <div className={`text-sm font-bold transition-colors ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                            {table.tableId}
                        </div>

                        {/* Capacity */}
                        <div className={`flex items-center gap-1 text-xs font-medium transition-colors ${isSelected ? 'text-white/90' : 'text-slate-600'
                            }`}>
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
                            <div className="px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 min-w-[140px]">
                                <div className="text-sm font-bold mb-1">{table.tableId}</div>
                                <div className="text-xs text-slate-300 mb-2">Capacity: {table.capacity} guests</div>
                                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border ${getStatusBadgeColor(table.status)
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${table.status === 'available' ? 'bg-emerald-500' :
                                        table.status === 'reserved' ? 'bg-orange-500' :
                                            'bg-red-500'
                                        }`}></div>
                                    {getStatusText(table.status)}
                                </div>
                                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
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
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">Restaurant Floor Plan</h1>
                            <p className="text-sm text-slate-400">Select an available table to proceed</p>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-3">
                            <div className="px-4 py-2 bg-slate-900 rounded-xl shadow-sm border border-slate-800">
                                <div className="text-xs text-slate-500 mb-0.5">Available</div>
                                <div className="text-2xl font-bold text-emerald-500">{availableCount}</div>
                            </div>
                            <div className="px-4 py-2 bg-slate-900 rounded-xl shadow-sm border border-slate-800">
                                <div className="text-xs text-slate-500 mb-0.5">Reserved</div>
                                <div className="text-2xl font-bold text-orange-500">{reservedCount}</div>
                            </div>
                            <div className="px-4 py-2 bg-slate-900 rounded-xl shadow-sm border border-slate-800">
                                <div className="text-xs text-slate-500 mb-0.5">Occupied</div>
                                <div className="text-2xl font-bold text-red-500">{occupiedCount}</div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-6 px-6 py-3 bg-slate-900 rounded-2xl shadow-sm border border-slate-800 w-fit">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-white border-2 border-slate-300 rounded shadow-sm"></div>
                            <span className="text-sm font-medium text-slate-400">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded shadow-sm"></div>
                            <span className="text-sm font-medium text-slate-400">Reserved</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded shadow-sm"></div>
                            <span className="text-sm font-medium text-slate-400">Occupied</span>
                        </div>
                    </div>
                </div>

                {/* Floor Blueprint */}
                <div className="bg-white/5 rounded-3xl shadow-xl border border-slate-800 p-8 relative overflow-hidden">
                    {/* Floor Pattern */}
                    <div className="absolute inset-0 opacity-[0.05]"
                        style={{
                            backgroundImage: `repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px),
                                   repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)`
                        }}>
                    </div>

                    {/* Restaurant Layout */}
                    <div className="relative" style={{ height: '650px' }}>
                        {/* Area Labels */}
                        <div className="absolute top-0 left-0 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                            <span className="text-xs font-semibold text-slate-400">Window Side</span>
                        </div>
                        <div className="absolute top-0 right-0 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                            <span className="text-xs font-semibold text-slate-400">Premium Corner</span>
                        </div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-amber-950/30 rounded-lg border border-amber-900/50">
                            <span className="text-xs font-semibold text-amber-500">VIP Section</span>
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
                                        <span className="text-2xl font-bold">{selectedTable.tableId}</span>
                                    </div>
                                    <div>
                                        <div className="text-sm opacity-90 mb-1">Selected Table</div>
                                        <div className="text-2xl font-bold">{selectedTable.capacity} Guests</div>
                                    </div>
                                </div>
                                <button className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200">
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
