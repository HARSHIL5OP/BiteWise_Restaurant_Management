import { useState } from "react";
import { Search, Filter, ShieldCheck, XCircle, Eye, MoreVertical } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const DUMMY_NGOS = [
  { id: "1", name: "Hope Foundation", contact: "+1 234-567-8900", status: "Verified", donations: "1,240 kg", location: "New York" },
  { id: "2", name: "City Harvest", contact: "contact@cityharvest.org", status: "Verified", donations: "8,900 kg", location: "Brooklyn" },
  { id: "3", name: "Food Rescuers", contact: "+1 987-654-3210", status: "Pending", donations: "0 kg", location: "Queens" },
  { id: "4", name: "Earth Care", contact: "earthcare@gmail.com", status: "Rejected", donations: "0 kg", location: "Staten Island" },
  { id: "5", name: "Meals for All", contact: "+1 555-123-4567", status: "Verified", donations: "450 kg", location: "Bronx" },
];

export default function NGOManagement() {
  const [searchTerm, setSearchTerm] = useState("");

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
              {DUMMY_NGOS.map((ngo) => (
                <TableRow key={ngo.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-slate-700 shadow-lg">
                        <AvatarFallback className="bg-slate-800 text-orange-400 font-bold">{ngo.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-slate-200">{ngo.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">{ngo.contact}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{ngo.location}</TableCell>
                  <TableCell>{getStatusBadge(ngo.status)}</TableCell>
                  <TableCell className="text-right text-orange-400 font-medium">{ngo.donations}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors rounded-full">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 shadow-2xl rounded-xl">
                        <DropdownMenuItem className="text-slate-300 hover:text-white focus:text-white cursor-pointer hover:bg-slate-800 focus:bg-slate-800 rounded-lg">
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {ngo.status === 'Pending' && (
                          <>
                            <DropdownMenuItem className="text-emerald-400 hover:text-emerald-300 focus:text-emerald-300 cursor-pointer hover:bg-emerald-500/10 focus:bg-emerald-500/10 rounded-lg">
                              <ShieldCheck className="mr-2 h-4 w-4" /> Approve Application
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 rounded-lg">
                              <XCircle className="mr-2 h-4 w-4" /> Reject
                            </DropdownMenuItem>
                          </>
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
