export const getOrderStatus = (items: any[]) => {
    if (!items || items.length === 0) return "pending";
    const statuses = items.map(i => i.status || "pending");
  
    if (statuses.every(s => s === "served")) return "completed";
    if (statuses.every(s => s === "ready")) return "ready";
    if (statuses.some(s => s === "preparing")) return "preparing";
    return "pending";
};
