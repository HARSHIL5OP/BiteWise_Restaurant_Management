import { Download, FileText, Calendar, Filter, PieChart, TrendingUp, HandHeart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const REPORTS = [
  { id: 1, title: "Financial & Revenue Setup", desc: "Detailed breakdown of platform earnings, commission, and payouts.", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: 2, title: "Restaurant Performance", desc: "Order volume, ratings, and operational metrics across all partners.", icon: PieChart, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: 3, title: "Inventory & Waste Insights", desc: "Analysis of food saved versus waste generated system-wide.", icon: FileText, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { id: 4, title: "Social Impact & Donations", desc: "Comprehensive NGO delivery tracking and total food rescued.", icon: HandHeart, color: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20" },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Automated Reports</h1>
          <p className="text-slate-400">Generate, view, and export comprehensive system analytics.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="border-slate-700 bg-slate-900/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button variant="outline" className="border-slate-700 bg-slate-900/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {REPORTS.map((report) => (
          <Card key={report.id} className="bg-[#0F172A] border-slate-800 shadow-xl overflow-hidden hover:border-slate-700 hover:shadow-2xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
              <div className={`p-4 rounded-xl ${report.bg} ${report.border} border shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_0_20px_rgba(0,0,0,0.2)]`}>
                <report.icon className={`w-8 h-8 ${report.color}`} />
              </div>
              <div className="space-y-1 flex-1">
                <CardTitle className="text-xl text-white font-semibold">{report.title}</CardTitle>
                <CardDescription className="text-slate-400 text-sm leading-relaxed">{report.desc}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex items-center justify-between border-t border-slate-800/50 mt-4">
              <div className="text-xs text-slate-500 font-medium">Last generated: <span className="text-slate-300">Today, 09:00 AM</span></div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg hidden sm:flex">
                  Preview
                </Button>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-all rounded-lg">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#0F172A] border-slate-800 shadow-xl overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Recent Exports</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/20 hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <FileText className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">Q1 Financial Summary</h4>
                    <span className="text-xs text-slate-500">PDF • 2.4 MB</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400 hidden sm:block">Jan 24, 2026 - 14:30</span>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8 rounded-full">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
