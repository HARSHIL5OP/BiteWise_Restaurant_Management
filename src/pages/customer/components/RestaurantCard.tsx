import { Star, MapPin, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface RestaurantCardProps {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: string;
  cuisine: string;
  price: string;
  location: string;
  distance: string;
  offers: string[];
}

export default function RestaurantCard({
  id,
  name,
  image,
  rating,
  reviews,
  cuisine,
  price,
  location,
  distance,
  offers,
}: RestaurantCardProps) {
  return (
    <Link to={`/customer/restaurant/${id}`} className="block">
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg active:scale-[0.98] transition-all duration-300 group">
        
        {/* Image Container */}
        <div className="relative h-48 w-full overflow-hidden">
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
          
          {/* Wishlist heart removed */}

          <div className="absolute bottom-3 left-3 space-y-1.5 flex flex-col items-start w-3/4">
            {offers.slice(0, 2).map((offer, idx) => (
              <Badge key={idx} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold border-0 text-xs py-0.5 px-2 shadow-lg flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {offer}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 transition-colors duration-300">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1 transition-colors duration-300">{name}</h3>
            <div className="flex items-center gap-1 bg-emerald-600 text-white px-1.5 py-0.5 rounded-lg text-xs font-bold shadow-sm shrink-0">
              <Star className="w-3 h-3 fill-current" />
              {rating}
            </div>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mb-2 transition-colors duration-300">
            {cuisine} • {price}
          </p>

          <div className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-3 transition-colors duration-300">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300">
              <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="truncate max-w-[120px]">{location}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors duration-300"></div>
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md transition-colors duration-300">
              {distance}
            </div>
          </div>
        </div>
        
      </div>
    </Link>
  );
}
