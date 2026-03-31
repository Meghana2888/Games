import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const TYPING_PHRASES = [
  "The quick brown fox jumps over the lazy dog.",
  "Hello world, programming games in React is fun!",
  "A journey of a thousand miles begins with a single step.",
  "To be or not to be, that is the question.",
  "May the force be with you."
];

const SpeedTypist = () => {
  const [started, setStarted] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [input, setInput] = useState('');
  const [timer, setTimer] = useState(30);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const inputRef = useRef(null);
  
  const navigate = useNavigate();

  const initializeGame = () => {
    setPhrase(TYPING_PHRASES[Math.floor(Math.random() * TYPING_PHRASES.length)]);
    setInput('');
    setTimer(30);
    setScore(0);
    setGameOver(false);
    setStarted(true);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  const endGame = async (finalScore) => {
    setGameOver(true);
    try {
      await API.post('/game/score', { game_name: 'Speed Typist', score: finalScore });
    } catch (err) {
      console.error('Failed to submit score');
    }
  };

  useEffect(() => {
    let interval;
    if (started && timer > 0 && !gameOver) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && !gameOver) {
      endGame(score);
    }
    return () => clearInterval(interval);
  }, [started, timer, gameOver, score]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);

    if (val === phrase) {
      // Score calculation based on length and time remaining
      const newScore = score + (phrase.length * 10) + (timer * 5);
      setScore(newScore);
      setPhrase(TYPING_PHRASES[Math.floor(Math.random() * TYPING_PHRASES.length)]);
      setInput('');
      setTimer((prev) => Math.min(prev + 5, 30)); // Bonus time!
    }
  };

  if (!started) {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ padding: '3rem', marginTop: '2rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Speed Typist</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            Race against the clock to type random phrases exactly as they appear. Case-sensitive and space-sensitive!
          </p>
          <button className="btn-primary" style={{ fontSize: '1.2rem', padding: '12px 32px' }} onClick={initializeGame}>
            Start 30s Countdown
          </button>
        </div>
        <div style={{ padding: '2rem', marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
            Exit To Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-gradient">Time: {timer}s</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '1.5rem', color: 'var(--success-color)' }}>
            Score: {score}
          </span>
        </div>
      </div>

      {gameOver ? (
        <div className="glass-panel animate-fade-in" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 className="text-gradient" style={{ fontSize: '2.5rem' }}>Time's Up!</h2>
          <p style={{ fontSize: '1.5rem', margin: '1rem 0' }}>It's over! Your fingers are tired.</p>
          <p style={{ color: 'var(--success-color)', fontSize: '1.2rem' }}>Final Score Approved: {score} pts</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '3rem' }}>
            <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--accent-color)' }} onClick={() => navigate('/')}>
              Exit Arcade
            </button>
            <button className="btn-primary" onClick={initializeGame}>
              Play Again
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.8rem', marginBottom: '2rem', color: '#f8fafc', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
            {phrase}
          </p>
          
          <input 
            ref={inputRef}
            type="text" 
            className="input-field" 
            value={input} 
            onChange={handleInputChange} 
            placeholder="Type it here..." 
            style={{ fontSize: '1.5rem', padding: '15px 20px', textAlign: 'center', border: input !== phrase.substring(0, input.length) ? '2px solid var(--danger-color)' : '1px solid rgba(255,255,255,0.2)' }}
          />

          {input.length > 0 && input !== phrase.substring(0, input.length) && (
            <p style={{ color: 'var(--danger-color)', marginTop: '1rem' }}>Typo detected. Backspace!</p>
          )}
        </div>
      )}

      <div style={{ padding: '2rem', marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
          Exit To Dashboard
        </button>
      </div>
    </div>
  );
};

export default SpeedTypist;
