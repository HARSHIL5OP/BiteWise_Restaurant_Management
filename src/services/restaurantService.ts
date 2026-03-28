import { collection, doc, setDoc, serverTimestamp, getDocs, getDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/lib/firebase";

export interface RestaurantData {
  name: string;
  description: string;
  logoUrl: string;
  bannerImage: string;
  ownerName: string;
  ownerEmail: string;
  password?: string;
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
    if (!data.password) throw new Error("Password is required for new restaurant owners");
    
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.ownerEmail, data.password);
    const uid = userCredential.user.uid;

    // 2. Save User in Firestore
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      userId: uid,
      name: data.ownerName,
      email: data.ownerEmail,
      role: "restaurant_admin",
      restaurantId: "",
      createdAt: serverTimestamp()
    });

    // 3. Create Restaurant
    const restaurantRef = doc(collection(db, "restaurants"));
    
    const newDoc = {
      restaurantId: restaurantRef.id,
      name: data.name,
      description: data.description,
      logoUrl: data.logoUrl || "",
      bannerImage: data.bannerImage || "",
      ownerId: uid,
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
      restaurantStatus: "approved",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false
    };

    await setDoc(restaurantRef, newDoc);

    // 4. Update user with Restaurant ID
    await updateDoc(userRef, {
      restaurantId: restaurantRef.id
    });

    return newDoc.restaurantId;
  } catch (error) {
    console.error("Error adding restaurant: ", error);
    throw error;
  }
};

export const getAllRestaurants = async () => {
  try {
    const snapshot = await getDocs(collection(db, "restaurants"));
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((r: any) => !r.isDeleted && r.restaurantStatus === "approved");
  } catch (error) {
    console.error("Error fetching restaurants: ", error);
    throw error;
  }
};

export const getRestaurantById = async (id: string) => {
  try {
    const docRef = doc(db, "restaurants", id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  } catch (error) {
    console.error("Error fetching restaurant: ", error);
    throw error;
  }
};
