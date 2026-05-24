import React, { useState } from "react";
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
      setFeedback({ type: "success", text: data?.message || "Message sent! We'll be in touch soon." });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error) {
      setFeedback({
        type: "error",
        text: error?.response?.data?.message || "Failed to send message. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="contact-page">

      {/* Hero */}
      <section className="contact-hero">
        <div className="contact-container">
          <span className="contact-badge">Get in touch</span>
          <h1>Contact Us</h1>
          <p>Have a question, spotted a pricing error, or just want to say hello? We'd love to hear from you.</p>
        </div>
      </section>

      {/* Body */}
      <section className="contact-body">
        <div className="contact-container">
          <div className="contact-grid">

            {/* Left — info */}
            <div className="contact-info-col">
              <div className="contact-info-card">
                <h2>How can we help?</h2>
                <p>
                  Whether it's a question about the service, a bug report, or
                  feedback on pricing data — drop us a message and we'll get
                  back to you as quickly as we can.
                </p>
              </div>

              <div className="contact-details-card">
                <div className="contact-detail-item">
                  <div className="contact-detail-icon">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div className="contact-detail-content">
                    <h3>Email</h3>
                    <p>addandcomparemessageus@hotmail.com</p>
                  </div>
                </div>

                <div className="contact-detail-item">
                  <div className="contact-detail-icon">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="contact-detail-content">
                    <h3>Response Time</h3>
                    <p>Within 1–2 business days</p>
                  </div>
                </div>

                <div className="contact-detail-item">
                  <div className="contact-detail-icon">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div className="contact-detail-content">
                    <h3>Based in</h3>
                    <p>Ireland</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="contact-form-col">
              <div className="contact-form-card">
                <h2>Send a Message</h2>
                <form onSubmit={handleSubmit} className="contact-form">

                  <div className="contact-form-group">
                    <label htmlFor="name">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="contact-form-group">
                    <label htmlFor="email">Your Email</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="contact-form-group">
                    <label htmlFor="subject">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What's this about?"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="contact-form-group">
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us more..."
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <button type="submit" className="contact-submit-btn" disabled={isLoading}>
                    {isLoading ? (
                      <><i className="fas fa-circle-notch fa-spin"></i> Sending…</>
                    ) : (
                      <><i className="fas fa-paper-plane"></i> Send Message</>
                    )}
                  </button>

                  {feedback && (
                    <div className={`contact-feedback ${feedback.type}`}>
                      <i className={`fas ${feedback.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
                      {" "}{feedback.text}
                    </div>
                  )}

                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}

export default ContactUs;
