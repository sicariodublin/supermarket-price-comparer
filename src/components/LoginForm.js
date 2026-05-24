// LoginForm.js

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";
import { http } from "../services/api";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [verifiedMessage, setVerifiedMessage] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get("verified") === "true") {
      setVerifiedMessage("Email verified successfully! You can now log in.");
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowResend(false);
    setResendStatus("");

    try {
      const { data } = await http.post("/login", { email: username, password });
      setTimeout(() => {
        login(data.user);
        navigate("/search");
      }, 0);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.error || "Invalid login credentials";
      setErrorMessage(msg);
      if (error?.response?.status === 403 && msg.toLowerCase().includes("verify")) {
        setShowResend(true);
      }
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendStatus("");
    try {
      await http.post("/resend-verification", { email: username });
      setResendStatus("A new verification link has been sent — please check your inbox.");
    } catch {
      setResendStatus("Could not send the link. Please try again later.");
    } finally {
      setResendLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="form-message-slot">
        {verifiedMessage && (
          <div className="success-message">
            <i className="bi bi-check-circle-fill me-2"></i>
            {verifiedMessage}
          </div>
        )}
        {errorMessage && (
          <div className="error-message">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMessage}
            {showResend && (
              <div style={{ marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? "Sending…" : "Resend verification email"}
                </button>
                {resendStatus && <p style={{ marginTop: "0.4rem", fontSize: "0.85rem" }}>{resendStatus}</p>}
              </div>
            )}
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
