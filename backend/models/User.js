const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  username: String,
  first_name: String,
  points: { type: Number, default: 0 },
  referrals: { type: Number, default: 0 },
  referredBy: { type: Number, default: null },
  pointsHistory: [
    {
      reason: String,
      points: Number,
      date: { type: Date, default: Date.now }
    }
  ],
  completedTasks: {
    telegram1: { type: Boolean, default: false },
    telegram2: { type: Boolean, default: false },
    twitterFollow1: { type: Boolean, default: false },
    retweet: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model('User', userSchema);
