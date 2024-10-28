import React from 'react';
import '../styles/Contact-us.css';

function ContactUs() {
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

      <div class="contact-form-container">
      <h2>Contact Form</h2>
      <form id="contactForm">
          <div class="form-group">
              <label for="name">Your Name:</label>
              <input type="text" id="name" name="name" required />
          </div>
          <div class="form-group">
              <label for="email">Your Email:</label>
              <input type="email" id="email" name="email" required/>
          </div>
          <div class="form-group">
              <label for="subject">Subject:</label>
              <input type="text" id="subject" name="subject" required/>
          </div>
          <div class="form-group">
              <label for="message">Message:</label>
              <textarea id="message" name="message" required></textarea>
          </div>
          <button type="submit">Send Message</button>
      </form>
      <div id="contactMessage"></div>
  </div>
</div>
            
         
  );
}

export default ContactUs;