import React from 'react';
import '../styles/Termsofservice.css';

function TermsOfService() {
  return (
    <div className="terms-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Terms of Service</h1>
            <p className="hero-subtitle">
              Welcome to addandcompare.com! By accessing our website, you agree to these terms of service.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="content-section">
        <div className="container">
          <div className="terms-content">
            <div className="terms-intro">
              <p className="intro-text">
                Please read these terms carefully as they govern your use of our services and platform.
              </p>
            </div>

            <div className="terms-sections">
              <div className="terms-card">
                <div className="card-icon">✅</div>
                <h2>Acceptance of Terms</h2>
                <p>
                  When you use our services, you're agreeing to our terms, so please
                  take a few minutes to read over the User Agreement below.
                </p>
              </div>

              <div className="terms-card">
                <div className="card-icon">🔄</div>
                <h2>Changes to Terms</h2>
                <p>
                  We may modify these terms at any time. We will notify you of any
                  changes by posting the new terms on our website.
                </p>
              </div>

              <div className="terms-card">
                <div className="card-icon">📧</div>
                <h2>Communication</h2>
                <p>
                  By creating an account on our website, you agree to subscribe to
                  newsletters, marketing or promotional materials and other
                  information we may send.
                </p>
              </div>

              <div className="terms-card">
                <div className="card-icon">📄</div>
                <h2>Content</h2>
                <p>
                  The content found on or through this service are the property of
                  Addandcompare.com or used with permission. You may not distribute,
                  modify, transmit, reuse, download, repost, copy, or use said
                  Content, whether in whole or in part, for commercial purposes or for
                  personal gain, without express advance written permission from us.
                </p>
              </div>

              <div className="terms-card">
                <div className="card-icon">👤</div>
                <h2>Accounts</h2>
                <p>
                  When you create an account with us, you guarantee that you are above
                  the age of 18, and that the information you provide us is accurate,
                  complete, and current at all times. Inaccurate, incomplete, or
                  obsolete information may result in the immediate termination of your
                  account on our service.
                </p>
              </div>

              <div className="terms-card">
                <div className="card-icon">©️</div>
                <h2>Intellectual Property</h2>
                <p>
                  The service and its original content (excluding Content provided by
                  users), features, and functionality are and will remain the
                  exclusive property of Addandcompare.com and its licensors.
                </p>
              </div>

              <div className="terms-card featured">
                <div className="card-icon">📞</div>
                <h2>Contact Us</h2>
                <p>
                  If you have any questions about these Terms, please contact us.
                  We're here to help clarify any concerns you may have.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TermsOfService;