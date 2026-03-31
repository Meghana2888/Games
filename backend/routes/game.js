const express = require('express');
const router = express.Router();
const db = require('../database');
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
router.get('/dashboard', auth, (req, res) => {
  const userId = req.user.id;

  db.get(`SELECT streak FROM users WHERE id = ?`, [userId], (err, user) => {
    if (err || !user) return res.status(500).json({ error: 'Error fetching user' });

    db.all(`SELECT game_name, MAX(score) as max_score FROM scores WHERE user_id = ? GROUP BY game_name`, [userId], (err, scores) => {
      if (err) return res.status(500).json({ error: 'Error fetching scores' });
      res.json({ streak: user.streak, highScores: scores });
    });
  });
});

// GET /api/game/leaderboard: Get the global #1 high score across all users for each game
router.get('/leaderboard', auth, (req, res) => {
  const query = `
    SELECT game_name, username, max_score 
    FROM (
      SELECT s.game_name, u.username, s.score as max_score,
             ROW_NUMBER() OVER(PARTITION BY s.game_name ORDER BY s.score DESC) as rn
      FROM scores s
      JOIN users u ON s.user_id = u.id
    ) 
    WHERE rn = 1
    ORDER BY game_name;
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error fetching leaderboard' });
    res.json(rows);
  });
});

// POST /api/game/score: Submit a new score after game is finished
router.post('/score', auth, (req, res) => {
  const userId = req.user.id;
  const { game_name, score } = req.body;

  if (!game_name || score === undefined) return res.status(400).json({ error: 'Missing game parameters' });

  db.run(`INSERT INTO scores (user_id, game_name, score) VALUES (?, ?, ?)`, [userId, game_name, score], function (err) {
    if (err) return res.status(500).json({ error: 'Database error while saving score' });
    res.status(201).json({ message: 'Score saved!' });
  });
});

module.exports = router;
