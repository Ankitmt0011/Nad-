const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// User model
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

// Telegram Webhook Handler
app.post(`/webhook/${BOT_TOKEN}`, async (req, res) => {
  const message = req.body.message;
  if (!message || !message.from) return res.sendStatus(200);

  const { id, username, first_name } = message.from;
  const chatId = message.chat.id;
  const text = message.text || "";

  // Register user
  let user = await User.findOne({ id });
  if (!user) {
    user = await User.create({ id, username, first_name });
  }

  // Handle /start
  if (text.startsWith("/start")) {
    await sendMessage(chatId, `Welcome to Nad Wallet, ${first_name}!`);
  }

  res.sendStatus(200);
});

// Helper to send Telegram message
async function sendMessage(chatId, text) {
  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    chat_id: chatId,
    text
  });
}

// Task verification endpoint
app.post('/verify-telegram-join', async (req, res) => {
  const { id } = req.body;
  try {
    const user = await User.findOne({ id });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const response = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`, {
      params: {
        chat_id: CHANNEL_ID,
        user_id: id
      }
    });

    const status = response.data?.result?.status;
    const isMember = ['member', 'administrator', 'creator'].includes(status);

    if (isMember) {
      await User.updateOne(
        { id },
        {
          $set: { "completedTasks.telegram": true },
          $inc: { points: 100 }
        }
      );
      return res.json({ success: true });
    }

    res.json({ success: false, message: "Not a member yet" });
  } catch (err) {
    console.error("Verification error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("✅ Nad Wallet backend is running with bot.");
});

// Start server & set webhook
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  const webhookUrl = `https://${RENDER_EXTERNAL_URL}/webhook/${BOT_TOKEN}`;
  try {
    const res = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      params: { url: webhookUrl }
    });
    console.log("✅ Webhook set:", res.data);
  } catch (err) {
    console.error("❌ Webhook setup failed:", err.response?.data || err.message);
  }
});
