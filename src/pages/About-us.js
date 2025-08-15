import React from 'react';
import '../styles/About-us.css';

function AboutUs() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>About Us</h1>
            <p className="hero-subtitle">
              Welcome to addandcompare.com! Established in 2024, our platform was born from a simple yet profound realization.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="content-section">
        <div className="container">
          <div className="about-content">
            <div className="about-intro">
              <p className="intro-text">
                Our platform was born from routine grocery shopping trips and the challenges we all face in price comparison and saving money.
              </p>
            </div>

            <div className="about-sections">
              <div className="about-card">
                <div className="card-icon">🌱</div>
                <h2>Our Origin</h2>
                <p>
                  Noticing the frequent to and fro to supermarkets challenges in price comparison, product quality assessment and save more money, the idea for addandcompare.com was conceived. Our founder envisioned a user-driven platform that leverages the collective insights of the shopping community.
                </p>
              </div>

              <div className="about-card featured">
                <div className="card-icon">🛒</div>
                <h2>What We Do</h2>
                <p>
                  Addandcompare.com provides a unique web application where users can add, compare, and review their grocery shopping experiences. By contributing to and utilizing our database, users can make more informed decisions, saving time and money.
                </p>
              </div>

              <div className="about-card">
                <div className="card-icon">🎯</div>
                <h2>Our Mission</h2>
                <p>
                  Our mission is to empower consumers by providing a comprehensive and accessible platform for comparing grocery products across various supermarkets. We strive to simplify shopping decisions and enhance the shopping experience through technology and community input.
                </p>
              </div>

              <div className="about-card">
                <div className="card-icon">🤝</div>
                <h2>Join Us</h2>
                <p>
                  We invite you to be part of our community. Whether you're comparing prices, seeking the best deals, or sharing your shopping experiences, Addandcompare.com is your go-to resource for all things grocery.
                </p>
              </div>

              <div className="about-card">
                <div className="card-icon">📞</div>
                <h2>Contact Us</h2>
                <p>
                  If you have any inquiries or wish to connect with us, please don't hesitate to reach out. We are excited to grow with you and continue enhancing our services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;