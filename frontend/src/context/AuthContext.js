// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axiosInstance from "../axiosConfig";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on first mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("auth") || "null");
      if (saved?.token) {
        setToken(saved.token);

        // Normalize role field to systemRole
        const normalizedUser = saved.user
          ? {
              ...saved.user,
              systemRole: saved.user.systemRole || saved.user.role || "employee",
            }
          : null;

        setUser(normalizedUser);
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${saved.token}`;
      }
    } catch {
      // ignore malformed storage
    } finally {
      setLoading(false);
    }
  }, []);

  // Login: save token+user, set default header, persist
  const login = (jwt, userObj) => {
    const normalizedUser = userObj
      ? {
          ...userObj,
          systemRole: userObj.systemRole || userObj.role || "employee",
        }
      : null;

    setToken(jwt);
    setUser(normalizedUser);
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
    localStorage.setItem("auth", JSON.stringify({ token: jwt, user: normalizedUser }));
  };

  // Logout: clear everything
  const logout = () => {
    setToken(null);
    setUser(null);
    delete axiosInstance.defaults.headers.common["Authorization"];
    localStorage.removeItem("auth");
  };

  // 🔑 Correct check
  const isAdmin = !!user && user.systemRole === "admin";

  const value = useMemo(
    () => ({ token, user, isAdmin, loading, login, logout }),
    [token, user, isAdmin, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
