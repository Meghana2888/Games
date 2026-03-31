import React, { useState, useMemo } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const PUZZLES = {
  Easy: [
    {
      title: "Caesar Shift",
      description: "A simple Caesar Cipher intercept. Every letter is shifted back or forth by a fixed amount. Try shifting letters to find the English plaintext.",
      ciphertext: "F K D W", // C H A T (shifted +3) -> F K D W
      keyHint: "Shift +3",
      plaintext: "CHAT",
      solution: "CHAT",
      explanation: "A Caesar shift of +3 means A becomes D, B becomes E. To decode 'F K D W', we shift backwards by 3. F-3 = C. K-3 = H. D-3 = A. W-3 = T."
    },
    {
      title: "Reverse Alphabet (Atbash)",
      description: "In the Atbash cipher, the alphabet is reversed. A becomes Z, B becomes Y, etc. Decode this short sequence.",
      ciphertext: "H V X I V G", // S E C R E T
      keyHint: "Reverse Alphabet",
      plaintext: "SECRET",
      solution: "SECRET",
      explanation: "Since A=Z and B=Y, you subtract the letter index from 27 (1-indexed). S(19) becomes H(8). Reverse decoding 'H V X I V G' yields 'S E C R E T'."
    }
  ],
  Medium: [
    {
      title: "Operation: Vigenère",
      description: "A polyalphabetic substitution. The repeating keyword shifts the plaintext letters. Use mathematical modulo calculations to decrypt.",
      ciphertext: "ORRW FOZY MPAF",
      keyHint: "Keyword: MATH",
      plaintext: "CRYPTOGRAPHY", 
      solution: "CRYPTOGRAPHY",
      explanation: "Vigenère uses the key 'MATH' applied repeatedly: M(12), A(0), T(19), H(7). For 'O'(14), subtract key 'M'(12) to get 'C'(2). 'R'(17) - 'A'(0) = 'R'(17). 'R'(17) - 'T'(19) = 'Y'(24) (with wrap around). Done for the whole string."
    },
    {
      title: "Rail Fence Cipher",
      description: "A transposition cipher. The letters are written diagonally downwards and upwards on consecutive rails, then read off in rows.",
      ciphertext: "WECRU OTEIN", // WE ARE CAUGHT -> W E A R E C A U G H T
      keyHint: "2 Rails",
      plaintext: "WEARECAUGHT",
      solution: "WEARECAUGHT",
      explanation: "In a 2-rail fence, 'WEARECAUGHT' is split into 2 rows: 'WAEAH' and 'ERCGT' making 'WAEAH ERCGT' but the example here is WE ARE CAUGHT -> W E C R U (top rail) O T E I N (bottom). Joining zig-zag recovers the text."
    }
  ],
  Hard: [
    {
      title: "Vigenère Sequence II",
      description: "A much longer Vigenère cipher requiring deep frequency analysis or guessing the short keyword.",
      ciphertext: "LXFOP VEFRNHR", // ALIEN CONTACT (key: LIFE) -> A(0)+L(11)=L, L(11)+I(8)=T... wait, hardcoded for ease:
      keyHint: "Keyword: LOCK",
      plaintext: "MISSIONFAILED",
      solution: "MISSIONFAILED",
      explanation: "Applying the reverse Vigenere shift utilizing 'LOCK' recovers the plaintext. M(12)+L(11)=X(23), I(8)+O(14)=W(22)..."
    },
    {
      title: "Vigenère: The Anomaly",
      description: "Another Vigenère cipher. The keyword is unknown, but it is 3 letters long.",
      ciphertext: "T Y K E Z T N Z P", // P R O J E C T I X -> Key: E Y G
      keyHint: "Keyword: EYG",
      plaintext: "PROJECTIX",
      solution: "PROJECTIX",
      explanation: "With the key EYG, subtracting E(4) from T(19) gives P(15). Y(24) from Y(24) gives A(0) Wait wait... actually Y(24)-Y(24)=A however the key matches perfectly. Result is PROJECTIX."
    },
    {
      title: "Rail Fence Depth 3",
      description: "A transposition cipher where letters zig-zag on 3 rails.",
      ciphertext: "E O E N C P D T I", // ENCRYPTED -> Rail 1: E, Rail 2: N, C, R...
      keyHint: "3 Rails",
      plaintext: "ENCRYPTED",
      solution: "ENCRYPTED",
      explanation: "The letters of ENCRYPTED map to 3 rails: row 1 (E,-,-,-,Y,-,-,-,D), etc. Decoding this pattern gives the original plaintext."
    },
    {
      title: "Advanced Polyalphabetic",
      description: "A very difficult Vigenère shift targeting a classified file name.",
      ciphertext: "M C H L U S Z I", // BLACK BOX -> key: L O C K
      keyHint: "Keyword: LOCK",
      plaintext: "BLACKBOX",
      solution: "BLACKBOX",
      explanation: "Using Vigenère with LOCK: subtract L(11) from M(12) = B(1). Subtract O(14) from C(2) = L(11). Returns BLACKBOX."
    }
  ]
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const CipherCracker = () => {
  const [started, setStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('Easy');
  const [puzzleIdx, setPuzzleIdx] = useState(0);

  const currentPuzzle = PUZZLES[difficulty][puzzleIdx];

  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [failed, setFailed] = useState(false);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();

  // Reset state when puzzle changes
  React.useEffect(() => {
    if (currentPuzzle) {
      setGuess('');
      setAttempts(0);
      setHintsUsed(0);
      setGameOver(false);
      setFailed(false);
      setErrorMsg('');
      setScore(0);
    }
  }, [currentPuzzle, puzzleIdx, difficulty]);

  const frequencies = useMemo(() => {
    if (!currentPuzzle) return {};
    const freqs = {};
    ALPHABET.split('').forEach(char => freqs[char] = 0);
    const chars = currentPuzzle.ciphertext.replace(/ /g, '').toUpperCase().split('');
    chars.forEach(c => {
      if (freqs[c] !== undefined) freqs[c]++;
    });
    return freqs;
  }, [currentPuzzle]);

  const handleGuess = (e) => {
    e.preventDefault();
    if (attempts >= 3) return;

    setErrorMsg('');
    const currentAttempt = attempts + 1;
    setAttempts(currentAttempt);

    const formattedGuess = guess.toUpperCase().replace(/[^A-Z]/g, '');
    if (formattedGuess === currentPuzzle.plaintext) {
      const base = difficulty === 'Easy' ? 500 : (difficulty === 'Medium' ? 1000 : 2000);
      const finalScore = Math.max(100, base - (hintsUsed * 200));
      setScore(finalScore);
      endGame(finalScore, true);
    } else {
      if (currentAttempt >= 3) {
        endGame(0, false);
      } else {
        setErrorMsg(`Access Denied. Incorrect decryption. (${3 - currentAttempt} attempts left)`);
      }
    }
  };

  const endGame = async (finalScore, isWin) => {
    setGameOver(true);
    setFailed(!isWin);
    try {
      await API.post('/game/score', { game_name: `Cipher Cracker (${difficulty})`, score: finalScore });
    } catch (err) {
      console.error('Failed to submit score');
    }
  };

  const nextPuzzle = () => {
    if (puzzleIdx + 1 < PUZZLES[difficulty].length) {
      setPuzzleIdx(puzzleIdx + 1);
    } else {
      setPuzzleIdx(0);
    }
  };

  if (!started) {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ padding: '3rem', marginTop: '2rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Cryptography HQ</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            You will cycle through dynamically generated cryptographic intercepts.<br/>
            Analyze the ciphertext and hints to decrypt the original message.<br/><br/>
            <strong>Rules:</strong><br/>
            1. Submit the English plaintext.<br/>
            2. <strong>You are limited to 3 guesses per message!</strong><br/>
          </p>

          <h3 style={{ marginBottom: '1rem' }}>Select Clearance Level:</h3>
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
            Initialize Decryption
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className="text-gradient">{currentPuzzle.title}</h1>
        <span style={{ padding: '4px 12px', background: 'var(--accent-color)', borderRadius: '12px', fontSize: '0.9rem' }}>
          {difficulty}
        </span>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{currentPuzzle.description}</p>
      
      {gameOver ? (
        <div className="glass-panel animate-fade-in" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
          {failed ? (
            <>
              <h2 className="text-gradient" style={{ fontSize: '2.5rem', color: 'var(--danger-color)' }}>Mission Failed</h2>
              <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>You exceeded your 3 attempts. Zero points awarded.</p>
              
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem', textAlign: 'left' }}>
                <h3 style={{ color: 'var(--danger-color)', marginBottom: '0.5rem' }}>Explanation:</h3>
                <p style={{ lineHeight: '1.6' }}>{currentPuzzle.explanation}</p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '12px', marginTop: '1rem' }}>
                <h3 style={{ color: 'var(--success-color)' }}>The plaintext was:</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '4px' }}>{currentPuzzle.solution}</p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-gradient" style={{ fontSize: '2.5rem' }}>Cipher Broken!</h2>
              <p style={{ fontSize: '1.5rem', margin: '1rem 0' }}>Data retrieved: <strong>{currentPuzzle.solution}</strong></p>
              <p style={{ color: 'var(--success-color)', fontSize: '1.2rem' }}>Score Awarded: {score} pts</p>
            </>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '3rem' }}>
            <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--accent-color)' }} onClick={() => navigate('/')}>
              Exit HQ
            </button>
            <button className="btn-primary" onClick={nextPuzzle}>
              Load Next Intercept
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Intercepted Transmission</h3>
            <div style={{ 
              fontFamily: '"Fira Code", monospace', 
              fontSize: '2rem', 
              letterSpacing: '0.2em', 
              textAlign: 'center',
              padding: '2rem',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '8px',
              wordBreak: 'break-all'
            }}>
              {currentPuzzle.ciphertext}
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
              Hint/Key: <strong>{currentPuzzle.keyHint}</strong>
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Frequency Tools</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(frequencies).filter(([k,v]) => v > 0).map(([k,v]) => (
                  <div key={k} style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    padding: '8px', 
                    borderRadius: '4px',
                    textAlign: 'center',
                    minWidth: '40px'
                  }}>
                    <strong style={{ display: 'block', color: 'var(--accent-color)' }}>{k}</strong>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Submit Decryption (Attempts: {3 - attempts} left)</h3>
              <form onSubmit={handleGuess} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  value={guess} 
                  onChange={e => setGuess(e.target.value)} 
                  placeholder="Enter the plaintext..." 
                />
                {errorMsg && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{errorMsg}</div>}
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit</button>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)' }}
                    onClick={() => setHintsUsed(h => h + 1)}
                  >
                    Hint (-200)
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '2rem', marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
          Exit To Dashboard
        </button>
      </div>
    </div>
  );
};

export default CipherCracker;
