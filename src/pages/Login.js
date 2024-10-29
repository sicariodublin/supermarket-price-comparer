// Login.js (Page Component)
import React from 'react';
import LoginForm from '../components/LoginForm';
import '../styles/Login.css';

function Login() {
  return (
    <div className="login-page">
      <div className="login-left-section">
        <h1>WELCOME</h1>
          <h1>BACK!</h1> 
      </div>
      <div className="login-right-section">
        <h2>Log In</h2>
        <LoginForm />
      </div>
    </div>
  );
}

export default Login;