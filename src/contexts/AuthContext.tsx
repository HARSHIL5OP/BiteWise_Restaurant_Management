import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  User,
  UserCredential,
} from "firebase/auth";
import { auth, db, googleProvider, githubProvider } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp, collectionGroup, query, where, getDocs, collection } from "firebase/firestore";

// --- Types ---

type UserRole = "customer" | "staff" | "ngo" | "main-admin" | "restaurant_admin";

export interface UserProfile {
  uid: string; // React state only
  restaurantId?: string; // React state only
  staffRole?: string; // e.g. 'chef', 'waiter', 'cashier'
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  role: UserRole;
  profileImage: string;
  loyaltyPoints: number;
  createdAt: any;
  lastLogin: any;
  isVerified: boolean;
  ngoId?: string; // React state only
  ngoName?: string; // React state only
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  role: UserRole | null; // EXPILICIT ROLE
  loading: boolean;
  signup: (
    email: string,
    password: string,
    additionalData?: { firstName?: string; lastName?: string }
  ) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  loginWithGoogle: () => Promise<UserCredential>;
  loginWithGithub: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// --- Provider ---

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Subscribe to Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Set the base user immediately
      setUser(currentUser);

      if (!currentUser) {
        // No user -> Clear everything and stop loading
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // 2. User exists -> Fetch Profile (Role source of truth)
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const profileData = snap.data();
          let currentRestaurantId = undefined;
          let currentStaffRole = undefined;
          
          if (profileData.role !== 'customer') {
            try {
              if (profileData.role === 'restaurant_admin' || profileData.role === 'owner') {
                  const { collection, query, where, getDocs } = await import('firebase/firestore');
                  const restQuery = query(collection(db, 'restaurants'), where('ownerId', '==', currentUser.uid));
                  const restSnap = await getDocs(restQuery);
                  if (!restSnap.empty) {
                      currentRestaurantId = restSnap.docs[0].id;
                  }
              } else if (profileData.role === 'ngo') {
                  const ngoQuery = query(collection(db, 'ngos'), where('userId', '==', currentUser.uid));
                  const ngoSnap = await getDocs(ngoQuery);
                  if (!ngoSnap.empty) {
                      const ngoData = ngoSnap.docs[0].data();
                      currentRestaurantId = ngoSnap.docs[0].id;
                      profileData.ngoId = ngoSnap.docs[0].id;
                      profileData.ngoName = ngoData.name;
                  }
              } else {
                  const staffQuery = query(collectionGroup(db, 'staff'), where('userId', '==', currentUser.uid));
                  const staffSnap = await getDocs(staffQuery);
                  if (!staffSnap.empty) {
                      currentRestaurantId = staffSnap.docs[0].data().restaurantId;
                      currentStaffRole = staffSnap.docs[0].data().role;
                  }
              }
            } catch (err) {
              console.error("Error fetching restaurantId mapping for user:", err);
            }
          }

          const profile: UserProfile = {
             uid: currentUser.uid,
             restaurantId: currentRestaurantId,
             staffRole: currentStaffRole,
             firstName: profileData.firstName || "",
             lastName: profileData.lastName || "",
             email: profileData.email || null,
             phone: profileData.phone || "",
             role: profileData.role || "customer",
             profileImage: profileData.profileImage || "",
             loyaltyPoints: profileData.loyaltyPoints || 0,
             createdAt: profileData.createdAt || null,
             lastLogin: profileData.lastLogin || null,
             isVerified: profileData.isVerified || false,
             ngoId: profileData.ngoId,
             ngoName: profileData.ngoName
          };
          setUserProfile(profile);
        } else {
          // Profile pending (signup race condition) or missing
          // Optimization: Could create a barebones profile here if needed, 
          // but for now, we wait or set null.
          console.warn(`User ${currentUser.uid} has no profile document.`);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      } finally {
        // 3. DONE -> Stop loading
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (
    email: string,
    password: string,
    additionalData?: { firstName?: string; lastName?: string }
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const authUser = userCredential.user;

    const newFirestoreData = {
      firstName: additionalData?.firstName || "",
      lastName: additionalData?.lastName || "",
      email: authUser.email,
      phone: "",
      role: "customer" as UserRole, // Default role
      profileImage: "",
      loyaltyPoints: 0,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      isVerified: false
    };

    // Create profile Source of Truth
    await setDoc(doc(db, "users", authUser.uid), newFirestoreData);

    // Optimistic update to avoid flicker before Firestore listener fires
    setUserProfile({ uid: authUser.uid, restaurantId: undefined, ...newFirestoreData });

    return userCredential;
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const authUser = result.user;
    const ref = doc(db, "users", authUser.uid);

    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const newFirestoreData = {
        firstName: authUser.displayName?.split(" ")[0] || "",
        lastName: authUser.displayName?.split(" ").slice(1).join(" ") || "",
        email: authUser.email,
        phone: "",
        role: "customer" as UserRole,
        profileImage: authUser.photoURL || "",
        loyaltyPoints: 0,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isVerified: true
      };
      await setDoc(ref, newFirestoreData);
      setUserProfile({ uid: authUser.uid, restaurantId: undefined, ...newFirestoreData });
    } else {
      // Use the logic in onAuthStateChanged to populate all fields accurately
      // but here we just wait for listener or fake it.
    }
    return result;
  };

  const loginWithGithub = async () => {
    const result = await signInWithPopup(auth, githubProvider);
    const authUser = result.user;
    const ref = doc(db, "users", authUser.uid);

    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const newFirestoreData = {
        firstName: authUser.displayName || "",
        lastName: "",
        email: authUser.email,
        phone: "",
        role: "customer" as UserRole,
        profileImage: authUser.photoURL || "",
        loyaltyPoints: 0,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isVerified: true
      };
      await setDoc(ref, newFirestoreData);
      setUserProfile({ uid: authUser.uid, restaurantId: undefined, ...newFirestoreData });
    } else {
      // Handled by listener
    }
    return result;
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Clean state immediately
      setUser(null);
      setUserProfile(null);
      // Optional: Clear any local storage/session storage your app might use
      sessionStorage.clear();
      localStorage.clear();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Derived Role
  const role = userProfile?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        role,
        loading,
        signup,
        login,
        loginWithGoogle,
        loginWithGithub,
        logout,
        resetPassword,
      }}
    >
      {/* DO NOT BLOCK RENDRING HERE. Let the Router handle 'Loading' vs 'Content' */}
      {/* Why? Because Route components need to exist to perform redirects. */}
      {children}
    </AuthContext.Provider>
  );
};
