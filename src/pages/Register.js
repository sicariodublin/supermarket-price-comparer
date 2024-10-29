import React from 'react';
import RegisterForm from '../components/RegisterForm';
import '../styles/Register.css';
function Register() {
  return (
    <div className="register-page">
      <div className="register-left-section">
        <h1>WELCOME</h1>
        <h1>BACK!</h1>
      </div>
      <div className="register-right-section">
        <h2>Register</h2>
        <p>Register here to start your journey with us.</p>
        <RegisterForm />
      </div>
    </div>

  );
}

export default Register;