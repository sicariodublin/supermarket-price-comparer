import React, { useEffect, useState } from "react";
//import { useLocation, useNavigate } from "react-router-dom";
import { http } from "../services/api";

function VerifyEmail() {
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;

    http
      .get("/verify-email", { params: { token } })
      .then(() => setMessage("Email verified successfully!"))
      .catch(() => setMessage("Verification failed. Please try again."));
  }, []);
  return (
    <div className="verify-email">
      <h1>{message}</h1>
    </div>
  );
}

export default VerifyEmail;
