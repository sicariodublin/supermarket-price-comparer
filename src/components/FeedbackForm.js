import React, { useState } from 'react';
import './FeedbackForm.css';
import { http } from "../services/api";

function FeedbackForm() {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data } = await http.post("/feedback/sendFeedback", { message });
      alert(data?.message || 'Thank you for your feedback!');
      setMessage('');
    } catch (error) {
      console.error('Error sending feedback:', error);
      alert(
        error?.response?.data?.message ||
        'An error occurred. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-section">
      <div className="feedback-container">
        <div className="feedback-header">
          <h3 className="feedback-title">
            <i className="bi bi-chat-dots"></i>
            Notice any problems with the website?
          </h3>
          <p className="feedback-description">
            This website is still in Beta testing and problems may arise now and again.
            Let us know by sending us a message; we appreciate all feedback!
          </p>
        </div>
        
        <form className="feedback-form" onSubmit={handleSubmit}>
          <div className="feedback-input-group">
            <div className="input-wrapper">
              <i className="bi bi-chat-text input-icon"></i>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your feedback or report an issue..."
                className="feedback-input"
                disabled={isSubmitting}
                required
              />
            </div>
            <button 
              type="submit" 
              className="feedback-button"
              disabled={isSubmitting || !message.trim()}
            >
              {isSubmitting ? (
                <>
                  <i className="bi bi-arrow-clockwise spin"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="bi bi-send"></i>
                  Send
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FeedbackForm;
