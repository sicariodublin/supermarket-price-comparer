// LoginForm.js

import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import "../styles/Login.css";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // For error messages
  const [verifiedMessage, setVerifiedMessage] = useState(""); // For success messages

  const { login } = useContext(AuthContext); // Use AuthContext
  const navigate = useNavigate(); // For navigation
  const location = useLocation(); // For handling query parameters

  // Check for email verification success message in query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get("verified") === "true") {
      setVerifiedMessage("Email verified successfully! You can now log in.");
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      });

      if (response.ok) {
        const data = await response.json(); // Fetch response data here
        console.log("Token received:", data.token); // Debug log
        login(data.token); // Authenticate
        navigate("/search"); // Redirect
      } else {
        const errorData = await response.json(); // Fetch error data here
        console.error("Login failed:", errorData); // Debug log
        setErrorMessage(errorData.error || "Invalid login credentials");
      }
    } catch (error) {
      console.error("Error during login:", error); // Debug log
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  return (
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="input-group">
        {verifiedMessage && <div className="success-message">{verifiedMessage}</div>} {/* Success message */}
        {errorMessage && <div className="error-message">{errorMessage}</div>} {/* Error message */}
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <div style={{ position: "absolute", right: "12px", top: "32px" }}>
            <p className="text-sz color-icon">
              <i className="bi bi-check-circle-fill"></i>
            </p>
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="icon-container" onClick={togglePasswordVisibility}>
            <i
              className={
                showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"
              }
            ></i>
          </div>
        </div>
        <button type="submit" className="login-button">
          Log In
        </button>
        <div className="additional-options">
          <Link to="/register">Don't have an account? Register here.</Link>
        </div>
      </form>
  );
}

export default LoginForm;
