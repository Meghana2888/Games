import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const PALETTE = [
  { name: 'Red', rgb: [255, 0, 0], hex: '#ff0000' },
  { name: 'Blue', rgb: [0, 0, 255], hex: '#0000ff' },
  { name: 'Yellow', rgb: [255, 255, 0], hex: '#ffff00' },
  { name: 'Green', rgb: [0, 255, 0], hex: '#00ff00' },
  { name: 'Black', rgb: [0, 0, 0], hex: '#000000' },
  { name: 'White', rgb: [255, 255, 255], hex: '#ffffff' }
];

const EASY_TARGETS = [
  { name: 'Purple', rgb: [127, 0, 127] },      // R+B
  { name: 'Orange', rgb: [255, 127, 0] },      // R+Y
  { name: 'Teal', rgb: [0, 127, 127] },        // B+G
  { name: 'Pink', rgb: [255, 127, 127] },      // R+W
  { name: 'Dark Red', rgb: [127, 0, 0] }       // R+Black
];

const ColorMixing = () => {
  const [started, setStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('Easy');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  const [targetColor, setTargetColor] = useState([255, 255, 255]);
  const [mix, setMix] = useState([255, 255, 255]);
  const [drops, setDrops] = useState(5);
  const [initialDrops, setInitialDrops] = useState(5);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (started) generateLevel();
  }, [started, difficulty]);

  const generateLevel = () => {
    setHistory([]);
    setMix([255, 255, 255]); // Base is white canvas
    setGameOver(false);

    let t, d;
    if (difficulty === 'Easy') {
      t = EASY_TARGETS[Math.floor(Math.random() * EASY_TARGETS.length)].rgb;
      d = 4;
    } else if (difficulty === 'Medium') {
      t = [
        Math.floor(Math.random() * 5) * 50,
        Math.floor(Math.random() * 5) * 50,
        Math.floor(Math.random() * 5) * 50
      ];
      d = 6;
    } else {
      t = [
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255)
      ];
      d = 8;
    }
    
    setTargetColor(t);
    setDrops(d);
    setInitialDrops(d);
  };

  const calculateDistance = (c1, c2) => {
    return Math.sqrt(
      Math.pow(c1[0] - c2[0], 2) + 
      Math.pow(c1[1] - c2[1], 2) + 
      Math.pow(c1[2] - c2[2], 2)
    );
  };

  const handleDrop = (colorObj) => {
    if (drops <= 0 || gameOver) return;

    const newMix = [
      Math.floor((mix[0] + colorObj.rgb[0]) / 2),
      Math.floor((mix[1] + colorObj.rgb[1]) / 2),
      Math.floor((mix[2] + colorObj.rgb[2]) / 2)
    ];

    setMix(newMix);
    setHistory(prev => [...prev, colorObj.hex]);
    setDrops(d => d - 1);

    const dist = calculateDistance(newMix, targetColor);
    
    // Win threshold
    const threshold = difficulty === 'Easy' ? 20 : difficulty === 'Medium' ? 15 : 8;
    
    if (dist < threshold) {
      // WIN
      const points = (difficulty === 'Easy' ? 500 : difficulty === 'Medium' ? 1000 : 2500) + (drops * 100);
      setScore(points);
      endGame(points);
    } else if (drops - 1 === 0) {
      endGame(0); // LOSE
    }
  };

  const endGame = async (points) => {
    setGameOver(true);
    if (points > 0) {
      try {
        await API.post('/game/score', { game_name: 'Color Mixing', score: points });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const rgbToStr = (arr) => `rgb(${arr[0]}, ${arr[1]}, ${arr[2]})`;

  const distToTarget = calculateDistance(mix, targetColor);
  const matchPercent = Math.max(0, 100 - (distToTarget / 4.41)); // 441 is max distance

  if (!started) {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '4rem 3rem', marginTop: '2rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Color Mixing Puzzle</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            Can you replicate the exact target shade? Mix basic primary colors onto your canvas using average additive physics. 
            Keep a close eye on your drop limit!
          </p>
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
          <button className="btn-primary" style={{ fontSize: '1.5rem', padding: '15px 40px' }} onClick={() => setStarted(true)}>
            Pick up Palette
          </button>
        </div>
        
        <div style={{ padding: '2rem' }}>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
            Exit To Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-gradient">Color Match Lab ({difficulty})</h1>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
          Drops Left: <span style={{ color: drops < 2 ? 'var(--danger-color)' : 'var(--success-color)', fontSize: '1.5rem' }}>{drops}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
        {/* Target Board */}
        <div className="glass-panel" style={{ padding: '1rem', flex: 1, minWidth: '300px', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1rem' }}>Target Goal</h3>
          <div style={{ 
            width: '100%', height: '200px', borderRadius: '12px', background: rgbToStr(targetColor),
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.2)'
          }}></div>
        </div>

        {/* Current Mix Board */}
        <div className="glass-panel" style={{ padding: '1rem', flex: 1, minWidth: '300px', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1rem' }}>Your Canvas</h3>
          <div style={{ 
            width: '100%', height: '200px', borderRadius: '12px', background: rgbToStr(mix),
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.2)',
            transition: 'background 0.5s ease'
          }}></div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h4 style={{ color: 'var(--text-secondary)' }}>Color Match Accuracy:</h4>
        <div style={{ width: '100%', height: '20px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', overflow: 'hidden', marginTop: '0.5rem' }}>
          <div style={{ 
            height: '100%', width: `${matchPercent}%`, 
            background: matchPercent > 90 ? 'var(--success-color)' : matchPercent > 60 ? 'orange' : 'var(--danger-color)',
            transition: 'width 0.5s ease'
          }}></div>
        </div>
        <p style={{ marginTop: '0.5rem' }}>{matchPercent.toFixed(1)}%</p>
      </div>

      {!gameOver ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Add Drops to Canvas</h3>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {PALETTE.map(c => (
              <button
                key={c.name}
                onClick={() => handleDrop(c)}
                style={{
                  width: '80px', height: '80px', borderRadius: '50%', background: c.hex, border: '4px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 8px 16px rgba(0,0,0,0.4)'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                title={c.name}
              />
            ))}
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            {history.map((h, i) => (
              <div key={i} style={{ width: '20px', height: '20px', borderRadius: '50%', background: h }}></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
          {score > 0 ? (
            <>
              <h2 className="text-gradient" style={{ fontSize: '2.5rem' }}>Perfect Match!</h2>
              <p style={{ fontSize: '1.5rem', color: 'var(--success-color)' }}>+{score} Points (Saved Drops Bonus Included)</p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--danger-color)' }}>Out of Drops!</h2>
              <p style={{ fontSize: '1.5rem' }}>You failed to hit the exact shade within {initialDrops} moves.</p>
            </>
          )}
          <button className="btn-primary" style={{ marginTop: '2rem' }} onClick={generateLevel}>
            Next Mixture
          </button>
        </div>
      )}

      {/* Put EXIT at the very bottom explicitly as requested */}
      <div style={{ padding: '2rem', marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
          Exit Game
        </button>
      </div>

    </div>
  );
};

export default ColorMixing;
