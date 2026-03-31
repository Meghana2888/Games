import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

// The actual targets you must find
const HIDDEN_ITEMS = ['💠', '🗝️', '📜', '👁️', '🧿'];

// Garbage noise icons
const DECOYS = ['🔹', '🔸', '▫️', '▪️', '🔺', '🔻', '🔲', '🔳', '⚪', '⚫', '⚙️', '✨', '⚡', '🌟', '❄️'];

const VisualPuzzle = () => {
  const [phase, setPhase] = useState('menu'); // menu, intro, active, result
  const [mode, setMode] = useState(''); // 'ar' or 'image'
  const [difficulty, setDifficulty] = useState('easy'); 
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  // Object Datasets
  const [targets, setTargets] = useState([]);
  const [fakeNoise, setFakeNoise] = useState([]);
  
  // Transform State (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // AR Video State
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  const navigate = useNavigate();

  const handleStartGame = async (selectedMode, selectedDiff) => {
    setMode(selectedMode);
    setDifficulty(selectedDiff);
    
    if (selectedMode === 'ar') {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        alert("Camera access denied or unavailable. Falling back to Image mode.");
        setMode('image');
      }
    }

    // Configure Difficulty Scaling
    let targetCount = 0;
    let decoyCount = 0;
    let iconScale = 1;
    let camouflage = 1; // 1 = fully visible

    if (selectedDiff === 'easy') { targetCount = 3; decoyCount = 10; iconScale = 1.0; camouflage = 1.0; }
    if (selectedDiff === 'medium') { targetCount = 5; decoyCount = 50; iconScale = 0.6; camouflage = 0.7; }
    if (selectedDiff === 'hard') { targetCount = 8; decoyCount = 300; iconScale = 0.3; camouflage = 0.4; } // Brutal

    // Generate Targets
    const newTargets = [];
    const availableTargets = [...HIDDEN_ITEMS, '🧬', '🔮', '🛡️']; // pool of 8
    for(let i=0; i<targetCount; i++) {
        newTargets.push({
            symbol: availableTargets[i],
            x: 5 + Math.random() * 90, 
            y: 5 + Math.random() * 90, 
            found: false,
            scale: iconScale,
            opacity: camouflage
        });
    }
    
    // Generate Dense Field of Decoys
    const newDecoys = [];
    for(let i=0; i<decoyCount; i++) {
        newDecoys.push({
            symbol: DECOYS[Math.floor(Math.random() * DECOYS.length)],
            x: 2 + Math.random() * 96,
            y: 2 + Math.random() * 96,
            scale: iconScale * (0.8 + Math.random()*0.4),
            opacity: camouflage * 0.8
        });
    }

    setTargets(newTargets);
    setFakeNoise(newDecoys);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setStartTime(Date.now());
    setPhase('active');
  };

  // Attach stream specifically if ref mounts later
  useEffect(() => {
    if (phase === 'active' && mode === 'ar' && stream && videoRef.current) {
        videoRef.current.srcObject = stream;
    }
  }, [phase, mode, stream]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  const handleTargetClick = (index, e) => {
    e.preventDefault();
    e.stopPropagation(); // prevent drag
    if (targets[index].found) return;

    const updated = [...targets];
    updated[index].found = true;
    setTargets(updated);

    if (updated.every(t => t.found)) {
      handleWin();
    }
  };

  const handleWin = async () => {
    const totalTime = (Date.now() - startTime) / 1000;
    setEndTime(totalTime);
    
    let multiplier = difficulty === 'easy' ? 1 : (difficulty === 'medium' ? 2.5 : 5);
    let finalScore = Math.max(500, parseInt((10000 - (totalTime * 100)) * multiplier));
    setScore(score + finalScore);
    
    setPhase('result');

    try {
      await API.post('/game/score', { game_name: 'Visual Locator', score: finalScore });
    } catch(err){}
  };

  // ----- Lens Inspector Logic -----
  const handleWheel = (e) => {
    if (phase !== 'active') return;
    e.preventDefault();
    const zoomSensitivity = 0.05;
    // Cap max zoom so hard mode requires precise sliding
    const newZoom = Math.max(1, Math.min(zoom - (e.deltaY < 0 ? zoomSensitivity : -zoomSensitivity) * 2, 8));
    
    // If we zoom ALL the way out, strictly reset pan to center.
    if (newZoom <= 1.05) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(newZoom);
    }
  };

  const handleMouseDown = (e) => {
    if (zoom <= 1) return; // Only allow drag if zoomed in
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ----- Renderers -----

  if (phase === 'menu') {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ padding: '4rem 3rem', marginTop: '2rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>AR Visual Inspector</h2>
          
          <div style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p>Hidden anomalous targets are scattered within the sector.</p>
            <p>The higher the difficulty, the smaller, more transparent, and severely guarded by false-decoys the targets become.</p>
            <p style={{marginTop:'1rem', color:'var(--danger-color)'}}><strong>Hard Mode</strong> injects 300+ decoys and shrinks targets to microscopic levels. Extreme magnification required.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '2rem' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <h3 style={{color:'#fff'}}>Static Image Sector</h3>
                <button className="btn-primary" style={{ background: 'rgba(59, 130, 246, 0.4)' }} onClick={() => handleStartGame('image', 'easy')}>Easy</button>
                <button className="btn-primary" style={{ background: 'rgba(234, 179, 8, 0.4)' }} onClick={() => handleStartGame('image', 'medium')}>Medium</button>
                <button className="btn-primary" style={{ background: 'rgba(239, 68, 68, 0.4)', border:'1px solid var(--danger-color)' }} onClick={() => handleStartGame('image', 'hard')}>Hard (Brutal)</button>
            </div>
            
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <h3 style={{color:'var(--accent-color)'}}>Live AR Sector (Webcam)</h3>
                <button className="btn-primary" style={{ background: 'var(--accent-color)', opacity: 0.6 }} onClick={() => handleStartGame('ar', 'easy')}>Easy (Live)</button>
                <button className="btn-primary" style={{ background: 'var(--accent-color)', opacity: 0.8 }} onClick={() => handleStartGame('ar', 'medium')}>Medium (Live)</button>
                <button className="btn-primary" style={{ background: 'var(--danger-color)' }} onClick={() => handleStartGame('ar', 'hard')}>Hard (Live)</button>
            </div>
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

  const foundCount = targets.filter(t => t.found).length;

  return (
    <div className="game-container animate-fade-in" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden', position: 'relative' }}>
      
      {/* HUD OVERLAY (Fixed to screen) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '2rem', zIndex: 100, pointerEvents: 'none' }}>
        <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--accent-color)' }}>{difficulty.toUpperCase()} Sector</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Zoom: {(zoom).toFixed(1)}x</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', maxWidth:'500px', justifyContent:'flex-end' }}>
            {targets.map((t, idx) => (
              <div key={idx} style={{ 
                fontSize: '2rem', opacity: t.found ? 1 : 0.4, 
                filter: t.found ? 'none' : 'grayscale(100%)',
                transition: 'all 0.3s'
              }}>
                {t.symbol}
              </div>
            ))}
            <div style={{ fontSize: '1.5rem', marginLeft: '20px', fontWeight: 'bold' }}>
              {foundCount} / {targets.length} Found
            </div>
          </div>
        </div>
      </div>

      {phase === 'result' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, background: 'rgba(0,0,0,0.8)' }}>
           <div className="glass-panel animate-fade-in" style={{ padding: '4rem', textAlign: 'center', maxWidth: '600px', pointerEvents: 'auto' }}>
            <h2 style={{ fontSize: '4rem', color: 'var(--success-color)', marginBottom: '1rem', textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}>
              AREA CLEARED
            </h2>
            <p style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Sector resolved in {endTime.toFixed(1)} seconds.</p>
            <p style={{ fontSize: '1.5rem', marginBottom: '2rem', color:'var(--success-color)'}}>Score Earned: {score} pts</p>
            <button className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 40px' }} onClick={() => setPhase('menu')}>
              Return to Sector Selection
            </button>
          </div>
        </div>
      )}

      {/* RENDER VIEWPORT (Pannable/Zoomable) */}
      <div 
        style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: isDragging ? 'grabbing' : (zoom > 1 ? 'grab' : 'crosshair') }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div style={{ 
            width: '100%', height: '100%', position: 'absolute', top: 0, left: 0,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}>

            {/* Background Render */}
            {mode === 'ar' ? (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                 />
            ) : (
                <div style={{ 
                  width: '100%', height: '100%', 
                  background: 'repeating-radial-gradient( circle at 0 0, transparent 0, #111822 40px ), repeating-linear-gradient( #2b3a42, #2b3a42 )',
                  backgroundBlendMode: 'multiply'
                }}>
                  {/* Fake complex CSS clutter to make it challenging */}
                  {Array.from({length: difficulty === 'hard' ? 150 : 50}).map((_, i) => (
                    <div key={i} style={{
                      position: 'absolute', pointerEvents: 'none',
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      width: `${20 + Math.random() * 100}px`,
                      height: `${20 + Math.random() * 100}px`,
                      background: `hsla(${Math.random() * 360}, 50%, ${difficulty === 'hard' ? 20 : 50}%, 0.1)`,
                      transform: `rotate(${Math.random() * 360}deg)`,
                      borderRadius: Math.random() > 0.5 ? '50%' : '0%'
                    }} />
                  ))}
                  {/* Fake Text clutter */}
                  {Array.from({length: difficulty === 'hard' ? 100 : 30}).map((_, i) => (
                    <div key={i} style={{
                      position: 'absolute', pointerEvents: 'none', color: 'rgba(255,255,255,0.05)', fontFamily: 'monospace', fontSize: '10px',
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      transform: `rotate(${Math.random() * 360}deg)`,
                    }}>
                        0x{Math.floor(Math.random() * 99999999).toString(16)}
                    </div>
                  ))}
                </div>
            )}

            {/* Render Decoy Noise Field */}
            {fakeNoise.map((decoy, idx) => (
                 <div key={`decoy-${idx}`} style={{
                    position: 'absolute', pointerEvents: 'none',
                    left: `${decoy.x}%`, top: `${decoy.y}%`,
                    transform: `translate(-50%, -50%) scale(${decoy.scale})`,
                    fontSize: '2rem', opacity: decoy.opacity,
                    filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.5))',
                    zIndex: 2,
                }}>
                    {decoy.symbol}
                </div>
            ))}

            {/* Hidden Target Injectors */}
            {targets.map((target, idx) => (
                <div 
                  key={`target-${idx}`}
                  onMouseDown={(e) => handleTargetClick(idx, e)}
                  onTouchStart={(e) => handleTargetClick(idx, e)}
                  style={{
                    position: 'absolute',
                    pointerEvents: 'auto',
                    left: `${target.x}%`,
                    top: `${target.y}%`,
                    width: '40px',
                    height: '40px',
                    transform: `translate(-50%, -50%) scale(${target.found ? 1 : target.scale})`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem', // Base size, scaled down heavily via transform.scale in hard mode
                    opacity: target.found ? 1 : target.opacity,
                    filter: target.found ? 'drop-shadow(0 0 10px var(--success-color))' : 'drop-shadow(0 0 1px rgba(0,0,0,0.8))',
                    zIndex: target.found ? 50 : 10,
                  }}
                >
                    {/* Highlight Box if Found */}
                    {target.found && (
                      <div className="animate-pulse" style={{ position: 'absolute', width: '150%', height: '150%', borderRadius: '50%', border: '4px solid var(--success-color)' }} />
                    )}
                    {target.symbol}
                </div>
            ))}

        </div>
      </div>

      {/* Exit Container Absolutely Positioned over everything so it's always accessible */}
      <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 100, pointerEvents: 'auto' }}>
        <button className="btn-primary" onClick={() => {
            if (stream) stream.getTracks().forEach(t => t.stop());
            navigate('/');
        }} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.5)',backdropFilter:'blur(5px)' }}>
          Exit To Dashboard
        </button>
      </div>

    </div>
  );
};

export default VisualPuzzle;
