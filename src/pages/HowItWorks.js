import React from 'react';
import '../styles/HowItWorks.css';

function HowItWorks() {
  return (
    <div className="how-it-works-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>How it Works!</h1>
              <p className="hero-subtitle">
                Ireland's new supermarket prices comparison website!
              </p>
              <p className="hero-description">
                At addandcompare.com, we simplify your grocery shopping by providing a platform to compare product prices from various supermarkets. Here's how you can make the most of our service:
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="content-section">
        <div className="container">
          <div className="content-grid">
            {/* Guest Users */}
            <div className="info-card">
              <div className="card-icon"><span role="img" aria-label="user">👥</span></div>
              <h2>For Guests (Unregistered Users)</h2>
              <ul>
                <li>Search for products to see current prices from different supermarkets in Ireland.</li>
                <li>View product details and average prices without creating an account.</li>
              </ul>
            </div>

            {/* Registered Users */}
            <div className="info-card featured">
              <div className="card-icon"><span role="img" aria-label="lock">🔐</span></div>
              <h2>For Registered Users</h2>
              <p>By creating a free account on addandcompare.com, you unlock additional features that enhance your shopping experience. Registered users can:</p>
              <ul>
                <li>Add new products to the platform.</li>
                <li>Update product prices and details based on their latest shopping experiences.</li>
                <li>Access a personalized dashboard with product tracking, shop list, and more.</li>
              </ul>
            </div>

            {/* Getting Started */}
            <div className="info-card">
              <div className="card-icon"><span role="img" aria-label="rocket">🚀</span></div>
              <ol>
                <li>Visit our registration page to create your account.</li>
                <li>Once registered, log in to access your personalized dashboard.</li>
                <li>Start adding or searching for products immediately!</li>
              </ol>
            </div>

            {/* Our Commitment */}
            <div className="info-card">
              <div className="card-icon"><span role="img" aria-label="strong">💪</span></div>
              <h2>Our Commitment</h2>
              <li>We are dedicated to keeping our platform up-to-date and reliable. We encourage our users to contribute by updating product prices and information to help fellow shoppers.</li>
            </div>

            {/* Need Help */}
            <div className="info-card">
              <div className="card-icon"><span role="img" aria-label="question">❓</span></div>
              <h2>Need Help?</h2>
              <li>If you need assistance or have any questions, visit our <a href="/contact-us" className="link-primary">Contact Us</a> page, and we'll be happy to help you navigate our site or resolve any issues.</li>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HowItWorks;