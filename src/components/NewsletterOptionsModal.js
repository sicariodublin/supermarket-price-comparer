// components/NewsletterOptionsModal.js
import React, { useState } from 'react';
import "../styles/Dashboard.css";

function NewsletterOptionsModal({ isOpen, onClose, onSave, currentSettings }) {
  const [settings, setSettings] = useState(currentSettings || {
    weeklyDeals: false,
    priceAlerts: false,
    newProducts: false,
    seasonalTips: false
  });

  if (!isOpen) return null;

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Newsletter Options</h2>
        <div className="newsletter-options">
          <div className="option-item">
            <label>
              <input
                type="checkbox"
                checked={settings.weeklyDeals}
                onChange={() => handleToggle('weeklyDeals')}
              />
              Weekly Deals & Offers
            </label>
          </div>
          <div className="option-item">
            <label>
              <input
                type="checkbox"
                checked={settings.priceAlerts}
                onChange={() => handleToggle('priceAlerts')}
              />
              Price Drop Alerts
            </label>
          </div>
          <div className="option-item">
            <label>
              <input
                type="checkbox"
                checked={settings.newProducts}
                onChange={() => handleToggle('newProducts')}
              />
              New Product Notifications
            </label>
          </div>
          <div className="option-item">
            <label>
              <input
                type="checkbox"
                checked={settings.seasonalTips}
                onChange={() => handleToggle('seasonalTips')}
              />
              Seasonal Shopping Tips
            </label>
          </div>
        </div>
        <div className="button-container">
          <button className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsletterOptionsModal;