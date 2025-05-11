const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register referral
router.post('/referral', async (req, res) => {
  const { referrerId, newUserId } = req.body;

  if (!referrerId || !newUserId) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  try {
    const referrer = await User.findOne({ id: referrerId });
    const newUser = await User.findOne({ id: newUserId });

    if (!referrer || !newUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent self-referral and double rewards
    if (referrerId === newUserId || newUser.completedTasks.referral) {
      return res.status(400).json({ success: false, message: "Invalid or duplicate referral" });
    }

    newUser.completedTasks.referral = true;
    referrer.referrals += 1;
    referrer.points += 100;

    await newUser.save();
    await referrer.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Referral error:", err.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
