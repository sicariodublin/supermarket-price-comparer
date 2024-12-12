// components/AccountSettingsModal.js
import React from 'react';
import "../styles/Dashboard.css";

function AccountSettingsModal({ isOpen, onClose, onPasswordReset, onDeleteAccount }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Account Settings</h2>
        <div className="button-container">
        <button className="btn btn-primary" onClick={onPasswordReset}>
          Change Password
        </button>
        <button className="btn btn-danger" onClick={onDeleteAccount}>
          Delete Account
        </button>
        </div>
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default AccountSettingsModal;
