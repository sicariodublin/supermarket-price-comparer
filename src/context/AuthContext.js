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
  const [user, setUser] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const navigate = useNavigate();

  // Restore user data from localStorage on app load (token lives in HttpOnly cookie)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Logout function to clear auth data
  const logout = useCallback(async () => {
    try {
      // Cookie is cleared server-side; withCredentials sends it automatically
      await http.post("/logout");
    } catch (error) {
      console.error("Error during logout:", error.message);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
      clearTimeout(timeoutId);
      setTimeoutId(null);
      navigate("/");
    }
  }, [navigate, timeoutId]);

  // Start or restart inactivity timer
  const startInactivityTimer = useCallback(() => {
    clearTimeout(timeoutId);
    const newTimeout = setTimeout(() => {
      console.log("Logging out due to inactivity...");
      setShowInactivityModal(true);
      logout();
    }, 55 * 60 * 1000); // 55 minutes
    setTimeoutId(newTimeout);
  }, [timeoutId, logout]);

  // Login function — token is set as HttpOnly cookie by the server
  const login = useCallback((userData) => {
    setUser(userData);
    setIsAuthenticated(true);
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
    user,
    login,
    logout
  }), [isAuthenticated, user, login, logout]);

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
