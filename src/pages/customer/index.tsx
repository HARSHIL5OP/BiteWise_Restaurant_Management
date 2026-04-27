import { useState, useEffect } from "react";
import { Coffee, Pizza, Leaf, Store, UtensilsCrossed, Wine, PartyPopper, MapPin, Sparkles, Check, X, SlidersHorizontal } from "lucide-react";
import RestaurantCard from "./components/RestaurantCard";
import { LocationBar, SearchBar, CategoryChip, SectionHeader, OfferBanner } from "./components/SharedUI";
import { getAllRestaurants, getRestaurantMenu } from "@/services/restaurantService";
import { useAuth } from "@/contexts/AuthContext";


/*
const DUMMY_RESTAURANTS = [
  {
    id: "r1",
    name: "The Mocha Grill",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    rating: 4.5,
    reviews: "1.2k",
    cuisine: "Continental, Italian",
    price: "₹1,200 for two",
    location: "Bodakdev, Ahmedabad",
    distance: "2.4 km",
    offers: ["Flat 20% OFF", "Free Dessert"]
  },
  {
    id: "r2",
    name: "Spice Symphony",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800",
    rating: 4.8,
    reviews: "3.4k",
    cuisine: "North Indian, Mughlai",
    price: "₹1,800 for two",
    location: "Thaltej, Ahmedabad",
    distance: "1.2 km",
    offers: ["Flat 15% OFF", "1+1 Drinks"]
  },
  {
    id: "r3",
    name: "Zen Gardens",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800",
    rating: 4.3,
    reviews: "850",
    cuisine: "Asian, Sushi",
    price: "₹2,500 for two",
    location: "Sarkhej, Ahmedabad",
    distance: "4.5 km",
    offers: ["Complimentary Soup"]
  },
  {
    id: "r4",
    name: "Tuscany Terrace",
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800",
    rating: 4.6,
    reviews: "2.1k",
    cuisine: "Italian, Mediterranean",
    price: "₹2,000 for two",
    location: "Vastrapur, Ahmedabad",
    distance: "3.1 km",
    offers: ["Flat 10% OFF", "Live Music"]
  }
];
*/



export default function CustomerHome() {
  const { userProfile } = useAuth();
  const firstName = userProfile?.firstName || "Guest";
  const formattedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const headerTitle = !userProfile ? "Loading..." : `${formattedName}, what's on your mind?`;

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const [filters, setFilters] = useState({
    category: "",
    isNew: false,
    diet: "", 
    cuisine: "",
    nearMe: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [availableCuisines, setAvailableCuisines] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [nearbyLocales, setNearbyLocales] = useState<string[]>([]);
  const [localesLoading, setLocalesLoading] = useState(true);

  // Quick categories
  const quickCategories = [
    { id: "category-Cafe", label: "Cafes", icon: <Coffee className="w-6 h-6" /> },
    { id: "category-Restaurant", label: "Family", icon: <UtensilsCrossed className="w-6 h-6" /> },
    { id: "diet-pure_veg", label: "Pure Veg", icon: <Leaf className="w-6 h-6" /> },
    { id: "isNew-true", label: "New", icon: <Store className="w-6 h-6" /> },
    { id: "cuisine-Italian", label: "Italian", icon: <Pizza className="w-6 h-6" /> },
    { id: "category-QSR", label: "Quick Bites", icon: <PartyPopper className="w-6 h-6" /> },
  ];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          setUserLocation(null);
          setLocalesLoading(false);
        }
      );
    } else {
      setLocalesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLocation) {
      setNearbyLocales(["Bodakdev", "Thaltej", "Navrangpura", "Satellite", "Vastrapur"]);
      setLocalesLoading(false);
      return;
    }

    const fetchLocales = async () => {
      try {
        setLocalesLoading(true);
        const query = `
          [out:json];
          (
            node["place"="suburb"](around:8000,${userLocation.lat},${userLocation.lng});
            node["place"="neighbourhood"](around:8000,${userLocation.lat},${userLocation.lng});
          );
          out 10;
        `;
        const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        const names = data.elements
          .map((e: any) => e.tags?.name)
          .filter((name: string) => name && name.length > 2);
          
        const uniqueNames = Array.from(new Set<string>(names)).slice(0, 8);
        
        if (uniqueNames.length > 0) {
          setNearbyLocales(uniqueNames);
        } else {
          setNearbyLocales(["Downtown", "City Center", "North Suburbs", "South Suburbs"]);
        }
      } catch (err) {
        console.error("Error fetching nearby locales:", err);
        setNearbyLocales(["Bodakdev", "Thaltej", "Navrangpura", "Satellite"]);
      } finally {
        setLocalesLoading(false);
      }
    };

    fetchLocales();
  }, [userLocation]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const cuisinesSet = new Set<string>();
    const categoriesSet = new Set<string>();
    restaurants.forEach(r => {
      if (r.cuisineType) r.cuisineType.forEach((c: string) => cuisinesSet.add(c.trim()));
      if (r.outletType) categoriesSet.add(r.outletType.trim());
    });
    setAvailableCuisines(Array.from(cuisinesSet).filter(Boolean).sort());
    setAvailableCategories(Array.from(categoriesSet).filter(Boolean).sort());
  }, [restaurants]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const query = debouncedSearchQuery.toLowerCase();
    const matchesSearch = query === "" || 
      restaurant.name?.toLowerCase().includes(query) ||
      restaurant.cuisineType?.join(" ").toLowerCase().includes(query) ||
      restaurant.location?.city?.toLowerCase().includes(query) ||
      restaurant.location?.address?.toLowerCase().includes(query) ||
      restaurant.location?.area?.toLowerCase().includes(query) ||
      restaurant.outletType?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // 1. Category
    if (filters.category && restaurant.outletType !== filters.category) return false;

    // 2. New (Added within last 30 days)
    if (filters.isNew) {
      if (!restaurant.createdAt) return false;
      const createdAtMs = restaurant.createdAt.toMillis ? restaurant.createdAt.toMillis() : (restaurant.createdAt.seconds * 1000);
      if ((Date.now() - createdAtMs) > 30 * 24 * 60 * 60 * 1000) return false;
    }

    // 3. Dietary
    if (filters.diet) {
      const isJain = !!restaurant.isJainAvailable;
      const rType = restaurant.restaurantType || "Both"; // Fallback if missing
      const servesNonVeg = rType === "Non-Veg" || rType === "Both";
      
      if (filters.diet === "pure_veg" && servesNonVeg) return false;
      if (filters.diet === "jain" && !isJain) return false;
      if (filters.diet === "veg_jain" && (!isJain || servesNonVeg)) return false;
      if (filters.diet === "non_veg" && !servesNonVeg) return false;
    }

    // 4. Cuisine
    if (filters.cuisine && !restaurant.cuisineType?.includes(filters.cuisine)) return false;

    // 5. Near Me (Within 10km)
    if (filters.nearMe && userLocation && restaurant.location?.lat && restaurant.location?.lng) {
      const dist = calculateDistance(userLocation.lat, userLocation.lng, restaurant.location.lat, restaurant.location.lng);
      if (dist > 10) return false;
    }

    return true;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllRestaurants();
        const restaurantsWithMenu = await Promise.all(
          data.map(async (restaurant: any) => {
            const menu = await getRestaurantMenu(restaurant.id);
            return {
              ...restaurant,
              menu
            };
          })
        );
        setRestaurants(restaurantsWithMenu);
      } catch (err) {
        console.error("Error fetching restaurants:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePreBook = () => {
    const options = {
      key: "rzp_test_yourkey", // Replace with actual key if available
      amount: 50000, // INR 500 in paise
      currency: "INR",
      name: "BiteWise Pre-book",
      description: "Exclusive Offer Reservation",
      handler: function (response: any) {
        alert("Payment Successful! Your offer is reserved. Payment ID: " + response.razorpay_payment_id);
      },
      prefill: {
        name: userProfile?.firstName || "Guest",
        email: userProfile?.email || ""
      },
      theme: {
        color: "#F97316"
      }
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  return (
    <div className="bg-slate-50 dark:bg-[#0A0F1C] min-h-screen text-slate-900 dark:text-slate-200 pb-20 font-sans max-w-md mx-auto shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x border-slate-200 dark:border-slate-900 overflow-x-hidden relative scroll-smooth selection:bg-orange-500/30 transition-colors duration-300">
      
      {/* 1. Location Bar (Sticky Top) */}
      <LocationBar />

      {/* 2. Search Bar (Sticky under Location) */}
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} onFilterClick={() => setShowFilters(true)} />

      {/* 3. Horizontal Category Scroll */}
      <div className="py-2 mt-2">
        <div className="flex gap-4 overflow-x-auto px-4 snap-x pb-4 scrollbar-hide">
          {quickCategories.map((cat, idx) => {
            const [type, val] = cat.id.split("-");
            const isActive = (filters as any)[type] === (val === "true" ? true : val);
            
            return (
              <div 
                key={idx}
                onClick={() => {
                  if (isActive) {
                    setFilters({...filters, [type]: val === "true" ? false : ""});
                  } else {
                    setFilters({...filters, [type]: val === "true" ? true : val});
                  }
                }}
              >
                <CategoryChip 
                  label={cat.label} 
                  icon={cat.icon} 
                  active={isActive} 
                />
              </div>
            );
          })}
        </div>
      </div>


      {/* 5. Spotlight Section */}
      {/*
      <SectionHeader title="In the spotlight" subtitle="Trending places around you" actionText="View all" />
      <div className="flex gap-4 overflow-x-auto px-4 snap-x pb-6 pt-2 scrollbar-hide">
        {DUMMY_RESTAURANTS.slice(0, 3).map((rest) => (
          <div key={rest.id} className="min-w-[85%] snap-center shrink-0">
            <RestaurantCard {...rest} />
          </div>
        ))}
      </div>
      */}



        {/* 8. Main Restaurant Stack */}
      <div className="border-t border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-slate-100/50 dark:from-slate-900/30 to-slate-50 dark:to-[#0A0F1C] pt-6 rounded-t-[3rem] transition-colors duration-300">
        <div className="px-4 mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 transition-colors">
            {loading ? "Loading..." : filteredRestaurants.length} places to <span className="bg-orange-500 text-white px-2 py-0.5 rounded-lg rotate-2 shadow-lg">dine out</span>
          </h2>
        </div>

        <div className="px-4 space-y-5 pb-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl h-[300px] w-full transition-colors"></div>
            ))
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">No restaurants found</p>
            </div>
          ) : (
            filteredRestaurants.map((restaurant) => {
              const dummyImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800";
              
              let distStr = "Near you";
              if (userLocation && restaurant.location?.lat && restaurant.location?.lng) {
                 const dist = calculateDistance(userLocation.lat, userLocation.lng, restaurant.location.lat, restaurant.location.lng);
                 distStr = dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
              }
              
              const dynamicOffers = [];
              if (restaurant.averagePriceForTwo > 1000) dynamicOffers.push("Premium Dining");
              if (restaurant.isJainAvailable) dynamicOffers.push("Jain Available");
              if (dynamicOffers.length === 0) dynamicOffers.push("Open Now");

              return (
                <RestaurantCard
                  key={restaurant.id}
                  id={restaurant.id}
                  name={restaurant.name || "Sample Restaurant"}
                  image={restaurant.bannerImage || dummyImage}
                  rating={restaurant.averageRating || 4.2}
                  reviews={restaurant.reviewCount ? `${restaurant.reviewCount}` : "New"}
                  cuisine={restaurant.cuisineType?.join(", ") || "Multi Cuisine"}
                  price={`₹${restaurant.averagePriceForTwo || 500} for two`}
                  location={restaurant.location?.city || "Ahmedabad"}
                  distance={distStr}
                  offers={dynamicOffers}
                />
              );
            })
            )}
        </div>
      </div>

        {/* 4. Banner Section */}
          <OfferBanner />


      {/* 6. Personalized Section - Small Grids */}
      <div className="bg-slate-100/50 dark:bg-slate-900/50 py-6 my-2 border-y border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <SectionHeader title={headerTitle} subtitle="Curated specifically for your taste buds." />
        <div className="px-4 grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-[#1e293b] dark:to-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg active:scale-95 transition-all flex flex-col justify-end min-h-[120px] relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition-colors"></div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white z-10 w-3/4 transition-colors">Restaurants near me</h4>
            <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 flex items-center justify-center z-10 transition-colors">
              <span className="text-orange-500 text-xs">→</span>
            </div>
          </div>
          <div 
            onClick={handlePreBook}
            className="bg-gradient-to-br from-white to-slate-50 dark:from-[#1e293b] dark:to-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg active:scale-95 transition-all flex flex-col justify-end min-h-[120px] relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors"></div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white z-10 w-3/4 transition-colors">Pre-book exclusive offers</h4>
            <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 flex items-center justify-center z-10 transition-colors">
              <span className="text-emerald-500 text-xs">→</span>
            </div>
          </div>
      </div>

      {/* FILTER DRAWER - Premium UI */}
      {showFilters && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowFilters(false)}
          />
          
          {/* Bottom Sheet */}
          <div className="relative bg-white dark:bg-[#0F172A] rounded-t-3xl w-full max-h-[85vh] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300">
            {/* Drag Handle & Header */}
            <div className="sticky top-0 bg-white dark:bg-[#0F172A] rounded-t-3xl z-10 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mt-3 mb-2" />
              <div className="flex items-center justify-between px-6 pb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Filters</h3>
                <button 
                  onClick={() => setShowFilters(false)} 
                  className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
              {/* Sort & Quick Filters */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Sort & Highlights</h4>
                <div className="flex flex-col gap-3">
                  <label className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${filters.nearMe ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-slate-200 dark:border-slate-800 bg-transparent'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${filters.nearMe ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`font-semibold ${filters.nearMe ? 'text-orange-700 dark:text-orange-400' : 'text-slate-700 dark:text-slate-200'}`}>Restaurants Near Me</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Within 10km radius</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${filters.nearMe ? 'border-orange-500 bg-orange-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {filters.nearMe && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={filters.nearMe} onChange={() => setFilters({...filters, nearMe: !filters.nearMe})} />
                  </label>
                  
                  <label className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${filters.isNew ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-slate-200 dark:border-slate-800 bg-transparent'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${filters.isNew ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`font-semibold ${filters.isNew ? 'text-orange-700 dark:text-orange-400' : 'text-slate-700 dark:text-slate-200'}`}>Newly Added</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Onboarded recently</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${filters.isNew ? 'border-orange-500 bg-orange-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {filters.isNew && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={filters.isNew} onChange={() => setFilters({...filters, isNew: !filters.isNew})} />
                  </label>
                </div>
              </div>

              {/* Dietary Preferences */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Dietary Preferences</h4>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "", label: "Any" },
                    { id: "pure_veg", label: "Pure Veg" },
                    { id: "jain", label: "Jain Available" },
                    { id: "veg_jain", label: "Veg + Jain" },
                    { id: "non_veg", label: "Non-Veg" }
                  ].map(d => {
                    const isActive = filters.diet === d.id;
                    return (
                      <button 
                        key={d.id}
                        onClick={() => setFilters({...filters, diet: d.id})}
                        className={`py-2.5 px-5 rounded-full text-sm font-semibold transition-all active:scale-95 ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-500 shadow-sm dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/50' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 dark:bg-[#1e293b] dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'}`}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Category */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Outlet Type</h4>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => setFilters({...filters, category: ""})}
                    className={`py-2 px-5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${filters.category === "" ? 'bg-orange-50 text-orange-700 border border-orange-500 shadow-sm dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/50' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 dark:bg-[#1e293b] dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'}`}
                  >
                    All Types
                  </button>
                  {availableCategories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setFilters({...filters, category: cat})}
                      className={`py-2 px-5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${filters.category === cat ? 'bg-orange-50 text-orange-700 border border-orange-500 shadow-sm dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/50' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 dark:bg-[#1e293b] dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuisines */}
              <div className="pb-8">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Cuisines</h4>
                <div className="flex flex-wrap gap-2.5">
                  <button 
                    onClick={() => setFilters({...filters, cuisine: ""})}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-all active:scale-95 ${filters.cuisine === "" ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                  >
                    All
                  </button>
                  {availableCuisines.map(c => (
                    <button 
                      key={c}
                      onClick={() => setFilters({...filters, cuisine: c})}
                      className={`py-2 px-4 rounded-lg text-sm font-medium transition-all active:scale-95 ${filters.cuisine === c ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-4 bg-white dark:bg-[#0F172A] border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-10 rounded-b-3xl">
              <div className="flex items-center gap-4 max-w-md mx-auto">
                <button 
                  onClick={() => setFilters({category: "", isNew: false, diet: "", cuisine: "", nearMe: false})}
                  className="px-6 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-3.5 bg-orange-500 text-white rounded-xl font-bold shadow-[0_4px_15px_rgba(249,115,22,0.3)] active:scale-[0.98] transition-all text-center tracking-wide"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      

      



      {/* 7. Popular Locations Chips */}
      <div className="py-6 mb-8 mt-4 border-t border-slate-200 dark:border-slate-800/80">
        <SectionHeader title="Nearby locales" subtitle="Explore popular neighborhoods around you" />
        <div className="px-4 flex flex-wrap gap-2.5">
          {localesLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-10 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full"></div>
            ))
          ) : (
            nearbyLocales.map((loc, idx) => (
              <div 
                key={idx} 
                onClick={() => setSearchQuery(loc)}
                className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-500/10 dark:hover:border-orange-500/30 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer active:scale-95 shadow-sm flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 opacity-60" />
                {loc}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
