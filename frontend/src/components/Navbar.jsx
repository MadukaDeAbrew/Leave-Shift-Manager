// Updatded Navbar.jsx - Maduka
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = () => {
    logout?.();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="bg-[#1e3a8a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold">
          Leave & Shift Manager
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            {/* Always visible to all */}
            <NavLink to="/" className={({ isActive }) => (isActive ? "underline" : "")}>
              Home
            </NavLink>
            <NavLink to="/leaves" className={({ isActive }) => (isActive ? "underline" : "")}>
              Leaves
            </NavLink>
            <NavLink to="/shifts" className={({ isActive }) => (isActive ? "underline" : "")}>
              Shifts
            </NavLink>
            <NavLink to="/my-swaps" className={({ isActive }) => (isActive ? "underline" : "")}>
              My Swaps
            </NavLink>

            {/* Admin-only */}
            {isAdmin && (
              <>
                <NavLink to="/admin/leaves" className={({ isActive }) => (isActive ? "underline" : "")}>
                  Admin Leaves
                </NavLink>
                <NavLink to="/admin/swaps" className={({ isActive }) => (isActive ? "underline" : "")}>
                  Admin Swaps
                </NavLink>
                <NavLink to="/employees" className={({ isActive }) => (isActive ? "underline" : "")}>
                  Employees
                </NavLink>
              </>
            )}

            {/* Profile + security */}
            <NavLink to="/profile" className={({ isActive }) => (isActive ? "underline" : "")}>
              My Profile
            </NavLink>
            <NavLink to="/change-password" className={({ isActive }) => (isActive ? "underline" : "")}>
              Change Password
            </NavLink>

            {/* User name to display- if user name is not give then email */}
            <span className="text-sm opacity-80">
              {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
            </span>
            <button
              onClick={doLogout}
              className="bg-white/10 px-3 py-1 rounded hover:bg-white/20"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <NavLink to="/login" className={({ isActive }) => (isActive ? "underline" : "")}>
              Login
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => (isActive ? "underline" : "")}>
              Register
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}
