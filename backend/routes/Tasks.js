const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');

// Telegram channel join verification
router.post('/verify-telegram-join', async (req, res) => {
  const { id, task, channel } = req.body;

  if (!id || !task || !channel) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  try {
    const user = await User.findOne({ id });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const response = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChatMember`, {
      params: { chat_id: channel, user_id: id }
    });

    const status = response.data?.result?.status;
    const isMember = ['member', 'administrator', 'creator'].includes(status);

    if (isMember && !user.completedTasks[task]) {
      await User.updateOne(
        { id },
        {
          $set: { [`completedTasks.${task}`]: true },
          $inc: { points: 100 }
        }
      );
      return res.json({ success: true });
    }

    res.json({ success: false, message: "Not a member or already rewarded" });
  } catch (err) {
    console.error("Telegram verification error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
});

// Save non-Telegram tasks (e.g., Twitter follow, retweet)
router.post('/save-task', async (req, res) => {
  const { id, taskId, points } = req.body;

  if (!id || !taskId || !points) return res.status(400).json({ success: false, message: "Missing data" });

  try {
    const user = await User.findOne({ id });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.completedTasks[taskId]) {
      user.completedTasks[taskId] = true;
      user.points += points;
      await user.save();
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Save task error:", err.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
