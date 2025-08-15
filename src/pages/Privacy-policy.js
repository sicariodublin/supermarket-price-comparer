import React from 'react';
import '../styles/Privacypolicy.css';

function PrivacyPolicy() {
  return (
    <div className="privacy-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Privacy Policy</h1>
            <p className="hero-subtitle">
              Your privacy is important to us. Learn how we protect and handle your information.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="content-section">
        <div className="container">
          <div className="privacy-content">
            <div className="privacy-intro">
              <p className="intro-text">
                Your privacy is important to us. It is our policy to respect your
                privacy regarding any information we may collect from you across our
                website.
              </p>
            </div>

            <div className="privacy-sections">
              <div className="privacy-card">
                <div className="card-icon">📊</div>
                <h2>Information we collect</h2>
                <p>
                  We collect information you voluntarily provide to us, such as your
                  email address at sign-up, product search queries and any other
                  personal information you provide through the Addandcompare.com
                  website. We also collect non-personally identifiable information,
                  such as your IP address.
                </p>
              </div>

              <div className="privacy-card">
                <div className="card-icon">🎯</div>
                <h2>Why we collect this information</h2>
                <p>
                  The information you provide to us enables us to fulfill your service
                  expectations. The provided information is used in various ways to
                  improve our website's interaction with the user, via newsletters or
                  personalised product displays.
                </p>
              </div>

              <div className="privacy-card">
                <div className="card-icon">🔒</div>
                <h2>Information sharing and disclosure</h2>
                <p>
                  We do not share or disclose your personal information to any third
                  parties, except as required by law or as necessary to provide you
                  with the services you request.
                </p>
              </div>

              <div className="privacy-card">
                <div className="card-icon">🛡️</div>
                <h2>Security</h2>
                <p>
                  We take reasonable measures to protect your personal information
                  from unauthorized access, use, or disclosure. However, we cannot
                  guarantee that your information will be completely secure.
                </p>
              </div>

              <div className="privacy-card">
                <div className="card-icon">🔄</div>
                <h2>Changes to this policy</h2>
                <p>
                  We may update this policy from time to time. We will notify you of
                  any changes by posting the new policy on our website.
                </p>
              </div>

              <div className="privacy-card featured">
                <div className="card-icon">📞</div>
                <h2>Contact us</h2>
                <p>
                  If you have any questions or concerns about our privacy policy,
                  please feel free to reach out to us, we are always happy to help!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PrivacyPolicy;