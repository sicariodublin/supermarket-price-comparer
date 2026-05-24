import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/About-us.css';

const stats = [
  { number: '6',    label: 'Supermarkets tracked' },
  { number: '10K+', label: 'Products compared' },
  { number: '2024', label: 'Founded in Ireland' },
  { number: 'Free', label: 'Always free to use' },
];

const cards = [
  {
    icon: '🌱',
    title: 'Our Origin',
    body: 'Add&Compare started from a simple frustration — visiting multiple supermarkets just to find the best price on everyday groceries. We built a community-powered platform so shoppers never have to guess again.',
  },
  {
    icon: '🛒',
    title: 'What We Do',
    body: 'We aggregate and compare grocery prices across Ireland\'s major supermarkets. Users can search any product, see where it\'s cheapest today, and contribute prices they find in-store to help the whole community.',
  },
  {
    icon: '🎯',
    title: 'Our Mission',
    body: 'To empower every household in Ireland to make smarter, more informed shopping decisions — saving time, reducing food bills, and making comparison effortless.',
  },
  {
    icon: '🤝',
    title: 'Community First',
    body: 'The platform is built on the idea that shoppers helping shoppers creates the most accurate, up-to-date data. Every price you add makes the app better for everyone.',
  },
];

function AboutUs() {
  return (
    <div className="about-page">

      {/* Hero */}
      <section className="about-hero">
        <div className="about-container">
          <span className="about-badge">About Us</span>
          <h1>Built by Irish shoppers, for Irish shoppers</h1>
          <p>
            Add&amp;Compare was founded in 2024 with one goal: make grocery price comparison
            effortless for everyone in Ireland.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="about-stats">
        <div className="about-container">
          <div className="about-stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="about-stat">
                <span className="about-stat-number">{s.number}</span>
                <span className="about-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story cards */}
      <section className="about-cards-section">
        <div className="about-container">
          <h2 className="about-section-title">Our story</h2>
          <div className="about-cards">
            {cards.map((card) => (
              <div key={card.title} className="about-card">
                <div className="about-card-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="about-container about-cta-inner">
          <div>
            <h3>Ready to start saving?</h3>
            <p>Join thousands of Irish shoppers comparing prices every day.</p>
          </div>
          <div className="about-cta-btns">
            <Link to="/register" className="about-btn-primary">Create Free Account</Link>
            <Link to="/contact-us" className="about-btn-outline">Contact Us</Link>
          </div>
        </div>
      </section>

    </div>
  );
}

export default AboutUs;
