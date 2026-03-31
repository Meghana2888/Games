import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const QUESTIONS = [
  { q: 'What is the capital of France?', c: 'Paris', w: ['Banana City', 'Mars', 'New York City'] },
  { q: 'What color is the sky on a clear day?', c: 'Blue', w: ['Neon Green', 'Plaid', 'Polka Dots'] },
  { q: 'How many days are in a standard week?', c: '7', w: ['-4', '420', 'Tuesday'] },
  { q: 'Who was the first President of the United States?', c: 'George Washington', w: ['Shrek', 'A Sentient Pie', 'Batman'] },
  { q: 'What sound does a cow make?', c: 'Moo', w: ['Bark', 'Meow', 'Tax Evasion'] },
  { q: 'What do bees produce?', c: 'Honey', w: ['Gasoline', 'Bluetooth Speakers', 'Ketchup'] },
  { q: 'Which planet is known as the Red Planet?', c: 'Mars', w: ['The Sun', 'Jupiter (But Angry)', 'Pluto'] },
  { q: 'What is 2 + 2?', c: '4', w: ['Fish', '9000', 'A Triangle'] },
  { q: 'What do you use to brush your teeth?', c: 'Toothbrush', w: ['A Hammer', 'Jalapenos', 'Sandpaper'] },
  { q: 'Which bird is a universal symbol of peace?', c: 'Dove', w: ['Pterodactyl', 'Angry Penguin', 'Robot Owl'] },
  { q: "What is Earth's only natural satellite?", c: 'The Moon', w: ['The Death Star', 'A Giant Cheese Wheel', 'Saturn'] },
  { q: 'What gas do humans need to breathe to survive?', c: 'Oxygen', w: ['Helium', 'Lava', 'Liquid Gold'] },
  { q: 'How many legs does a spider have?', c: '8', w: ['3', '100', 'None, they float'] }
];

const shuffleArray = (arr) => {
  const cloned = [...arr];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

const WrongAnswer = () => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  
  const [currentQ, setCurrentQ] = useState(null);
  const [options, setOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(5.0); // 5 seconds
  const [failReason, setFailReason] = useState('');
  
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const handleStart = () => {
    setStarted(true);
    setGameOver(false);
    setScore(0);
    setStreak(0);
    loadNextQuestion();
  };

  const loadNextQuestion = () => {
    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const bundledOptions = [
      { text: q.c, isCorrect: true },
      { text: q.w[0], isCorrect: false },
      { text: q.w[1], isCorrect: false },
      { text: q.w[2], isCorrect: false },
    ];
    setOptions(shuffleArray(bundledOptions));
    setCurrentQ(q);
    setTimeLeft(5.0);
    
    // Clear old interval
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Start ticking down 10 times a sec for smooth bar
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
  };

  const handleTimeout = () => {
    setFailReason('You ran out of time! You must rapidly pick a Wrong Answer!');
    endGame();
  };

  const handleSelect = (option) => {
    if (gameOver) return;
    
    if (option.isCorrect) {
      // LOSE
      if (timerRef.current) clearInterval(timerRef.current);
      setFailReason(`You selected "${option.text}" which is FACTUALLY CORRECT. You lose!`);
      endGame();
    } else {
      // WIN (Wrong answer)
      const points = 100 + Math.floor(timeLeft * 20); // Bonus for speed
      setScore(s => s + points);
      setStreak(s => s + 1);
      loadNextQuestion();
    }
  };

  const endGame = async () => {
    setGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (score > 0) {
      try {
        await API.post('/game/score', { game_name: 'Wrong Answer', score });
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!started) {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ padding: '4rem 3rem', marginTop: '2rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Wrong Answer Only.</h2>
          
          <div style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p>Your brain is wired to find the truth. We are going to punish you for it.</p>
            <ul style={{ listStyleType: 'none', padding: 0, marginTop: '1rem', fontWeight: 'bold' }}>
              <li style={{ color: 'var(--danger-color)' }}>❌ Clicking the Correct Answer = GAME OVER</li>
              <li style={{ color: 'var(--success-color)', margin: '10px 0' }}>✅ Clicking ANY absurd Answer = POINTS</li>
              <li style={{ color: 'orange' }}>⏱️ You only have 5 seconds per question.</li>
            </ul>
          </div>

          <button className="btn-primary" style={{ fontSize: '1.5rem', padding: '15px 40px', background: 'var(--success-color)' }} onClick={handleStart}>
            Begin The Panic
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
    <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-gradient">Panic Quiz</h1>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
          Score: <span style={{ color: 'var(--success-color)', fontSize: '1.5rem', marginRight: '2rem' }}>{score}</span>
          Streak: <span style={{ color: 'var(--accent-color)', fontSize: '1.5rem' }}>{streak}🔥</span>
        </div>
      </div>

      {!gameOver && currentQ ? (
        <div className="glass-panel" style={{ padding: '3rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem' }}>
            {currentQ.q}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            {options.map((opt, i) => (
              <button 
                key={i}
                className="btn-primary"
                style={{ 
                  padding: '1.5rem 1rem', fontSize: '1.5rem', background: 'rgba(255,255,255,0.05)', 
                  border: '2px solid rgba(255,255,255,0.2)', transition: 'all 0.1s ease',
                  whiteSpace: 'normal', height: '100%'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                onClick={() => handleSelect(opt)}
              >
                {opt.text}
              </button>
            ))}
          </div>

          {/* Time Bar */}
          <div style={{ width: '100%', height: '20px', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', marginTop: '4rem', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${(timeLeft / 5) * 100}%`,
              background: timeLeft > 2.5 ? 'var(--success-color)' : timeLeft > 1 ? 'orange' : 'var(--danger-color)',
              transition: 'width 0.1s linear, background 0.3s ease'
            }} />
          </div>
        </div>
      ) : (
        <div className="glass-panel animate-fade-in" style={{ padding: '4rem', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ fontSize: '4rem', color: 'var(--danger-color)', marginBottom: '1rem', textShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}>
            GAME OVER
          </h2>
          <p style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '2rem' }}>
            {failReason}
          </p>
          <div style={{ fontSize: '1.5rem', marginBottom: '3rem' }}>
            Final Score: <strong style={{ color: 'var(--success-color)' }}>{score}</strong><br/>
            Final Streak: <strong style={{ color: 'var(--accent-color)' }}>{streak}</strong>
          </div>
          <button className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 40px' }} onClick={handleStart}>
            Try The Panic Again
          </button>
        </div>
      )}

      {/* Put EXIT at the very bottom strictly per protocol */}
      <div style={{ padding: '2rem', marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
          Exit To Dashboard
        </button>
      </div>

    </div>
  );
};

export default WrongAnswer;
