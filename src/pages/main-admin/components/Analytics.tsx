import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Target, Activity } from "lucide-react";

const revenueData = [
  { month: "Jan", revenue: 40000, orders: 2400 },
  { month: "Feb", revenue: 30000, orders: 1398 },
  { month: "Mar", revenue: 55000, orders: 3800 },
  { month: "Apr", revenue: 45000, orders: 3908 },
  { month: "May", revenue: 60000, orders: 4800 },
  { month: "Jun", revenue: 75000, orders: 6800 },
  { month: "Jul", revenue: 95000, orders: 8300 },
];

const donationImpactData = [
  { name: "Spice Route", saved: 400 },
  { name: "Burger Station", saved: 300 },
  { name: "Sushi Master", saved: 200 },
  { name: "Vegan Bites", saved: 278 },
  { name: "Bella Italiano", saved: 189 },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <TrendingUp className="text-orange-500 w-8 h-8" />
          Platform Analytics
        </h1>
        <p className="text-slate-400">Deep dive into revenue, order trends, and social impact.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue & Orders Trend line chart */}
        <Card className="bg-[#0F172A] border-slate-800 shadow-xl overflow-hidden hover:shadow-orange-500/5 transition-all">
          <CardHeader className="bg-slate-900/50 border-b border-slate-800">
            <CardTitle className="text-lg text-white font-medium flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Revenue & Order Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} dot={{ stroke: '#10b981', strokeWidth: 2, r: 4, fill: '#0f172a' }} activeDot={{ r: 8, fill: '#10b981' }} />
                <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#f97316" strokeWidth={3} dot={{ stroke: '#f97316', strokeWidth: 2, r: 4, fill: '#0f172a' }} activeDot={{ r: 8, fill: '#f97316' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Restaurants by Impact Bar chart */}
        <Card className="bg-[#0F172A] border-slate-800 shadow-xl overflow-hidden hover:shadow-orange-500/5 transition-all">
          <CardHeader className="bg-slate-900/50 border-b border-slate-800">
            <CardTitle className="text-lg text-white font-medium flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" /> Top Restaurants by Donation Impact (kg)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donationImpactData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tickLine={false} axisLine={false} width={100} fontSize={12} />
                <Tooltip 
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f8fafc' }}
                />
                <Bar dataKey="saved" fill="#f97316" radius={[0, 4, 4, 0]} barSize={24} name="Food Donated (kg)">
                  {donationImpactData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#f97316' : index === 1 ? '#fb923c' : '#fdba74'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
