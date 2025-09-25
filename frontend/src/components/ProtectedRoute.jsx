import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-4">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  // FIX: use systemRole instead of role
  if (requireAdmin && user.systemRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
