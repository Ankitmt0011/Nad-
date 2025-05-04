const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// User schema
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

// Telegram webhook route
app.post(`/webhook/${process.env.BOT_TOKEN}`, async (req, res) => {
  const message = req.body.message;
  if (!message || !message.from) return res.sendStatus(200);

  const { id, username, first_name } = message.from;
  const chat_id = message.chat.id;
  const text = message.text || "";

  let user = await User.findOne({ id });
  if (!user) {
    user = await User.create({ id, username, first_name });
  }

  if (text === "/start") {
    await sendMessage(chat_id, "Welcome to Nad Wallet! You can now complete tasks and earn ND points.");
  }

  res.sendStatus(200);
});

// Verify Telegram channel join
app.post('/verify-telegram-join', async (req, res) => {
  const { id } = req.body;

  try {
    const user = await User.findOne({ id });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const response = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getChatMember`, {
      params: {
        chat_id: process.env.CHANNEL_ID,
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
  res.send("✅ Nad Wallet backend is running with Telegram Bot!");
});

// Helper: send message via Telegram
async function sendMessage(chatId, text) {
  await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    chat_id: chatId,
    text
  });
}

// Start server and set webhook
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  const webhookUrl = `https://${process.env.RENDER_EXTERNAL_URL}/webhook/${process.env.BOT_TOKEN}`;
  try {
    const res = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook`, {
      params: { url: webhookUrl }
    });
    console.log("✅ Telegram webhook set:", res.data);
  } catch (err) {
    console.error("❌ Failed to set webhook:", err.response?.data || err.message);
  }
});
