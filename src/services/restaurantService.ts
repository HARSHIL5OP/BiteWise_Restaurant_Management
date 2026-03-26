import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface RestaurantData {
  name: string;
  description: string;
  logoUrl: string;
  bannerImage: string;
  ownerId: string;
  location: {
    address: string;
    city: string;
    lat: number;
    lng: number;
  };
  cuisineType: string[];
  priceRange: string;
  operatingHours: {
    open: string;
    close: string;
  };
}

export const addRestaurant = async (data: RestaurantData) => {
  try {
    const restaurantRef = doc(collection(db, "restaurants"));
    
    const newDoc = {
      restaurantId: restaurantRef.id,
      name: data.name,
      description: data.description,
      logoUrl: data.logoUrl || "",
      bannerImage: data.bannerImage || "",
      ownerId: data.ownerId || "admin",
      location: {
        address: data.location.address,
        city: data.location.city,
        lat: Number(data.location.lat),
        lng: Number(data.location.lng)
      },
      cuisineType: data.cuisineType,
      priceRange: data.priceRange,
      operatingHours: {
        open: data.operatingHours.open,
        close: data.operatingHours.close
      },
      averageRating: 0,
      restaurantStatus: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false
    };

    await setDoc(restaurantRef, newDoc);

    return newDoc.restaurantId;
  } catch (error) {
    console.error("Error adding restaurant: ", error);
    throw error;
  }
};
