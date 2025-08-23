// LoginForm.js

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // For error messages
  const [verifiedMessage, setVerifiedMessage] = useState(""); // For success messages

  const { login } = useAuth(); // Use AuthContext hook
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
      const response = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Token received:", data.token);
        
        // Use setTimeout to ensure state updates are processed
        setTimeout(() => {
          login(data.token, data.user);
          navigate("/search");
        }, 0);
      } else {
        const errorData = await response.json();
        console.error("Login failed:", errorData);
        setErrorMessage(errorData.error || "Invalid login credentials");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {/* Keep banners OUTSIDE input groups so icons never shift */}
      <div className="form-message-slot">
        {verifiedMessage && (
          <div className="success-message">
            <i className="bi bi-check-csrcle-fill me-2"></i>
            {verifiedMessage}
          </div>
        )}
        {errorMessage && (
          <div className="error-message">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMessage}
          </div>
        )}
      </div>

      <div className="input-group">
        <label htmlFor="username">Username</label>
        <div className="input-wrap">
          <input
            type="text"
            id="username"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <i className="bi bi-person-circle end-icon" aria-hidden="true"></i>
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="password">Password</label>
        <div className="input-wrap">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <i
            className={`end-icon bi ${
              showPassword ? "bi-eye-slash-fill" : "bi-eye-fill"
            }`}
            role="button"
            tabIndex={0}
            onClick={togglePasswordVisibility}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && togglePasswordVisibility()}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
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
