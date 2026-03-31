import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AudioContext } from '../context/AudioContext';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState({ streak: 0, highScores: [] });
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeCategory, setActiveCategory] = useState('technical'); // technical | fun | leaderboard
  const { playSFX } = useContext(AudioContext);
  const navigate = useNavigate();

  const handleGameSelect = (path) => {
    if (playSFX) playSFX();
    navigate(path);
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await API.get('/game/dashboard');
        
        // Calculate Streak based on Frontend Local Storage Accesses
        const today = new Date().toDateString();
        const activityKey = `lastActivityDate_${user?.id || user?.username || 'user'}`;
        const streakKey = `userStreak_${user?.id || user?.username || 'user'}`;
        
        const lastLogin = localStorage.getItem(activityKey);
        let currentStreak = parseInt(localStorage.getItem(streakKey)) || data.streak || 0;

        if (lastLogin) {
          const lastDate = new Date(lastLogin);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastDate.toDateString() === yesterday.toDateString()) {
            currentStreak += 1; // Kept the streak alive
          } else if (lastDate.toDateString() !== today) {
            currentStreak = currentStreak === 0 ? 0 : 1; // Reset streak, missed a day (or remains 0)
          }
        } else {
            // Very first time opening for a new user
            currentStreak = data.streak || 0; 
        }
        
        localStorage.setItem(activityKey, today);
        localStorage.setItem(streakKey, currentStreak);

        setStats({ ...data, streak: currentStreak });
        
        // Fetch Leaderboard
        const leaderboardRes = await API.get('/game/leaderboard');
        setLeaderboard(leaderboardRes.data);
      } catch (error) {
        console.error('Error fetching dashboard', error);
      }
    };
    fetchDashboard();
  }, []);

  const getHighScore = (gameName) => {
    const scoreObj = stats.highScores.find(s => s.game_name === gameName);
    return scoreObj ? scoreObj.max_score : 0;
  };

  return (
    <div className="dashboard-container animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 className="text-gradient">Welcome, {user?.username}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
            🔥 Activity Streak: <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>{stats.streak} Days</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={logout} style={{ background: 'var(--danger-color)' }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
        <button 
          className="btn-primary" 
          style={{ background: activeCategory === 'technical' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', padding: '12px 32px', fontSize: '1.2rem' }}
          onClick={() => setActiveCategory('technical')}
        >
          💻 Technical Academy
        </button>
        <button 
          className="btn-primary" 
          style={{ background: activeCategory === 'fun' ? 'var(--success-color)' : 'rgba(255,255,255,0.1)', padding: '12px 32px', fontSize: '1.2rem' }}
          onClick={() => setActiveCategory('fun')}
        >
          🎮 Fun Arcade
        </button>
        <button 
          className="btn-primary" 
          style={{ background: activeCategory === 'leaderboard' ? 'var(--warning-color, #f59e0b)' : 'rgba(255,255,255,0.1)', padding: '12px 32px', fontSize: '1.2rem', borderColor: activeCategory === 'leaderboard' ? 'var(--warning-color, #f59e0b)' : 'rgba(255,255,255,0.2)' }}
          onClick={() => setActiveCategory('leaderboard')}
        >
          🏆 Global Leaderboard
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {activeCategory === 'technical' && (
          <>
            {/* Game 1 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => navigate('/game/algorithm-debugger')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Algorithmic Debugger</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Analyze defective Computer Science algorithms and patch their logical bugs passing hidden test suites.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Algorithm Debugger')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px' }}>Terminal Execute</span>
              </div>
            </div>

            {/* Game 2 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => navigate('/game/cipher-cracker')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Cipher Cracker</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Utilize cryptography knowledge and frequency tools to decrypt intercepted multi-layer ciphers.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Cipher Cracker')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px' }}>Begin Decrypt</span>
              </div>
            </div>

            {/* Game 3 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => navigate('/game/syntax-sleuth')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Syntax Sleuth</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Intercept and logically reconstruct broken scripts written in C, Java, and Python.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Syntax Sleuth')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px' }}>Network Scan</span>
              </div>
            </div>

            {/* Game 4 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => handleGameSelect('/game/circuit-logic')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Circuit Logic Puzzle</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Repair offline hardware components. Cycle through Boolean Logic Gates to route electrical signals properly.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Circuit Logic Puzzle')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px' }}>Power On</span>
              </div>
            </div>

            {/* Game 5 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => handleGameSelect('/game/placement-run')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Placement Run</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>An endless survival aptitude test. Answer Logical Reasoning, Number Series, and Coding MCQs to see how far you can get!</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Placement Run')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px' }}>Begin Run</span>
              </div>
            </div>

            {/* Game 6 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => handleGameSelect('/game/time-complexity-assassin')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Time Complexity Assassin</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Protect the server! Identify incredibly slow algorithms, select their optimal replacements, and type the exact Time Complexity to execute them before the system CPU reaches 100%.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Time Complexity Assassin')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px' }}>Inject Target</span>
              </div>
            </div>

            {/* Game 7 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => handleGameSelect('/game/database-normalizer')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Database Normalizer</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Act as the Lead Database Architect. Restructure messy, unnormalized "universal tables" into strict 1NF, 2NF, 3NF, and BCNF architectures by clicking columns and executing table splits!</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Database Normalizer')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px' }}>Review Schemas</span>
              </div>
            </div>
            {/* Game 8 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => handleGameSelect('/game/network-rescue')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Network Rescue</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Fix a broken network in a college lab. Connect routers, find shortest paths via Dijkstra, match IPs, solve subnetting, and manually route packets!</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Network Rescue')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px' }}>Establish Link</span>
              </div>
            </div>

            {/* Game 9 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => handleGameSelect('/game/ai-lab-simulator')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>AI Lab Simulator</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Act as a Data Science student. Train models with limited compute, diagnose overfitting limits, and verify algorithmic theory to pass your semester!</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('AI Lab Simulator')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px' }}>Boot Compute Lab</span>
              </div>
            </div>
          </>
        )}

        {activeCategory === 'fun' && (
          <>
            {/* Fun Game 1 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s', borderColor: 'var(--success-color)' }} onClick={() => handleGameSelect('/game/emoji-memory')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Emoji Memory Match</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Challenge your short term memory with this classic fast-paced tile flipping game.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Emoji Memory')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px', background: 'var(--success-color)' }}>Play Arcade</span>
              </div>
            </div>

            {/* Fun Game 2 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s', borderColor: 'var(--success-color)' }} onClick={() => handleGameSelect('/game/speed-typist')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Speed Typist Race</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Beat the clock! Rapid-fire typing test to measure your finger accuracy and raw WPM.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Speed Typist')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px', background: 'var(--success-color)' }}>Launch Race</span>
              </div>
            </div>

            {/* Fun Game 3 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s', borderColor: 'var(--success-color)' }} onClick={() => handleGameSelect('/game/angry-chicken')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Angry Chicken</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Cross the streets—but SLAP the cars out of your way instead of dodging them! A violent endless-runner arcade spin-off.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Angry Chicken (Hard)')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px', background: 'var(--success-color)' }}>Deploy Chicken</span>
              </div>
            </div>

            {/* Fun Game 4 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s', borderColor: 'var(--success-color)' }} onClick={() => handleGameSelect('/game/color-mixing')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Color Mixing</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Combine purely primary hex-colors dynamically on the canvas to match complex targets within strict move limits.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Color Mixing')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px', background: 'var(--success-color)' }}>Mix Palette</span>
              </div>
            </div>

            {/* Fun Game 5 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s', borderColor: 'var(--success-color)' }} onClick={() => handleGameSelect('/game/wrong-answer')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Wrong Answer Only</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Tricky inverted logic quiz. You lose if you click the correct answer! Fight your instincts within a shrinking 5-second panic window.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Wrong Answer')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px', background: 'var(--success-color)' }}>Trigger Panic</span>
              </div>
            </div>

            {/* Fun Game 6 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s', borderColor: 'var(--success-color)' }} onClick={() => handleGameSelect('/game/time-echo')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Time Echo Puzzle</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manipulate a spacetime clone of your past loop to execute dual concurrent puzzle logic on a synchronized turn-based grid.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Time Echo Puzzle')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px', background: 'var(--success-color)' }}>Enter Grid</span>
              </div>
            </div>

            {/* Fun Game 7 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s', borderColor: 'var(--success-color)' }} onClick={() => handleGameSelect('/game/escape-room')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Escape the Room</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Trapped in the Computer Science building at 2:00 AM! Solve multi-staged spatial puzzles to break out in under 5 minutes.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Escape the Room')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px', background: 'var(--success-color)' }}>Enter Room</span>
              </div>
            </div>

            {/* Fun Game 8 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s', borderColor: 'var(--success-color)' }} onClick={() => handleGameSelect('/game/pattern-master')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Pattern Master</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Push your short-term spatial memory to the limit. Features a brutal 'Chimp Test' numerical spatial grid mode.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Pattern Master')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px', background: 'var(--success-color)' }}>Test Memory</span>
              </div>
            </div>

            {/* Fun Game 9 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s', borderColor: 'var(--success-color)' }} onClick={() => handleGameSelect('/game/visual-puzzle')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Lens Inspector</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Uncover 5 occult runes hidden in plain sight. Activate "Fake AR" mode to inject targets onto your live webcam feed natively!</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Visual Locator')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px', background: 'var(--success-color)' }}>Open Lens</span>
              </div>
            </div>
            {/* Fun Game 10 */}
            <div className="glass-panel game-card" style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s', borderColor: 'var(--success-color)' }} onClick={() => handleGameSelect('/game/custom-puzzle')}>
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Custom Image Puzzle</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Upload any image and reconstruct it in a drag-and-drop grid. Challenge your visual memory against the clock!</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>High Score: {getHighScore('Custom Image Puzzle')}</span>
                <span className="btn-primary" style={{ padding: '8px 16px', background: 'var(--success-color)' }}>Play Puzzle</span>
              </div>
            </div>
          </>
        )}

        {activeCategory === 'leaderboard' && (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '3rem', width: '100%' }}>
            <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center', color: '#f59e0b' }}>Hall of Fame</h2>
            {leaderboard.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>No high scores recorded across the network yet. Be the first!</p>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '1.2rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '1.5rem', color: '#94a3b8' }}>Puzzle Name</th>
                      <th style={{ padding: '1.5rem', color: '#94a3b8' }}>Top Player</th>
                      <th style={{ padding: '1.5rem', color: '#94a3b8', textAlign: 'right' }}>Max Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.2s' }}>
                        <td style={{ padding: '1.5rem', fontWeight: 'bold' }}>{entry.game_name}</td>
                        <td style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.5rem' }}>👑</span>
                          <span style={{ color: 'var(--accent-color)' }}>{entry.username}</span>
                        </td>
                        <td style={{ padding: '1.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--success-color)', fontFamily: 'monospace', fontSize: '1.5rem' }}>
                          {entry.max_score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
