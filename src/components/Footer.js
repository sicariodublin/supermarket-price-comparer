// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__logo-section">
          <img src={require('../assets/images/logo4.png')} alt="addandcompare" className="logo" />
          <div className="social-icons">
          <a href="#" className="facebook-icon" aria-label="Facebook">
          <img src={`${process.env.PUBLIC_URL}/Facebook-48.png`} alt="Facebook" />
        </a>
        <a href="#" className="instagram-icon" aria-label="Instagram">
          <img src={`${process.env.PUBLIC_URL}/Instagram-48.png`} alt="Instagram" />
        </a>
        <a href="#" className="twitter-icon" aria-label="Twitter">
          <img src={`${process.env.PUBLIC_URL}/X-48.png`} alt="Twitter" />
            </a>
          <a href="#" className="linkedin-icon" aria-label="LinkedIn">
          <img src={`${process.env.PUBLIC_URL}/Linkedin-48.png`} alt="Twitter" />
        </a>
          </div>
        </div>
        <div className="footer__links">
          <div>
            <h5>My Account</h5>
            <ul>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Sign Up</Link></li>
              <li><Link to="/search">Search</Link></li>
            </ul>
          </div>
          <div>
            <h5>Links</h5>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/how-it-works">How it Works</Link></li>
              <li><Link to="/about-us">About Us</Link></li>
            </ul>
          </div>
          <div>
            <h5>Customer Care</h5>
            <ul>
              <li><Link to="/contact-us">Contact Us</Link></li>
              <li><Link to="/terms-of-service">Terms of Service</Link></li>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        {/* <hr class="solid" /> */}
        <div className="footer__copyright">
          <p>&copy; Copyright All Rights Reserved 2024</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
