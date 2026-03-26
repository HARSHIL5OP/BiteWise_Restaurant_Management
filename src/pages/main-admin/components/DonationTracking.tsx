import { useState } from "react";
import { Search, MapPin, Truck, Check, Package, ArrowRight, HeartPulse } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const STATS = [
  { title: "Total Donations", value: "14,320 kg", label: "+2% from last week", icon: Package, color: "text-emerald-500", shadow: "shadow-emerald-500/20" },
  { title: "Active Pickups", value: "24", label: "En route currently", icon: Truck, color: "text-orange-500", shadow: "shadow-orange-500/20" },
  { title: "Completed Today", value: "86", label: "Success rate: 98%", icon: Check, color: "text-blue-500", shadow: "shadow-blue-500/20" },
];

const DUMMY_DONATIONS = [
  { id: "DON-7821", restaurant: "Spice Route", ngo: "Hope Foundation", type: "Cooked Meals", qty: "45 kg", status: "In Transit", time: "10 mins ago" },
  { id: "DON-7822", restaurant: "Burger Station", ngo: "City Harvest", type: "Breads & Bakery", qty: "20 kg", status: "Pending Pickup", time: "25 mins ago" },
  { id: "DON-7823", restaurant: "Vegan Bites", ngo: "Meals for All", type: "Raw Vegetables", qty: "110 kg", status: "Completed", time: "2 hours ago" },
  { id: "DON-7824", restaurant: "Sushi Master", ngo: "Earth Care", type: "Cooked Seafood", qty: "15 kg", status: "Cancelled", time: "4 hours ago" },
  { id: "DON-7825", restaurant: "Bella Italiano", ngo: "Hope Foundation", type: "Pasta & Grains", qty: "60 kg", status: "Completed", time: "5 hours ago" },
];

export default function DonationTracking() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <HeartPulse className="text-orange-500" />
          Donation Tracking
        </h1>
        <p className="text-slate-400">Monitor live food rescue operations across the platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {STATS.map((stat, i) => (
          <Card key={i} className={`bg-[#0F172A] border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-xl group ${stat.shadow}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">{stat.title}</CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color} group-hover:scale-110 transition-transform duration-300`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white tracking-tight">{stat.value}</div>
              <p className="text-xs text-slate-500 mt-2">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#0F172A] border-slate-800 shadow-xl overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Live Operations</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">ID</TableHead>
                <TableHead className="text-slate-400">Transfer Route</TableHead>
                <TableHead className="text-slate-400">Food Type & Qty</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400 text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DUMMY_DONATIONS.map((donation) => (
                <TableRow key={donation.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors">
                  <TableCell className="font-mono text-xs text-slate-500">{donation.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-200 font-medium">{donation.restaurant}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-orange-400">{donation.ngo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-slate-300 text-sm">{donation.type}</span>
                      <span className="text-slate-500 text-xs font-semibold">{donation.qty}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {donation.status === 'Completed' && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Completed</Badge>}
                    {donation.status === 'In Transit' && <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 flex w-fit gap-1"><Truck className="w-3 h-3 animate-pulse" /> In Transit</Badge>}
                    {donation.status === 'Pending Pickup' && <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Pending</Badge>}
                    {donation.status === 'Cancelled' && <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Cancelled</Badge>}
                  </TableCell>
                  <TableCell className="text-right text-slate-500 text-xs">{donation.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
