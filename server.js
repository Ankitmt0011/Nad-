const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.get("/", (req, res) => {
  res.send("Nad Wallet Backend is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

app.use(express.json());

app.post('/register', async (req, res) => {
  const { id, username, first_name } = req.body;

  try {
    // Connect to MongoDB if not already connected
    const user = await db.collection('users').findOne({ id });

    if (!user) {
      await db.collection('users').insertOne({
        id,
        username,
        first_name,
        points: 0,
        referrals: 0,
        completedTasks: {}
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
app.post('/verify-telegram-join', async (req, res) => {
  const { id } = req.body;

  try {
    // Lookup user's Telegram ID in DB
    const user = await db.collection('users').findOne({ id });
    if (!user) return res.status(404).json({ success: false });

    const TELEGRAM_BOT_TOKEN = '7311910547:AAGBWubwo5GZGtcePUgmuvSaBnFVLlBzfd4';
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
      // Update user record
      await db.collection('users').updateOne(
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
