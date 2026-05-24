import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HowItWorks.css';

const steps = [
  {
    number: '01',
    icon: '🔍',
    title: 'Search for a Product',
    description:
      'Type any grocery item into the search bar — milk, bread, chicken, whatever you need. No account required.',
  },
  {
    number: '02',
    icon: '📊',
    title: 'Compare Prices Instantly',
    description:
      'See side-by-side prices from Lidl, SuperValu, Tesco, Aldi, M&S, and Dunnes Stores, updated regularly.',
  },
  {
    number: '03',
    icon: '🛒',
    title: 'Add Products (Registered)',
    description:
      'Create a free account to contribute prices you find in-store. Your submissions help thousands of other shoppers.',
  },
  {
    number: '04',
    icon: '💰',
    title: 'Save on Every Shop',
    description:
      'Use your dashboard to track favourites, set a weekly budget, and spot the cheapest place for your full basket.',
  },
];

const userTypes = [
  {
    icon: '👥',
    title: 'Guests',
    subtitle: 'No sign-up needed',
    points: [
      'Search any product and compare live prices',
      'View price history and trends',
      'See which supermarket is cheapest today',
    ],
    cta: null,
    highlight: false,
  },
  {
    icon: '🔐',
    title: 'Registered Users',
    subtitle: 'Free account — unlocks everything',
    points: [
      'Add new products and prices from your shopping',
      'Update prices you find that are out of date',
      'Track your favourite products in your dashboard',
      'Set a weekly shop budget and preferred stores',
    ],
    cta: { label: 'Create Free Account', href: '/register' },
    highlight: true,
  },
];

function HowItWorks() {
  return (
    <div className="hiw-page">

      {/* Hero */}
      <section className="hiw-hero">
        <div className="hiw-container">
          <span className="hiw-badge">How It Works</span>
          <h1>Shop smarter across every supermarket in Ireland</h1>
          <p>
            Add&amp;Compare is a community-powered price comparison tool. Search, compare, and
            contribute — so every shopper gets the best deal.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="hiw-steps-section">
        <div className="hiw-container">
          <h2 className="hiw-section-title">Four simple steps</h2>
          <div className="hiw-steps">
            {steps.map((step) => (
              <div key={step.number} className="hiw-step">
                <div className="hiw-step-number">{step.number}</div>
                <div className="hiw-step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User types */}
      <section className="hiw-users-section">
        <div className="hiw-container">
          <h2 className="hiw-section-title">Who can use Add&amp;Compare?</h2>
          <div className="hiw-user-cards">
            {userTypes.map((type) => (
              <div key={type.title} className={`hiw-user-card${type.highlight ? ' hiw-user-card--featured' : ''}`}>
                <div className="hiw-user-icon">{type.icon}</div>
                <h3>{type.title}</h3>
                <p className="hiw-user-subtitle">{type.subtitle}</p>
                <ul>
                  {type.points.map((pt) => (
                    <li key={pt}>
                      <span className="hiw-check">✓</span> {pt}
                    </li>
                  ))}
                </ul>
                {type.cta && (
                  <Link to={type.cta.href} className="hiw-cta-btn">{type.cta.label}</Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitment strip */}
      <section className="hiw-commitment">
        <div className="hiw-container hiw-commitment-inner">
          <div className="hiw-commitment-text">
            <h3>Our commitment to accuracy</h3>
            <p>
              Our community keeps prices up to date. Admins review every submission before it goes
              live, and you can flag any price that looks wrong — we'll investigate within 24 hours.
            </p>
          </div>
          <Link to="/contact-us" className="hiw-outline-btn">Get in touch</Link>
        </div>
      </section>

    </div>
  );
}

export default HowItWorks;
