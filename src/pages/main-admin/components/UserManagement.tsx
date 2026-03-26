import { useState } from "react";
import { UserCog, Shield, User, Clock, Trash2, Edit2, KeyRound } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const DUMMY_USERS = [
  { id: "1", name: "Alex Admin", email: "alex@bitewise.admin", role: "Super Admin", status: "Active", lastActive: "Just now", avatar: "AA" },
  { id: "2", name: "Sarah Manager", email: "sarah@spiceroute.com", role: "Owner", status: "Active", lastActive: "2 hrs ago", avatar: "SM" },
  { id: "3", name: "Mike Staff", email: "mike@burgerstation.com", role: "Staff", status: "Active", lastActive: "5 hrs ago", avatar: "MS" },
  { id: "4", name: "David NGO", email: "david@hopengo.org", role: "NGO", status: "Suspended", lastActive: "2 days ago", avatar: "DN" },
  { id: "5", name: "Emma Owner", email: "emma@veganbites.com", role: "Owner", status: "Active", lastActive: "1 day ago", avatar: "EO" },
];

export default function UserManagement() {

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'Super Admin': return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/30 font-semibold"><Shield className="w-3 h-3 mr-1" /> Super Admin</Badge>;
      case 'Owner': return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/30">Owner</Badge>;
      case 'Staff': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">Staff</Badge>;
      case 'NGO': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">NGO</Badge>;
      default: return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/30">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <UserCog className="text-orange-500 w-8 h-8" />
            User & Role Management
          </h1>
          <p className="text-slate-400">Control access levels and monitor activity across the platform.</p>
        </div>
        
        <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]">
          Invite User
        </Button>
      </div>

      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900/80 backdrop-blur-md">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Role</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Last Active</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DUMMY_USERS.map((user) => (
                <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/20 transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-slate-700 bg-slate-800">
                        <AvatarFallback className="text-slate-300 font-medium">{user.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-slate-200">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`} />
                      <span className={user.status === 'Active' ? 'text-slate-300' : 'text-slate-500'}>{user.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {user.lastActive}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 border-slate-700 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          Manage
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 rounded-xl shadow-2xl p-1 min-w-[160px]">
                        <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 focus:bg-slate-800 rounded-lg cursor-pointer flex items-center gap-2">
                          <Edit2 className="w-4 h-4" /> Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 focus:bg-slate-800 rounded-lg cursor-pointer flex items-center gap-2">
                          <KeyRound className="w-4 h-4" /> Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 rounded-lg cursor-pointer flex items-center gap-2 mt-1">
                          <Trash2 className="w-4 h-4" /> Suspend Account
                        </DropdownMenuItem>
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
