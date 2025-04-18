const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
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

// Default route
app.get("/", (req, res) => {
  res.send("✅ Nad Wallet backend is running!");
});

// Register a new user
app.post('/register', async (req, res) => {
  const { id, username, first_name } = req.body;
  try {
    let user = await User.findOne({ id });
    if (!user) {
      user = await User.create({ id, username, first_name });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Verify Telegram channel membership
app.post('/verify-telegram-join', async (req, res) => {
  const { id } = req.body;

  try {
    const user = await User.findOne({ id });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
    const CHANNEL_USERNAME = '@nadwalletofficial';

    const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember`, {
      params: {
        chat_id: CHANNEL_USERNAME,
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
