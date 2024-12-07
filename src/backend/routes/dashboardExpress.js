
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware'); // Path to your middleware file

// Fetch user details
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    // Replace this with your DB query logic
    const query = 'SELECT id, username, emasil FROM users WHERE id = ?';
    connection.query(query, [req.user.id], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(results[0]);
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/dashboard', verifyToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Replace this with your DB update logic
    const query = 'UPDATE users SET username = ?, email = ? WHERE id = ?';
    connection.query(query, [name, email, req.user.id], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'Profile updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
