import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const WIN_QUOTES = [
  "Incredible aptitude! You're a natural problem solver.",
  "Outstanding run! The logic flew right by you.",
  "You conquered the run like a true elite engineer."
];

const LOSS_QUOTES = [
  "A minor setback. Take a breath and run again!",
  "Logic bugs happen. Debug your mind and retry!",
  "You were so close! Next time, the run is yours."
];

const QUESTIONS_BANK = {
  Easy: [
    { type: 'text', category: 'Number Series', q: 'Find the next number: 2, 4, 6, 8, ?', options: ['10', '12', '14', '16'], a: '10' },
    { type: 'text', category: 'Speed Math', q: 'What is exactly 12% of 250?', options: ['25', '30', '35', '40'], a: '30' },
    { type: 'text', category: 'Logical Reasoning', q: 'If A is taller than B, and B is taller than C, who is the tallest?', options: ['A', 'B', 'C', 'Cannot be determined'], a: 'A' },
    { type: 'text', category: 'Coding MCQs', q: 'What HTML tag is used for the largest heading?', options: ['<head>', '<h6>', '<h1>', '<header>'], a: '<h1>' },
    { type: 'text', category: 'Database Systems', q: 'What does SQL stand for?', options: ['Structured Query Language', 'Strong Question Language', 'Standard Query Logic', 'Sequential Query Loop'], a: 'Structured Query Language' },
    { type: 'text', category: 'Time & Work', q: 'If 1 person completes a task in 4 days, how long does it take 2 people?', options: ['1 day', '2 days', '3 days', '4 days'], a: '2 days' },
    { type: 'svg', category: 'Pattern Logic', svgType: 'basic-shapes', q: 'Look at the square inside a circle. If inverted, what is it?', options: ['Circle inside Square', 'Two Squares', 'Triangle inside Circle', 'Circle inside Triangle'], a: 'Circle inside Square' }
  ],
  Medium: [
    { type: 'text', category: 'Number Series', q: 'Find the next number: 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '48'], a: '42' },
    { type: 'text', category: 'Logical Reasoning', q: "If A is brother of B, C is father of A. Who is uncle of D?", options: ['A', 'C', 'B', 'Cannot be determined'], a: 'Cannot be determined' },
    { type: 'text', category: 'Time & Work', q: 'A can do a work in 15 days, B in 20 days. Fraction left after 4 days together?', options: ['8/15', '7/15', '1/4', '1/10'], a: '8/15' },
    { type: 'text', category: 'Probability', q: 'Two dice are thrown. Probability of product being even?', options: ['1/2', '3/4', '5/8', '1/4'], a: '3/4' },
    { type: 'text', category: 'Coding MCQs', q: 'Which data structure inherently uses LIFO?', options: ['Queue', 'Stack', 'Linked List', 'Graph'], a: 'Stack' },
    { type: 'svg', category: 'Pattern Logic', svgType: 'logic-gates', q: 'Based on the generic circuit topology shown, what is the sequence of the outer two logic gates flowing into the final rightmost top gate?', options: ['OR -> AND', 'XOR -> AND', 'NAND -> OR', 'NOR -> XOR'], a: 'XOR -> AND' },
  ],
  Hard: [
    { type: 'text', category: 'Database Systems', q: 'What does the ACID property stand for in standard RDBMS architecture?', options: ['Atomicity, Consistency, Isolation, Durability', 'Array, Code, Integer, Data', 'All Core Indices Designed', 'Atomic Concurrent Isolated Data'], a: 'Atomicity, Consistency, Isolation, Durability' },
    { type: 'text', category: 'System Design', q: 'Which caching strategy writes data to cache and store simultaneously?', options: ['Write-back', 'Write-around', 'Write-through', 'Read-through'], a: 'Write-through' },
    { type: 'text', category: 'Coding MCQs', q: 'In JavaScript, what is the output of `typeof NaN`?', options: ['"number"', '"NaN"', '"undefined"', '"object"'], a: '"number"' },
    { type: 'svg', category: 'Venn Diagram', svgType: 'venn-diagram', q: 'Which colored region securely represents candidates who only know Python AND Java, but NOT C++?', options: ['Top Intersection (Orange)', 'Center (White)', 'Bottom Intersection (Purple)', 'Left Intersection (Green)'], a: 'Top Intersection (Orange)' },
    { type: 'text', category: 'Algorithm Analysis', q: 'What is the worst-case time complexity of standard QuickSort?', options: ['O(N log N)', 'O(N^2)', 'O(N)', 'O(log N)'], a: 'O(N^2)' },
    { type: 'text', category: 'Probability', q: 'A bag has 3 red and 4 blue marbles. Drawing 2 without replacement, probability both are red?', options: ['1/7', '2/7', '3/14', '1/12'], a: '1/7' },
  ]
};

export default function PlacementRun() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [active, setActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState('Medium');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [time, setTime] = useState(30);
  const [currentQ, setCurrentQ] = useState(null);
  const [questionPool, setQuestionPool] = useState([]);
  const [streak, setStreak] = useState(0);
  const [quote, setQuote] = useState("");

  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startGame = () => {
    // Shuffle only the selected difficulty bank
    const shuffled = [...QUESTIONS_BANK[difficulty]].sort(() => Math.random() - 0.5);
    setQuestionPool(shuffled);
    setCurrentQ(shuffled[0]);
    setScore(0);
    setLevel(1);
    setStreak(0);
    setActive(true);
    setGameOver(false);
    setQuote("");
    startTimer(30);
  };

  const startTimer = (duration) => {
    setTime(duration);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTime(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFail("Time Expired!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const getRandomQuote = (isWin) => {
    const arr = isWin ? WIN_QUOTES : LOSS_QUOTES;
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const handleFail = async (reason) => {
    setActive(false);
    setGameOver(true);
    setQuote(getRandomQuote(streak > 3)); // If they got more than 3, treat it as a "good" run for quotes
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await API.post('/game/score', { game_name: `Placement Run (${difficulty})`, score: score });
    } catch (e) {
      console.error("Score submit failed", e);
    }
  };

  const handleAnswer = (selectedOpt) => {
    if (selectedOpt === currentQ.a) {
      // Correct
      const points = 100 + (time * 5) + (level * 20);
      setScore(s => s + points);
      setStreak(s => s + 1);
      
      const newStreak = streak + 1;
      let newLevel = level;
      if (newStreak % 3 === 0) {
        newLevel += 1;
        setLevel(newLevel);
      }

      // Next Question
      const nextPool = [...questionPool];
      nextPool.shift(); // remove current
      
      // If pool empty, reshuffle to make endless
      if (nextPool.length === 0) {
        const reshuffled = [...QUESTIONS_BANK[difficulty]].sort(() => Math.random() - 0.5);
        setQuestionPool(reshuffled);
        setCurrentQ(reshuffled[0]);
      } else {
        setQuestionPool(nextPool);
        setCurrentQ(nextPool[0]);
      }

      // Dynamic time limit based on streak and difficulty
      let baseTime = difficulty === 'Hard' ? 20 : (difficulty === 'Medium' ? 25 : 30);
      const newTimeLimit = Math.max(10, baseTime - (newLevel * 2));
      startTimer(newTimeLimit);

    } else {
      // Wrong
      handleFail("Incorrect Answer.");
    }
  };

  const renderSVG = (type) => {
    if (type === 'basic-shapes') {
      return (
        <svg width="150" height="150" viewBox="0 0 150 150" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <circle cx="75" cy="75" r="50" fill="none" stroke="#3b82f6" strokeWidth="4" />
          <rect x="40" y="40" width="70" height="70" fill="none" stroke="#10b981" strokeWidth="4" />
        </svg>
      );
    }
    if (type === 'logic-gates') {
      return (
        <svg width="300" height="200" viewBox="0 0 300 200" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px' }}>
          <rect x="20" y="30" width="60" height="40" rx="5" fill="none" stroke="#3b82f6" strokeWidth="3"/>
          <text x="35" y="55" fill="#3b82f6" fontFamily="monospace" fontWeight="bold">XOR</text>
          
          <rect x="20" y="110" width="60" height="40" rx="5" fill="none" stroke="#10b981" strokeWidth="3"/>
          <text x="35" y="135" fill="#10b981" fontFamily="monospace" fontWeight="bold">AND</text>
          
          <rect x="180" y="70" width="80" height="50" rx="5" fill="none" stroke="#ef4444" strokeWidth="3"/>
          <text x="200" y="100" fill="#ef4444" fontFamily="monospace" fontWeight="bold">AND</text>

          <line x1="80" y1="50" x2="180" y2="80" stroke="#f8fafc" strokeWidth="2" strokeDasharray="4"/>
          <line x1="80" y1="130" x2="180" y2="100" stroke="#f8fafc" strokeWidth="2" strokeDasharray="4"/>
          
          <circle cx="270" cy="95" r="8" fill="#f59e0b" />
          <line x1="260" y1="95" x2="285" y2="95" stroke="#f59e0b" strokeWidth="2" />
        </svg>
      );
    }
    if (type === 'venn-diagram') {
      return (
        <svg width="300" height="250" viewBox="0 0 300 250" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px' }}>
          <circle cx="150" cy="90" r="70" fill="none" stroke="#3b82f6" strokeWidth="4" />
          <text x="135" y="40" fill="#3b82f6" fontWeight="bold">Python</text>
          
          <circle cx="190" cy="150" r="70" fill="none" stroke="#ef4444" strokeWidth="4" />
          <text x="220" y="210" fill="#ef4444" fontWeight="bold">Java</text>
          
          <circle cx="110" cy="150" r="70" fill="none" stroke="#10b981" strokeWidth="4" />
          <text x="50" y="210" fill="#10b981" fontWeight="bold">C++</text>

          <circle cx="150" cy="155" r="5" fill="#fff" />
          <circle cx="170" cy="115" r="5" fill="#f59e0b" />
          <circle cx="130" cy="115" r="5" fill="#a855f7" />
          <circle cx="150" cy="180" r="5" fill="#ec4899" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {(!active && !gameOver) && (
        <div className="glass-panel" style={{ textAlign: 'center', marginTop: '5vh', width: '100%' }}>
          <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, #38bdf8, #818cf8, #c084fc)', WebkitBackgroundClip: 'text' }}>Placement Run</h1>
          <p style={{ fontSize: '1.2rem', color: '#cbd5e1', marginBottom: '2rem', lineHeight: '1.6' }}>
            A rigorous, endless aptitude test mirroring technical placements. <br/>
            Survive as long as you can through Number Series, Logic, Probability, and Code. <br/>
            One wrong answer ends the run.
          </p>

          <h3 style={{ marginBottom: '1rem' }}>Select Test Difficulty:</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
            {['Easy', 'Medium', 'Hard'].map(lvl => (
              <button 
                key={lvl}
                className="btn-primary" 
                style={{ 
                  background: difficulty === lvl ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                  fontWeight: difficulty === lvl ? 'bold' : 'normal'
                }}
                onClick={() => setDifficulty(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button className="btn-primary" style={{ padding: '15px 40px', fontSize: '1.3rem', background: 'var(--success-color)' }} onClick={startGame}>
            Begin The Run
          </button>
        </div>
      )}

      {active && currentQ && (
        <div style={{ zIndex: 10, width: '100%', maxWidth: '800px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Category</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#60a5fa' }}>{currentQ.category}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'block' }}>TIMER</span>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'monospace', color: time <= 5 ? '#ef4444' : '#10b981', animation: time <= 5 ? 'pulse 1s infinite' : 'none' }}>
                {time}s
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
               <span style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Score</span>
               <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#f59e0b' }}>{score}</span>
            </div>
          </div>

          <div className="glass-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', alignSelf: 'flex-start', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Difficulty Level {level}
            </span>
            <h2 style={{ fontSize: '1.8rem', lineHeight: '1.5', marginBottom: '2rem' }}>{currentQ.q}</h2>
            
            {currentQ.type === 'svg' && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                {renderSVG(currentQ.svgType)}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', width: '100%', marginTop: 'auto' }}>
              {currentQ.options.map((opt, i) => (
                <button key={i} className="btn-primary" style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60px', wordBreak: 'break-word', whiteSpace: 'normal' }} onClick={() => handleAnswer(opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="glass-panel" style={{ textAlign: 'center', marginTop: '5vh', width: '100%', border: `1px solid ${streak > 3 ? '#10b981' : '#ef4444'}` }}>
          <h2 style={{ fontSize: '3rem', color: streak > 3 ? '#10b981' : '#ef4444', marginBottom: '1rem' }}>
            {streak > 3 ? 'Incredible Run!' : 'Run Invalidated'}
          </h2>
          <p style={{ fontSize: '1.3rem', fontStyle: 'italic', marginBottom: '2rem', color: '#cbd5e1' }}>
            "{quote}"
          </p>
          <p style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f8fafc' }}>Final Score: <strong style={{ color: '#f59e0b' }}>{score}</strong> pts</p>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>You survived to Level {level} with a streak of {streak} questions on {difficulty} mode.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn-primary" style={{ background: '#3b82f6' }} onClick={startGame}>
              Start New Run
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '2rem', marginTop: 'auto', display: 'flex', justifyContent: 'center', width: '100%', zIndex: 10 }}>
        <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer' }}>
          Exit To Dashboard
        </button>
      </div>

    </div>
  );
}
