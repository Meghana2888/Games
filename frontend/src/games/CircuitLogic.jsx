import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const GATE_TYPES = ['?', 'AND', 'OR', 'XOR', 'NAND', 'NOR'];

const runGate = (gate, in1, in2) => {
  if (gate === '?') return null;
  const b1 = Boolean(in1);
  const b2 = Boolean(in2);
  let res;
  if (gate === 'AND') res = b1 && b2;
  else if (gate === 'OR') res = b1 || b2;
  else if (gate === 'XOR') res = b1 !== b2;
  else if (gate === 'NAND') res = !(b1 && b2);
  else if (gate === 'NOR') res = !(b1 || b2);
  return res ? 1 : 0;
};

const PUZZLES = {
  Easy: [
    {
      title: "Signal Bootstrap",
      slots: 1,
      target: 1,
      description: "Connect the two inputs (1 and 0) using a valid logic gate to yield a True (1) signal.",
      solution: ['OR'], // Example valid solution for hint
      evaluator: (gates) => runGate(gates[0], 1, 0),
      renderGrid: (gates, cycleSlot, activeHints) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', fontSize: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '3rem', borderRadius: '12px' }}>
          <div className="btn-primary" style={{ background: '#333' }}>INPUT A: 1</div>
          <div style={{ width: '40px', height: '4px', background: 'var(--accent-color)' }}></div>
          <button 
            onClick={() => cycleSlot(0)}
            style={{ 
              padding: '20px 40px', fontSize: '1.5rem', background: activeHints[0] ? 'var(--success-color)' : 'var(--accent-color)', 
              border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontWeight: 'bold'
            }}>
            {gates[0]}
          </button>
          <div style={{ width: '40px', height: '4px', background: 'var(--accent-color)' }}></div>
          <div className="btn-primary" style={{ background: '#333' }}>INPUT B: 0</div>
        </div>
      )
    },
    {
      title: "Inversion Protocol",
      slots: 1,
      target: 0,
      description: "Both systems are active (1 and 1). We need a gate that chokes the signal down to 0.",
      solution: ['XOR'], // NAND or XOR works
      evaluator: (gates) => runGate(gates[0], 1, 1),
      renderGrid: (gates, cycleSlot, activeHints) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', fontSize: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '3rem', borderRadius: '12px' }}>
          <div className="btn-primary" style={{ background: '#333' }}>Sys A: 1</div>
          <div style={{ width: '40px', height: '4px', background: 'var(--danger-color)' }}></div>
          <button 
            onClick={() => cycleSlot(0)}
            style={{ 
              padding: '20px 40px', fontSize: '1.5rem', background: activeHints[0] ? 'var(--success-color)' : 'var(--accent-color)', 
              border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontWeight: 'bold'
            }}>
            {gates[0]}
          </button>
          <div style={{ width: '40px', height: '4px', background: 'var(--danger-color)' }}></div>
          <div className="btn-primary" style={{ background: '#333' }}>Sys B: 1</div>
        </div>
      )
    }
  ],
  Medium: [
    {
      title: "Cascading Signals",
      slots: 2,
      target: 1,
      description: "Three inputs (1, 0, 1). The first two merge into Gate 1. Its output merges with input 3 into Gate 2. Target final output is 1.",
      solution: ['OR', 'AND'], 
      evaluator: (gates) => {
        const out1 = runGate(gates[0], 1, 0);
        if (out1 === null) return null;
        return runGate(gates[1], out1, 1);
      },
      renderGrid: (gates, cycleSlot, activeHints) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.2rem' }}>
            <div className="btn-primary" style={{ background: '#333' }}>In1: 1</div>
            <div style={{ width: '20px', height: '2px', background: 'var(--accent-color)' }}></div>
            <button onClick={() => cycleSlot(0)} style={{ padding: '15px 30px', background: activeHints[0] ? 'var(--success-color)' : 'var(--accent-color)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}>{gates[0]}</button>
            <div style={{ width: '20px', height: '2px', background: 'var(--accent-color)' }}></div>
            <div className="btn-primary" style={{ background: '#333' }}>In2: 0</div>
          </div>
          
          <div style={{ height: '40px', width: '2px', background: 'var(--accent-color)' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.2rem' }}>
            <div className="btn-primary" style={{ background: '#444' }}>Gate 1 Out</div>
            <div style={{ width: '20px', height: '2px', background: 'var(--accent-color)' }}></div>
            <button onClick={() => cycleSlot(1)} style={{ padding: '15px 30px', background: activeHints[1] ? 'var(--success-color)' : 'var(--accent-color)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}>{gates[1]}</button>
            <div style={{ width: '20px', height: '2px', background: 'var(--accent-color)' }}></div>
            <div className="btn-primary" style={{ background: '#333' }}>In3: 1</div>
          </div>

        </div>
      )
    }
  ],
  Hard: [
    {
      title: "Binary Deadlock",
      slots: 3,
      target: 0,
      description: "Four inputs (0, 0, 1, 1). Gate 1 takes (0,0). Gate 2 takes (1,1). Gate 3 evaluates their outputs. We need absolute 0.",
      solution: ['NOR', 'AND', 'XOR'], 
      evaluator: (gates) => {
        const out1 = runGate(gates[0], 0, 0);
        const out2 = runGate(gates[1], 1, 1);
        if (out1 === null || out2 === null) return null;
        return runGate(gates[2], out1, out2);
      },
      renderGrid: (gates, cycleSlot, activeHints) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '12px' }}>
          
          <div style={{ display: 'flex', gap: '4rem', alignItems: 'center' }}>
            {/* Left Branch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span className="btn-primary" style={{ background: '#333' }}>A: 0</span>
                <span className="btn-primary" style={{ background: '#333' }}>B: 0</span>
              </div>
              <button onClick={() => cycleSlot(0)} style={{ padding: '15px 20px', background: activeHints[0] ? 'var(--success-color)' : 'var(--accent-color)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}>{gates[0]}</button>
            </div>
            
            {/* Right Branch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={() => cycleSlot(1)} style={{ padding: '15px 20px', background: activeHints[1] ? 'var(--success-color)' : 'var(--accent-color)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}>{gates[1]}</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span className="btn-primary" style={{ background: '#333' }}>C: 1</span>
                <span className="btn-primary" style={{ background: '#333' }}>D: 1</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', width: '200px', borderTop: '2px solid var(--accent-color)', borderLeft: '2px solid var(--accent-color)', borderRight: '2px solid var(--accent-color)', height: '20px' }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Merge</span>
            <button onClick={() => cycleSlot(2)} style={{ padding: '20px 40px', background: activeHints[2] ? 'var(--success-color)' : 'var(--danger-color)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}>{gates[2]}</button>
          </div>

        </div>
      )
    }
  ]
};

const CircuitLogic = () => {
  const [started, setStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('Easy');
  const [puzzleIdx, setPuzzleIdx] = useState(0);

  const currentPuzzle = PUZZLES[difficulty][puzzleIdx];

  const [gates, setGates] = useState([]);
  const [activeHints, setActiveHints] = useState({});
  const [timer, setTimer] = useState(60);
  const [attempts, setAttempts] = useState(0);
  
  const [gameOver, setGameOver] = useState(false);
  const [failed, setFailed] = useState(false);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentPuzzle) {
      setGates(Array(currentPuzzle.slots).fill('?'));
      setActiveHints({});
      setTimer(60);
      setAttempts(0);
      setGameOver(false);
      setFailed(false);
      setScore(0);
    }
  }, [currentPuzzle, puzzleIdx, difficulty]);

  useEffect(() => {
    let intv;
    if (started && timer > 0 && !gameOver) {
      intv = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && !gameOver) {
      triggerFail("Systems offline: Time expired.");
    }
    return () => clearInterval(intv);
  }, [started, timer, gameOver]);

  const cycleSlot = (index) => {
    if (gameOver || activeHints[index]) return; // Locked if hinted
    setGates(prev => {
      const newG = [...prev];
      const current = newG[index];
      const nextIdx = (GATE_TYPES.indexOf(current) + 1) % GATE_TYPES.length;
      newG[index] = GATE_TYPES[nextIdx === 0 ? 1 : nextIdx]; // Skip '?' when cycling
      return newG;
    });
  };

  const requestHint = () => {
    if (gameOver) return;
    // Find first '?' or incorrect unhinted slot
    for (let i = 0; i < currentPuzzle.slots; i++) {
      if (!activeHints[i]) {
        setActiveHints(prev => ({ ...prev, [i]: true }));
        setGates(prev => {
          const mod = [...prev];
          mod[i] = currentPuzzle.solution[i];
          return mod;
        });
        break; // Only 1 hint per click
      }
    }
  };

  const handleExecute = () => {
    if (gates.includes('?')) return;
    
    const currAt = attempts + 1;
    setAttempts(currAt);

    const result = currentPuzzle.evaluator(gates);
    
    if (result === currentPuzzle.target) {
      // Victory
      const baseObj = { 'Easy': 500, 'Medium': 1000, 'Hard': 2000 };
      let finalScore = baseObj[difficulty] + (timer * 10);
      
      // Deduct 200 for each explicitly requested hint
      const hintCount = Object.keys(activeHints).length;
      finalScore -= (hintCount * 200);
      finalScore -= (currAt * 50); // Small minus for attempts penalty

      finalScore = Math.max(10, finalScore);
      setScore(finalScore);
      endGame(finalScore, true);
    } else {
      if (currAt >= 3) {
        triggerFail("Circuit blew out. Max attempts reached.");
      }
    }
  };

  const triggerFail = (reason) => {
    setGameOver(true);
    setFailed(true);
    submitScore(0);
  };

  const endGame = async (finalScore, isWin) => {
    setGameOver(true);
    setFailed(!isWin);
    submitScore(finalScore);
  };

  const submitScore = async (val) => {
    try {
      await API.post('/game/score', { game_name: `Circuit Logic (${difficulty})`, score: val });
    } catch (err) {
      console.error('Failed to submit score');
    }
  };

  const nextPuzzle = () => {
    if (puzzleIdx + 1 < PUZZLES[difficulty].length) {
      setPuzzleIdx(idx => idx + 1);
    } else {
      setPuzzleIdx(0);
    }
  };

  if (!started) {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ padding: '3rem', marginTop: '2rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Circuit Logic Matrix</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            Hardware components have failed. Re-wire the electrical circuits by inserting the correct Boolean Logic Gates (AND, OR, XOR, NAND, NOR) into the empty nodes.
            <br/><br/>
            <strong>Objective:</strong> Match the target output within 60 seconds.
          </p>

          <h3 style={{ marginBottom: '1rem' }}>Complexity Level:</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
            {['Easy', 'Medium', 'Hard'].map(lvl => (
              <button 
                key={lvl}
                className="btn-primary" 
                style={{ 
                  background: difficulty === lvl ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                  fontWeight: difficulty === lvl ? 'bold' : 'normal'
                }}
                onClick={() => { setDifficulty(lvl); setPuzzleIdx(0); }}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button className="btn-primary" style={{ fontSize: '1.2rem', padding: '12px 32px' }} onClick={() => setStarted(true)}>
            Power On Matrix
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
        <h1 className="text-gradient">{currentPuzzle.title}</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger-color)', borderRadius: '12px', fontWeight: 'bold' }}>
            Time: {timer}s
          </span>
          <span style={{ padding: '8px 16px', background: 'var(--accent-color)', borderRadius: '12px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
            Output Required: {currentPuzzle.target}
          </span>
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{currentPuzzle.description}</p>
      
      {gameOver ? (
        <div className="glass-panel animate-fade-in" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
          {failed ? (
            <>
              <h2 className="text-gradient" style={{ fontSize: '2.5rem', color: 'var(--danger-color)' }}>Circuit Burnout</h2>
              <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>The signal failed to route properly or time expired. Points: 0</p>
              
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem', textAlign: 'left' }}>
                <h3 style={{ color: 'var(--danger-color)', marginBottom: '0.5rem' }}>One Possible Optimal Configuration:</h3>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', background: '#000', padding: '15px', color: '#10b981', textAlign: 'center' }}>
                  [ {currentPuzzle.solution.join(' ] -> [ ')} ]
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-gradient" style={{ fontSize: '2.5rem' }}>Power Restored!</h2>
              <p style={{ fontSize: '1.5rem', margin: '1rem 0' }}>Signals routed absolutely efficiently.</p>
              <p style={{ color: 'var(--success-color)', fontSize: '1.2rem' }}>Score Awarded: {score} pts (Includes Timer Bonus)</p>
            </>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '3rem' }}>
            <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--accent-color)' }} onClick={() => navigate('/')}>
              Exit Grid
            </button>
            <button className="btn-primary" onClick={nextPuzzle}>
              Load Next Matrix
            </button>
          </div>
        </div>
      ) : (
        <>
          {currentPuzzle.renderGrid(gates, cycleSlot, activeHints)}

          <div className="glass-panel" style={{ marginTop: '2rem', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Click individual slots to cycle through gate types.</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-primary" style={{ background: 'var(--accent-color)', opacity: Object.keys(activeHints).length >= currentPuzzle.slots ? 0.5 : 1 }} onClick={requestHint}>
                  Request Hint (-200 pts)
                </button>
                <div style={{ padding: '10px 15px', border: '1px solid #333', borderRadius: '8px' }}>
                  Attempts Left: {3 - attempts}
                </div>
              </div>
            </div>
            
            <button 
              className="btn-primary" 
              onClick={handleExecute}
              style={{ padding: '15px 40px', background: gates.includes('?') ? 'var(--text-secondary)' : 'var(--success-color)', fontSize: '1.2rem' }}
              disabled={gates.includes('?')}
            >
              Test Circuit
            </button>
          </div>
          {attempts > 0 && !gates.includes('?') && (
            <p style={{ textAlign: 'center', color: 'var(--danger-color)', marginTop: '1rem' }}>Incorrect signal path. Try different gates!</p>
          )}
        </>
      )}

      <div style={{ padding: '2rem', marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
          Exit To Dashboard
        </button>
      </div>
    </div>
  );
};

export default CircuitLogic;
