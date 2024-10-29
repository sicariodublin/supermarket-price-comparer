import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Register.css';

function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add form submission logic here
  };

   const togglePasswordVisibility = () => {
    setShowPassword((prevState) =>!prevState);
   };

  return (
    <form className="register-form" onSubmit={handleSubmit}>
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
        <div style={{ position: 'absolute', right: '12px', top: '32px' }}>
          <p className="text-sz color-icon">
            <i className="bi bi-check-circle-fill"></i>
          </p>
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div style={{ position: 'absolute', right: '12px', top: '32px' }}>
          <p className="text-sz color-icon">
            <i className="bi bi-check-circle-fill"></i>
          </p>
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="icon-container" onClick={togglePasswordVisibility}>
          <i className={showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'}></i>
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <div className="icon-container" onClick={togglePasswordVisibility}>
          <i className={showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'}></i>
        </div>
      </div>
      <button type="submit" className="register-button">Register</button>
      <div className="additional-options">
        <Link to="/login">Already have an account? Log in here.</Link>
      </div>
    </form>
  );
}   

export default RegisterForm;