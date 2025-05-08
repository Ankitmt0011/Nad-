const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const MONGODB_URI = process.env.MONGODB_URI;
const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_CHANNELS = {
  telegram: 'nadwalletofficial',
  telegram2: 'anotherchannel',
  telegram3: 'thirdchannel'
};

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  id: String,
  username: String,
  first_name: String,
  points: { type: Number, default: 0 },
  completedTasks: { type: Object, default: {} },
  referrer: String
});

const User = mongoose.model('User', userSchema);

// Register new user
app.post('/register', async (req, res) => {
  const { id, username, first_name } = req.body;

  try {
    let user = await User.findOne({ id });

    if (!user) {
      const referrer = req.query.ref || null;
      user = new User({ id, username, first_name, referrer });
      await user.save();

      // reward referrer
      if (referrer) {
        const refUser = await User.findOne({ username: referrer });
        if (refUser) {
          refUser.points += 100;
          await refUser.save();
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user data
app.post('/user-data', async (req, res) => {
  const { id } = req.body;

  try {
    const user = await User.findOne({ id });
    if (!user) return res.json({ success: false, message: 'User not found' });

    res.json({ success: true, data: {
      points: user.points,
      completedTasks: user.completedTasks
    }});
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Telegram join verification
app.post('/verify-telegram-join', async (req, res) => {
  const { id, taskId } = req.body;
  const channelUsername = TELEGRAM_CHANNELS[taskId];

  if (!channelUsername) {
    return res.status(400).json({ success: false, message: 'Invalid task ID' });
  }

  try {
    const user = await User.findOne({ id });
    if (!user) return res.json({ success: false, message: 'User not found' });

    if (user.completedTasks?.[taskId]) {
      return res.json({ success: false, message: 'Task already completed' });
    }

    const telegramRes = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`, {
      params: {
        chat_id: `@${channelUsername}`,
        user_id: id
      }
    });

    const status = telegramRes.data?.result?.status;
    if (status === 'member' || status === 'administrator' || status === 'creator') {
      user.points += 100;
      user.completedTasks[taskId] = true;
      await user.save();

      return res.json({ success: true });
    } else {
      return res.json({ success: false, message: 'User not in channel' });
    }

  } catch (error) {
    console.error('Verification error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('Nad Wallet backend is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
