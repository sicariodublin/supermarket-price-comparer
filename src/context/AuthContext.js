// AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Start as not authenticated
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const navigate = useNavigate();

  // Check if token and user exist on app load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    }
  }, []);
  

  // Login function to set token and user data
  const login = (newToken, userData) => {
    console.log("Logging in: ", newToken, userData);
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    startInactivityTimer();
    setShowInactivityModal(false);
  };

  // Logout function to clear auth data
  const logout = async () => {
    try {
      if (token) {
        await fetch("http://localhost:5000/api/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Error during logout:", error.message);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      navigate("/"); // Redirect to Home
    }
  };

  // Start or restart inactivity timer
  const startInactivityTimer = () => {
    clearTimeout(timeoutId);
    const newTimeout = setTimeout(() => {
      console.log("Logging out due to inactivity...");
      logout();
    }, 55 * 60 * 1000); // 5 minutes
    setTimeoutId(newTimeout);
  };

  // Reset inactivity timer on user activity
  const resetInactivityTimer = () => {
    if (isAuthenticated) startInactivityTimer();
  };

  // Attach event listeners for user activity
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click'];
    events.forEach((event) => window.addEventListener(event, resetInactivityTimer));

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
    };
  }, [isAuthenticated]);

  const handleInactivityModalClose = () => {
    setShowInactivityModal(false);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, login, logout }}>
      {children}
      {showInactivityModal && (
        <div className="inactivity-modal">
          <div className="modal-content">
            <p>You have been logged out due to inactivity.</p>
            <button onClick={() => navigate("/login")}>OK</button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
