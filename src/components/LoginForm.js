// LoginForm.js (Component)
import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import "../styles/Login.css";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // To display error messages

  const { login } = useContext(AuthContext); // Use AuthContext
  const navigate = useNavigate(); // Use navigate instead of history

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        login(data.token); // Store the token and authenticate
        navigate("/search"); // Redirect to the search page after login
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || "Invalid login credentials"); // Display a specific error message
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
      <div className="input-group">
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
            className={showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}
          ></i>
        </div>
      </div>
      {errorMessage && <p className="error-message">{errorMessage}</p>}{" "}
      {/* Display error messages */}
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
