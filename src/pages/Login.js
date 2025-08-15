// Login.js (Page Component)
import React from 'react';
import LoginForm from '../components/LoginForm';
import '../styles/Login.css';

function Login() {
  return (
    <div className="login-page">
      <div className="login-left-section">
        <div className="welcome-content">
          <h1>WELCOME</h1>
          <h1>BACK!</h1>
          <p className="welcome-subtitle">Continue your savings journey with us</p>
        </div>
      </div>
      <div className="login-right-section">
        <div className="login-container">
          <div className="login-header">
            <h2>Log In</h2>
            <p>Login here to start your journey with us.</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

export default Login;