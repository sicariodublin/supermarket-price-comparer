// Logout.js
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';


const Logout = () => {
  const { token, setToken, setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (token) {
        console.log('Token sent during logout:', token);

        // Send logout request to the server
        const response = await fetch('http://localhost:5000/api/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          console.log('Logout successful');
        } else {
          const errorData = await response.json();
          console.error('Error during logout:', errorData.message);
        }
      }

      // Clear local storage and context state
      localStorage.removeItem('token');
      setToken(null);
      setIsAuthenticated(false);
      navigate('/'); // Redirect to login page
    } catch (error) {
      console.error('Error during logout:', error.message);
    }
  };

  return (
    <button className="logout-button" onClick={handleLogout}>
      Logout
    </button>
  );
};

export default Logout;
