const express = require('express');
const router = express.Router();
const { User, Score, mongoose } = require('../database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-key-for-puzzle-platform'; // Replace with env variable in prod

// Middleware to protect routes
const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalid' });
    req.user = user;
    next();
  });
};

// GET /api/game/dashboard: Get user streak and high scores
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(500).json({ error: 'Error fetching user' });

    const scores = await Score.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$game_name', max_score: { $max: '$score' } } },
      { $project: { _id: 0, game_name: '$_id', max_score: 1 } }
    ]);

    res.json({ streak: user.streak, highScores: scores });
  } catch (error) {
    console.error('Error in /api/game/dashboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/game/leaderboard: Get the global #1 high score across all users for each game
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const leaderboard = await Score.aggregate([
      // Sort by score descending to get highest first
      { $sort: { score: -1 } },
      // Group by game_name to find max score per game
      { 
        $group: {
          _id: '$game_name',
          max_score: { $first: '$score' },
          user_id: { $first: '$user_id' }
        }
      },
      // Join with users collection
      { 
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      // Unwind user array
      { $unwind: '$user' },
      // Project final structure expected by frontend
      { 
        $project: {
          _id: 0,
          game_name: '$_id',
          max_score: 1,
          username: '$user.username'
        }
      },
      // Order by game_name alphabetically
      { $sort: { game_name: 1 } }
    ]);

    res.json(leaderboard);
  } catch (error) {
    console.error('Error in /api/game/leaderboard:', error);
    res.status(500).json({ error: 'Database error fetching leaderboard' });
  }
});

// POST /api/game/score: Submit a new score after game is finished
router.post('/score', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { game_name, score } = req.body;

    if (!game_name || score === undefined) return res.status(400).json({ error: 'Missing game parameters' });

    const newScore = new Score({
      user_id: userId,
      game_name,
      score
    });
    
    await newScore.save();

    res.status(201).json({ message: 'Score saved!' });
  } catch (error) {
    console.error('Error in /api/game/score:', error);
    res.status(500).json({ error: 'Database error while saving score' });
  }
});

module.exports = router;
