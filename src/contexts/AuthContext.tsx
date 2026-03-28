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
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// --- Types ---

type UserRole = "customer" | "cashier" | "waiter" | "chef" | "restaurant_admin";

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  createdAt: any;
  firstName?: string;
  lastName?: string;
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
          const profile = snap.data() as UserProfile;
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

    const newProfile: UserProfile = {
      uid: authUser.uid,
      email: authUser.email,
      role: "customer", // Default role
      createdAt: serverTimestamp(),
      ...additionalData,
    };

    // Create profile Source of Truth
    await setDoc(doc(db, "users", authUser.uid), newProfile);

    // Optimistic update to avoid flicker before Firestore listener fires
    setUserProfile(newProfile);

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
      const profile: UserProfile = {
        uid: authUser.uid,
        email: authUser.email,
        role: "customer",
        createdAt: serverTimestamp(),
        firstName: authUser.displayName?.split(" ")[0] || "",
        lastName: authUser.displayName?.split(" ").slice(1).join(" ") || "",
      };
      await setDoc(ref, profile);
      setUserProfile(profile);
    } else {
      setUserProfile(snap.data() as UserProfile);
    }
    return result;
  };

  const loginWithGithub = async () => {
    const result = await signInWithPopup(auth, githubProvider);
    const authUser = result.user;
    const ref = doc(db, "users", authUser.uid);

    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const profile: UserProfile = {
        uid: authUser.uid,
        email: authUser.email,
        role: "customer",
        createdAt: serverTimestamp(),
        firstName: authUser.displayName || "",
        lastName: "",
      };
      await setDoc(ref, profile);
      setUserProfile(profile);
    } else {
      setUserProfile(snap.data() as UserProfile);
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
