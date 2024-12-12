import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import "../styles/PasswordResetPage.css";


function PasswordResetPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      setIsResettingPassword(true);
    }
  }, [token]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Password reset email sent successfully. Please check your inbox.');
      } else {
        setMessage(data.message || 'Failed to handle password reset request.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again later.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('/api/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Password reset successfully. You can now log in.');
      } else {
        setMessage(data.message || 'Failed to reset password.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="password-reset-container">
      {isResettingPassword ? (
        <>
          <h2>Reset Your Password</h2>
          <form onSubmit={handleResetPassword}>
            <label>
              New Password:
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </label>
            <label>
              Confirm Password:
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="btn btn-primary">
              Reset Password
            </button>
          </form>
        </>
      ) : (
        <>
          <h2>Password Reset</h2>
          <form onSubmit={handleRequestReset}>
            <label>
              Username:
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>
            <label>
              Email:
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
          </form>
        </>
      )}
      {message && <p>{message}</p>}
    </div>
  );
}

export default PasswordResetPage;
