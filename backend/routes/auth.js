const express = require('express');
const router = express.Router();
const { User } = require('../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-key-for-puzzle-platform'; // In production, use env variables

// Helper: Calculate streak
const calculateStreak = (last_login, current_streak) => {
  if (!last_login) return 1;
  const lastDate = new Date(last_login).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return current_streak + 1; // Consecutive day
  if (diffDays === 0) return current_streak;     // Same day login
  return 1;                                      // Streak broken
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid password' });

    // Update Streak
    const newStreak = calculateStreak(user.last_login, user.streak);
    const now = new Date();
    
    user.streak = newStreak;
    user.last_login = now;
    await user.save();

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, username: user.username, streak: newStreak } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
