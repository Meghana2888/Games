import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const SHAPES = ['▲', '■', '●', '★', '♦', '♥'];

const PatternMaster = () => {
  const [phase, setPhase] = useState('home'); // home, memorize, recall, result
  const [difficulty, setDifficulty] = useState('easy');
  const [score, setScore] = useState(0);
  
  const [sequence, setSequence] = useState([]);
  const [grid, setGrid] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [timeLeft, setTimeLeft] = useState(3);
  
  const [winStatus, setWinStatus] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const handleStart = (mode) => {
    setDifficulty(mode);
    setScore(0);
    generatePattern(mode);
  };

  const generatePattern = (mode) => {
    setPhase('memorize');
    setTimeLeft(3);
    setUserInput([]);
    
    if (mode === 'easy') { // Colors
      const newSeq = [];
      for(let i=0; i<5; i++) newSeq.push(COLORS[Math.floor(Math.random() * COLORS.length)]);
      setSequence(newSeq);
    } else if (mode === 'medium') { // Shapes
      const newSeq = [];
      for(let i=0; i<6; i++) newSeq.push(SHAPES[Math.floor(Math.random() * SHAPES.length)]);
      setSequence(newSeq);
    } else if (mode === 'hard') { // Chimp Test Grid
      const newGrid = Array(16).fill(null);
      let placed = 0;
      while (placed < 6) {
        let rIdx = Math.floor(Math.random() * 16);
        if (newGrid[rIdx] === null) {
          placed++;
          newGrid[rIdx] = placed; // assigns 1 through 6
        }
      }
      setGrid(newGrid);
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase('recall');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const handleInputColorsShapes = (item) => {
    if (phase !== 'recall') return;
    const currentInput = [...userInput, item];
    setUserInput(currentInput);

    // Validate immediately
    const inputIndex = currentInput.length - 1;
    if (currentInput[inputIndex] !== sequence[inputIndex]) {
      handleGameOver(false);
    } else if (currentInput.length === sequence.length) {
      handleGameOver(true);
    }
  };

  const handleInputGrid = (index) => {
    if (phase !== 'recall') return;
    const targetValue = grid[index];
    
    // The player's expected next number is userInput.length + 1
    const expectedValue = userInput.length + 1;
    
    if (targetValue === expectedValue) {
      const currentInput = [...userInput, targetValue];
      setUserInput(currentInput);
      
      if (currentInput.length === 6) {
        handleGameOver(true);
      }
    } else {
      handleGameOver(false);
    }
  };

  const handleGameOver = async (win) => {
    setWinStatus(win);
    setPhase('result');
    
    if (win) {
      let earned = 0;
      if (difficulty === 'easy') earned = 200;
      if (difficulty === 'medium') earned = 500;
      if (difficulty === 'hard') earned = 1000;
      
      const newScore = score + earned;
      setScore(newScore);
      try {
        await API.post('/game/score', { game_name: 'Pattern Master', score: newScore });
      } catch(e){}
    }
  };

  const nextLevel = () => {
    generatePattern(difficulty);
  };

  if (phase === 'home') {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ padding: '4rem 3rem', marginTop: '2rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>Pattern Master</h2>
          
          <div style={{ fontSize: '1.2rem', marginBottom: '3rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p>Prove the superior capacity of your short-term memory.</p>
            <p>You have exactly <strong>3 seconds</strong> to memorize the sequence before it drops into the abyss.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px', margin: '0 auto' }}>
            <button className="btn-primary" style={{ padding: '15px' }} onClick={() => handleStart('easy')}>
              Easy Mode (Colors)
            </button>
            <button className="btn-primary" style={{ padding: '15px', background: 'var(--accent-color)' }} onClick={() => handleStart('medium')}>
              Medium Mode (Shapes)
            </button>
            <button className="btn-primary" style={{ padding: '15px', background: 'var(--danger-color)', border: 'none' }} onClick={() => handleStart('hard')}>
              Hard Mode (Chimp Test Grid)
            </button>
          </div>
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
        <div>
          <h1 className="text-gradient" style={{ margin: 0 }}>Pattern Master</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0', textTransform: 'capitalize' }}>{difficulty} Circuit</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold' }}>
          Score: <span style={{ color: 'var(--success-color)', fontSize: '1.5rem', marginLeft: '10px' }}>{score}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', flex: 1, alignItems: 'center', flexDirection: 'column' }}>
        
        {/* MEMORIZE PHASE */}
        {phase === 'memorize' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '3rem', textAlign: 'center', minWidth: '600px', border: '2px solid rgba(255,255,255,0.2)' }}>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--danger-color)', marginBottom: '2rem', animation: 'pulse 1s infinite' }}>MEMORIZE: {timeLeft}s</h2>
            
            {(difficulty === 'easy' || difficulty === 'medium') && (
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                {sequence.map((item, idx) => (
                  <div key={idx} style={{ 
                    width: '80px', height: '80px', borderRadius: '12px', 
                    background: difficulty === 'easy' ? item : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2.5rem', color: '#fff'
                  }}>
                    {difficulty === 'medium' ? item : ''}
                  </div>
                ))}
              </div>
            )}

            {difficulty === 'hard' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', maxWidth: '400px', margin: '0 auto' }}>
                {grid.map((cell, idx) => (
                  <div key={idx} style={{ 
                    width: '80px', height: '80px', borderRadius: '8px', 
                    background: cell ? '#fff' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2.5rem', color: '#000', fontWeight: 'bold'
                  }}>
                    {cell ? cell : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RECALL PHASE */}
        {phase === 'recall' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '3rem', textAlign: 'center', minWidth: '600px' }}>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--success-color)', marginBottom: '2rem' }}>RECREATE SEQUENCE</h2>
            
            {(difficulty === 'easy' || difficulty === 'medium') && (
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '2rem' }}>
                  {sequence.map((_, idx) => (
                    <div key={idx} style={{ 
                      width: '40px', height: '10px', borderRadius: '5px',
                      background: idx < userInput.length ? 'var(--success-color)' : 'rgba(255,255,255,0.1)'
                    }} />
                  ))}
                </div>
                
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Select the next element:</h3>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  {(difficulty === 'easy' ? COLORS : SHAPES).map((opt, idx) => (
                    <button key={idx} onClick={() => handleInputColorsShapes(opt)}
                      style={{ 
                        width: '80px', height: '80px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        background: difficulty === 'easy' ? opt : 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2.5rem', color: '#fff', transition: 'transform 0.1s'
                      }}
                      onMouseOver={e=>e.target.style.transform='scale(1.1)'}
                      onMouseOut={e=>e.target.style.transform='scale(1)'}
                    >
                      {difficulty === 'medium' ? opt : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {difficulty === 'hard' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', maxWidth: '400px', margin: '0 auto' }}>
                {grid.map((cell, idx) => {
                  const isClicked = userInput.includes(cell);
                  return (
                    <button key={idx} onClick={() => handleInputGrid(idx)}
                      disabled={isClicked}
                      style={{ 
                        width: '80px', height: '80px', borderRadius: '8px', border: 'none',
                        cursor: isClicked ? 'default' : 'pointer',
                        background: isClicked ? 'transparent' : 'rgba(255,255,255,0.2)',
                        transition: 'transform 0.1s'
                      }}
                      onMouseOver={e=>!isClicked && (e.target.style.transform='scale(1.1)')}
                      onMouseOut={e=>!isClicked && (e.target.style.transform='scale(1)')}
                    >
                    </button>
                  );
                })}
              </div>
            )}
            {difficulty === 'hard' && <p style={{ marginTop: '2rem', color: 'var(--text-secondary)' }}>Click the purely blank sequential grid numbers sequentially (1 → 6)</p>}
          </div>
        )}

        {/* RESULT PHASE */}
        {phase === 'result' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '4rem', textAlign: 'center', maxWidth: '600px' }}>
            {winStatus ? (
              <>
                <h2 style={{ fontSize: '4rem', color: 'var(--success-color)', marginBottom: '1rem', textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}>
                  SEQUENCE ACCEPTED
                </h2>
                <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>You successfully recreated the data.</p>
                <div style={{ fontSize: '1.5rem', marginBottom: '3rem' }}>
                  Current Score: <strong style={{ color: 'var(--accent-color)' }}>{score}</strong>
                </div>
                <button className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 40px' }} onClick={nextLevel}>
                  Next Sequence
                </button>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '4rem', color: 'var(--danger-color)', marginBottom: '1rem', textShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}>
                  MEMORY FAULT
                </h2>
                <p style={{ fontSize: '1.5rem', marginBottom: '3rem' }}>The synaptic connection was lost.</p>
                <button className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 40px' }} onClick={() => setPhase('home')}>
                  Return to Main Menu
                </button>
              </>
            )}
          </div>
        )}

      </div>

      <div style={{ padding: '2rem', marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
          Exit To Dashboard
        </button>
      </div>

    </div>
  );
};

export default PatternMaster;
