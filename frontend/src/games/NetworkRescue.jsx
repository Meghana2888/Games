import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const NetworkRescue = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [gameState, setGameState] = useState('intro'); // intro, playing, gameover, victory
  const [currentStage, setCurrentStage] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [feedback, setFeedback] = useState('');

  // Maze State (Stage 5)
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const mazeEnd = { x: 4, y: 4 };
  const obstacles = [
    { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 }, { x: 0, y: 3 }
  ];

  const timerRef = useRef(null);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0 && gameState === 'playing') {
      endGame(false);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState === 'playing' && currentStage === 5) {
      const handleKeyDown = (e) => {
        setPlayerPos(prev => {
          let newX = prev.x;
          let newY = prev.y;
          if (e.key === 'ArrowUp' || e.key === 'w') newY = Math.max(0, prev.y - 1);
          if (e.key === 'ArrowDown' || e.key === 's') newY = Math.min(4, prev.y + 1);
          if (e.key === 'ArrowLeft' || e.key === 'a') newX = Math.max(0, prev.x - 1);
          if (e.key === 'ArrowRight' || e.key === 'd') newX = Math.min(4, prev.x + 1);

          const hitObstacle = obstacles.find(o => o.x === newX && o.y === newY);
          if (hitObstacle) {
            showFeedback("Firewall Blocked Packet! Reroute.");
            return prev;
          }

          if (newX === mazeEnd.x && newY === mazeEnd.y) {
            handleStageComplete(1000);
            endGame(true);
          }

          return { x: newX, y: newY };
        });
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [gameState, currentStage]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(300);
    setCurrentStage(1);
    setPlayerPos({ x: 0, y: 0 });
    setFeedback('');
  };

  const showFeedback = (msg, time = 2000) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), time);
  };

  const handleStageComplete = (points) => {
    setScore(prev => prev + points + (timeLeft * 2));
    if (currentStage < 5) {
      setCurrentStage(prev => prev + 1);
      showFeedback('Stage Cleared! Initiating Next Protocol...', 1500);
    }
  };

  const handleWrongAnswer = () => {
    setTimeLeft(prev => Math.max(0, prev - 15));
    showFeedback('Connection Failed! Penalty: -15s', 2000);
  };

  const endGame = async (won) => {
    clearInterval(timerRef.current);
    setGameState(won ? 'victory' : 'gameover');

    if (won && user) {
      try {
        await API.post('/game/score', {
          game_name: 'Network Rescue',
          score: score + (timeLeft * 5)
        });
      } catch (err) {
        console.error('Failed to save score:', err);
      }
    }
  };

  // --- Visual Renderers ---
  
  const renderStage1 = () => {
    return (
      <div className="puzzle-container" style={{ textAlign: 'center' }}>
        <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Stage 1: Hardware Linking</h3>
        <p style={{ marginBottom: '2rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          Connect the Core Router (Layer 3) to the Aggregation Switch (Layer 2). Pick the correct physical medium.
        </p>
        
        {/* SVG Visualization */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '3rem' }}>
          <div style={{ textAlign: 'center' }}>
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
              <rect x="10" y="20" width="80" height="60" rx="10" fill="var(--bg-secondary)" stroke="var(--accent-color)" strokeWidth="3"/>
              <circle cx="50" cy="50" r="15" fill="var(--accent-color)" opacity="0.3"/>
              <path d="M40 50 L60 50 M50 40 L50 60" stroke="var(--accent-color)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>Core Router</p>
          </div>
          
          <div style={{ width: '80px', height: '4px', background: 'var(--text-secondary)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-15px', left: '20px', fontSize: '1.5rem' }}>❓</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
              <rect x="20" y="10" width="60" height="80" fill="var(--bg-secondary)" stroke="#10b981" strokeWidth="3"/>
              <line x1="30" y1="30" x2="70" y2="30" stroke="#10b981" strokeWidth="2"/>
              <line x1="30" y1="50" x2="70" y2="50" stroke="#10b981" strokeWidth="2"/>
              <line x1="30" y1="70" x2="70" y2="70" stroke="#10b981" strokeWidth="2"/>
            </svg>
            <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>Agg. Switch</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          <button className="btn-primary" style={{ height: '70px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} onClick={handleWrongAnswer}>
            <span style={{ fontSize: '1.5rem' }}>🔀</span> Crossover Cable
          </button>
          <button className="btn-primary" style={{ height: '70px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} onClick={() => handleStageComplete(200)}>
            <span style={{ fontSize: '1.5rem' }}>➖</span> Straight-through
          </button>
          <button className="btn-primary" style={{ height: '70px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} onClick={handleWrongAnswer}>
            <span style={{ fontSize: '1.5rem' }}>🔌</span> Console Cable
          </button>
          <button className="btn-primary" style={{ height: '70px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} onClick={handleWrongAnswer}>
            <span style={{ fontSize: '1.5rem' }}>✨</span> Fiber (Multimode)
          </button>
        </div>
      </div>
    );
  };

  const renderStage2 = () => {
    return (
      <div className="puzzle-container" style={{ textAlign: 'center' }}>
        <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Stage 2: Optimal Routing (Dijkstra)</h3>
        <p style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          Trace the cheapest OSPF payload path from Node A to Node D.
        </p>

        {/* SVG Network Graph */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <svg width="400" height="200" viewBox="0 0 400 200" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <line x1="50" y1="100" x2="200" y2="40" stroke="var(--text-secondary)" strokeWidth="3"/>
            <text x="110" y="60" fill="white" fontSize="16">Cost: 5</text>
            
            <line x1="200" y1="40" x2="200" y2="160" stroke="var(--text-secondary)" strokeWidth="3"/>
            <text x="210" y="105" fill="white" fontSize="16">Cost: 2</text>
            
            <line x1="200" y1="160" x2="350" y2="100" stroke="var(--text-secondary)" strokeWidth="3"/>
            <text x="290" y="150" fill="white" fontSize="16">Cost: 3</text>
            
            <line x1="50" y1="100" x2="200" y2="160" stroke="var(--text-secondary)" strokeWidth="3"/>
            <text x="110" y="150" fill="white" fontSize="16">Cost: 8</text>
            
            <line x1="200" y1="40" x2="350" y2="100" stroke="var(--text-secondary)" strokeWidth="3"/>
            <text x="280" y="60" fill="white" fontSize="16">Cost: 6</text>

            <circle cx="50" cy="100" r="25" fill="var(--bg-primary)" stroke="var(--accent-color)" strokeWidth="4"/>
            <text x="42" y="106" fill="white" fontSize="18" fontWeight="bold">A</text>

            <circle cx="200" cy="40" r="25" fill="var(--bg-primary)" stroke="var(--accent-color)" strokeWidth="4"/>
            <text x="193" y="46" fill="white" fontSize="18" fontWeight="bold">B</text>

            <circle cx="200" cy="160" r="25" fill="var(--bg-primary)" stroke="var(--accent-color)" strokeWidth="4"/>
            <text x="193" y="166" fill="white" fontSize="18" fontWeight="bold">C</text>

            <circle cx="350" cy="100" r="25" fill="var(--bg-primary)" stroke="var(--success-color)" strokeWidth="4"/>
            <text x="342" y="106" fill="white" fontSize="18" fontWeight="bold">D</text>
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
          <button className="btn-primary" onClick={handleWrongAnswer}>A ➔ C ➔ D (Cost: 11)</button>
          <button className="btn-primary" onClick={() => handleStageComplete(300)}>A ➔ B ➔ C ➔ D (Cost: 10)</button>
          <button className="btn-primary" onClick={handleWrongAnswer}>A ➔ B ➔ D (Cost: 11)</button>
        </div>
      </div>
    );
  };

  const renderStage3 = () => {
    return (
      <div className="puzzle-container" style={{ textAlign: 'center' }}>
        <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Stage 3: Subnet Allocation</h3>
        <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          DHCP assigned the payload IP <strong style={{ color: 'var(--accent-color)', fontSize: '1.3rem' }}>172.16.55.10</strong>.
          Which legacy server rack class does this belong to?
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          {['A', 'B', 'C'].map((cls, i) => (
             <div 
               key={cls} 
               onClick={cls === 'B' ? () => handleStageComplete(200) : handleWrongAnswer}
               style={{ 
                 cursor: 'pointer', background: 'var(--bg-secondary)', padding: '2rem 1rem', 
                 borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', flex: 1,
                 transition: 'all 0.2s ease', 
               }}
               onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'}
               onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
             >
               <svg width="60" height="100" viewBox="0 0 60 100">
                 {/* Server Chassis */}
                 <rect x="5" y="10" width="50" height="80" rx="5" fill="#1e293b" />
                 {/* Slots */}
                 <rect x="10" y="20" width="40" height="10" fill="#334155" />
                 <circle cx="15" cy="25" r="2" fill="#10b981" />
                 <rect x="10" y="40" width="40" height="10" fill="#334155" />
                 <circle cx="15" cy="45" r="2" fill="#ef4444" />
                 <rect x="10" y="60" width="40" height="10" fill="#334155" />
                 <circle cx="15" cy="65" r="2" fill="#10b981" />
               </svg>
               <h3 style={{ marginTop: '1rem' }}>Rack Class {cls}</h3>
             </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStage4 = () => {
    return (
      <div className="puzzle-container" style={{ textAlign: 'center' }}>
        <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Stage 4: Capacity Planning</h3>
        <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          The local library requested a new subnet block.<br/>
          You deployed CIDR <strong style={{color: 'var(--accent-color)', fontSize: '1.2rem'}}>192.168.10.0 /26</strong>.
        </p>
        <p style={{marginBottom: '2rem', fontSize: '1.2rem'}}>How many <strong>usable</strong> host IPs does this block provide?</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '500px', margin: '0 auto' }}>
          <button className="btn-primary" style={{ height: '60px', fontSize: '1.3rem' }} onClick={handleWrongAnswer}>64</button>
          <button className="btn-primary" style={{ height: '60px', fontSize: '1.3rem' }} onClick={() => handleStageComplete(400)}>62</button>
          <button className="btn-primary" style={{ height: '60px', fontSize: '1.3rem' }} onClick={handleWrongAnswer}>32</button>
          <button className="btn-primary" style={{ height: '60px', fontSize: '1.3rem' }} onClick={handleWrongAnswer}>30</button>
        </div>
      </div>
    );
  };

  const renderStage5 = () => {
    return (
      <div className="puzzle-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Stage 5: Data Link Courier</h3>
        <p style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          Bypass the internal firewalls (red). Route the data packet (blue) to the database (green).<br/>
          <strong style={{color: 'var(--accent-color)'}}>Use WASD or Arrow Keys to move.</strong>
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 60px)',
          gridTemplateRows: 'repeat(5, 60px)',
          gap: '5px',
          background: 'rgba(255,255,255,0.05)',
          padding: '15px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {Array.from({ length: 5 }).map((_, r) => 
            Array.from({ length: 5 }).map((_, c) => {
              const isPlayer = playerPos.x === c && playerPos.y === r;
              const isEnd = mazeEnd.x === c && mazeEnd.y === r;
              const isObstacle = obstacles.some(o => o.x === c && o.y === r);

              let bg = 'rgba(255,255,255,0.1)';
              let icon = '';
              if (isPlayer) { bg = 'var(--accent-color)'; icon = '🌐'; }
              else if (isEnd) { bg = 'var(--success-color)'; icon = '💾'; }
              else if (isObstacle) { bg = 'var(--danger-color)'; icon = '🧱'; }

              return (
                <div key={`${r}-${c}`} style={{
                  width: '60px', height: '60px', background: bg, borderRadius: '8px',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.8rem',
                  boxShadow: isPlayer || isEnd ? `0 0 15px ${bg}` : 'none',
                  transition: 'all 0.1s ease',
                  border: isObstacle ? '2px solid rgba(0,0,0,0.3)' : 'none'
                }}>
                  {icon}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const getStageContent = () => {
    switch(currentStage) {
      case 1: return renderStage1();
      case 2: return renderStage2();
      case 3: return renderStage3();
      case 4: return renderStage4();
      case 5: return renderStage5();
      default: return null;
    }
  };

  if (gameState === 'intro') {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '800px', width: '100%', padding: '4rem 3rem', textAlign: 'center' }}>
          <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '1.5rem', textShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}>Network Rescue</h1>
          <p style={{ fontSize: '1.3rem', color: '#cbd5e1', marginBottom: '3rem', lineHeight: '1.6' }}>
            Alert! The main university network foundation has collapsed. 
            You are the lead Network Engineer. Jump from terminal to terminal to patch routing cables, compute dynamic OSPF paths, allocate isolated subnets, and manually route priority payload packets before the network blackout becomes permanent!
          </p>
          <button className="btn-primary" style={{ fontSize: '1.5rem', padding: '15px 50px', boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' }} onClick={startGame}>
            Initialize Rescue Protocol
          </button>
        </div>
        
        {/* Updated Exit Button Style */}
        <div style={{ padding: '2rem', marginTop: '3rem' }}>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer' }}>
            Exit To Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover' || gameState === 'victory') {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '4rem 3rem', textAlign: 'center', border: `1px solid ${gameState === 'victory' ? '#10b981' : '#ef4444'}` }}>
          <h1 style={{ fontSize: '3.5rem', color: gameState === 'victory' ? 'var(--success-color)' : 'var(--danger-color)', marginBottom: '1rem', fontFamily: 'monospace' }}>
            {gameState === 'victory' ? 'NETWORK RESTORED' : 'NETWORK BLACKOUT'}
          </h1>
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '2rem', borderRadius: '12px', margin: '2rem 0', display: 'inline-block' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f8fafc' }}>Final Score: <strong style={{ color: '#f59e0b', fontSize: '2rem' }}>{score + (timeLeft > 0 ? timeLeft * 5 : 0)}</strong> pts</p>
            {gameState === 'victory' ? (
              <p style={{ color: 'var(--text-secondary)' }}>Excellent work! Packets are flowing, latency is nominal, and zero connections were dropped. The students thank you.</p>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>The system offline threshold was reached. Time ran out while configuring the layer 3 tables.</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button className="btn-primary" style={{ padding: '15px 30px', fontSize: '1.2rem', background: gameState === 'victory' ? 'var(--success-color)' : 'var(--danger-color)' }} onClick={startGame}>
              Reboot & Retry
            </button>
          </div>
        </div>

        <div style={{ padding: '2rem', marginTop: '2rem' }}>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer' }}>
            Exit To Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', minHeight: '100vh', alignItems: 'center' }}>
      
      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'rgba(0,0,0,0.5)', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid #333' }}>
        <div>
          <span style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Protocol Sequence</span>
          <h2 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Stage {currentStage} / 5</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '3rem' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'block' }}>SCORE</span>
            <span style={{ fontWeight: 'bold', fontSize: '1.8rem', color: '#f59e0b' }}>{score}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'block' }}>UPTIME RESERVE</span>
            <span style={{ fontWeight: 'bold', fontSize: '1.8rem', fontFamily: 'monospace', color: timeLeft < 30 ? 'var(--danger-color)' : 'var(--text-primary)', animation: timeLeft < 30 ? 'pulse 0.5s infinite' : 'none' }}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: feedback.includes('Failed') || feedback.includes('Blocked') ? 'var(--danger-color)' : 'var(--success-color)',
          color: 'white', padding: '15px 30px', borderRadius: '8px', zIndex: 1000,
          fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {feedback}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '4rem 3rem', width: '100%', maxWidth: '1000px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {getStageContent()}
      </div>

      <div style={{ padding: '2rem', marginTop: 'auto', display: 'flex', justifyContent: 'center', width: '100%', zIndex: 10 }}>
        <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer' }}>
          Abort Protocol & Exit
        </button>
      </div>

    </div>
  );
};

export default NetworkRescue;
