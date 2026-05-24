import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import './Footer.css';

function Footer() {
  const { isAuthenticated } = useAuth();
  const currentYear = new Date().getFullYear();
  const [nlEmail, setNlEmail] = useState('');
  const [nlStatus, setNlStatus] = useState(null);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!nlEmail.trim()) return;
    setNlStatus('success');
    setNlEmail('');
  };

  return (
    <footer className="modern-footer">
      <div className="footer-container">

        <div className="footer-main">

          {/* Brand */}
          <div className="footer-brand">
            <Logo variant="option1" width={180} height={50} className="footer-logo" />
            <p className="footer-description">
              Ireland's leading supermarket price comparison platform.
              Save money on your weekly shop by comparing prices across all major retailers.
            </p>
            <div className="social-links">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Twitter">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                <i className="bi bi-linkedin"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h5 className="footer-title">Quick Links</h5>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/search">Search Products</Link></li>
              <li><Link to="/how-it-works">How it Works</Link></li>
              <li><Link to="/about-us">About Us</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div className="footer-section">
            <h5 className="footer-title">My Account</h5>
            <ul className="footer-links">
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Sign Up</Link></li>
              <li><Link to={isAuthenticated ? "/dashboard" : "/login"}>Dashboard</Link></li>
              <li><Link to="/search">Add Product</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer-section">
            <h5 className="footer-title">Support</h5>
            <ul className="footer-links">
              <li><Link to="/contact-us">Contact Us</Link></li>
              <li><Link to="/terms-of-service">Terms of Service</Link></li>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><a href="mailto:addandcomparemessageus@hotmail.com">Help Centre</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="footer-section newsletter-section">
            <h5 className="footer-title">Stay Updated</h5>
            <p className="newsletter-description">
              Get the latest deals and price alerts delivered to your inbox.
            </p>

            {nlStatus === 'success' ? (
              <p className="newsletter-thanks">
                <i className="bi bi-check-circle-fill"></i> Thanks! We'll keep you posted.
              </p>
            ) : (
              <form className="newsletter-form" onSubmit={handleNewsletter}>
                <div className="newsletter-input-group">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="newsletter-input"
                    value={nlEmail}
                    onChange={(e) => setNlEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="newsletter-button" aria-label="Subscribe">
                    <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
              </form>
            )}

            <div className="footer-stats">
              <div className="stat">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Active Users</span>
              </div>
              <div className="stat">
                <span className="stat-number">€2M+</span>
                <span className="stat-label">Total Savings</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              &copy; {currentYear} Add&amp;Compare. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <Link to="/privacy-policy">Privacy</Link>
              <Link to="/terms-of-service">Terms</Link>
              <Link to="/contact-us">Contact</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
