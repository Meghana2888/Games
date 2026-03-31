import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const EscapeRoom = () => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [escaped, setEscaped] = useState(false);
  const [stage, setStage] = useState(0); // 0, 1, 2, 3
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes = 300s
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  
  const timerRef = useRef(null);
  const navigate = useNavigate();

  // Stage 0: Blackboard (Unscramble)
  const letters = ['O', 'A', 'M', 'H', 'S', 'G', 'L', 'I', 'R', 'T']; // ALGORITHMS
  const [scrambleStatus, setScrambleStatus] = useState('');
  
  // Stage 1: The Exam Grid (Math)
  const [mathStatus, setMathStatus] = useState('');

  // Stage 2: Hidden Objects
  const [hiddenGrid, setHiddenGrid] = useState([]);
  const [foundObjects, setFoundObjects] = useState(0);

  // Stage 3: The Final Door (Riddle)
  const riddleAnswer = 'KEYBOARD';
  const [riddleStatus, setRiddleStatus] = useState('');

  const initializeGame = () => {
    setStarted(true);
    setGameOver(false);
    setEscaped(false);
    setScore(0);
    setStage(0);
    setTimeLeft(300);
    setHintsUsed(0);
    setScrambleStatus('');
    setMathStatus('');
    setRiddleStatus('');
    
    // Build random 8x8 emoji grid and inject exactly 3 '💳' IDs.
    const emojis = ['📚', '🔬', '💻', '☕', '📐', '✏️', '📝', '📓', '📋', '📎'];
    const grid = Array(64).fill('');
    for(let i=0; i<64; i++) grid[i] = emojis[Math.floor(Math.random() * emojis.length)];
    
    // Inject IDs
    let idsPlaced = 0;
    while(idsPlaced < 3) {
      let rIdx = Math.floor(Math.random() * 64);
      if (grid[rIdx] !== '💳') {
        grid[rIdx] = '💳';
        idsPlaced++;
      }
    }
    setHiddenGrid(grid.map(e => ({ emoji: e, found: false })));
    setFoundObjects(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleGameOver(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGameOver = (win) => {
    setGameOver(true);
    setEscaped(win);
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (win) {
      const finalScore = Math.max(0, (timeLeft * 10) - (hintsUsed * 250) + 1000);
      setScore(finalScore);
      API.post('/game/score', { game_name: 'Escape the Room', score: finalScore }).catch(e=>console.error(e));
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  // Format time
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;


  // ------------- STAGE LOGIC -------------

  const checkScramble = (e) => {
    e.preventDefault();
    const val = e.target.answer.value.toUpperCase();
    if (val === 'ALGORITHMS') {
      setStage(1);
    } else {
      setScrambleStatus('Incorrect sequence detected.');
    }
  };

  const checkMath = (e) => {
    e.preventDefault();
    const val = e.target.answer.value;
    if (val === '33') { // Example logic: [2,8,12,11] sum
      setStage(2);
    } else {
      setMathStatus('ERROR: Calculation invalid.');
    }
  };

  const clickHiddenObject = (index) => {
    const item = hiddenGrid[index];
    if (item.emoji === '💳' && !item.found) {
      const newGrid = [...hiddenGrid];
      newGrid[index].found = true;
      setHiddenGrid(newGrid);
      const newFound = foundObjects + 1;
      setFoundObjects(newFound);
      if (newFound >= 3) {
        setTimeout(() => setStage(3), 500);
      }
    }
  };

  const checkRiddle = (e) => {
    e.preventDefault();
    const val = e.target.answer.value.toUpperCase();
    if (val === riddleAnswer || val.includes(riddleAnswer)) {
      handleGameOver(true);
    } else {
      setRiddleStatus('The door remains locked.');
    }
  };

  // Dynamic Background Engine
  const getContainerStyle = () => {
    let base = { padding: '2rem', maxWidth: '1200px', margin: '0 auto', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'all 0.5s ease' };
    
    if (!started || gameOver) {
      return { ...base };
    }
    
    switch(stage) {
      case 0:
        return { ...base, background: 'radial-gradient(circle at center, #2b3a42, #111822)', boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)' }; // Blackboard
      case 1:
        return { ...base, background: 'var(--surface-color)', backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }; // Graph paper
      case 2:
        return { ...base, background: 'linear-gradient(135deg, #1e3a8a, #4c1d95)' }; // Messy Lab
      case 3:
        return { ...base, background: 'radial-gradient(circle at center, #78350f, #451a03)' }; // Wooden Door
      default:
        return base;
    }
  };

  // Hints Engine
  const requestHint = () => {
    setHintsUsed(h => h + 1);
    alert(`Hint for Stage ${stage + 1}:\n${
      stage === 0 ? "It starts with A and ends with S. It's how computers solve problems." :
      stage === 1 ? "Simple addition! Add all the integers sequentially." :
      stage === 2 ? "Look for the tiny blue ID cards 💳 scattered around." :
      "Think about what you use to type code!" 
    }`);
  };


  if (!started) {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ padding: '4rem 3rem', marginTop: '2rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>Escape the Room.</h2>
          <h3 style={{ color: 'var(--accent-color)' }}>Campus Edition</h3>
          
          <div style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p>You have been locked inside the Computer Science building at 2:00 AM.</p>
            <ul style={{ listStyleType: 'none', padding: 0, marginTop: '2rem', fontWeight: 'bold' }}>
              <li style={{ margin: '15px 0' }}>⏳ You have exactly <strong>5 Minutes</strong> to solve 4 distinct puzzles and break out.</li>
              <li style={{ margin: '15px 0' }}>💡 You can ask for hints, but your final score modifier will be harshly penalized.</li>
            </ul>
          </div>

          <button className="btn-primary" style={{ fontSize: '1.5rem', padding: '15px 40px', background: 'var(--success-color)' }} onClick={initializeGame}>
            Wake Up in the Classroom
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
    <div className="game-container animate-fade-in" style={getContainerStyle()}>
      
      {/* Top HUD */}
      {!gameOver && (
        <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1rem 2rem', border: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Phase {stage + 1} / 4
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'monospace', color: timeLeft <= 60 ? 'var(--danger-color)' : 'var(--success-color)' }}>
            {timeStr}
          </div>
          <button className="btn-primary" style={{ padding: '8px 16px', background: 'var(--accent-color)', fontSize: '1rem' }} onClick={requestHint}>
            Need Hint?
          </button>
        </div>
      )}

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        {gameOver ? (
          <div className="glass-panel animate-fade-in" style={{ padding: '4rem', textAlign: 'center', maxWidth: '600px' }}>
            {escaped ? (
              <>
                <h2 style={{ fontSize: '4rem', color: 'var(--success-color)', marginBottom: '1rem', textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}>
                  ESCAPED!
                </h2>
                <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>You burst out of the classroom into the fresh air!</p>
                <div style={{ fontSize: '1.5rem', marginBottom: '3rem' }}>
                  Time Remaining: <strong>{timeStr}</strong><br/>
                  Hints Used: <strong style={{color:'var(--danger-color)'}}>{hintsUsed}</strong><br/>
                  Final Score: <strong style={{ color: 'var(--accent-color)' }}>{score}</strong>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '4rem', color: 'var(--danger-color)', marginBottom: '1rem', textShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}>
                  TIME UP
                </h2>
                <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>The magnetic locks fully engaged... you are trapped.</p>
              </>
            )}
            
            <button className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 40px' }} onClick={initializeGame}>
              Play Again
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '800px' }}>
            
            {/* STAGE 0: BLACKBOARD */}
            {stage === 0 && (
              <div className="glass-panel animate-fade-in" style={{ padding: '3rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#cbd5e1', textAlign: 'center', fontFamily: 'monospace' }}>The Blackboard</h3>
                <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '2rem' }}>A student left an anagram on the board. Perhaps it holds the password to the teacher's locked laptop drawer.</p>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '3rem' }}>
                  {letters.map((l, i) => (
                    <div key={i} style={{ 
                      width: '50px', height: '50px', background: 'rgba(255,255,255,0.1)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}>
                      {l}
                    </div>
                  ))}
                </div>

                <form onSubmit={checkScramble} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <input type="text" name="answer" placeholder="Unscramble the subject..." autoFocus
                    style={{ width: '100%', maxWidth: '400px', padding: '15px', fontSize: '1.5rem', borderRadius: '8px', border: 'none', textAlign: 'center', marginBottom: '1rem', textTransform: 'uppercase' }} />
                  <button type="submit" className="btn-primary" style={{ padding: '12px 32px' }}>Unlock Drawer</button>
                  {scrambleStatus && <p style={{ color: 'var(--danger-color)', marginTop: '1rem' }}>{scrambleStatus}</p>}
                </form>
              </div>
            )}

            {/* STAGE 1: MATH GRID */}
            {stage === 1 && (
              <div className="glass-panel animate-fade-in" style={{ padding: '3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--accent-color)' }}>
                <h3 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#cbd5e1', textAlign: 'center', fontFamily: 'monospace' }}>The Exam Paper</h3>
                <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '2rem' }}>You found a locked briefcase inside the drawer. On top of it lies a torn math exam.</p>
                
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '2rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '1.5rem', textAlign: 'center', color: '#a7f3d0', marginBottom: '3rem', letterSpacing: '2px' }}>
                  <p>let arr = [ 5, 8, -2, 12, 10 ];</p>
                  <p style={{ marginTop: '1rem' }}>const code = arr.reduce((a, b) =&gt; a + b, 0);</p>
                  <p style={{ marginTop: '1rem', color: '#fff' }}>WHAT IS "code"?</p>
                </div>

                <form onSubmit={checkMath} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <input type="number" name="answer" placeholder="Enter combination..." autoFocus
                    style={{ width: '100%', maxWidth: '300px', padding: '15px', fontSize: '1.5rem', borderRadius: '8px', border: 'none', textAlign: 'center', marginBottom: '1rem', letterSpacing: '5px' }} />
                  <button type="submit" className="btn-primary" style={{ padding: '12px 32px' }}>Open Briefcase</button>
                  {mathStatus && <p style={{ color: 'var(--danger-color)', marginTop: '1rem' }}>{mathStatus}</p>}
                </form>
              </div>
            )}

            {/* STAGE 2: HIDDEN OBJECTS */}
            {stage === 2 && (
              <div className="glass-panel animate-fade-in" style={{ padding: '2rem', background: 'rgba(0,0,0,0.4)' }}>
                <h3 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#cbd5e1', textAlign: 'center', fontFamily: 'monospace' }}>The Scattered Lab</h3>
                <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '1rem' }}>
                  The briefcase contained a UV flashlight! You shine it around the messy lab.<br/>
                  Find ALL <strong>3 Student ID Cards 💳</strong> scattered around to bypass the room's main server!
                </p>
                
                <div style={{ textAlign: 'center', fontSize: '1.5rem', color: 'var(--success-color)', marginBottom: '1rem' }}>
                  Found: {foundObjects} / 3
                </div>

                <div style={{ 
                  display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '10px', 
                  maxWidth: '500px', margin: '0 auto', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' 
                }}>
                  {hiddenGrid.map((item, i) => (
                    <div key={i} onClick={() => clickHiddenObject(i)}
                      style={{
                        padding: '10px', fontSize: '2rem', cursor: item.found ? 'default' : 'pointer',
                        textAlign: 'center', userSelect: 'none',
                        transition: 'transform 0.1s', opacity: item.found ? 0.2 : 1,
                        background: item.found ? 'var(--success-color)' : 'transparent',
                        borderRadius: '8px'
                      }}
                      onMouseOver={(e) => !item.found && (e.target.style.transform = 'scale(1.2)')}
                      onMouseOut={(e) => !item.found && (e.target.style.transform = 'scale(1)')}
                    >
                      {item.emoji}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STAGE 3: THE FINAL DOOR */}
            {stage === 3 && (
              <div className="glass-panel animate-fade-in" style={{ padding: '4rem 3rem', background: 'rgba(0,0,0,0.8)' }}>
                <h3 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--danger-color)', textAlign: 'center', fontFamily: 'monospace' }}>The Main Door</h3>
                <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '2rem' }}>
                  The server bypassed the lockdown! The heavy door powers down, but asks for a final security passphrase based on a legendary riddle:
                </p>
                
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '8px', fontSize: '1.5rem', textAlign: 'center', color: '#fff', marginBottom: '3rem', fontStyle: 'italic' }}>
                  "I have keys but no locks.<br/>I have space but no room.<br/>You can enter but not go outside.<br/><br/>What am I?"
                </div>

                <form onSubmit={checkRiddle} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <input type="text" name="answer" placeholder="Speak the passphrase..." autoFocus
                    style={{ width: '100%', maxWidth: '400px', padding: '15px', fontSize: '1.5rem', borderRadius: '8px', border: 'none', textAlign: 'center', marginBottom: '1rem', textTransform: 'uppercase', background: 'rgba(255,0,0,0.1)', color: 'white' }} />
                  <button type="submit" className="btn-primary" style={{ padding: '12px 32px', background: 'var(--danger-color)', border: 'none' }}>SHOUT ANSWER</button>
                  {riddleStatus && <p style={{ color: 'var(--accent-color)', marginTop: '1rem' }}>{riddleStatus}</p>}
                </form>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Standardized Exit Anchor */}
      <div style={{ padding: '2rem', marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
          Exit To Dashboard
        </button>
      </div>

    </div>
  );
};

export default EscapeRoom;
