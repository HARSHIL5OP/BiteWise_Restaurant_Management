import { MapPin, Search, ChevronDown, User, SlidersHorizontal, ArrowRight, CirclePercent, Flame, UtensilsCrossed, X, LogOut, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";

// === LOCATION BAR ===
export function LocationBar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileData, setProfileData] = useState<any>(null);

  const [area, setArea] = useState("Fetching...");
  const [city, setCity] = useState("");
  const [isLocLoading, setIsLocLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setArea("Ahmedabad");
      setCity("");
      setIsLocLoading(false);
      return;
    }

    // Attempt to get user location
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
          );
          const data = await res.json();
          const address = data.address || {};

          let fetchedArea =
            address.suburb ||
            address.neighbourhood ||
            address.residential ||
            address.road ||
            address.hamlet ||
            address.quarter;

          const parts = data.display_name ? data.display_name.split(",") : [];

          if (!fetchedArea || fetchedArea.toLowerCase().includes("road") || fetchedArea.toLowerCase().includes("unnamed")) {
            fetchedArea = parts[0]?.trim(); 
            if (!fetchedArea || fetchedArea.toLowerCase().includes("unnamed")) {
              fetchedArea = parts[1]?.trim(); 
            }
          }

          const fetchedCity =
            address.city ||
            address.town ||
            address.village ||
            address.state_district ||
            parts[2]?.trim() ||
            "Ahmedabad";

          setArea(fetchedArea || "Ahmedabad");
          setCity(fetchedCity || "");
        } catch (err) {
          console.error("Geocoding error:", err);
          setArea("Ahmedabad");
          setCity("");
        } finally {
          setIsLocLoading(false);
        }
      },
      () => {
        // Fallback if permission denied
        setArea("Ahmedabad");
        setCity("");
        setIsLocLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setProfileData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user profile", error);
        }
      }
    }
    if (isProfileOpen && !profileData) {
      fetchProfile();
    }
  }, [user, isProfileOpen, profileData]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <div className="flex items-center justify-between py-4 px-4 sticky top-0 z-50 bg-white/90 dark:bg-[#0A0F1C]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-[0_4px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-500/10 rounded-full text-orange-500 dark:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-colors duration-300">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 transition-colors duration-300">
              {isLocLoading ? "Locating" : (area === city || !area ? city : area)} <ChevronDown className="w-4 h-4 text-orange-500 shrink-0" />
            </h2>
            {isLocLoading ? (
               <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-3 w-32 rounded mt-1 transition-colors"></div>
            ) : (
               <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] transition-colors duration-300">
                 {area !== city && area ? city : ""}
               </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-95"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-95"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PROFILE DRAWER/MODAL */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-[80%] max-w-sm h-full bg-white dark:bg-[#0F172A] border-l border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col pt-6 px-6 relative transition-colors">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">Profile</h2>
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg mb-4">
                {profileData?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">
                {profileData ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'Guest User' : 'Loading...'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-3 transition-colors">{user?.email || "No email"}</p>
              <Badge className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 uppercase tracking-widest text-xs px-3 py-1 transition-colors">
                {profileData?.role || 'Customer'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between w-full p-4 mb-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 transition-colors">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Dark Mode</span>
              <button 
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out flex items-center ${
                  theme === 'dark' ? 'bg-orange-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
              </button>
            </div>
            
            <div className="mt-auto mb-8">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-slate-700 text-red-500 dark:text-red-400 font-semibold py-3.5 rounded-xl transition-all active:scale-95 border border-slate-200 dark:border-slate-700 hover:border-red-500/30 shadow-sm dark:shadow-lg"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// === SEARCH BAR ===
interface SearchBarProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onFilterClick?: () => void;
}

export function SearchBar({ searchQuery = "", setSearchQuery, onFilterClick }: SearchBarProps) {
  return (
    <div className="px-4 py-3 sticky top-[72px] z-40 bg-white/90 dark:bg-[#0A0F1C]/90 backdrop-blur-md transition-colors duration-300">
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-orange-500 transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Search restaurants..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery?.(e.target.value)}
          className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-full py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 shadow-sm dark:shadow-lg transition-all duration-300"
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          <button onClick={onFilterClick} className="p-2 rounded-full text-slate-400 dark:text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors active:scale-95">
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
      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm dark:shadow-xl ${
        active 
          ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white border-2 border-orange-200 dark:border-orange-300 shadow-[0_4px_15px_rgba(249,115,22,0.3)] dark:shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-105" 
          : "bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:group-hover:bg-slate-700 active:scale-95"
      }`}>
        {icon}
      </div>
      <span className={`text-[11px] font-semibold text-center leading-tight tracking-wide transition-colors duration-300 ${active ? "text-orange-600 dark:text-orange-400" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"}`}>
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
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight transition-colors duration-300">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 font-medium transition-colors duration-300">{subtitle}</p>}
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 dark:from-emerald-900 to-slate-800 dark:to-slate-900 border border-emerald-400/30 dark:border-emerald-500/30 p-6 shadow-xl dark:shadow-2xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all duration-300 group">
        
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-400/20 dark:bg-emerald-500/20 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-400/40 dark:group-hover:bg-emerald-500/40 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-orange-400/20 dark:bg-orange-500/20 rounded-full blur-[40px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-[60%] space-y-2">
          <Badge className="bg-orange-500 hover:bg-orange-600 border-none text-[10px] tracking-wider uppercase px-2 py-0.5 shadow-[0_0_10px_rgba(249,115,22,0.5)]">Limited Time</Badge>
          <h2 className="text-2xl font-black italic text-white leading-tight drop-shadow-md">
            FLAT <span className="text-transparent bg-clip-text bg-gradient-to-br from-orange-300 to-yellow-200 dark:from-orange-400 dark:to-yellow-300">50% OFF</span> <br/>ON DINING
          </h2>
          <p className="text-xs text-emerald-100/90 dark:text-emerald-100/70 font-medium">Valid on select premium restaurants.</p>
        </div>
        
        <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-emerald-400/20 dark:from-emerald-500/20 to-transparent rounded-full border border-emerald-400/40 dark:border-emerald-500/40 flex items-center justify-center shadow-[inset_0_0_30px_rgba(16,185,129,0.2)] dark:shadow-[inset_0_0_30px_rgba(16,185,129,0.3)] group-hover:rotate-[15deg] transition-transform duration-500">
          <CirclePercent className="w-12 h-12 text-emerald-300 dark:text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)] dark:drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
        </div>
      </div>
    </div>
  );
}
