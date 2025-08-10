import React, { useState } from 'react';
import './FeedbackForm.css';

function FeedbackForm() {
  const [message, setMessage] = useState('');
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5001/api/feedback/sendFeedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        alert('Thank you for your feedback!');
        setMessage('');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to send feedback');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      alert('An error occurred. Please try again later.');
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
