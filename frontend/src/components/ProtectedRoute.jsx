import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { token, user, loading } = useAuth();

  if (loading) return null; 

  // Not logged in → go to login
  if (!token) return <Navigate to="/login" replace />;

  // Role check (only if a role prop is provided)
  if (role && user?.role !== role) {
    // You can send to a 403 page if you have one; otherwise back to a safe page
    return <Navigate to="/shifts" replace />;
  }

  return children;
};

export default ProtectedRoute;
