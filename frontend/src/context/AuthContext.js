import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../axiosConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on first mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('auth') || 'null');
      if (saved?.token) {
        setToken(saved.token);
        setUser(saved.user || null);
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${saved.token}`;
      }
    } catch {/* ignore */}
    setLoading(false);
  }, []);

  // Login: save token+user, set default header, persist
  const login = (jwt, userObj) => {
    setToken(jwt);
    setUser(userObj || null);
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${jwt}`;
    localStorage.setItem('auth', JSON.stringify({ token: jwt, user: userObj || null }));
  };

  // Logout: clear everything
  const logout = () => {
    setToken(null);
    setUser(null);
    delete axiosInstance.defaults.headers.common.Authorization;
    localStorage.removeItem('auth');
  };

  const value = useMemo(() => ({ token, user, loading, login, logout }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
