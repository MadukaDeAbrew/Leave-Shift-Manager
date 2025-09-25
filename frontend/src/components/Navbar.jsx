// frontend/src/components/Navbar.js
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true, state: { msg: "You have been logged out." } });
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-[#1e3a8a] text-white shadow-md z-50">
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center h-14">
        {/* Brand / Home */}
        <Link to="/" className="font-bold text-lg">
          Leave & Shift Manager
        </Link>

        {/* Right side nav */}
        <div className="flex items-center space-x-4">
          {token && (
            <>
              <Link to="/profile" className="hover:underline">
                Profile
              </Link>
              <Link to="/change-password" className="hover:underline">
                Change Password
              </Link>

              {/* Admin-only */}
              {user?.systemRole === "admin" && (
                <Link to="/employees" className="hover:underline">
                  Employees
                </Link>
              )}

              <button
                onClick={onLogout}
                className="ml-2 bg-red-600 px-3 py-1 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </>
          )}

          {!token && (
            <Link to="/login" className="hover:underline">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
