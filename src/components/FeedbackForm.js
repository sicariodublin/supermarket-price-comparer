import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Substitua useHistory por useNavigate
import { AuthContext } from '../context/AuthContext';
import './FeedbackForm.css';

function FeedbackForm() {
  const [message, setMessage] = useState('');
  const { isAuthenticated, token } = useContext(AuthContext);
  const navigate = useNavigate(); // Use useNavigate em vez de useHistory

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert('You need to be logged in to send feedback');
      navigate('/login'); // Use navigate para redirecionar
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        alert('Thank you for your feedback!');
        setMessage('');
      } else {
        alert('Failed to send feedback');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  return (
    <div className="feedback-section">
      <p className="feedback-title">Notice any problems with the website?</p>
      <p>
        This website is still in Beta testing and problems may arise now and again.
        Let us know by sending us a message; we appreciate all feedback!
      </p>
      <form className="feedback-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          className="feedback-input"
        />
        <button type="submit" className="feedback-button">Send</button>
      </form>
    </div>
  );
}

export default FeedbackForm;
