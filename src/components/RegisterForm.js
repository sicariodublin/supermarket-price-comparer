// RegisterForm.js
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import '../styles/Register.css';

function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Password validation function
  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[£$%&*\/\\@-]).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password strength
    if (!validatePassword(password)) {
      alert(
        'Password must be at least 8 characters long, contain at least one uppercase letter, and one special character (£$%&*/\\@-).'
      );
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        alert('Registration successful! Please check your email to verify your account.');
        navigate('/login');
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prevState) => !prevState);
  };

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      {/* Username Field */}
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
      </div>

      {/* Email Field */}
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
      </div>

      {/* Password Field */}
      <div className="input-group" style={{ position: 'relative' }}>
        <label htmlFor="password">Password</label>
        <input
          type={showPassword ? 'text' : 'password'}
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

      {/* Confirm Password Field */}
      <div className="input-group" style={{ position: 'relative' }}>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          type={showConfirmPassword ? 'text' : 'password'}
          id="confirmPassword"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <div className="icon-container" onClick={toggleConfirmPasswordVisibility}>
          <i className={showConfirmPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'}></i>
        </div>
      </div>

      <button type="submit" className="register-button">
        Register
      </button>
      <div className="additional-options">
        <Link to="/login">Already have an account? Log in here.</Link>
      </div>
    </form>
  );
}

export default RegisterForm;
