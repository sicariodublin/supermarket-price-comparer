import React from 'react';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const DeleteAccountPage = () => {
  const navigate = useNavigate();
  
  const handleClose = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <DeleteConfirmationModal 
      isOpen={true} 
      onClose={handleClose} 
    />
  );
};

export default DeleteAccountPage;