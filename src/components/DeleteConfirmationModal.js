import PropTypes from "prop-types";
import React from "react";
import { useAuth } from "../context/AuthContext";


const DeleteConfirmationModal = ({ isOpen, onClose, user }) => {
  const { logout } = useAuth(); // Retrieve logout function from AuthContext

  console.log("User in DeleteConfirmationModal:", user);

  const handleConfirm = async () => {
    if (!user || !user.id) {
      alert("User data is not available. Please log in again.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        alert("Account deleted successfully!");
        logout(); // Call logout function after successful deletion
      } else {
        const errorData = await response.json();
        alert(`Failed to delete account: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("An error occurred while deleting your account.");
    }
  };

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
};

DeleteConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  /* onConfirm: PropTypes.func.isRequired, */
  user: PropTypes.object,
};

export default DeleteConfirmationModal;
