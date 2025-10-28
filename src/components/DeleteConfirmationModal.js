import PropTypes from "prop-types";
import React from "react";
import { useAuth } from "../context/AuthContext";
import { http } from "../services/api";

function DeleteConfirmationModal({ isOpen, onClose }) {
  const { token, logout } = useAuth(); // Retrieve token and logout from AuthContext

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await http.delete("/delete-account", {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Account deleted successfully!");
      logout(); // Log out the user after successful deletion
    } catch (error) {
      console.error("Error deleting account:", error);
      const msg =
        error?.response?.data?.message ||
        "An error occurred while deleting your account.";
      alert(msg);
    }
  };

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
          <button onClick={handleConfirm} className="btn btn-danger">
            Yes
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            No
          </button>
        </div>
      </div>
    </div>
  );
}

DeleteConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  /* onConfirm: PropTypes.func.isRequired, */
  /* user: PropTypes.object, */
};

export default DeleteConfirmationModal;
