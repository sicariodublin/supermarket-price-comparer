// src/components/FeedbackForm.js
import React, { useState } from 'react';
import './FeedbackForm.css';

function FeedbackForm() {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission, e.g., send the message to a server or API.
    alert('Thank you for your feedback!');
    setMessage('');
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
