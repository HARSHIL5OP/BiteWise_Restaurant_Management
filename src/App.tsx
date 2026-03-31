import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import HomePage from "./pages/Home";
import AdminPage from "./admin/AdminDashboard";
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
import CustomerTableView from "./pages/customer/CustomerTableView";

// NGO
import NgoLayout from "./ngo/NgoLayout";
import NgoDashboard from "./ngo/dashboard/NgoDashboard";
import RequestList from "./ngo/requests/RequestList";
import NgoReports from "./ngo/reports/NgoReports";
import NgoSettings from "./ngo/settings/NgoSettings";

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
  const { user, role, userProfile, loading } = useAuth();

  if (loading || (user && !userProfile)) return <SplashScreen />;

  if (user) {
    if (role === "main-admin") return <Navigate to="/main-admin" replace />;
    if (role === "restaurant_admin") return <Navigate to="/admin" replace />;

    // ✅ FIXED NGO REDIRECT
    if (role === "ngo") return <Navigate to="/ngo/dashboard" replace />;

    if (role === "staff") {
      // If profile is loaded but staffRole is still undefined, we are still preparing
      if (userProfile?.staffRole === undefined) return <SplashScreen />;

      if (userProfile.staffRole === "chef") {
        return <Navigate to="/chef" replace />;
      }
      if (userProfile.staffRole === "waiter") {
        return <Navigate to="/waiter" replace />;
      }
      // Fallback for null or unrecognized staff roles (e.g., manager, cashier)
      // return <Navigate to="/home" replace />;
    }

    if (role === "customer") return <Navigate to="/customer" replace />;

    return <Navigate to="/home" replace />;
  }

  return children;
};

const ProtectedRoute = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading || (user && !userProfile)) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

const RoleRoute = ({
  allowedRoles,
  allowedStaffRoles,
  children,
}: {
  allowedRoles: string[];
  allowedStaffRoles?: string[];
  children: JSX.Element;
}) => {
  const { user, role, userProfile, loading } = useAuth();

  if (loading || (user && !userProfile)) return <SplashScreen />;

  const isRoleAllowed = role && allowedRoles.includes(role);
  const isStaffRoleAllowed =
    allowedStaffRoles &&
    role === "staff" &&
    userProfile?.staffRole &&
    allowedStaffRoles.includes(userProfile.staffRole);

  console.log("ROLE:", role);
  console.log("STAFF ROLE:", userProfile?.staffRole);

  if (!isRoleAllowed && !isStaffRoleAllowed) {
    console.warn(
      `Unauthorized access attempt: Role '${role}' (StaffRole: '${userProfile?.staffRole}') tried to access restricted route.`
    );

    if (role === "main-admin") return <Navigate to="/main-admin" replace />;
    if (role === "restaurant_admin") return <Navigate to="/admin" replace />;

    // ✅ FIXED NGO REDIRECT
    if (role === "ngo") return <Navigate to="/ngo/dashboard" replace />;

    if (role === "staff") {
      if (userProfile?.staffRole === "chef") {
        return <Navigate to="/chef" replace />;
      }

      if (userProfile?.staffRole === "waiter") {
        return <Navigate to="/waiter" replace />;
      }
    }

    if (role === "customer") return <Navigate to="/customer" replace />;

    return <Navigate to="/home" replace />;
  }

  return children;
};

const RoleRedirector = () => {
  const { user, role, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const location = window.location.pathname;

  useEffect(() => {
    if (loading || !user || !userProfile || !role) return;

    // List of public paths where we might want to redirect from
    const publicPaths = ["/", "/home", "/login", "/signup"];
    if (!publicPaths.includes(location)) return;

    if (role === "main-admin") navigate("/main-admin", { replace: true });
    else if (role === "restaurant_admin") navigate("/admin", { replace: true });
    else if (role === "ngo") navigate("/ngo/dashboard", { replace: true });
    else if (role === "staff") {
      const sRole = userProfile?.staffRole;
      if (sRole === "chef") navigate("/chef", { replace: true });
      else if (sRole === "waiter") navigate("/waiter", { replace: true });
    }
  }, [user, role, userProfile, loading, location, navigate]);

  return null;
};

// --- APP ROUTER ---

const AppRoutes = () => {
  return (
    <>
      <RoleRedirector />
      <Routes>
      {/* --- Public Routes --- */}
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />

      {/* --- Public Home --- */}
      <Route path="/home" element={<HomePage />} />
      <Route path="/home/:tableId" element={<HomePage />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/social-impact" element={<SocialImpact />} />

      {/* --- Main Admin --- */}
      <Route path="/main-admin" element={<MainAdminPage />} />

      {/* --- NGO (UPDATED) --- */}
      <Route path="/ngo" element={<NgoLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<NgoDashboard />} />
        <Route path="requests" element={<RequestList />} />
        <Route path="reports" element={<NgoReports />} />
        <Route path="settings" element={<NgoSettings />} />
      </Route>

      {/* --- Customer --- */}
      <Route path="/customer" element={
        <RoleRoute allowedRoles={["customer"]}>
          <CustomerHome />
        </RoleRoute>
      } />

      <Route path="/customer/restaurant/:id" element={
        <RoleRoute allowedRoles={["customer"]}>
          <RestaurantDetail />
        </RoleRoute>
      } />

      <Route path="/customer/restaurant/:id/tables" element={
        <RoleRoute allowedRoles={["customer"]}>
          <CustomerTableView />
        </RoleRoute>
      } />

      {/* --- Protected Routes --- */}
      <Route element={<ProtectedRoute />}>

        {/* Chef */}
        <Route path="/chef" element={
          <RoleRoute allowedRoles={[]} allowedStaffRoles={["chef"]}>
            <ChefKDS />
          </RoleRoute>
        } />

        {/* Waiter */}
        <Route path="/waiter" element={
          <RoleRoute allowedRoles={[]} allowedStaffRoles={["waiter"]}>
            <WaiterPage />
          </RoleRoute>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <RoleRoute allowedRoles={["restaurant_admin"]}>
            <AdminPage />
          </RoleRoute>
        } />

      </Route>

      {/* --- 404 --- */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;