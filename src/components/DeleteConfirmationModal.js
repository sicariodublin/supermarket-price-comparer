import PropTypes from "prop-types";
import React from "react";
import { useAuth } from "../context/AuthContext";


const DeleteConfirmationModal = ({ isOpen, onClose }) => {
  const { token, logout } = useAuth(); // Retrieve token and logout from AuthContext

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Ensure the token is correct
        },
      });
  
      if (response.ok) {
        alert("Account deleted successfully!");
        logout(); // Log out the user after successful deletion
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        alert(`Failed to delete account: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("An error occurred while deleting your account.");
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
};

DeleteConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  /* onConfirm: PropTypes.func.isRequired, */
  /* user: PropTypes.object, */
};

export default DeleteConfirmationModal;
