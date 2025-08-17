/*
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();  //3.1
    navigate('/login', {   //3.2,3.3
      replace: true,
      state: { msg: 'You have been logged out.' },
    });
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
          
            

            <Link to="/shifts" className="mr-4 hover:underline">Shifts</Link>
            <Link to="/leaves" className="mr-4 hover:underline">Leaves</Link>
            <Link to="/my-swaps" className="mr-4 hover:underline">My Swaps</Link>
                    {user?.role === 'admin' && (
            <Link to="/admin/swaps" className="mr-4 hover:underline">Admin: Swaps</Link> 
  )}
              {user?.role === 'admin' && (
                <Link to="/admin/leaves" className="mr-4 hover:underline">Admin: Leaves</Link>
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
*/


// src/components/Navbar.jsx
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = () => {
    logout?.();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-[#1e3a8a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold">Leave & Shift Manager</Link>

        {user ? (
          <div className="flex items-center gap-4">
            <NavLink to="/" className={({isActive}) => isActive ? 'underline' : ''}>Home</NavLink>
            <NavLink to="/leaves" className={({isActive}) => isActive ? 'underline' : ''}>Leaves</NavLink>
            <NavLink to="/shifts" className={({isActive}) => isActive ? 'underline' : ''}>Shifts</NavLink>
            <NavLink to="/my-swaps" className={({isActive}) => isActive ? 'underline' : ''}>My Swaps</NavLink>

            {user.role === 'admin' && (
              <>
                <NavLink to="/admin/leaves" className={({isActive}) => isActive ? 'underline' : ''}>Admin Leaves</NavLink>
                <NavLink to="/admin/swaps" className={({isActive}) => isActive ? 'underline' : ''}>Admin Swaps</NavLink>
              </>
            )}

            <span className="text-sm opacity-80">{user.name}</span>
            <button onClick={doLogout} className="bg-white/10 px-3 py-1 rounded hover:bg-white/20">Logout</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <NavLink to="/login" className={({isActive}) => isActive ? 'underline' : ''}>Login</NavLink>
            <NavLink to="/register" className={({isActive}) => isActive ? 'underline' : ''}>Register</NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}
