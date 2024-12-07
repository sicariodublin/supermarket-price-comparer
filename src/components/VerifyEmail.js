import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search); 
    const token = queryParams.get("token");

    if (token) {
      fetch(`http://localhost:5000/api/verify-email?token=${token}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to verify email");
          }
          return response.json();
        })
        .then((data) => {
          console.log("Verification response:", data);
          if (data.message === "Email verified successfully. You can now log in.") {
            setMessage(data.message);
            setTimeout(() => navigate("/login"), 3000); // Redirect after 3 seconds
          } else {
            setMessage("Verification failed. Please try again.");
          }
        })
        .catch((error) => {
          console.error('Error verifying email:', error);
          setMessage("An error occurred. Please try again later.");
        });
    } else {
      setMessage("Invalid verification link.");
    }
  }, [location, navigate]);

  return (
    <div className="verify-email">
      <h1>{message}</h1>
    </div>
  );
}

export default VerifyEmail;
