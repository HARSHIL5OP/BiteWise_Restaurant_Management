import { Server, Activity, AlertCircle, Database, Network, Cpu, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const METRICS = [
  { title: "CPU Usage", value: 34, icon: Cpu, color: "bg-blue-500", text: "text-blue-500" },
  { title: "Memory (RAM)", value: 68, icon: HardDrive, color: "bg-orange-500", text: "text-orange-500" },
  { title: "Storage", value: 45, icon: Database, color: "bg-emerald-500", text: "text-emerald-500" },
  { title: "Network Load", value: 12, icon: Network, color: "bg-purple-500", text: "text-purple-500" },
];

export default function SystemMonitoring() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Activity className="text-orange-500 w-8 h-8" />
          System Monitoring
        </h1>
        <p className="text-slate-400">Real-time infrastructure health and platform status.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-3 bg-[#0F172A] border-slate-800 shadow-xl overflow-hidden relative">
          <CardHeader className="bg-slate-900/50 border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-white font-medium flex items-center gap-2">
                  <Server className="w-5 h-5 text-slate-300" /> Core Infrastructure
                </CardTitle>
                <CardDescription className="text-slate-400 mt-1">Live resource allocation</CardDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">All Systems Operational</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-8 md:grid-cols-2">
              {METRICS.map((metric, i) => (
                <div key={i} className="space-y-3 relative group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg bg-slate-800 text-slate-300 transition-colors group-hover:${metric.text}`}>
                        <metric.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-300">{metric.title}</span>
                    </div>
                    <span className="text-sm font-bold text-white">{metric.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full ${metric.color} transition-all duration-1000 ease-out relative`} style={{ width: `${metric.value}%` }}>
                      <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0F172A] border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="bg-slate-900/50 border-b border-slate-800 pb-4">
            <CardTitle className="text-lg text-white font-medium">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center items-center text-center space-y-4 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
            <div className="w-24 h-24 rounded-full border-4 border-slate-800 border-t-blue-500 flex items-center justify-center animate-[spin_10s_linear_infinite]">
              <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center animate-[spin_10s_linear_infinite_reverse]">
                <span className="text-3xl font-bold text-white">4.2k</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium tracking-wide">USERS ONLINE</p>
              <p className="text-xs text-emerald-500 mt-1 flex items-center justify-center gap-1">
                +12% vs hourly avg
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#0F172A] border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-900/40 backdrop-blur-sm flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" /> Recent System Logs
          </h3>
          <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">Auto-refreshing...</span>
        </div>
        <div className="p-0">
          <div className="flex flex-col font-mono text-sm max-h-[300px] overflow-y-auto w-full">
            {[
              { level: "INFO", time: "14:32:05", msg: "API Gateway traffic normalized.", color: "text-blue-400" },
              { level: "WARN", time: "14:30:12", msg: "High latency detected on Route /payment/webhook (800ms)", color: "text-orange-400" },
              { level: "INFO", time: "14:28:55", msg: "Database micro-backup completed successfully.", color: "text-blue-400" },
              { level: "ERROR", time: "14:25:01", msg: "Failed to connect to email SMTP service. Retrying in 5s...", color: "text-red-400" },
              { level: "INFO", time: "14:20:45", msg: "User Alex Admin (ID: 1) logged in securely.", color: "text-emerald-400" },
            ].map((log, i) => (
              <div key={i} className="flex items-start gap-4 px-6 py-3 border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors last:border-0 pointer-events-none">
                <span className="text-slate-500 w-20 shrink-0">{log.time}</span>
                <span className={`w-14 font-bold shrink-0 ${log.color}`}>[{log.level}]</span>
                <span className="text-slate-300">{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
