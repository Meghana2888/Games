import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const CustomImagePuzzle = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [imageUrl, setImageUrl] = useState(null);
  const [gridSize, setGridSize] = useState(3); // 3x3, 4x4, 5x5
  const [pieces, setPieces] = useState([]);
  const [time, setTime] = useState(0);
  const [initialTime, setInitialTime] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [quote, setQuote] = useState("");
  
  const timerRef = useRef(null);
  const containerSize = 400; // Fixed canvas size

  const happyQuotes = [
    "Brilliant! You've got an eagle eye! 🦅",
    "Outstanding memory and speed! ⚡",
    "You pieced that together perfectly! 🧩",
    "Amazing! Your spatial awareness is top notch! 🧠"
  ];
  
  const sadQuotes = [
    "Time's up! Don't let your memories fade... 🕰️",
    "So close! Try to visualize the final picture next time. 🖼️",
    "The pieces didn't quite fall into place. Try again! 🤔",
    "Time flies when you're puzzling! Let's give it another shot. ⏳"
  ];

  const randomQuote = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // --- Handlers ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setIsPlaying(false);
      setIsWon(false);
      setIsLost(false);
      setPieces([]);
    }
  };

  const startGame = () => {
    if (!imageUrl) return;
    
    // Slice image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      sliceImage(img);
    };
  };

  const sliceImage = (img) => {
    const pieceSize = containerSize / gridSize;
    const canvas = document.createElement('canvas');
    canvas.width = containerSize;
    canvas.height = containerSize;
    const ctx = canvas.getContext('2d');

    // Square crop logic
    const size = Math.min(img.width, img.height);
    const x = (img.width - size) / 2;
    const y = (img.height - size) / 2;
    
    // Draw cropped image onto square canvas
    ctx.drawImage(img, x, y, size, size, 0, 0, containerSize, containerSize);

    // Extract pieces
    const newPieces = [];
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const pieceCanvas = document.createElement('canvas');
        pieceCanvas.width = pieceSize;
        pieceCanvas.height = pieceSize;
        const pCtx = pieceCanvas.getContext('2d');
        pCtx.drawImage(
          canvas,
          col * pieceSize, row * pieceSize, pieceSize, pieceSize,
          0, 0, pieceSize, pieceSize
        );
        newPieces.push({
          id: row * gridSize + col,
          src: pieceCanvas.toDataURL(),
        });
      }
    }

    // Shuffle
    const shuffled = [...newPieces].sort(() => Math.random() - 0.5);
    setPieces(shuffled);
    
    const timeLimit = gridSize === 3 ? 60 : gridSize === 4 ? 180 : 300;
    setInitialTime(timeLimit);
    setTime(timeLimit);
    setMoves(0);
    setIsPlaying(true);
    setIsWon(false);
    setIsLost(false);
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setIsPlaying(false);
          setIsLost(true);
          setQuote(randomQuote(sadQuotes));
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // --- Drag and Drop ---
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('pieceIndex', index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData('pieceIndex'), 10);
    if (draggedIndex === index) return;

    const newPieces = [...pieces];
    const temp = newPieces[draggedIndex];
    newPieces[draggedIndex] = newPieces[index];
    newPieces[index] = temp;

    setPieces(newPieces);
    setMoves(m => m + 1);
    checkWin(newPieces);
  };

  const checkWin = (currentPieces) => {
    const isSolved = currentPieces.every((p, i) => p.id === i);
    if (isSolved) {
      setIsPlaying(false);
      setIsWon(true);
      setQuote(randomQuote(happyQuotes));
      if (timerRef.current) clearInterval(timerRef.current);
      submitScore();
    }
  };

  const submitScore = async () => {
    try {
      const timeTaken = initialTime - time;
      const base = gridSize * 1000;
      const penalty = (timeTaken * 5) + (moves * 10);
      const finalScore = Math.max(10, base - penalty);
      
      await API.post('/game/score', {
        game_name: 'Custom Image Puzzle',
        score: finalScore
      });
    } catch (error) {
      console.error('Failed to save score', error);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePlayAgain = () => {
    setImageUrl(null);
    setPieces([]);
    setIsPlaying(false);
    setIsWon(false);
    setIsLost(false);
    setTime(0);
    setMoves(0);
  };

  return (
    <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', color: 'white' }}>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', textAlign: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '3rem', margin: 0 }}>Custom Image Puzzle</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>Upload an image and reconstruct it before time runs out!</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', flex: 1, alignItems: 'center', flexDirection: 'column', width: '100%' }}>
        
        {!isPlaying && !isWon && !isLost && (
          <div className="glass-panel" style={{ padding: '4rem 3rem', textAlign: 'center', maxWidth: '600px', width: '100%', marginTop: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Upload an Image to Play</h2>
            
            <div style={{ marginBottom: '2rem' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                id="image-upload" 
                style={{ display: 'none' }} 
              />
              <label htmlFor="image-upload" className="btn-primary" style={{ cursor: 'pointer', display: 'inline-block', padding: '15px 30px', fontSize: '1.2rem' }}>
                Choose Image
              </label>
            </div>

            {imageUrl && (
              <div style={{ marginBottom: '2rem' }}>
                <img src={imageUrl} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
              </div>
            )}

            <div style={{ marginBottom: '2.5rem' }}>
              <label style={{ marginRight: '1rem', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Difficulty:</label>
              <select 
                value={gridSize} 
                onChange={(e) => setGridSize(Number(e.target.value))}
                style={{ padding: '0.8rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--accent-color)', fontSize: '1.1rem' }}
              >
                <option value={3} style={{ color: 'black' }}>3x3 (Easy - 60s)</option>
                <option value={4} style={{ color: 'black' }}>4x4 (Medium - 180s)</option>
                <option value={5} style={{ color: 'black' }}>5x5 (Hard - 300s)</option>
              </select>
            </div>

            <button 
              className="btn-primary" 
              onClick={startGame} 
              disabled={!imageUrl}
              style={{ 
                opacity: imageUrl ? 1 : 0.5, 
                cursor: imageUrl ? 'pointer' : 'not-allowed',
                transform: imageUrl ? 'none' : 'scale(1)',
                background: 'var(--accent-color)',
                padding: '15px 40px',
                fontSize: '1.2rem'
              }}
            >
              Start Puzzle
            </button>
          </div>
        )}

        {(isPlaying || isWon || isLost) && (
          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
            
            {/* Controls Panel */}
            <div className="glass-panel" style={{ padding: '2rem', minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignSelf: 'flex-start' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Time Left</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: time <= 10 ? 'var(--danger-color)' : 'var(--accent-color)', fontFamily: 'monospace', animation: time <= 10 && isPlaying ? 'pulse 1s infinite' : 'none' }}>
                  {formatTime(time)}
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Moves</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success-color)', fontFamily: 'monospace' }}>{moves}</div>
              </div>

              {isPlaying && (
                <>
                  <button 
                    className="btn-secondary" 
                    onClick={() => setShowPreview(!showPreview)}
                    style={{ marginTop: '1rem' }}
                  >
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>

                  <button 
                    className="btn-secondary" 
                    onClick={() => {
                      setIsPlaying(false);
                      setIsLost(true);
                      setQuote("You gave up! Let's try again.");
                      if (timerRef.current) clearInterval(timerRef.current);
                    }}
                    style={{ background: 'rgba(255,0,0,0.2)', border: '1px solid var(--danger-color)' }}
                  >
                    Give Up
                  </button>
                </>
              )}
            </div>

            {/* Puzzle Grid */}
            <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  width: `${containerSize}px`,
                  height: `${containerSize}px`,
                  gap: '2px',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '4px',
                  borderRadius: '8px',
                  boxShadow: isWon ? '0 0 30px var(--success-color)' : isLost ? '0 0 30px var(--danger-color)' : '0 10px 30px rgba(0,0,0,0.5)',
                  transition: 'box-shadow 0.3s',
                  pointerEvents: isPlaying ? 'auto' : 'none',
                  opacity: isLost ? 0.6 : 1
                }}
              >
                {pieces.map((piece, index) => (
                  <div
                    key={index}
                    draggable={isPlaying}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, index)}
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url(${piece.src})`,
                      backgroundSize: 'cover',
                      cursor: isPlaying ? 'grab' : 'default',
                      opacity: isWon ? 1 : 0.9,
                      transition: 'transform 0.1s',
                      borderRadius: '2px'
                    }}
                    onDragEnd={(e) => {
                      if (isPlaying) e.target.style.opacity = '1';
                    }}
                    onDrag={() => {}}
                  />
                ))}
              </div>

              {(isWon || isLost) && (
                <div className="glass-panel animate-fade-in" style={{ padding: '2rem', textAlign: 'center', marginTop: '1rem', width: '100%', maxWidth: `${containerSize}px`, border: `2px solid ${isWon ? 'var(--success-color)' : 'var(--danger-color)'}` }}>
                  <h3 style={{ fontSize: '2rem', color: isWon ? 'var(--success-color)' : 'var(--danger-color)', marginBottom: '1rem' }}>
                    {isWon ? '🎉 PUZZLE SOLVED! 🎉' : '💀 TIME EXPIRED 💀'}
                  </h3>
                  <p style={{ fontSize: '1.2rem', marginBottom: '2rem', fontStyle: 'italic', fontWeight: 'bold' }}>"{quote}"</p>
                  
                  <button className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 40px', background: isWon ? 'var(--success-color)' : 'var(--accent-color)' }} onClick={handlePlayAgain}>
                    Upload New & Play Again
                  </button>
                </div>
              )}

              {/* Preview Reference Image */}
              {isPlaying && (
                <div style={{ 
                  marginTop: '1rem', 
                  transition: 'all 0.3s ease', 
                  opacity: showPreview ? 1 : 0, 
                  height: showPreview ? 'auto' : '0px',
                  overflow: 'hidden',
                  textAlign: 'center'
                }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Reference Image</p>
                  <img 
                    src={imageUrl} 
                    alt="Original" 
                    style={{ 
                      width: `${containerSize / 2}px`, 
                      height: `${containerSize / 2}px`, 
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '2px solid rgba(255,255,255,0.2)'
                    }} 
                  />
                </div>
              )}

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

export default CustomImagePuzzle;
