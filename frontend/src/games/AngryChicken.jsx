import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const AngryChicken = () => {
  const [started, setStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('Easy');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [angerLevel, setAngerLevel] = useState(1);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // Reference hooks to persist mutable game states inside event listeners without re-rendering
  const stateRef = useRef({
    score: 0,
    multiplier: 1,
    multiplierTimer: 0,
    angerLevel: 1,
    isGameOver: false,
    keys: {},
    chicken: { x: 400, y: 550, size: 30, speed: 5, slapFrame: 0, maxSlap: 15, slapRadius: 70 },
    cars: [],
    particles: [],
    frame: 0,
    lastRoadY: 0,
    cameraOffset: 0
  });

  const getDifficultyScale = () => {
    if (difficulty === 'Easy') return 1;
    if (difficulty === 'Medium') return 1.5;
    return 2.5; // Hard
  };

  const initEngine = () => {
    stateRef.current = {
      score: 0,
      multiplier: 1,
      multiplierTimer: 0,
      angerLevel: 1,
      isGameOver: false,
      keys: {},
      chicken: { x: 400, y: 550, size: 30, speed: 5, slapFrame: 0, maxSlap: 15, slapRadius: 70 },
      cars: [],
      particles: [],
      frame: 0,
      lastRoadY: 0,
      cameraOffset: 0
    };
    setScore(0);
    setMultiplier(1);
    setAngerLevel(1);
    setGameOver(false);
    setStarted(true);
  };

  useEffect(() => {
    if (!started || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const handleKeyDown = (e) => {
      stateRef.current.keys[e.code] = true;
      // Prevent default scrolling for game keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      // Trigger slap
      if (e.code === 'Space' && stateRef.current.chicken.slapFrame === 0) {
        stateRef.current.chicken.slapFrame = stateRef.current.chicken.maxSlap;
      }
    };

    const handleKeyUp = (e) => {
      stateRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    // Game Loop
    const update = () => {
      if (stateRef.current.isGameOver) return; // Halt loop
      const state = stateRef.current;
      const { chicken, cars, keys, particles } = state;
      const diffScale = getDifficultyScale();
      state.frame++;

      // Background progressive scrolling offset (Endless feeling)
      const baseScroll = 1.5 * state.angerLevel;
      state.cameraOffset += baseScroll;

      // Update Chicken Position
      // Move Chicken down with camera
      chicken.y += baseScroll; 

      const moveSpeed = chicken.speed * (1 + (state.angerLevel * 0.1));
      if (keys['ArrowUp'] || keys['KeyW']) chicken.y -= moveSpeed;
      if (keys['ArrowDown'] || keys['KeyS']) chicken.y += moveSpeed;
      if (keys['ArrowLeft'] || keys['KeyA']) chicken.x -= moveSpeed;
      if (keys['ArrowRight'] || keys['KeyD']) chicken.x += moveSpeed;

      // Bounds
      if (chicken.x < 15) chicken.x = 15;
      if (chicken.x > canvas.width - 15) chicken.x = canvas.width - 15;
      
      // If chicken reaches too high, slide camera faster and gain score!
      if (chicken.y < 300) {
        const pushDown = 300 - chicken.y;
        chicken.y = 300;
        state.cameraOffset += pushDown;
        
        // Reward Forward Progression
        state.score += Math.floor(pushDown * state.multiplier);
      }

      // If chicken falls off the bottom -> Game Over
      if (chicken.y > canvas.height + 30) {
        triggerGameOver();
        return;
      }

      // Slap Cooldown
      if (chicken.slapFrame > 0) chicken.slapFrame--;

      // Spawn Cars
      // Frequency depends on difficulty and anger
      const spawnRate = Math.max(20, 90 - (diffScale * 15) - (state.angerLevel * 5));
      if (state.frame % Math.floor(spawnRate) === 0) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        cars.push({
          x: direction === 1 ? -60 : canvas.width + 60,
          y: -50, // Spawn just off top
          w: 50,
          h: 30,
          dir: direction,
          speed: (Math.random() * 3 + 2.5) * diffScale * (1 + state.angerLevel * 0.1),
          reversed: false,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`
        });
      }

      // Multiplier Decay
      if (state.multiplierTimer > 0) {
        state.multiplierTimer--;
        if (state.multiplierTimer <= 0 && state.multiplier > 1) {
          state.multiplier = 1;
          setMultiplier(1);
        }
      }

      // Anger Level Calculation
      const newAnger = 1 + Math.floor(state.score / 2000) * 0.5;
      if (newAnger !== state.angerLevel) {
        state.angerLevel = newAnger;
        setAngerLevel(newAnger);
      }

      // Sync React state periodically (60 times a sec is too much, just map it out but we need live feedback on UI)
      if (state.frame % 15 === 0) setScore(state.score);

      // Update Cars
      for (let i = cars.length - 1; i >= 0; i--) {
        const c = cars[i];
        
        // Move car down with camera 
        c.y += baseScroll;
        // Move car horizontally
        c.x += c.speed * c.dir;

        // Cleanup offscreen cars
        if (c.y > canvas.height + 50 || c.x < -200 || c.x > canvas.width + 200) {
          cars.splice(i, 1);
          continue;
        }

        // Collision bounds
        const cxC = chicken.x;
        const cyC = chicken.y;
        const radius = chicken.size / 2;
        
        const rectLeft = c.x - c.w/2;
        const rectRight = c.x + c.w/2;
        const rectTop = c.y - c.h/2;
        const rectBottom = c.y + c.h/2;

        const isColliding = 
          cxC + radius > rectLeft && 
          cxC - radius < rectRight && 
          cyC + radius > rectTop && 
          cyC - radius < rectBottom;

        if (isColliding) {
          if (!c.reversed) {
            triggerGameOver();
            return;
          }
        }

        // Slap Logic
        if (chicken.slapFrame > 0 && !c.reversed) {
          const distX = cxC - c.x;
          const distY = cyC - c.y;
          const dist = Math.sqrt(distX * distX + distY * distY);
          
          if (dist < chicken.slapRadius + c.w/2) {
            // SLAP HIT!
            c.reversed = true;
            c.dir = c.dir * -1; // Reverse horizontal
            c.speed = c.speed * 3; // Violently fly across
            c.vy = -15; // Launch upward relative to canvas
            
            state.score += (500 * state.multiplier);
            setScore(state.score);
            state.multiplier += 1;
            setMultiplier(state.multiplier);
            state.multiplierTimer = 180; // 3 seconds of buffer to hit another

            // Generate particles
            for(let p=0; p<10; p++) {
              particles.push({
                x: c.x, y: c.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30
              });
            }
          }
        }

        // Apply upward velocity if reversed
        if (c.reversed && c.vy !== undefined) {
          c.y += c.vy; // flying off the screen upwards
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
      }

      draw(ctx, state);
      animationId = requestAnimationFrame(update);
    };

    const draw = (ctx, state) => {
      // Clear Screen (Anger Tint)
      const redAlpha = Math.min((state.angerLevel - 1) * 0.1, 0.4);
      ctx.fillStyle = `rgba(${20 + redAlpha * 255}, 22, 25, 1)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid / Road lines based on cameraOffset
      ctx.lineWidth = 2;
      ctx.beginPath();
      const lineSpacing = 100;
      const offset = state.cameraOffset % lineSpacing;
      for (let y = -lineSpacing; y < canvas.height + lineSpacing; y += lineSpacing) {
        ctx.moveTo(0, y + offset);
        ctx.lineTo(canvas.width, y + offset);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.stroke();

      // Slap Radius
      if (state.chicken.slapFrame > 0) {
        ctx.beginPath();
        ctx.arc(state.chicken.x, state.chicken.y, state.chicken.slapRadius, 0, Math.PI * 2);
        const intense = state.chicken.slapFrame / state.chicken.maxSlap; // 1 to 0
        ctx.fillStyle = `rgba(255, 100, 100, ${intense * 0.5})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 0, 0, ${intense})`;
        ctx.stroke();
      }

      // Draw Cars
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const c of state.cars) {
        ctx.save();
        ctx.translate(c.x, c.y);
        
        if (c.reversed) {
          ctx.rotate((state.frame * 0.2) % (Math.PI * 2)); // Spin out of control
        } else {
          if (c.dir === -1) {
            ctx.scale(-1, 1); // Face left
          }
        }
        
        ctx.fillStyle = c.color;
        // Simple car body
        ctx.fillRect(-c.w/2, -c.h/2, c.w, c.h);
        ctx.fillStyle = '#111';
        // Wheels
        ctx.fillRect(-c.w/2 + 5, -c.h/2 - 5, 15, 5); // top left
        ctx.fillRect(c.w/2 - 20, -c.h/2 - 5, 15, 5); // top right
        ctx.fillRect(-c.w/2 + 5, c.h/2, 15, 5); // bot left
        ctx.fillRect(c.w/2 - 20, c.h/2, 15, 5); // bot right
        // Windshield
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(c.w/2 - 15, -c.h/2 + 5, 10, c.h - 10);
        
        ctx.restore();
      }

      // Draw Particles
      for (const p of state.particles) {
        ctx.fillStyle = `rgba(255, 200, 0, ${p.life / 30})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Chicken
      ctx.save();
      ctx.translate(state.chicken.x, state.chicken.y);
      if (state.angerLevel > 1.5) {
        // Vibrate when angry
        ctx.translate((Math.random()-0.5)*3, (Math.random()-0.5)*3);
      }
      ctx.font = '40px Arial';
      ctx.fillText('🐔', 0, 0);
      
      // Sweat/Rage icon if angry
      if (state.angerLevel >= 2) {
        ctx.font = '20px Arial';
        ctx.fillText('💢', 15, -20);
      }
      ctx.restore();
    };

    const triggerGameOver = () => {
      stateRef.current.isGameOver = true;
      setGameOver(true);
      submitScoreDb(stateRef.current.score);
    };

    animationId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };

  }, [started, gameOver, difficulty]);

  const submitScoreDb = async (finalScore) => {
    try {
        await API.post('/game/score', { game_name: `Angry Chicken (${difficulty})`, score: finalScore });
      } catch (err) {
        console.error('Failed to submit score');
      }
  };

  if (!started) {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', marginTop: '4rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Angry Chicken Crossing</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Why cross the road to avoid traffic when you can physically <strong>slap</strong> vehicles out of your way?
            <br/><br/>
            <strong>Controls:</strong> Arrow Keys / WASD<br/>
            <strong>ATTACK:</strong> Spacebar (Slap incoming cars out of bounds for Multiplier Combos)
          </p>

          <h3 style={{ marginBottom: '1rem' }}>Road Danger:</h3>
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

          <button className="btn-primary" style={{ fontSize: '1.5rem', padding: '15px 40px', background: 'var(--success-color)' }} onClick={initEngine}>
            Deploy Chicken
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
      
      <div style={{ width: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
            <h2 className="text-gradient" style={{ margin: 0 }}>Score: {score}</h2>
            {multiplier > 1 && (
                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    x{multiplier} COMBO
                </span>
            )}
        </div>
        <div style={{ textAlign: 'right' }}>
            <span style={{ color: angerLevel >= 2 ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                Rage Phase: {angerLevel.toFixed(1)}
            </span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '800px', height: '600px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
        <canvas 
          ref={canvasRef}
          width={800}
          height={600}
          style={{ width: '100%', height: '100%', background: '#111' }}
        />
        
        {gameOver && (
          <div style={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', 
            justifyContent: 'center', alignItems: 'center', zIndex: 10 
          }}>
            <h1 className="text-gradient" style={{ fontSize: '4rem', color: 'var(--danger-color)' }}>ROADKILL</h1>
            <p style={{ fontSize: '2rem', color: '#fff' }}>Final Score: {score}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button className="btn-primary" onClick={() => navigate('/')}>
                    Retreat
                </button>
                <button className="btn-primary" style={{ background: 'var(--success-color)' }} onClick={initEngine}>
                    Respawn
                </button>
            </div>
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

export default AngryChicken;
