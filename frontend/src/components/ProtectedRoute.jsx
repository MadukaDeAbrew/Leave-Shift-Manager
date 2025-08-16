import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { token, user, loading } = useAuth();

  // While restoring session from localStorage
  if (loading) return null; // or a spinner

  // Not logged in → send to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Role-gated route (e.g., admin-only)
  if (role && user?.role !== role) {
    return <Navigate to="/shifts" replace />;
  }

  return children;
}
