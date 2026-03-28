import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import HomePage from "./pages/Home";
import AdminPage from "./pages/Admin";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import NotFound from "./pages/NotFound";
import ChefKDS from "./pages/ChefKDS";
import WaiterPage from "./pages/WaiterPage";
import SocialImpact from "./pages/SocialImpact";
import MainAdminPage from "./pages/main-admin";
import CustomerHome from "./pages/customer/index";
import RestaurantDetail from "./pages/customer/RestaurantDetail";

const queryClient = new QueryClient();

// --- GUARDS ---

const SplashScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-500"></div>
      <p className="text-slate-400 font-medium animate-pulse">Loading Application...</p>
    </div>
  </div>
);

const PublicOnly = ({ children }: { children: JSX.Element }) => {
  const { user, role, loading } = useAuth();

  if (loading) return <SplashScreen />;

  if (user) {
    if (role === "restaurant_admin") {
      return <Navigate to="/admin" replace />;
    }
    if (role === "chef") return <Navigate to="/chef" replace />;
    if (role === "waiter") return <Navigate to="/waiter" replace />;
    return <Navigate to="/home" replace />;
  }

  return children;
};

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

const RoleRoute = ({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: JSX.Element;
}) => {
  const { role, loading } = useAuth();

  if (loading) return <SplashScreen />;

  if (!role || !allowedRoles.includes(role)) {
    console.warn(
      `Unauthorized access attempt: Role '${role}' tried to access restricted route.`
    );

    // ✅ FIXED ADMIN ROLE HERE
    if (role === "chef") return <Navigate to="/chef" replace />;
    if (role === "waiter") return <Navigate to="/waiter" replace />;
    if (role === "restaurant_admin") return <Navigate to="/admin" replace />;

    return <Navigate to="/home" replace />;
  }

  return children;
};

// --- APP ROUTER ---

const AppRoutes = () => {
  return (
    <Routes>
      {/* --- Public Routes --- */}
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnly>
            <SignupPage />
          </PublicOnly>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnly>
            <ForgotPasswordPage />
          </PublicOnly>
        }
      />

      {/* --- Public Home --- */}
      <Route path="/home" element={<HomePage />} />
      <Route path="/home/:tableId" element={<HomePage />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/social-impact" element={<SocialImpact />} />

      {/* --- Main Admin --- */}
      <Route path="/main-admin" element={<MainAdminPage />} />

      {/* --- Customer --- */}
      <Route path="/customer" element={<CustomerHome />} />
      <Route path="/customer/restaurant/:id" element={<RestaurantDetail />} />

      {/* --- Protected Routes --- */}
      <Route element={<ProtectedRoute />}>

        {/* Chef */}
        <Route
          path="/chef"
          element={
            <RoleRoute allowedRoles={["chef", "restaurant_admin"]}>
              <ChefKDS />
            </RoleRoute>
          }
        />

        {/* Waiter */}
        <Route
          path="/waiter"
          element={
            <RoleRoute allowedRoles={["waiter", "restaurant_admin"]}>
              <WaiterPage />
            </RoleRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRoles={["restaurant_admin"]}>
              <AdminPage />
            </RoleRoute>
          }
        />
      </Route>

      {/* --- 404 --- */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;