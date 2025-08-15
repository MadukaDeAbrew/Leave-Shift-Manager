import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav
      className="bg-blue-600 text-white p-4 flex justify-between items-center"
      style={{
        backgroundImage: `url('taskmanagerv0.3/frontend/public/group.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Link to="/" className="text-2xl font-bold drop-shadow-lg">
        Leave & Shift Manager
      </Link>
      <div>
        {user ? (
          <>
          
            <Link to="/login" className="mr-4 hover:underline">Login</Link>

            <Link to="/shifts" className="mr-4 hover:underline">Shifts</Link>
            <Link to="/leaves" className="mr-4 hover:underline">Leaves</Link>
            <Link to="/my-swaps" className="mr-4 hover:underline">My Swaps</Link>
                    {user?.role === 'admin' && (
            <Link to="/admin/swaps" className="mr-4 hover:underline">Admin: Swaps</Link> 
  )}


            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-700 drop-shadow"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="mr-4 hover:underline drop-shadow">
              Login
            </Link>
            <Link
              to="/register"
              className="bg-green-500 px-4 py-2 rounded hover:bg-green-700 drop-shadow"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
