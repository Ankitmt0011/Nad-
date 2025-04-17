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
