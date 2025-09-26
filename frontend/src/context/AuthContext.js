// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axiosInstance from "../axiosConfig";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restoring session from localStorage on first mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("auth") || "null");
      if (saved?.token) {
        setToken(saved.token);
        setUser(saved.user || null);
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${saved.token}`;
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (jwt, userObj) => {
    setToken(jwt);
    setUser(userObj || null);
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
    localStorage.setItem("auth", JSON.stringify({ token: jwt, user: userObj || null }));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    delete axiosInstance.defaults.headers.common["Authorization"];
    localStorage.removeItem("auth");
  };

  // checking role using user.type (from wrapUser)
  const isAdmin = !!user && user.type === "Admin";

  const value = useMemo(
    () => ({ token, user, isAdmin, loading, login, logout }),
    [token, user, isAdmin, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
