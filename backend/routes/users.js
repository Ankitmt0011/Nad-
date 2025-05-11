const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register user
router.post('/register', async (req, res) => {
  const { id, username, first_name } = req.body;

  try {
    let user = await User.findOne({ id });
    if (!user) {
      user = new User({ id, username, first_name });
      await user.save();
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ success: false });
  }
});

// Get user data
router.post('/user-data', async (req, res) => {
  const { id } = req.body;

  try {
    const user = await User.findOne({ id });
    if (!user) return res.status(404).json({ success: false });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("User data fetch error:", err.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
