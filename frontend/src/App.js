/*
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import LeavesPage from './pages/LeavesPage'; 
import AdminLeaves from './pages/AdminLeaves';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/leaves" element={ <LeavesPage />}  />
        <Route path="/admin/leaves" element={<ProtectedRoute role="admin"><AdminLeaves /></ProtectedRoute>}/>

      </Routes>
    </Router>
  );
}

export default App;
*/
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import LeavesPage from './pages/LeavesPage';
import ShiftsPage from './pages/ShiftsPage';
import MySwapRequests from './pages/MySwapRequests';
import AdminSwapRequests from './pages/AdminSwapRequests';
import AdminLeaves from './pages/AdminLeaves.jsx'; // <-- add this if you created it

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/shifts" replace />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />}/>
        <Route path="/register" element={<Register />}/>

        {/* Protected routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaves"
          element={
            <ProtectedRoute>
              <LeavesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shifts"
          element={
            <ProtectedRoute>
              <ShiftsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-swaps"
          element={
            <ProtectedRoute>
              <MySwapRequests />
            </ProtectedRoute>
          }
        />

        {/* Admin-only routes */}
        <Route
          path="/admin/swaps"
          element={
            <ProtectedRoute role="admin">
              <AdminSwapRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/leaves"
          element={
            <ProtectedRoute role="admin">
              <AdminLeaves />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/shifts" replace />} />
      </Routes>
    </Router>
  );
}
