import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const Logout = () => {
  const { isAuthenticated, token, setToken, setIsAuthenticated, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (token) {
        console.log("Token sent during logout:", token);

        // Send logout request to the server
        const response = await fetch("http://localhost:5001/api/logout", {
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
    } catch (error) {
      console.error("Error during logout:", error.message);
    } finally {
      // Clear local storage and context state
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      navigate("/"); // Redirect to Home
    }
  };

  if (!isAuthenticated) return null; // Don't show the button if not authenticated

  return (
    <button className="logout-button" onClick={handleLogout}>
      Logout
    </button>
  );
};

export default Logout;
