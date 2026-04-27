import { useState } from "react";
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { useEffect } from "react";
import { getAllRestaurants } from "@/services/restaurantService";
import { Loader2, PlayCircle, StopCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

export default function RestaurantManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [viewRestaurant, setViewRestaurant] = useState<any>(null);
  const [editRestaurant, setEditRestaurant] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await getAllRestaurants();
        const dataWithRevenue = await Promise.all(data.map(async (r: any) => {
          let totalRev = 0;
          try {
            const ordersSnap = await getDocs(collection(db, 'restaurants', r.id, 'orders'));
            ordersSnap.forEach(docSnap => {
              const oData = docSnap.data();
              if (oData.status === 'completed') {
                totalRev += Number(oData.totalAmount) || 0;
              }
            });
          } catch(e) {
            console.error("Error fetching orders for revenue", e);
          }
          return { ...r, calculatedRevenue: totalRev };
        }));
        setRestaurants(dataWithRevenue);
      } catch (error) {
        console.error("Failed to fetch restaurants:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const filteredRestaurants = restaurants.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.location?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'active':
      case 'approved': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
      case 'pending': return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20';
      case 'suspended': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20';
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus?.toLowerCase() === 'suspended' ? 'Active' : 'Suspended';
      await updateDoc(doc(db, 'restaurants', id), { status: newStatus });
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to completely delete this restaurant? This cannot be undone.')) return;
    try {
      await updateDoc(doc(db, 'restaurants', id), { isDeleted: true });
      setRestaurants(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Error deleting restaurant:", error);
    }
  };

  const openView = (restaurant: any) => {
    setViewRestaurant(restaurant);
  };

  const openEdit = (restaurant: any) => {
    setEditRestaurant(restaurant);
    setEditFormData({
      name: restaurant.name || "",
      averagePriceForTwo: restaurant.averagePriceForTwo || 0,
      isJainAvailable: restaurant.isJainAvailable || false,
      outletType: restaurant.outletType || "Restaurant",
    });
  };

  const handleEditSubmit = async () => {
    if (!editRestaurant) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'restaurants', editRestaurant.id), {
        name: editFormData.name,
        averagePriceForTwo: Number(editFormData.averagePriceForTwo),
        isJainAvailable: editFormData.isJainAvailable,
        outletType: editFormData.outletType,
      });
      setRestaurants(prev => prev.map(r => r.id === editRestaurant.id ? { ...r, ...editFormData } : r));
      setEditRestaurant(null);
    } catch (error) {
      console.error("Error saving config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Restaurants</h1>
          <p className="text-slate-400">Manage all restaurant partners on the platform.</p>
        </div>
        
        <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Add Restaurant
        </Button>
      </div>

      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search by name, location, or owner..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 bg-slate-950 border-slate-800 focus-visible:ring-orange-500/50 text-slate-200"
            />
          </div>
          
          <Button variant="outline" className="w-full sm:w-auto border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Restaurant Name</TableHead>
                <TableHead className="text-slate-400">Location</TableHead>
                <TableHead className="text-slate-400">Owner</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400 text-right">Revenue (MTD)</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-500" />
                  </TableCell>
                </TableRow>
              ) : filteredRestaurants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-400">
                    No restaurants found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRestaurants.map((restaurant) => (
                  <TableRow key={restaurant.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors group">
                    <TableCell className="font-medium text-slate-200 py-4">{restaurant.name}</TableCell>
                    <TableCell className="text-slate-400">{restaurant.location?.city || "N/A"}</TableCell>
                    <TableCell className="text-slate-400">ID: {restaurant.ownerId?.slice(0, 6) || "N/A"}...</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-0 capitalize ${getStatusColor(restaurant.status || 'pending')}`}>
                        {restaurant.status || "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-slate-300 font-medium">₹{restaurant.calculatedRevenue || 0}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-300">
                          <DropdownMenuItem onClick={() => openView(restaurant)} className="hover:bg-slate-800 hover:text-white cursor-pointer focus:bg-slate-800 focus:text-white">
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(restaurant)} className="hover:bg-slate-800 hover:text-white cursor-pointer focus:bg-slate-800 focus:text-white">
                            <Edit className="mr-2 h-4 w-4" /> Edit Configuration
                          </DropdownMenuItem>
                          {restaurant.status?.toLowerCase() === 'suspended' ? (
                            <DropdownMenuItem onClick={() => handleToggleStatus(restaurant.id, restaurant.status)} className="text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-500 cursor-pointer focus:bg-emerald-500/10 focus:text-emerald-500">
                              <PlayCircle className="mr-2 h-4 w-4" /> Activate Account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleToggleStatus(restaurant.id, restaurant.status)} className="text-orange-400 hover:bg-orange-500/10 hover:text-orange-500 cursor-pointer focus:bg-orange-500/10 focus:text-orange-500">
                              <StopCircle className="mr-2 h-4 w-4" /> Suspend Account
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(restaurant.id)} className="text-red-400 hover:bg-red-500/10 hover:text-red-500 cursor-pointer focus:bg-red-500/10 focus:text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Restaurant
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="p-4 border-t border-slate-800 text-sm text-slate-500 flex justify-between items-center bg-slate-900/50">
          <span>Showing {filteredRestaurants.length} entries</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-8 border-slate-700 bg-transparent hover:bg-slate-800 text-slate-400" disabled>Prev</Button>
            <Button variant="outline" size="sm" className="h-8 border-slate-700 bg-orange-500/10 text-orange-500 border-orange-500/50 hover:bg-orange-500/20">1</Button>
            <Button variant="outline" size="sm" className="h-8 border-slate-700 bg-transparent hover:bg-slate-800 text-slate-400">2</Button>
            <Button variant="outline" size="sm" className="h-8 border-slate-700 bg-transparent hover:bg-slate-800 text-slate-400">3</Button>
            <Button variant="outline" size="sm" className="h-8 border-slate-700 bg-transparent hover:bg-slate-800 text-slate-400">Next</Button>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      <Dialog open={!!viewRestaurant} onOpenChange={(open) => !open && setViewRestaurant(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Restaurant Details</DialogTitle>
          </DialogHeader>
          {viewRestaurant && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                  {viewRestaurant.logoUrl && typeof viewRestaurant.logoUrl === 'string' && viewRestaurant.logoUrl.startsWith('http') ? (
                    <img src={viewRestaurant.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                  ) : <span className="flex items-center justify-center h-full text-2xl">{typeof viewRestaurant.logoUrl === 'string' ? viewRestaurant.logoUrl : '🍽️'}</span>}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{viewRestaurant.name}</h3>
                  <p className="text-slate-400 text-sm">{viewRestaurant.cuisineType?.join(', ')} • {viewRestaurant.outletType}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                  <span className="text-slate-500 block mb-1">Status</span>
                  <Badge variant="secondary" className={`capitalize border-0 ${getStatusColor(viewRestaurant.status || 'pending')}`}>
                    {viewRestaurant.status || "pending"}
                  </Badge>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                  <span className="text-slate-500 block mb-1">Average Price</span>
                  <span className="font-semibold text-white">₹{viewRestaurant.averagePriceForTwo || 0} for two</span>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                  <span className="text-slate-500 block mb-1">Location</span>
                  <span className="font-semibold text-white">{viewRestaurant.location?.city || "N/A"}</span>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                  <span className="text-slate-500 block mb-1">Jain Available</span>
                  <span className="font-semibold text-white">{viewRestaurant.isJainAvailable ? "Yes" : "No"}</span>
                </div>
              </div>
              
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-sm">
                 <span className="text-slate-500 block mb-1">Owner ID</span>
                 <span className="font-mono text-white">{viewRestaurant.ownerId || "N/A"}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Configuration Modal */}
      <Dialog open={!!editRestaurant} onOpenChange={(open) => !open && setEditRestaurant(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Edit Configuration</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update core restaurant settings directly.
            </DialogDescription>
          </DialogHeader>
          
          {editFormData && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Restaurant Name</label>
                <Input 
                  value={editFormData.name} 
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="bg-slate-950 border-slate-800 text-white focus-visible:ring-orange-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Outlet Type</label>
                <select 
                  value={editFormData.outletType}
                  onChange={(e) => setEditFormData({...editFormData, outletType: e.target.value})}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Restaurant">Restaurant</option>
                  <option value="Cafe">Cafe</option>
                  <option value="QSR">QSR (Quick Service)</option>
                  <option value="Food Truck">Food Truck</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Cloud Kitchen">Cloud Kitchen</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Average Price for Two</label>
                <Input 
                  type="number"
                  value={editFormData.averagePriceForTwo} 
                  onChange={(e) => setEditFormData({...editFormData, averagePriceForTwo: e.target.value})}
                  className="bg-slate-950 border-slate-800 text-white focus-visible:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-4 rounded-xl mt-4">
                <div>
                  <h4 className="text-sm font-medium text-white">Jain Food Available</h4>
                  <p className="text-xs text-slate-400">Does this outlet serve Jain food?</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, isJainAvailable: !editFormData.isJainAvailable })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editFormData.isJainAvailable ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editFormData.isJainAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRestaurant(null)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600 text-white border-0">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
