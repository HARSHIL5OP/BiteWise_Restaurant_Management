import { collection, doc, setDoc, serverTimestamp, getDocs, getDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/lib/firebase";

export interface RestaurantData {
  name: string;
  description: string;
  logoUrl: any;
  bannerImage: any;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  location: {
    address: string;
    city: string;
    lat: number;
    lng: number;
  };
  cuisineType: string[];
  averagePriceForTwo: number;
  outletType: string;
  isJainAvailable: boolean;
  operatingHours: {
    open: string;
    close: string;
  };
}

export const addRestaurant = async (data: RestaurantData) => {
  try {
    if (!data.password) throw new Error("Password is required for new restaurant owners");
    
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const uid = userCredential.user.uid;

    // 2. Save User in Firestore completely matching schema
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      role: "restaurant_admin",
      profileImage: "",
      loyaltyPoints: 0,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      isVerified: false
    });

    // 3. Create Restaurant
    const restaurantRef = doc(collection(db, "restaurants"));
    
    const newDoc = {
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
      averagePriceForTwo: data.averagePriceForTwo,
      outletType: data.outletType,
      isJainAvailable: data.isJainAvailable,
      operatingHours: {
        open: data.operatingHours.open,
        close: data.operatingHours.close
      },
      averageRating: 0,
      totalOrders: 0,
      status: "Active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false
    };

    await setDoc(restaurantRef, newDoc);

    return restaurantRef.id;
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
      .filter((r: any) => !r.isDeleted);
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

export const getRestaurantMenu = async (restaurantId: string) => {
  try {
    const menuRef = collection(db, "restaurants", restaurantId, "menu");
    const snapshot = await getDocs(menuRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error fetching menu for ${restaurantId}: `, error);
    throw error;
  }
};
