const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Use the MongoDB URI from the .env file
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Mongoose User model
const userSchema = new mongoose.Schema({
  id: Number,
  username: String,
  first_name: String,
  points: { type: Number, default: 0 },
  referrals: { type: Number, default: 0 },
  completedTasks: {
    telegram: { type: Boolean, default: false },
    twitterFollow: { type: Boolean, default: false },
    retweet: { type: Boolean, default: false }
  }
});
const User = mongoose.model('User', userSchema);

// Test route
app.get("/", (req, res) => {
  res.send("Nad Wallet Backend is running!");
});

// Register route
app.post('/register', async (req, res) => {
  const { id, username, first_name } = req.body;

  try {
    const user = await User.findOne({ id });
    if (!user) {
      await User.create({
        id,
        username,
        first_name
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify Telegram Join
app.post('/verify-telegram-join', async (req, res) => {
  const { id } = req.body;

  try {
    const user = await User.findOne({ id });
    if (!user) return res.status(404).json({ success: false });

    const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
    const CHANNEL_USERNAME = '@nadwalletofficial';

    const result = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember`, {
      params: {
        chat_id: CHANNEL_USERNAME,
        user_id: id
      }
    });

    const status = result.data.result.status;
    const isMember = ['member', 'administrator', 'creator'].includes(status);

    if (isMember) {
      await User.updateOne(
        { id },
        {
          $set: { "completedTasks.telegram": true },
          $inc: { points: 100 }
        }
      );
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    console.error("Telegram verification error:", err.message);
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
