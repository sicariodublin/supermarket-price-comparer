// AuthContext.js
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../services/api";

export const AuthContext = createContext();

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const navigate = useNavigate();

  // Check if token and user exist on app load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    }
  }, []);

  // Logout function to clear auth data
  const logout = useCallback(async () => {
    try {
      await http.post("/logout", null, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch (error) {
      console.error("Error during logout:", error.message);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      clearTimeout(timeoutId);
      setTimeoutId(null);
      navigate("/"); // Redirect to Home
    }
  }, [navigate, timeoutId, token]);

  // Start or restart inactivity timer
  const startInactivityTimer = useCallback(() => {
    clearTimeout(timeoutId);
    const newTimeout = setTimeout(() => {
      console.log("Logging out due to inactivity...");
      logout();
    }, 55 * 60 * 1000); // 55 minutes
    setTimeoutId(newTimeout);
  }, [timeoutId, logout]);

  // Login function to set token and user data
  const login = useCallback((newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    startInactivityTimer();
    setShowInactivityModal(false);
  }, [startInactivityTimer]);

  // Reset inactivity timer on user activity
  const resetInactivityTimer = useCallback(() => {
    if (isAuthenticated) startInactivityTimer();
  }, [isAuthenticated, startInactivityTimer]);

  // Attach event listeners for user activity
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click'];
    events.forEach((event) => window.addEventListener(event, resetInactivityTimer));

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
    };
  }, [resetInactivityTimer]);

  const handleInactivityModalClose = () => {
    setShowInactivityModal(false);
    navigate('/login');
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isAuthenticated,
    token,
    user,
    login,
    logout
  }), [isAuthenticated, token, user, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      {showInactivityModal && (
        <div className="inactivity-modal">
          <div className="modal-content">
            <p>You have been logged out due to inactivity.</p>
            <button onClick={handleInactivityModalClose}>OK</button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext;
