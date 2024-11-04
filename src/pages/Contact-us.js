import React, { useState } from 'react';
import '../styles/Contact-us.css';

function ContactUs() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await response.json();
      if (response.ok) {
        setFeedback("Message sent successfully!");
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setFeedback("Failed to send message: " + data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setFeedback("Failed to send message.");
    }
  };

  return (
  <div class="contact-container">
      <div class="contact-info">
        <h1>Contact Us</h1>
        <p>Feel free to contact us directly if you have any inquiries regarding our services. We are very pleased that you are considering us and will answer all your questions.</p>
        <h2>How can we help you today?</h2>
        <p>Feel free to contact us directly if you have any inquiries regarding our services. We would love to assist you.</p>
        <p>Simply fill in your personal data and let us get in touch with you. Normally, the support team answers within one business day, so that you don't have to wait. Or call us directly from the phone.</p>
        <h3>Address</h3>
        <p>To be Confirmed</p>
        <h3>Phone</h3>
        <p>To be Confirmed</p>
        <h3>Toll-Free</h3>
        <p>To be Confirmed</p>
        <h3>Email</h3>
        <p>addandcomparemessageus@hotmail.com</p>
      </div>

       <div className="contact-form-container">
        <h2>Contact Form</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Your Name:</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Your Email:</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="subject">Subject:</label>
            <input type="text" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message:</label>
            <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required></textarea>
          </div>
          <button type="submit">Send Message</button>
        </form>
        {feedback && <div id="contactMessage">{feedback}</div>}
      </div>
    </div>
  );
}

export default ContactUs;