import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import './Footer.css';

function Footer() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Function to scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleDashboardClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate('/login');
    }
    // If authenticated, let Link handle navigation to /dashboard
  };

  return (
    <footer className="modern-footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          {/* Brand Section */}
          <div className="footer-brand">
            <Logo variant="option1" width={180} height={50} className="footer-logo" />
            <p className="footer-description">
              Ireland's leading supermarket price comparison platform. 
              Save money on your weekly shop by comparing prices across all major retailers.
            </p>
            <div className="social-links">
              <button type="button" className="social-link facebook" aria-label="Facebook" onClick={scrollToTop}>
                <i className="bi bi-facebook"></i>
                </button>
              <button type="button" className="social-link instagram" aria-label="Instagram" onClick={scrollToTop}>
                <i className="bi bi-instagram"></i>
                </button>
              <button type="button" className="social-link twitter" aria-label="Twitter" onClick={scrollToTop}>
                <i className="bi bi-twitter"></i>
                </button>
              <button type="button" className="social-link linkedin" aria-label="LinkedIn" onClick={scrollToTop}>
               <i className="bi bi-linkedin"></i>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h5 className="footer-title">Quick Links</h5>
            <ul className="footer-links">
              <li><Link to="/" onClick={scrollToTop}>Home</Link></li>
              <li><Link to="/search" onClick={scrollToTop}>Search Products</Link></li>
              <li><Link to="/how-it-works" onClick={scrollToTop}>How it Works</Link></li>
              <li><Link to="/about-us" onClick={scrollToTop}>About Us</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div className="footer-section">
            <h5 className="footer-title">My Account</h5>
            <ul className="footer-links">
              <li><Link to="/login" onClick={scrollToTop}>Login</Link></li>
              <li><Link to="/register" onClick={scrollToTop}>Sign Up</Link></li>
              <li>
                <Link
                  to={isAuthenticated ? "/dashboard" : "/login"}
                  onClick={scrollToTop}
                  
                  className="footer-link"
                >
                  Dashboard
                </Link>
              </li>
              <li><Link to="/search" onClick={scrollToTop}>Add Product</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer-section">
            <h5 className="footer-title">Support</h5>
            <ul className="footer-links">
              <li><Link to="/contact-us" onClick={scrollToTop}>Contact Us</Link></li>
              <li><Link to="/terms-of-service" onClick={scrollToTop}>Terms of Service</Link></li>
              <li><Link to="/privacy-policy" onClick={scrollToTop}>Privacy Policy</Link></li>
              <li><a href="mailto:support@addandcompare.com">Help Center</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="footer-section newsletter-section">
            <h5 className="footer-title">Stay Updated</h5>
            <p className="newsletter-description">
              Get the latest deals and price alerts delivered to your inbox.
            </p>
            <form className="newsletter-form">
              <div className="newsletter-input-group">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="newsletter-input"
                  required
                />
                <button type="submit" className="newsletter-button">
                  <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </form>
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

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              &copy; {currentYear} Add&Compare. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <Link to="/privacy-policy" onClick={scrollToTop}>Privacy</Link>
              <Link to="/terms-of-service" onClick={scrollToTop}>Terms</Link>
              <Link to="/contact-us" onClick={scrollToTop}>Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
