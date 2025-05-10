const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Mongoose schema and model
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
    retweet: { type: Boolean, default: false }
  }
});
const User = mongoose.model("User", userSchema);

// Register user
app.post('/register', async (req, res) => {
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
app.post('/user-data', async (req, res) => {
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

// Verify Telegram channel join
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

// Save non-Telegram tasks (e.g., Twitter, retweet)
app.post('/save-task', async (req, res) => {
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
