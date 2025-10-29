import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../services/api";
import AuthContext from "../context/AuthContext";

function Logout() {
  const { isAuthenticated, setToken, setIsAuthenticated, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await http.post("/logout");
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
