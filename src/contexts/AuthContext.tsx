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

type UserRole = "customer" | "cashier" | "waiter" | "chef" | "admin";

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  createdAt: any; // Firestore Timestamp
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // --------------------
  // Auth State Listener
  // --------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
        } else {
          // 🔥 IMPORTANT: don't error, just wait
          console.warn("User profile not found yet, waiting for creation...");
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // --------------------
  // Email / Password Signup
  // --------------------
  const signup = async (
    
    email: string,
    password: string,
    additionalData?: { firstName?: string; lastName?: string }
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        role: "customer",
        createdAt: serverTimestamp(),
        ...additionalData,
      };

      await setDoc(doc(db, "users", user.uid), newProfile);
      alert("Signup successful!");
      setUserProfile(newProfile);

      return userCredential;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // --------------------
  // Login
  // --------------------
  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // --------------------
  // Google Login
  // --------------------
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const ref = doc(db, "users", user.uid);

    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email,
        role: "customer",
        createdAt: serverTimestamp(),
        firstName: user.displayName?.split(" ")[0] || "",
        lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
      };
      await setDoc(ref, profile);
      setUserProfile(profile);
    } else {
      setUserProfile(snap.data() as UserProfile);
    }

    return result;
  };

  // --------------------
  // GitHub Login
  // --------------------
  const loginWithGithub = async () => {
    const result = await signInWithPopup(auth, githubProvider);
    const user = result.user;
    const ref = doc(db, "users", user.uid);

    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email,
        role: "customer",
        createdAt: serverTimestamp(),
        firstName: user.displayName || "",
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
    setUserProfile(null);
    await signOut(auth);
  };

  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signup,
        login,
        loginWithGoogle,
        loginWithGithub,
        logout,
        resetPassword,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
