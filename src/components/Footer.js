// src/components/Footer.js
import React from 'react';
import FacebookIcon from '../assets/images/Facebook-48.png';
import InstagramIcon from '../assets/images/Instagram-48.png';
import LinkedInIcon from '../assets/images/Linkedin-48.png';
import TwitterIcon from '../assets/images/X-48.png';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__logo-section">
          <img src={require('../assets/images/logo4.png')} alt="addandcompare" className="logo" />
          <div className="social-icons">
            <a href="#" aria-label="Facebook" style={{ pointerEvents: 'none' }}>
              <img src={FacebookIcon} alt="Facebook" />
            </a>
            <a href="#" aria-label="Instagram" style={{ pointerEvents: 'none' }}>
              <img src={InstagramIcon} alt="Instagram" />
            </a>
            <a href="#" aria-label="Twitter" style={{ pointerEvents: 'none' }}>
              <img src={TwitterIcon} alt="Twitter" />
            </a>
            <a href="#" aria-label="LinkedIn" style={{ pointerEvents: 'none' }}>
              <img src={LinkedInIcon} alt="LinkedIn" />
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
        <div className="footer__copyright">
          <p>&copy; Copyright All Rights Reserved 2024</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
