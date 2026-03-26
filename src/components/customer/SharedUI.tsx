import { MapPin, Search, ChevronDown, User, SlidersHorizontal, ArrowRight, CirclePercent, Flame, UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// === LOCATION BAR ===
export function LocationBar() {
  return (
    <div className="flex items-center justify-between py-4 px-4 sticky top-0 z-50 bg-[#0A0F1C]/90 backdrop-blur-xl border-b border-slate-800 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500/10 rounded-full text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
          <MapPin className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-1">
            Gokul Park <ChevronDown className="w-4 h-4 text-orange-500" />
          </h2>
          <p className="text-xs text-slate-400 truncate max-w-[200px]">Thaltej, Ahmedabad, Gujarat</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white transition-colors active:scale-95">
          <User className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// === SEARCH BAR ===
export function SearchBar() {
  return (
    <div className="px-4 py-3 sticky top-[72px] z-40 bg-[#0A0F1C]/90 backdrop-blur-md">
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Search for restaurant, area, vibe..." 
          className="w-full bg-[#1e293b] border border-slate-800 text-slate-200 placeholder:text-slate-500 rounded-full py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 shadow-lg transition-all"
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          <button className="p-2 rounded-full text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 transition-colors active:scale-95">
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// === CATEGORY CHIP ===
interface CategoryChipProps {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}
export function CategoryChip({ label, icon, active = false }: CategoryChipProps) {
  return (
    <div className={`flex flex-col items-center gap-2 group cursor-pointer shrink-0 snap-center w-[72px]`}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
        active 
          ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white border-2 border-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-105" 
          : "bg-slate-800/80 border border-slate-700 text-slate-300 group-hover:bg-slate-700 active:scale-95"
      }`}>
        {icon}
      </div>
      <span className={`text-[11px] font-semibold text-center leading-tight tracking-wide ${active ? "text-orange-400" : "text-slate-400 group-hover:text-slate-200"}`}>
        {label}
      </span>
    </div>
  );
}

// === SECTION HEADER ===
export function SectionHeader({ title, subtitle, actionText }: { title: string, subtitle?: string, actionText?: string }) {
  return (
    <div className="flex items-end justify-between px-4 mb-4 mt-8">
      <div>
        <h3 className="text-xl font-bold text-slate-100 tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-1 font-medium">{subtitle}</p>}
      </div>
      {actionText && (
        <button className="text-sm font-bold text-orange-500 flex items-center gap-1 active:opacity-70 group">
          {actionText} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
}

// === OFFER BANNER ===
export function OfferBanner() {
  return (
    <div className="px-4 py-2 mt-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 border border-emerald-500/30 p-6 shadow-2xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all group">
        
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/40 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-orange-500/20 rounded-full blur-[40px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-[60%] space-y-2">
          <Badge className="bg-orange-500 hover:bg-orange-600 border-none text-[10px] tracking-wider uppercase px-2 py-0.5 shadow-[0_0_10px_rgba(249,115,22,0.5)]">Limited Time</Badge>
          <h2 className="text-2xl font-black italic text-white leading-tight drop-shadow-md">
            FLAT <span className="text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-yellow-300">50% OFF</span> <br/>ON DINING
          </h2>
          <p className="text-xs text-emerald-100/70 font-medium">Valid on select premium restaurants.</p>
        </div>
        
        <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full border border-emerald-500/40 flex items-center justify-center shadow-[inset_0_0_30px_rgba(16,185,129,0.3)] group-hover:rotate-[15deg] transition-transform duration-500">
          <CirclePercent className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
        </div>
      </div>
    </div>
  );
}
