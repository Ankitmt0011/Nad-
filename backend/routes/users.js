const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register or update user
router.post('/register', async (req, res) => {
  const { id, username, first_name, referredBy } = req.body;

  if (!id || !username || !first_name) {
    return res.status(400).json({ success: false, message: "Missing user data" });
  }

  try {
    let user = await User.findOne({ id });

    if (!user) {
      user = new User({ id, username, first_name });

      // handle referral logic
      if (referredBy) {
        const referrer = await User.findOne({ id: referredBy });
        if (referrer) {
          user.referredBy = referredBy;
          referrer.referrals += 1;
          referrer.points += 100;
          referrer.pointsHistory.push({ task: "Referral", points: 100 });
          await referrer.save();
        }
      }

      await user.save();
      return res.json({ success: true, message: "User registered" });
    }

    res.json({ success: true, message: "User already exists" });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ success: false });
  }
});

// Get user info
router.get('/info/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ success: false });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
