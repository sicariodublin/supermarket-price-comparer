import React from "react";
import { useAuth } from "../context/AuthContext";

function Logout() {
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <button className="logout-button" onClick={logout}>
      Logout
    </button>
  );
};

export default Logout;
