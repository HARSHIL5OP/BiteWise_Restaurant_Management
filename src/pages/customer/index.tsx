import { useState, useEffect } from "react";
import { Coffee, Pizza, Leaf, Store, UtensilsCrossed, Wine, PartyPopper } from "lucide-react";
import RestaurantCard from "@/components/customer/RestaurantCard";
import { LocationBar, SearchBar, CategoryChip, SectionHeader, OfferBanner } from "@/components/customer/SharedUI";
import { getAllRestaurants, getRestaurantMenu } from "@/services/restaurantService";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES = [
  { label: "Cafes", icon: <Coffee className="w-6 h-6" /> },
  { label: "Family", icon: <UtensilsCrossed className="w-6 h-6" />, active: true },
  { label: "Pure Veg", icon: <Leaf className="w-6 h-6" /> },
  { label: "New", icon: <Store className="w-6 h-6" /> },
  { label: "Rooftop", icon: <Wine className="w-6 h-6" /> },
  { label: "Buffets", icon: <Pizza className="w-6 h-6" /> },
  { label: "Quick Bites", icon: <PartyPopper className="w-6 h-6" /> },
];

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

const LOCATIONS = ["Bodakdev", "Thaltej", "Navrangpura", "Satellite", "Prahlad Nagar", "Vastrapur"];

export default function CustomerHome() {
  const { userProfile } = useAuth();
  const firstName = userProfile?.firstName || "Guest";
  const formattedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const headerTitle = !userProfile ? "Loading..." : `${formattedName}, what's on your mind?`;

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const query = debouncedSearchQuery.toLowerCase();

    return (
      restaurant.name?.toLowerCase().includes(query) ||
      restaurant.cuisineType?.join(" ").toLowerCase().includes(query) ||
      restaurant.location?.city?.toLowerCase().includes(query)
    );
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

  return (
    <div className="bg-slate-50 dark:bg-[#0A0F1C] min-h-screen text-slate-900 dark:text-slate-200 pb-20 font-sans max-w-md mx-auto shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x border-slate-200 dark:border-slate-900 overflow-x-hidden relative scroll-smooth selection:bg-orange-500/30 transition-colors duration-300">
      
      {/* 1. Location Bar (Sticky Top) */}
      <LocationBar />

      {/* 2. Search Bar (Sticky under Location) */}
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* 3. Horizontal Category Scroll */}
      <div className="py-2 mt-2">
        <div className="flex gap-4 overflow-x-auto px-4 snap-x pb-4 scrollbar-hide">
          {CATEGORIES.map((cat, idx) => (
            <CategoryChip 
              key={idx} 
              label={cat.label} 
              icon={cat.icon} 
              active={cat.active} 
            />
          ))}
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
              return (
                <RestaurantCard
                key={restaurant.id}
                id={restaurant.id}
                name={restaurant.name || "Sample Restaurant"}
                image={restaurant.bannerImage || dummyImage}
                  rating={restaurant.averageRating || 4.2}
                  reviews="1.2k"
                  cuisine={restaurant.cuisineType?.join(", ") || "Multi Cuisine"}
                  price={restaurant.priceRange || "₹₹"}
                  location={restaurant.location?.city || "Ahmedabad"}
                  distance={restaurant.location?.address ? "1.2 km" : "Unknown"}
                  offers={["Flat 20% OFF", "Free Dessert"]} // Keep dummy offers
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
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-[#1e293b] dark:to-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg active:scale-95 transition-all flex flex-col justify-end min-h-[120px] relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors"></div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white z-10 w-3/4 transition-colors">Pre-book exclusive offers</h4>
            <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 flex items-center justify-center z-10 transition-colors">
              <span className="text-emerald-500 text-xs">→</span>
            </div>
          </div>
        </div>
      </div>

      

      



      {/* 7. Popular Locations Chips */}
      <SectionHeader title="Popular locales" subtitle="Explore popular neighborhoods" />
      <div className="px-4 flex flex-wrap gap-2 mb-8">
        {LOCATIONS.map((loc, idx) => (
          <div key={idx} className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer active:scale-95 shadow-sm">
            {loc}
          </div>
        ))}
      </div>

    </div>
  );
}
