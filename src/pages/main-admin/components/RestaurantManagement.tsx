import { useState } from "react";
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const DUMMY_RESTAURANTS = [
  { id: "1", name: "Spice Route", location: "Downtown NY", owner: "John Doe", status: "Approved", revenue: "$45,000", },
  { id: "2", name: "Bella Italiano", location: "West End", owner: "Maria Garcia", status: "Approved", revenue: "$32,500", },
  { id: "3", name: "Sushi Master", location: "Central City", owner: "Kenji Sato", status: "Pending", revenue: "$0", },
  { id: "4", name: "Burger Station", location: "Uptown", owner: "Mike Johnson", status: "Suspended", revenue: "$15,200", },
  { id: "5", name: "Vegan Bites", location: "Downtown NY", owner: "Sarah Connor", status: "Approved", revenue: "$28,900", },
];

export default function RestaurantManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Approved': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
      case 'Pending': return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20';
      case 'Suspended': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20';
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
              {DUMMY_RESTAURANTS.map((restaurant) => (
                <TableRow key={restaurant.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors group">
                  <TableCell className="font-medium text-slate-200 py-4">{restaurant.name}</TableCell>
                  <TableCell className="text-slate-400">{restaurant.location}</TableCell>
                  <TableCell className="text-slate-400">{restaurant.owner}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`border-0 ${getStatusColor(restaurant.status)}`}>
                      {restaurant.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-300 font-medium">{restaurant.revenue}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-300">
                        <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer focus:bg-slate-800 focus:text-white">
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer focus:bg-slate-800 focus:text-white">
                          <Edit className="mr-2 h-4 w-4" /> Edit Configuration
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400 hover:bg-red-500/10 hover:text-red-500 cursor-pointer focus:bg-red-500/10 focus:text-red-500">
                          <Trash2 className="mr-2 h-4 w-4" /> Suspend Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="p-4 border-t border-slate-800 text-sm text-slate-500 flex justify-between items-center bg-slate-900/50">
          <span>Showing 1 to 5 of 142 entries</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-8 border-slate-700 bg-transparent hover:bg-slate-800 text-slate-400" disabled>Prev</Button>
            <Button variant="outline" size="sm" className="h-8 border-slate-700 bg-orange-500/10 text-orange-500 border-orange-500/50 hover:bg-orange-500/20">1</Button>
            <Button variant="outline" size="sm" className="h-8 border-slate-700 bg-transparent hover:bg-slate-800 text-slate-400">2</Button>
            <Button variant="outline" size="sm" className="h-8 border-slate-700 bg-transparent hover:bg-slate-800 text-slate-400">3</Button>
            <Button variant="outline" size="sm" className="h-8 border-slate-700 bg-transparent hover:bg-slate-800 text-slate-400">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
