import { collection, addDoc, getDocs, doc, updateDoc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/lib/firebase";

export interface NgoData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    city: string;
    lat: number;
    lng: number;
  };
  registrationNo: string;
  isVerified: boolean;
  operatingHours: {
    open: string;
    close: string;
  };
  totalDonationsReceived: number;
  userId?: string;
  password?: string;
  createdAt?: any;
  updatedAt?: any;
}

export const getAllNgos = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "ngos"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (NgoData & { id: string })[];
  } catch (error) {
    console.error("Error fetching NGOs:", error);
    throw error;
  }
};

export const createNgo = async (data: Omit<NgoData, "isVerified" | "totalDonationsReceived" | "createdAt" | "updatedAt">) => {
  try {
    if (!data.password) throw new Error("Password is required for NGO registration");

    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const uid = userCredential.user.uid;

    // 2. Save User in Firestore
    const firstName = data.contactPerson.split(" ")[0];
    const lastName = data.contactPerson.split(" ").slice(1).join(" ") || "";

    await setDoc(doc(db, "users", uid), {
      firstName,
      lastName,
      email: data.email,
      phone: data.phone,
      role: "ngo",
      profileImage: "",
      loyaltyPoints: 0,
      createdAt: serverTimestamp(),
      isVerified: true
    });

    // 3. Create NGO Document
    const { password, ...ngoDataWithoutPassword } = data;
    const defaultData = {
      ...ngoDataWithoutPassword,
      isVerified: false,
      totalDonationsReceived: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId: uid
    };
    const docRef = await addDoc(collection(db, "ngos"), defaultData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating NGO:", error);
    throw error;
  }
};

export const updateNgoStatus = async (id: string, isVerified: boolean) => {
  try {
    const ngoRef = doc(db, "ngos", id);
    await updateDoc(ngoRef, {
      isVerified,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating NGO status:", error);
    throw error;
  }
};

export const updateNgoDetails = async (id: string, data: Partial<NgoData>) => {
  try {
    const ngoRef = doc(db, "ngos", id);
    await updateDoc(ngoRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating NGO details:", error);
    throw error;
  }
};

export const getNgoById = async (id: string) => {
  try {
    const docRef = doc(db, "ngos", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as NgoData & { id: string };
    }
    return null;
  } catch (error) {
    console.error("Error fetching NGO by ID:", error);
    throw error;
  }
};
