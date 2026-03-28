import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Heart, Share2, Star, MapPin, 
  Clock, Tag, Car, Leaf, CreditCard, ChevronRight, CheckCircle2 
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getRestaurantById } from "@/services/restaurantService";

const AMENITIES = [
  { icon: <Car className="w-5 h-5 text-slate-400" />, label: "Valet Parking" },
  { icon: <Leaf className="w-5 h-5 text-emerald-500" />, label: "Pure Veg Options" },
  { icon: <CreditCard className="w-5 h-5 text-blue-400" />, label: "Cards & UPI Accepted" },
];

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("offers");

  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const data = await getRestaurantById(id as string);
        setRestaurant(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchRestaurant();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-[#0A0F1C] min-h-screen text-slate-200 font-sans max-w-md mx-auto pt-10 px-4">
        <div className="animate-pulse bg-slate-900 h-64 rounded-2xl w-full mb-4"></div>
        <div className="animate-pulse bg-slate-900 h-32 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="bg-[#0A0F1C] min-h-screen text-slate-200 font-sans max-w-md mx-auto flex items-center justify-center">
        <p className="text-xl font-bold text-slate-400">Restaurant not found</p>
      </div>
    );
  }

  const dummyHeroImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200";
  const imgUrl = restaurant?.bannerImage || dummyHeroImage;
  const name = restaurant?.name || "Sample Restaurant";
  const rating = restaurant?.averageRating || 4.2;
  const cuisine = restaurant?.cuisineType?.join(", ") || "Multi Cuisine";
  const price = restaurant?.priceRange || "₹₹";
  const address = restaurant?.location?.address || "Ahmedabad";
  const timing = (restaurant?.operatingHours?.open && restaurant?.operatingHours?.close)
    ? `${restaurant?.operatingHours?.open} - ${restaurant?.operatingHours?.close}`
    : "11:00 AM - 11:00 PM";

  return (
    <div className="bg-[#0A0F1C] min-h-screen text-slate-200 font-sans max-w-md mx-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x border-slate-900 overflow-x-hidden relative scroll-smooth selection:bg-orange-500/30 pb-24">
      
      {/* 1. Hero Image Section */}
      <div className="relative h-[300px] w-full">
        <div className="absolute inset-0 bg-slate-900 animate-pulse" /> {/* Skeleton base */}
        <img 
          src={imgUrl} 
          alt={name} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1C] via-[#0A0F1C]/40 to-black/30"></div>

        {/* Top Navbar overlay */}
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 sticky-nav transition-all">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors active:scale-90"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex gap-3">
            <button className="w-10 h-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors active:scale-90">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-orange-500 transition-colors active:scale-90">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Restaurant Info Card ( overlapping hero ) */}
      <div className="relative -mt-16 px-4 z-10">
        <div className="bg-[#0F172A]/90 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-6 shadow-2xl">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-black text-white leading-tight">{name}</h1>
              <p className="text-sm text-slate-400 mt-1 line-clamp-1">{cuisine}</p>
            </div>
            <div className="flex flex-col items-center bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-2xl px-3 py-1.5 shadow-sm shrink-0">
              <div className="flex items-center gap-1 font-black text-lg">
                {rating} <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="text-[10px] font-medium tracking-wide">3.4k REVIEWS</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5 py-3 border-y border-slate-800/60">
            <div className="flex items-center gap-1.5 text-sm text-slate-300 font-medium">
              <Clock className="w-4 h-4 text-orange-500" />
              {timing}
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
            <div className="text-sm font-medium text-slate-300">
              {price}
            </div>
          </div>

          <div className="flex items-start gap-2 mt-4 text-sm text-slate-400">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-snug">
              {address}
              <span className="block mt-1 font-semibold text-orange-400">1.2 km away</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Tabs Navigation */}
      <div className="sticky top-0 z-40 bg-[#0A0F1C]/90 backdrop-blur-xl border-b border-slate-900 mt-4 px-2">
        <div className="flex overflow-x-auto scrollbar-hide py-3 items-center gap-2">
          {["Offers", "Menu", "Photos", "About"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${
                activeTab === tab.toLowerCase() 
                ? "bg-slate-100 text-[#0A0F1C] shadow-lg scale-105" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6 space-y-8 animate-in fade-in duration-500">

        {/* 4. Offers Section */}
        {activeTab === 'offers' && (
          <section className="space-y-4 slide-in-from-right-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Tag className="text-orange-500 w-5 h-5" /> Available Offers
            </h3>
            
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-900/10 border border-orange-500/30 rounded-2xl p-4 flex gap-4 active:scale-95 transition-transform cursor-pointer shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/30 transition-colors"></div>
              <div className="w-12 h-12 bg-orange-500 text-white rounded-xl shadow-lg flex items-center justify-center font-black text-xl shrink-0 z-10">
                %
              </div>
              <div className="z-10">
                <h4 className="text-white font-bold text-lg mb-1">Flat 25% OFF</h4>
                <p className="text-xs text-orange-200/70">Applicable on entire dining bill. Valid today.</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 active:scale-95 transition-transform cursor-pointer shadow-lg">
              <div className="w-12 h-12 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl flex items-center justify-center font-black shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg mb-1">Up to ₹500 Cashback</h4>
                <p className="text-xs text-slate-400">Pay via HDFC Credit Cards. Min order ₹1,500.</p>
              </div>
            </div>
          </section>
        )}

        {/* 5. Menu / Category Preview */}
        {activeTab === 'menu' && (
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-white">Menu Highlights</h3>
            <div className="grid grid-cols-2 gap-3">
              {["Starters", "Main Course", "Breads", "Desserts"].map((cat, i) => (
                <div key={i} className="relative h-32 rounded-2xl overflow-hidden border border-slate-800 shadow-md group cursor-pointer active:scale-95 transition-all">
                  <div className="absolute inset-0 bg-slate-900/50 group-hover:bg-slate-900/40 transition-colors z-10"></div>
                  <img src={`https://images.unsplash.com/photo-1546069901-${1000 + i}?auto=format&fit=crop&w=400&q=80`} alt={cat} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <span className="bg-black/40 backdrop-blur-md text-white font-bold px-3 py-1.5 rounded-lg border border-white/20 text-sm shadow-xl drop-shadow-md">
                      {cat}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-4 bg-slate-900 border border-slate-800 rounded-2xl text-orange-500 font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors active:scale-[0.98]">
              View Full Menu <ChevronRight className="w-4 h-4" />
            </button>
          </section>
        )}

        {/* 6. Photos */}
        {activeTab === 'photos' && (
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-white">Ambience & Food</h3>
            <div className="columns-2 gap-3 space-y-3">
              {[800, 600, 700, 500, 900].map((h, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-slate-800 relative break-inside-avoid shadow-lg group">
                  <img src={`https://images.unsplash.com/photo-1555396273-${400 + i}?auto=format&fit=crop&w=400&h=${h}&q=80`} alt="Gallery" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. About & Amenities & Map */}
        {activeTab === 'about' && (
          <section className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Amenities</h3>
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 grid gap-4">
                {AMENITIES.map((amt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="p-2 border border-slate-800 bg-slate-950 rounded-xl shadow-inner">
                      {amt.icon}
                    </div>
                    <span className="text-sm font-semibold text-slate-300">{amt.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex justify-between items-end">
                Location
                <span className="text-xs text-orange-500 font-bold uppercase tracking-wider">Get Directions</span>
              </h3>
              <div className="h-48 rounded-2xl border border-slate-800 overflow-hidden relative group cursor-pointer shadow-lg active:scale-[0.98] transition-transform">
                <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors z-10"></div>
                {/* Mock Map Background */}
                <div className="w-full h-full bg-[url('https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/blogs/15923/images/wIF15f7iQR2cOQ6D6FmF_Google_Maps_Dark_Mode.png')] bg-cover bg-center grayscale-[30%] opacity-80" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-4 h-4 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,1)]" />
                </div>
                <div className="absolute bottom-3 left-3 right-3 bg-[#0F172A]/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 z-20 text-xs text-slate-300 text-center font-medium shadow-xl">
                  {address}
                </div>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* Sticky Bottom Pre-book Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-6 pt-4 bg-gradient-to-t from-[#0A0F1C] via-[#0A0F1C]/90 to-transparent z-50">
        <button className="w-full bg-slate-100 hover:bg-white text-[#0A0F1C] font-black py-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Book a Table with Offers
        </button>
      </div>

    </div>
  );
}
