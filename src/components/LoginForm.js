// LoginForm.js (Component)
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Importa AuthContext
import '../styles/Login.css';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext); // Usa o contexto de autenticação
  const navigate = useNavigate(); // Usa navigate em vez de history

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });
  
      if (response.ok) {
        const data = await response.json();
        login(data.token); // Armazena o token e autentica
        navigate('/search'); // Redireciona para a página inicial ou dashboard
      } else {
        const errorData = await response.json();
        alert(errorData.error); // Exibe a mensagem de erro específica
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
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