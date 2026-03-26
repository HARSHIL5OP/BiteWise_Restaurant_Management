import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, DollarSign, HeartHandshake, Store, Utensils } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { name: "Mon", revenue: 4000 },
  { name: "Tue", revenue: 3000 },
  { name: "Wed", revenue: 5000 },
  { name: "Thu", revenue: 6500 },
  { name: "Fri", revenue: 8000 },
  { name: "Sat", revenue: 10000 },
  { name: "Sun", revenue: 9500 },
];

const STATS = [
  { title: "Total Revenue", value: "$45,231.89", icon: DollarSign, trend: "+20.1% from last month", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { title: "Active Restaurants", value: "142", icon: Store, trend: "+12 new this week", color: "text-blue-500", bg: "bg-blue-500/10" },
  { title: "Platform Orders", value: "23,500+", icon: Utensils, trend: "+15% this week", color: "text-orange-500", bg: "bg-orange-500/10" },
  { title: "NGOs Connected", value: "28", icon: HeartHandshake, trend: "+3 new approvals", color: "text-purple-500", bg: "bg-purple-500/10" },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
        <p className="text-slate-400">Welcome back. Here is what's happening across Bitewise today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <Card key={i} className="bg-[#0F172A] border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg} group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 bg-[#0F172A] border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-[#0F172A] border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">System Alerts & Feed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-400">High API Latency</p>
                <p className="text-xs text-slate-400">Payment gateway response time &gt; 2s. Investigating.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4 text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-200">New Restaurant Onboarded</p>
                <p className="text-xs text-slate-400">"Spice Route" completed verification.</p>
              </div>
              <div className="ml-auto text-xs text-slate-500">2h ago</div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-200">Donation Complete</p>
                <p className="text-xs text-slate-400">20kg food delivered by "Burger Hub" to "Hope NGO".</p>
              </div>
              <div className="ml-auto text-xs text-slate-500">5h ago</div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-purple-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-200">System Update</p>
                <p className="text-xs text-slate-400">V2.4 Analytics Module deployed successfully.</p>
              </div>
              <div className="ml-auto text-xs text-slate-500">1d ago</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
