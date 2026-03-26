import { useState } from "react";
import { 
  LayoutDashboard, 
  Store, 
  PlusCircle, 
  HeartHandshake, 
  Gift, 
  BarChart3, 
  Users, 
  FileText, 
  Activity, 
  Settings,
  Bell,
  Search,
  Menu,
  Sun,
  Moon,
  LogOut,
  ChevronRight
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

import DashboardOverview from "./components/DashboardOverview";
import RestaurantManagement from "./components/RestaurantManagement";
import AddRestaurant from "./components/AddRestaurant";
import NGOManagement from "./components/NGOManagement";
import DonationTracking from "./components/DonationTracking";
import Analytics from "./components/Analytics";
import UserManagement from "./components/UserManagement";
import Reports from "./components/Reports";
import SystemMonitoring from "./components/SystemMonitoring";

const SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "restaurants", label: "Restaurants", icon: Store },
  { id: "add-restaurant", label: "Add Restaurant", icon: PlusCircle },
  { id: "ngos", label: "NGOs", icon: HeartHandshake },
  { id: "donations", label: "Donations", icon: Gift },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "users", label: "Users / Roles", icon: Users },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "monitoring", label: "System Monitoring", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function MainAdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardOverview />;
      case "restaurants": return <RestaurantManagement />;
      case "add-restaurant": return <AddRestaurant />;
      case "ngos": return <NGOManagement />;
      case "donations": return <DonationTracking />;
      case "analytics": return <Analytics />;
      case "users": return <UserManagement />;
      case "reports": return <Reports />;
      case "monitoring": return <SystemMonitoring />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0F1C] text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0F172A] border-r border-slate-800 transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-20 lg:w-20 w-0" 
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className={cn("flex items-center gap-3 overflow-hidden", !sidebarOpen && "hidden lg:flex lg:w-0")}>
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.5)]">
              B
            </div>
            {sidebarOpen && <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 whitespace-nowrap">Bitewise</span>}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          <div className="px-3 space-y-1">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                  activeTab === item.id 
                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[inset_0_0_20px_rgba(249,115,22,0.05)]" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", activeTab === item.id ? "text-orange-500" : "")} />
                {sidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                {activeTab === item.id && sidebarOpen && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="font-medium whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 min-h-screen overscroll-none",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-[#0A0F1C]/80 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white hidden lg:flex">
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
              <span>Main Admin</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-orange-400 font-medium capitalize">{activeTab.replace('-', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input 
                placeholder="Search globally..." 
                className="w-full pl-9 bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-orange-500/50 rounded-full h-9"
              />
            </div>
            
            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white rounded-full">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#0A0F1C]"></span>
            </Button>
            
            <div className="h-8 w-px bg-slate-800 mx-2"></div>

            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-200">Super Admin</div>
                <div className="text-xs text-slate-500">System Owner</div>
              </div>
              <Avatar className="h-9 w-9 border-2 border-slate-800">
                <AvatarImage src="https://i.pravatar.cc/150?u=admin" />
                <AvatarFallback className="bg-orange-500 text-white">SA</AvatarFallback>
              </Avatar>
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderContent()}
          </div>
        </div>
      </main>

    </div>
  );
}
