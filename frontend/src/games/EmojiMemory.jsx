import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const EMOJIS = ['🚀', '👽', '🧠', '💻', '🔮', '⚡️', '🔥', '🌊'];

const EmojiMemory = () => {
  const [started, setStarted] = useState(false);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  const navigate = useNavigate();

  const initializeGame = () => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji }));
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameOver(false);
    setScore(0);
    setStarted(true);
  };

  useEffect(() => {
    if (flipped.length === 2) {
      const [first, second] = flipped;
      if (cards[first].emoji === cards[second].emoji) {
        setMatched((prev) => [...prev, cards[first].emoji]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
      setMoves((m) => m + 1);
    }
  }, [flipped, cards]);

  const submitScore = async (finalScore) => {
    try {
      await API.post('/game/score', { game_name: 'Emoji Memory', score: finalScore });
    } catch (err) {
      console.error('Failed to submit score');
    }
  };

  useEffect(() => {
    if (started && matched.length === EMOJIS.length) {
      const calculateScore = Math.max(100, 1000 - (moves * 20));
      setScore(calculateScore);
      setGameOver(true);
      submitScore(calculateScore);
    }
  }, [matched, started, moves]);

  const handleFlip = (index) => {
    if (flipped.length < 2 && !flipped.includes(index) && !matched.includes(cards[index].emoji)) {
      setFlipped((prev) => [...prev, index]);
    }
  };

  if (!started) {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ padding: '3rem', marginTop: '2rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Emoji Memory Match</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            Flip cards and match the identical pairs as quickly and efficiently as possible. Fewer turns yield a higher score!
          </p>
          <button className="btn-primary" style={{ fontSize: '1.2rem', padding: '12px 32px' }} onClick={initializeGame}>
            Start Memory Check
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
        <h1 className="text-gradient">Memory Match</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>Moves: {moves}</span>
        </div>
      </div>

      {gameOver ? (
        <div className="glass-panel animate-fade-in" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 className="text-gradient" style={{ fontSize: '2.5rem' }}>You Won!</h2>
          <p style={{ fontSize: '1.5rem', margin: '1rem 0' }}>It took you {moves} moves.</p>
          <p style={{ color: 'var(--success-color)', fontSize: '1.2rem' }}>Score Awarded: {score} pts</p>
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
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', 
          maxWidth: '500px', margin: '0 auto', background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '16px' 
        }}>
          {cards.map((card, idx) => {
            const isFlipped = flipped.includes(idx) || matched.includes(card.emoji);
            return (
              <div 
                key={card.id} 
                onClick={() => handleFlip(idx)}
                style={{
                  height: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  background: isFlipped ? '#f8fafc' : 'var(--accent-color)',
                  color: isFlipped ? '#000' : 'transparent',
                  borderRadius: '12px',
                  cursor: isFlipped ? 'default' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: isFlipped ? '0 0 15px rgba(255,255,255,0.2)' : '0 4px 6px rgba(0,0,0,0.3)',
                  transform: isFlipped ? 'rotateY(180deg)' : 'none'
                }}
              >
                <span style={{ transform: isFlipped ? 'rotateY(180deg)' : 'none' }}>
                  {isFlipped ? card.emoji : '?'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmojiMemory;
