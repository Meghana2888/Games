import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

// 0: Floor
// 1: Wall
// 2: Start (Visual only, acts as Floor after init)
// 3: Exit
// 4: Switch
// 5: Door (Solid unless a Switch is stood upon)

const LEVELS = [
  {
    name: 'Phase 1: Dual Activation',
    desc: 'The door blocks your extraction. Walk to the switch, hold SPACE for a few turns, then trigger a TIME LOOP. Your Ghost will replay your movements while you run through the open door!',
    grid: [
      [1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,1,0,0,4,0,1],
      [1,0,1,0,1,0,1,1,0,1],
      [1,0,1,5,1,0,0,0,0,1],
      [1,0,1,0,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,1,1,0,0,1],
      [1,0,0,0,0,0,0,0,3,1],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1]
    ]
  },
  {
    name: 'Phase 2: Speed Buffer',
    desc: 'You have only one switch, but two doors. The ghost must race to hold the switch for you...',
    grid: [
      [1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,1,5,1,1,1,1,5,1,1],
      [1,0,0,0,0,0,0,0,4,1],
      [1,0,1,1,1,1,1,1,1,1],
      [1,3,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1]
    ]
  },
  {
    name: 'Phase 3: Paradox',
    desc: 'Complex overlapping required. The ghost\'s lifespan runs out exactly when it reaches the end of the recorded sequence.',
    grid: [
      [1,1,1,1,1,1,1,1,1,1],
      [1,2,0,1,0,0,0,0,3,1],
      [1,0,0,1,0,1,1,1,0,1],
      [1,1,0,5,0,0,0,1,0,1],
      [1,0,0,1,1,1,0,5,0,1],
      [1,4,0,0,0,1,0,1,0,1],
      [1,1,1,1,0,1,0,1,0,1],
      [1,0,0,0,0,1,0,1,0,1],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1]
    ]
  }
];

const BOARD_SIZE = 10;

const getStartPos = (grid) => {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (grid[y][x] === 2) return { x, y };
    }
  }
  return { x: 1, y: 1 };
};

const getSwitches = (grid) => {
  let s = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (grid[y][x] === 4) s.push({ x, y });
    }
  }
  return s;
};

const TimeEcho = () => {
  const [started, setStarted] = useState(false);
  const [levelIdx, setLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  
  // Grid / Logical State
  const [grid, setGrid] = useState([]);
  const [player, setPlayer] = useState({ x: 0, y: 0 });
  const [ghost, setGhost] = useState(null); // { x, y }
  
  const [recordedMoves, setRecordedMoves] = useState([]); // Past loop
  const [currentMoves, setCurrentMoves] = useState([]);   // Current loop
  const [stepCounter, setStepCounter] = useState(0);
  const [doorOpen, setDoorOpen] = useState(false);

  // References for fast continuous state inside keyboard event listeners
  const stateRef = useRef({
    player: { x: 0, y: 0 },
    ghost: null,
    recordedMoves: [],
    currentMoves: [],
    stepCounter: 0,
    grid: [],
    switches: [],
    doorOpen: false,
    gameOver: false // Prevents movement if won
  });

  const navigate = useNavigate();

  const initLevel = (idx) => {
    const lvlGrid = LEVELS[idx].grid;
    const startPos = getStartPos(lvlGrid);
    const sws = getSwitches(lvlGrid);
    
    // Sync React State
    setGrid(lvlGrid);
    setPlayer(startPos);
    setGhost(null);
    setRecordedMoves([]);
    setCurrentMoves([]);
    setStepCounter(0);
    setDoorOpen(false);

    // Sync Mutable Ref State
    stateRef.current = {
      player: { ...startPos },
      ghost: null,
      recordedMoves: [],
      currentMoves: [],
      stepCounter: 0,
      grid: lvlGrid,
      switches: sws,
      doorOpen: false,
      gameOver: false
    };
  };

  const handleStart = () => {
    setStarted(true);
    setScore(0);
    initLevel(0);
  };

  const executeTimeLoop = () => {
    if (stateRef.current.gameOver) return;
    
    // Convert current loop into recorded loop
    const newRecord = [...stateRef.current.currentMoves];
    const startPos = getStartPos(stateRef.current.grid);
    
    // Reset React
    setRecordedMoves(newRecord);
    setCurrentMoves([]);
    setStepCounter(0);
    setPlayer(startPos);
    // Only spawn ghost if we recorded moves
    if (newRecord.length > 0) {
      setGhost({ ...startPos });
    } else {
      setGhost(null);
    }
    
    setDoorOpen(false);

    // Reset Ref
    stateRef.current.recordedMoves = newRecord;
    stateRef.current.currentMoves = [];
    stateRef.current.stepCounter = 0;
    stateRef.current.player = { ...startPos };
    if (newRecord.length > 0) {
      stateRef.current.ghost = { ...startPos };
    } else {
      stateRef.current.ghost = null;
    }
    stateRef.current.doorOpen = false;
  };

  useEffect(() => {
    if (!started) return;

    const handleKeyDown = (e) => {
      // We only care about explicit moves to advance a "Turn"
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) return;
      if (stateRef.current.gameOver) return;
      
      e.preventDefault();

      let dx = 0; let dy = 0;
      let moveChar = 'WAIT';
      
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': dy = -1; moveChar = 'U'; break;
        case 'ArrowDown': case 'KeyS': dy = 1; moveChar = 'D'; break;
        case 'ArrowLeft': case 'KeyA': dx = -1; moveChar = 'L'; break;
        case 'ArrowRight': case 'KeyD': dx = 1; moveChar = 'R'; break;
        case 'Space': dx = 0; dy = 0; moveChar = 'WAIT'; break;
        default: break;
      }

      // 1. Process intended Player Movement logic
      let newPx = stateRef.current.player.x + dx;
      let newPy = stateRef.current.player.y + dy;
      
      // Is door open this frame? (Evaluated BEFORE moving based on last frame's positions standing on switches)
      let dOpen = stateRef.current.doorOpen;
      
      // Collision Player
      const pTile = stateRef.current.grid[Math.max(0, Math.min(newPy, BOARD_SIZE - 1))][Math.max(0, Math.min(newPx, BOARD_SIZE - 1))];
      if (pTile === 1) { newPx = stateRef.current.player.x; newPy = stateRef.current.player.y; } // Hit wall
      if (pTile === 5 && !dOpen) { newPx = stateRef.current.player.x; newPy = stateRef.current.player.y; } // Hit locked door

      // 2. Process Ghost Movement
      let newGx = null; let newGy = null;
      if (stateRef.current.ghost && stateRef.current.stepCounter < stateRef.current.recordedMoves.length) {
        const gMove = stateRef.current.recordedMoves[stateRef.current.stepCounter];
        let gdx = 0; let gdy = 0;
        if (gMove === 'U') gdy = -1;
        if (gMove === 'D') gdy = 1;
        if (gMove === 'L') gdx = -1;
        if (gMove === 'R') gdx = 1;
        
        newGx = stateRef.current.ghost.x + gdx;
        newGy = stateRef.current.ghost.y + gdy;
        
        // Collision Ghost (Ghosts can't technically hit walls if recorded properly, but we protect index out of bounds)
        // Also if a door closed while a ghost tries to walk through it, ghost gets stuck.
        const gTile = stateRef.current.grid[Math.max(0, Math.min(newGy, BOARD_SIZE - 1))][Math.max(0, Math.min(newGx, BOARD_SIZE - 1))];
        if (gTile === 1 || (gTile === 5 && !dOpen)) {
          newGx = stateRef.current.ghost.x; newGy = stateRef.current.ghost.y; // Ghost blocked
        }
      } else if (stateRef.current.ghost) {
        // Ghost has finished loop but persists physically where it ended? No, concept is ghost "echoes" then fades.
        // We will despawn the ghost if it runs out of recorded moves, forcing a puzzle failure if they rely on it staying. 
        // Actually, let the ghost "fade out" or "stay still" on the last frame?
        // Let's make it hold its last position indefinitely waiting! 
        newGx = stateRef.current.ghost.x;
        newGy = stateRef.current.ghost.y;
      }

      // 3. Commit state shifts
      stateRef.current.player = { x: newPx, y: newPy };
      setPlayer({ ...stateRef.current.player });
      
      if (newGx !== null && newGy !== null) {
        stateRef.current.ghost = { x: newGx, y: newGy };
        setGhost({ ...stateRef.current.ghost });
      }

      stateRef.current.currentMoves.push(moveChar);
      setCurrentMoves([...stateRef.current.currentMoves]);
      
      stateRef.current.stepCounter += 1;
      setStepCounter(stateRef.current.stepCounter);

      // 4. Re-evaluate Switches for the NEXT frame and instantly update visual state
      let switchPressed = false;
      stateRef.current.switches.forEach(sw => {
        if (stateRef.current.player.x === sw.x && stateRef.current.player.y === sw.y) switchPressed = true;
        if (stateRef.current.ghost) {
          if (stateRef.current.ghost.x === sw.x && stateRef.current.ghost.y === sw.y) switchPressed = true;
        }
      });
      stateRef.current.doorOpen = switchPressed;
      setDoorOpen(switchPressed);

      // 5. Evaluate WIN CONDITION
      const finalTile = stateRef.current.grid[newPy][newPx];
      if (finalTile === 3) {
        // Win Level!
        handleLevelWin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started, levelIdx]);

  const handleLevelWin = () => {
    stateRef.current.gameOver = true;
    
    // Add points
    const pts = 1000 - (stateRef.current.currentMoves.length * 5); // Optimization bonus
    setScore(s => s + Math.max(200, pts));

    setTimeout(() => {
      if (levelIdx + 1 < LEVELS.length) {
        setLevelIdx(levelIdx + 1);
        initLevel(levelIdx + 1);
      } else {
        // Fully Won the Game
        submitScoreDb(score + Math.max(200, pts) + 5000 /* Clear Bonus */);
      }
    }, 1500);
  };

  const submitScoreDb = async (finalScore) => {
    try {
        await API.post('/game/score', { game_name: 'Time Echo Puzzle', score: finalScore });
      } catch (err) {
        console.error('Failed to submit score');
      }
  };


  if (!started) {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ padding: '4rem 3rem', marginTop: '2rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>Time Echo Puzzle.</h2>
          
          <div style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p>You cannot escape the matrix alone. You must trap your past iterations to help you.</p>
            <ul style={{ listStyleType: 'none', padding: 0, marginTop: '2rem', fontWeight: 'bold' }}>
              <li style={{ margin: '15px 0' }}>🔵 <span style={{color: 'cyan'}}>Blue Portal</span> = The Exit.</li>
              <li style={{ margin: '15px 0' }}>🟨 <span style={{color: 'yellow'}}>Yellow Tiles</span> = Switches to hold open Doors.</li>
              <li style={{ margin: '15px 0' }}>⏱️ Hit <strong>"TIME LOOP"</strong> to restart from the beginning. A 👻 <strong>Ghost</strong> will perfectly replay the steps you just recorded, allowing it to hold a switch down for you!</li>
              <li style={{ margin: '15px 0', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px'}}><strong>Movement:</strong> Arrow Keys / WASD<br/><strong>Wait/Stand Still:</strong> Spacebar</li>
            </ul>
          </div>

          <button className="btn-primary" style={{ fontSize: '1.5rem', padding: '15px 40px', background: 'var(--success-color)' }} onClick={handleStart}>
            Enter the Spacetime Grid
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

  const isLevelComplete = stateRef.current?.gameOver;
  const isGameComplete = isLevelComplete && levelIdx === LEVELS.length - 1;

  return (
    <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 className="text-gradient" style={{ margin: 0 }}>{LEVELS[levelIdx].name}</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>{LEVELS[levelIdx].desc}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            Score: <span style={{ color: 'var(--success-color)', fontSize: '1.5rem', marginLeft: '10px' }}>{score}</span>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>Turn Sequence: {stepCounter}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', flex: 1, alignItems: 'center' }}>
        
        {/* Game Area */}
        {isGameComplete ? (
          <div className="glass-panel animate-fade-in" style={{ padding: '4rem', textAlign: 'center', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '4rem', color: 'var(--success-color)', marginBottom: '1rem', textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}>
              MATRIX ESCAPED
            </h2>
            <div style={{ fontSize: '1.5rem', marginBottom: '3rem' }}>
              Final Time Score: <strong style={{ color: '#fff' }}>{score}</strong>
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            gap: '2px',
            background: 'var(--surface-color)',
            padding: '10px',
            borderRadius: '12px',
            border: '2px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            width: '100%',
            maxWidth: '500px',
            aspectRatio: '1/1'
          }}>
            {grid.map((row, y) => row.map((cell, x) => {
              
              const isPlayer = player.x === x && player.y === y;
              const isGhost = ghost && ghost.x === x && ghost.y === y;
              
              let bgColor = '#111'; // Floor 0 or 2(Start)
              if (cell === 1) bgColor = 'rgba(255,255,255,0.2)'; // Wall
              if (cell === 3) bgColor = 'cyan'; // Exit
              if (cell === 4) bgColor = 'yellow'; // Switch
              if (cell === 5 && !doorOpen) bgColor = 'orange'; // Locked Door
              if (cell === 5 && doorOpen) bgColor = '#333'; // Open Door
              
              return (
                <div key={`${x}-${y}`} style={{
                  position: 'relative',
                  background: bgColor,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                  boxShadow: cell === 1 ? 'inset 0 0 10px rgba(0,0,0,0.5)' : 'none'
                }}>
                  {cell === 5 && !doorOpen && <span style={{ fontSize: '0.8rem' }}>🔒</span>}
                  
                  {isGhost && (
                    <div style={{
                      position: 'absolute', width: '80%', height: '80%', 
                      background: 'var(--accent-color)', borderRadius: '50%', opacity: 0.5,
                      boxShadow: '0 0 10px var(--accent-color)', zIndex: 5
                    }}>👻</div>
                  )}

                  {isPlayer && (
                    <div className="animate-pulse" style={{
                      position: 'absolute', width: '80%', height: '80%', 
                      background: '#fff', borderRadius: '50%',
                      boxShadow: '0 0 10px #fff', zIndex: 10
                    }}>🧍</div>
                  )}

                </div>
              );
            }))}
          </div>
        )}

        {/* Controls Panel */}
        {!isGameComplete && (
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Spacetime Controls</h3>
            
            <button className="btn-primary" style={{ padding: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }} onClick={executeTimeLoop}>
              <span style={{ fontSize: '1.5rem' }}>🔁</span> LOOP TIME
            </button>

            <button className="btn-primary" style={{ padding: '15px', background: 'transparent', border: '1px solid var(--text-secondary)' }} onClick={() => initLevel(levelIdx)}>
              Restart Grid
            </button>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <strong>Recorded Frames:</strong> {recordedMoves.length}<br/>
              <strong>Current Frames:</strong> {currentMoves.length}<br/><br/>
              <em>Press Spacebar to manually skip a turn/wait in place.</em>
            </div>
            
            {isLevelComplete && (
              <div className="animate-fade-in" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success-color)', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                TIME ANOMALY RESOLVED<br/>Accessing next phase...
              </div>
            )}
          </div>
        )}

      </div>

      {/* Put EXIT at the very bottom strictly per protocol */}
      <div style={{ padding: '2rem', marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
          Exit To Dashboard
        </button>
      </div>

    </div>
  );
};

export default TimeEcho;
