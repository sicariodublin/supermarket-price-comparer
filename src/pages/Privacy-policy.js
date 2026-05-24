import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Privacypolicy.css';

const sections = [
  {
    id: 'collect',
    icon: '📊',
    title: 'What We Collect',
    body: 'We collect information you provide directly: your email address and username when you register, and any product data you submit. We also collect non-personal technical data such as your IP address and browser type for security and analytics purposes.',
  },
  {
    id: 'why',
    icon: '🎯',
    title: 'Why We Collect It',
    body: 'Your information is used to provide and improve the service — including account management, email verification, personalised dashboards, and price alerts. We do not sell your data to third parties.',
  },
  {
    id: 'sharing',
    icon: '🔒',
    title: 'Sharing & Disclosure',
    body: 'We do not share your personal information with third parties except where required by law, or as strictly necessary to operate the platform (e.g. our transactional email provider Mailjet, used solely to send verification and reset emails).',
  },
  {
    id: 'cookies',
    icon: '🍪',
    title: 'Cookies & Sessions',
    body: 'We use an HttpOnly session cookie to keep you logged in securely. This cookie cannot be read by JavaScript and expires after 1 hour of activity. We do not use third-party advertising or tracking cookies.',
  },
  {
    id: 'security',
    icon: '🛡️',
    title: 'Security',
    body: 'Passwords are hashed using bcrypt. Connections are encrypted with HTTPS/TLS. Session tokens are stored in HttpOnly cookies to protect against cross-site scripting. We take reasonable measures to protect your data, though no system is 100% secure.',
  },
  {
    id: 'rights',
    icon: '⚖️',
    title: 'Your Rights',
    body: 'Under GDPR you have the right to access, correct, or delete your personal data at any time. You can delete your account from the Dashboard settings page. For data export requests or other enquiries, contact us directly.',
  },
  {
    id: 'changes',
    icon: '🔄',
    title: 'Changes to This Policy',
    body: 'We may update this policy periodically. We will notify registered users of any material changes by email. The date at the top of this page always reflects the most recent revision.',
  },
  {
    id: 'contact',
    icon: '📞',
    title: 'Contact Us',
    body: 'For any privacy-related questions, requests, or concerns please reach out via our Contact Us page. We take all enquiries seriously and aim to respond within 5 business days.',
  },
];

function PrivacyPolicy() {
  return (
    <div className="legal-page">

      {/* Hero */}
      <section className="legal-hero">
        <div className="legal-container">
          <span className="legal-badge">Legal</span>
          <h1>Privacy Policy</h1>
          <p>Last updated: January 2025 &nbsp;·&nbsp; GDPR compliant</p>
        </div>
      </section>

      {/* Two-column layout */}
      <section className="legal-body">
        <div className="legal-container legal-layout">

          {/* Sticky TOC */}
          <aside className="legal-toc">
            <p className="legal-toc-heading">Contents</p>
            <ul>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.title}</a>
                </li>
              ))}
            </ul>
          </aside>

          {/* Sections */}
          <div className="legal-sections">
            {sections.map((s) => (
              <div key={s.id} id={s.id} className="legal-section">
                <div className="legal-section-header">
                  <span className="legal-section-icon">{s.icon}</span>
                  <h2>{s.title}</h2>
                </div>
                <p>{s.body}</p>
              </div>
            ))}

            <div className="legal-footer-note">
              Questions? <Link to="/contact-us">Get in touch with us</Link>.
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default PrivacyPolicy;
