
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { queryAsync } = require('../db');

// Fetch user details
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const results = await queryAsync(
      'SELECT id, username, email FROM users WHERE id = ?',
      [req.user.id]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(results[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/dashboard', verifyToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    const result = await queryAsync(
      'UPDATE users SET username = ?, email = ? WHERE id = ?',
      [name, email, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
