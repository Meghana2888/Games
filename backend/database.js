const mongoose = require('mongoose');

// Mongoose connection to MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://maggi:maggi@cluster0.nxasyps.mongodb.net/Games?appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas.'))
  .catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  streak: {
    type: Number,
    default: 0
  },
  last_login: {
    type: Date
  }
});

// Score Schema
const scoreSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  game_name: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  played_at: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);
const Score = mongoose.model('Score', scoreSchema);

module.exports = { User, Score, mongoose };
