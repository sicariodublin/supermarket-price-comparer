// LoginForm.js (Component)
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Login.css';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add form submission logic here
  };
    
  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="input-group" >
        <label htmlFor="username">Username</label>
        <input
            type="text"
            id="username"
            placeholder='Enter Username'
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
        <label htmlFor="password">Password</label>
        <input
          type={showPassword ? 'text' : 'password'}
          id="password"
          placeholder='Enter Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="icon-container" onClick={togglePasswordVisibility}>
          <i className={showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'}></i>
        </div>
      </div>
      <button type="submit" className="login-button">Log In</button>
      <div className="additional-options">
        <Link to="/register">Don't have an account? Register here.</Link>
      </div>
    </form>
  );
}

export default LoginForm;