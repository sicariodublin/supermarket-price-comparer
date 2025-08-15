import React from 'react';
import RegisterForm from '../components/RegisterForm';
import '../styles/Register.css';

function Register() {
  return (
    <div className="register-page">
      <div className="register-left-section">
        <div className="welcome-content">
          <h1>JOIN</h1>
          <h1>US!</h1>
          <p className="welcome-subtitle">Start saving money on your groceries today</p>
        </div>
      </div>
      <div className="register-right-section">
        <div className="register-container">
          <div className="register-header">
            <h2>Create Account</h2>
            <p>Register here to start your savings journey with us.</p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}

export default Register;