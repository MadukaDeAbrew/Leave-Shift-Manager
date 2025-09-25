// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth, AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import LeavesPage from "./pages/LeavesPage";
import ShiftsPage from "./pages/ShiftsPage";
import MySwapRequests from "./pages/MySwapRequests";
import AdminLeaves from "./pages/AdminLeaves";
import AdminSwapRequests from "./pages/AdminSwapRequests";
import Employees from "./pages/Employees"; 
import Profile from "./pages/Profile";          // ✅ import
import ChangePassword from "./pages/ChangePassword";  // ✅ import

function AppShell() {
  const { user, restoreSession } = useAuth();

  useEffect(() => {
    restoreSession?.();
  }, [restoreSession]);

  return (
    <Router>
      <Navbar />

      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <Register />}
        />

        {/* Protected (any logged-in user) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/leaves" element={<LeavesPage />} />
          <Route path="/shifts" element={<ShiftsPage />} />
          <Route path="/my-swaps" element={<MySwapRequests />} />
          <Route path="/profile" element={<Profile />} />               {/* ✅ added */}
          <Route path="/change-password" element={<ChangePassword />} /> {/* ✅ added */}
        </Route>

        {/* Admin-only */}
        <Route element={<ProtectedRoute requireAdmin={true} />}>
          <Route path="/admin/leaves" element={<AdminLeaves />} />
          <Route path="/admin/swaps" element={<AdminSwapRequests />} />
          <Route path="/employees" element={<Employees />} />
        </Route>

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to={user ? "/" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
