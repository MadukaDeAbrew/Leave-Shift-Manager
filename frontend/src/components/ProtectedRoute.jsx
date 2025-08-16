import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { token, user, loading } = useAuth();

  if (loading) return null; 

  // Not logged in → go to login
  if (!token) return <Navigate to="/login" replace state={{ msg: 'Please log in to continue.' }}/>;

  
  if (role && user?.role !== role) {
    return <Navigate to="/shifts" replace state={{ msg: 'You do not have permission to view that page.' }}/>;
  }

  return children;
};

export default ProtectedRoute;
