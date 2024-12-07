// AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);
  const [showInactivityModal, setShowInactivityModal] = useState(false); // For custom modal
  const navigate = useNavigate();

  // Check if token exists on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setIsAuthenticated(true);
      setToken(storedToken);
      startInactivityTimer(); // Start the timer on app load
    }
  }, []);

  const login = (newToken) => {
    console.log("Saving token to localStorage:", newToken);
    setToken(newToken);
    setIsAuthenticated(true);
    localStorage.setItem("token", newToken);
    startInactivityTimer(); // Start the timer on login
    setShowInactivityModal(false); // Reset inactivity modal state
  };

  const logout = async () => {
    try {
      if (token) {
        console.log("Token sent during logout:", token);
  
        // Send logout request to the server
        const response = await fetch("http://localhost:5000/api/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (response.ok) {
          console.log("Logout successful");
        } else {
          const errorData = await response.json();
          console.error("Error during logout:", errorData.message);
        }
      }
  
      // Clear local storage and context state
      localStorage.removeItem("token");
      setToken(null);
      setIsAuthenticated(false);
      navigate("/"); // Redirect to login page
    } catch (error) {
      console.error("Error during logout:", error.message);
    }
  };
  
  // Start or restart the inactivity timer
  const startInactivityTimer = () => {
    clearTimeout(timeoutId); // Clear any existing timer
    const newTimeoutId = setTimeout(() => {
      logout(true); // Auto-logout after 5 minutes due to inactivity
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
    setTimeoutId(newTimeoutId);
  };

  // Reset the inactivity timer on user activity
  const resetInactivityTimer = () => {
    if (isAuthenticated) {
      startInactivityTimer();
    }
  };

  // Attach event listeners for user activity
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click'];
    events.forEach((event) => window.addEventListener(event, resetInactivityTimer));

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
    };
  }, [isAuthenticated]); // Re-run if the auth state changes

  const handleInactivityModalClose = () => {
    setShowInactivityModal(false);
    navigate('/login'); // Redirect to login page
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token, setToken, setIsAuthenticated }}>
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

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
