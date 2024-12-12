// DeleteConfirmationModal.js
import PropTypes from "prop-types";
import React from "react";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Account Settings</h2>
          <button onClick={onClose} className="close-button">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete your account?</p>
        </div>
        <div className="modal-footer">
          <button onClick={onConfirm} className="btn btn-danger">
            Yes
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            No
          </button>
        </div>
      </div>
    </div>
  );
};

DeleteConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default DeleteConfirmationModal;
