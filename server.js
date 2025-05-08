const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  throw new Error("❌ MONGO_URI is not defined in environment variables.");
}

mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// User schema and model
const userSchema = new mongoose.Schema({
  id: Number,
  username: String,
  first_name: String,
  points: { type: Number, default: 0 },
  referrals: { type: Number, default: 0 },
  completedTasks: {
    telegram1: { type: Boolean, default: false },
    telegram2: { type: Boolean, default: false },
    twitterFollow1: { type: Boolean, default: false },
    twitterFollow2: { type: Boolean, default: false },
    retweet: { type: Boolean, default: false }
  }
});
const User = mongoose.model('User', userSchema);

// Telegram webhook route
app.post(`/webhook/${process.env.TELEGRAM_BOT_TOKEN}`, async (req, res) => {
  const message = req.body.message;
  if (!message || !message.from) return res.sendStatus(200);

  const { id, username, first_name } = message.from;
  const chatId = message.chat.id;
  const text = message.text || "";

  let user = await User.findOne({ id });
  if (!user) {
    user = await User.create({ id, username, first_name });
  }

  if (text.startsWith("/start")) {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: "Welcome! Tap below to open your wallet:",
      reply_markup: {
        inline_keyboard: [[
          { text: "Open Wallet", web_app: { url: "https://nadwallet.vercel.app/" } }
        ]]
      }
    });
  }

  res.sendStatus(200);
});

// Generic Telegram task verifier
app.post('/verify-telegram-join', async (req, res) => {
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
    console.error("Verification error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
});

// Get user data
app.post('/user-data', async (req, res) => {
  const { id } = req.body;

  try {
    const user = await User.findOne({ id });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      data: {
        points: user.points,
        completedTasks: user.completedTasks
      }
    });
  } catch (err) {
    console.error("Fetch user data error:", err.message);
    res.status(500).json({ success: false });
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("✅ Nad Wallet backend is running with Telegram Bot!");
});

// Start server and set webhook
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  if (process.env.RENDER_EXTERNAL_URL) {
    const webhookUrl = `${process.env.RENDER_EXTERNAL_URL}/webhook/${process.env.TELEGRAM_BOT_TOKEN}`;
    try {
      const res = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
        params: { url: webhookUrl }
      });
      console.log("✅ Webhook set:", res.data);
    } catch (err) {
      console.error("❌ Webhook setup failed:", err.response?.data || err.message);
    }
  } else {
    console.warn("⚠️ RENDER_EXTERNAL_URL not set. Webhook not configured.");
  }
});
