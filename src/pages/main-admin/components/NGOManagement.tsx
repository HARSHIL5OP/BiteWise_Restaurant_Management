import { useState, useEffect } from "react";
import { Search, Filter, ShieldCheck, XCircle, Eye, MoreVertical } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNgo, updateNgoStatus, updateNgoDetails, NgoData } from "@/services/ngoService";
import { toast } from "sonner";

export default function NGOManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ngos, setNgos] = useState<(NgoData & { id: string })[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedNgo, setSelectedNgo] = useState<(NgoData & { id: string }) | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [editFormData, setEditFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    city: "",
    registrationNo: "",
    openTime: "",
    closeTime: ""
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    city: "",
    registrationNo: "",
    openTime: "",
    closeTime: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    // Real-time updates
    const q = query(collection(db, "ngos"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ngoData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (NgoData & { id: string })[];
      setNgos(ngoData);
    }, (error) => {
      console.error("Error fetching NGOs:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await updateNgoStatus(id, true);
    } catch (error) {
      console.error("Failed to approve NGO:", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      // Reject sets isVerified to false
      await updateNgoStatus(id, false);
    } catch (error) {
      console.error("Failed to reject NGO:", error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await createNgo({
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        address: {
          city: formData.city,
          lat: 0,
          lng: 0
        },
        registrationNo: formData.registrationNo,
        operatingHours: {
          open: formData.openTime,
          close: formData.closeTime
        }
      });
      toast.success("NGO Registered Successfully");
      setIsAddModalOpen(false);
      setFormData({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        city: "",
        registrationNo: "",
        openTime: "",
        closeTime: "",
        password: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      console.error("Failed to create NGO:", error);
      toast.error(error.message || "Failed to register NGO");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNgo) return;
    setIsSubmitting(true);
    try {
      await updateNgoDetails(selectedNgo.id, {
        name: editFormData.name,
        contactPerson: editFormData.contactPerson,
        email: editFormData.email,
        phone: editFormData.phone,
        address: {
          city: editFormData.city,
          lat: selectedNgo.address?.lat || 0,
          lng: selectedNgo.address?.lng || 0
        },
        registrationNo: editFormData.registrationNo,
        operatingHours: {
          open: editFormData.openTime,
          close: editFormData.closeTime
        }
      });
      setIsEditMode(false);
      setIsViewModalOpen(false);
    } catch (error) {
      console.error("Failed to update NGO:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredNgos = ngos.filter(ngo => 
    ngo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Verified': return <Badge className="bg-emerald-500/10 text-emerald-500 border-0 hover:bg-emerald-500/20"><ShieldCheck className="w-3 h-3 mr-1" /> Verified</Badge>;
      case 'Pending': return <Badge className="bg-orange-500/10 text-orange-500 border-0 hover:bg-orange-500/20">Pending</Badge>;
      case 'Rejected': return <Badge className="bg-red-500/10 text-red-500 border-0 hover:bg-red-500/20"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default: return <Badge className="bg-slate-500/10 text-slate-500 border-0">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">NGO Partners</h1>
          <p className="text-slate-400">Manage non-profit organizations and their verification status.</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full">
              Add NGO
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New NGO</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">NGO Name</Label>
                <Input required id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-800 border-slate-700" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input required id="contactPerson" value={formData.contactPerson} onChange={(e) => setFormData({...formData, contactPerson: e.target.value})} className="bg-slate-800 border-slate-700" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input required type="email" id="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input required id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-800 border-slate-700" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input required type="password" id="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input required type="password" id="confirmPassword" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="bg-slate-800 border-slate-700" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input required id="city" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="bg-slate-800 border-slate-700" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationNo">Registration No</Label>
                <Input required id="registrationNo" value={formData.registrationNo} onChange={(e) => setFormData({...formData, registrationNo: e.target.value})} className="bg-slate-800 border-slate-700" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openTime">Open Time</Label>
                  <Input required type="time" id="openTime" value={formData.openTime} onChange={(e) => setFormData({...formData, openTime: e.target.value})} className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closeTime">Close Time</Label>
                  <Input required type="time" id="closeTime" value={formData.closeTime} onChange={(e) => setFormData({...formData, closeTime: e.target.value})} className="bg-slate-800 border-slate-700" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="border-slate-700 text-slate-300">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600">
                  {isSubmitting ? "Registering..." : "Register NGO"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit NGO Details" : "NGO Details"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">NGO Name</Label>
                <Input required disabled={!isEditMode} id="edit-name" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="bg-slate-800 border-slate-700 disabled:opacity-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contactPerson">Contact Person</Label>
                <Input required disabled={!isEditMode} id="edit-contactPerson" value={editFormData.contactPerson} onChange={(e) => setEditFormData({...editFormData, contactPerson: e.target.value})} className="bg-slate-800 border-slate-700 disabled:opacity-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input required disabled={!isEditMode} type="email" id="edit-email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} className="bg-slate-800 border-slate-700 disabled:opacity-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input required disabled={!isEditMode} id="edit-phone" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} className="bg-slate-800 border-slate-700 disabled:opacity-50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input required disabled={!isEditMode} id="edit-city" value={editFormData.city} onChange={(e) => setEditFormData({...editFormData, city: e.target.value})} className="bg-slate-800 border-slate-700 disabled:opacity-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-registrationNo">Registration No</Label>
                <Input required disabled={!isEditMode} id="edit-registrationNo" value={editFormData.registrationNo} onChange={(e) => setEditFormData({...editFormData, registrationNo: e.target.value})} className="bg-slate-800 border-slate-700 disabled:opacity-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-openTime">Open Time</Label>
                  <Input required disabled={!isEditMode} type="time" id="edit-openTime" value={editFormData.openTime} onChange={(e) => setEditFormData({...editFormData, openTime: e.target.value})} className="bg-slate-800 border-slate-700 disabled:opacity-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-closeTime">Close Time</Label>
                  <Input required disabled={!isEditMode} type="time" id="edit-closeTime" value={editFormData.closeTime} onChange={(e) => setEditFormData({...editFormData, closeTime: e.target.value})} className="bg-slate-800 border-slate-700 disabled:opacity-50" />
                </div>
              </div>
              <DialogFooter>
                {isEditMode ? (
                  <>
                    <Button type="button" variant="outline" onClick={() => setIsEditMode(false)} className="border-slate-700 text-slate-300">Cancel</Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600">
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={() => setIsViewModalOpen(false)} className="border-slate-700 text-slate-300">Close</Button>
                    <Button type="button" onClick={() => setIsEditMode(true)} className="bg-orange-500 hover:bg-orange-600">
                      Edit Details
                    </Button>
                  </>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search NGOs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 bg-slate-900 border-slate-800 focus-visible:ring-orange-500/50 text-slate-200 rounded-full"
            />
          </div>
          
          <Button variant="outline" className="w-full sm:w-auto border-slate-700 bg-slate-900 text-slate-300 rounded-full">
            <Filter className="w-4 h-4 mr-2" />
            Filter by Status
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900/50">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">NGO Details</TableHead>
                <TableHead className="text-slate-400">Contact Info</TableHead>
                <TableHead className="text-slate-400">Location</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400 text-right">Total Received</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNgos.map((ngo) => (
                <TableRow key={ngo.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-slate-700 shadow-lg">
                        <AvatarFallback className="bg-slate-800 text-orange-400 font-bold">{ngo.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-slate-200">{ngo.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">{ngo.email || ngo.phone}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{ngo.address?.city}</TableCell>
                  <TableCell>{getStatusBadge(ngo.isVerified ? 'Verified' : 'Pending')}</TableCell>
                  <TableCell className="text-right text-orange-400 font-medium">{ngo.totalDonationsReceived || 0} kg</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors rounded-full">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 shadow-2xl rounded-xl">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedNgo(ngo);
                            setEditFormData({
                              name: ngo.name || "",
                              contactPerson: ngo.contactPerson || "",
                              email: ngo.email || "",
                              phone: ngo.phone || "",
                              city: ngo.address?.city || "",
                              registrationNo: ngo.registrationNo || "",
                              openTime: ngo.operatingHours?.open || "",
                              closeTime: ngo.operatingHours?.close || ""
                            });
                            setIsEditMode(false);
                            setIsViewModalOpen(true);
                          }}
                          className="text-slate-300 hover:text-white focus:text-white cursor-pointer hover:bg-slate-800 focus:bg-slate-800 rounded-lg"
                        >
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {!ngo.isVerified && (
                          <>
                            <DropdownMenuItem onClick={() => handleApprove(ngo.id)} className="text-emerald-400 hover:text-emerald-300 focus:text-emerald-300 cursor-pointer hover:bg-emerald-500/10 focus:bg-emerald-500/10 rounded-lg">
                              <ShieldCheck className="mr-2 h-4 w-4" /> Approve Application
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReject(ngo.id)} className="text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 rounded-lg">
                              <XCircle className="mr-2 h-4 w-4" /> Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {ngo.isVerified && (
                           <DropdownMenuItem onClick={() => handleReject(ngo.id)} className="text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 rounded-lg">
                             <XCircle className="mr-2 h-4 w-4" /> Revoke Verification
                           </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
