import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Contact-us.css";
import { http } from "../services/api";

function ContactUs() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await http.post("/contact", { name, email, message });
      setFeedback(data?.message || "Message sent successfully!");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setFeedback(
        error?.response?.data?.message || "Failed to send message."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Contact Us</h1>
            <p className="hero-subtitle">
              Feel free to contact us directly if you have any inquiries
              regarding our services. We are very pleased that you are
              considering us.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="content-section">
        <div className="container">
          <div className="contact-content">
            <div className="contact-grid">
              {/* Contact Information */}
              <div className="contact-info-section">
                <div className="info-card">
                  <h2>How can we help you today?</h2>
                  <p>
                    Feel free to contact us directly if you have any inquiries
                    regarding our services. We would love to assist you.
                  </p>
                  <p>
                    Simply fill in your personal data and let us get in touch
                    with you. Normally, the support team answers within one
                    business day, so that you don't have to wait. Or call us
                    directly from the phone.
                  </p>
                </div>

                <div className="contact-details">
                  <div className="detail-item">
                    <div className="detail-icon">📍</div>
                    <div className="detail-content">
                      <h3>Address</h3>
                      <p>To be Confirmed</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon">📞</div>
                    <div className="detail-content">
                      <h3>Phone</h3>
                      <p>To be Confirmed</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon">📞</div>
                    <div className="detail-content">
                      <h3>Toll-Free</h3>
                      <p>To be Confirmed</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon">📧</div>
                    <div className="detail-content">
                      <h3>Email</h3>
                      <p>addandcomparemessageus@hotmail.com</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="contact-form-section">
                <div className="form-card">
                  <h2>Contact Form</h2>
                  <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-group">
                      <label htmlFor="name">Your Name:</label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Your Email:</label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="subject">Subject:</label>
                      <input
                        type="text"
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="message">Message:</label>
                      <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        disabled={isLoading}
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="submit-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending..." : "Send Message"}
                    </button>
                  </form>

                  {feedback && (
                    <div
                      className={`feedback-message ${
                        feedback.includes("successfully") ? "success" : "error"
                      }`}
                    >
                      {feedback}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Link
            to="/"
            className="btn btn-secondary btn-large"
            // style={{ padding: "8px 24px", fontSize: "1rem", }}
          >
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ContactUs;
