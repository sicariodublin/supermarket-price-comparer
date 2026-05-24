import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Termsofservice.css';

const sections = [
  {
    id: 'acceptance',
    icon: '✅',
    title: 'Acceptance of Terms',
    body: 'By accessing or using addandcompare.com you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our service.',
  },
  {
    id: 'changes',
    icon: '🔄',
    title: 'Changes to Terms',
    body: 'We may update these terms at any time. When we do, we will post the revised version on this page with an updated date. Continued use of the platform after changes are posted constitutes your acceptance of the new terms.',
  },
  {
    id: 'communication',
    icon: '📧',
    title: 'Communication',
    body: 'By creating an account you agree to receive service-related emails such as email verification and password reset links. You may opt out of marketing communications at any time via your dashboard settings.',
  },
  {
    id: 'content',
    icon: '📄',
    title: 'User-Contributed Content',
    body: 'Registered users may submit product prices and details. By submitting content you confirm it is accurate to the best of your knowledge. We reserve the right to remove any content that is inaccurate, misleading, or in breach of these terms. All scraped and platform-owned content remains the property of Add&Compare.',
  },
  {
    id: 'accounts',
    icon: '👤',
    title: 'Accounts',
    body: 'You must be 18 or over to create an account. You are responsible for keeping your login credentials secure. We reserve the right to suspend or terminate accounts that violate these terms, submit false data, or engage in any form of abuse.',
  },
  {
    id: 'ip',
    icon: '©️',
    title: 'Intellectual Property',
    body: 'The Add&Compare service, design, and original content are the exclusive property of Add&Compare and its licensors. You may not reproduce, distribute, or create derivative works without prior written permission.',
  },
  {
    id: 'liability',
    icon: '⚠️',
    title: 'Limitation of Liability',
    body: 'Prices displayed are provided for informational purposes only and may not reflect in-store prices at the time of your visit. Add&Compare is not liable for any purchase decisions made on the basis of information shown on this platform.',
  },
  {
    id: 'contact',
    icon: '📞',
    title: 'Contact Us',
    body: 'If you have any questions about these terms please contact us via our Contact Us page. We aim to respond within 2 business days.',
  },
];

function TermsOfService() {
  return (
    <div className="legal-page">

      {/* Hero */}
      <section className="legal-hero">
        <div className="legal-container">
          <span className="legal-badge">Legal</span>
          <h1>Terms of Service</h1>
          <p>Last updated: January 2025 &nbsp;·&nbsp; Effective immediately upon account creation</p>
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

export default TermsOfService;
