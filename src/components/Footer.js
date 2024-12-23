// src/components/Footer.js
import React from 'react';
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
              <li><a href="/login">Login</a></li>
              <li><a href="/register">Sign Up</a></li>
              <li><a href="/search">Search</a></li>
            </ul>
          </div>
          <div>
            <h5>Links</h5>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/how-it-works">How it Works</a></li>
              <li><a href="/about-us">About Us</a></li>
            </ul>
          </div>
          <div>
            <h5>Customer Care</h5>
            <ul>
              <li><a href="/contact-us">Contact Us</a></li>
              <li><a href="/terms-of-service">Terms of Service</a></li>
              <li><a href="/privacy-policy">Privacy Policy</a></li>
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
