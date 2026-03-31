import React, { useState } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';

const PUZZLES = {
  Easy: [
    {
      title: "Sum of Array",
      description: "This function tries to sum an array of numbers. However, the loop has a subtle logic flaw causing it to miss an element. Fix it!",
      buggyCode: `function sumArray(arr) {
  let sum = 0;
  for (let i = 1; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}`,
      solution: `function sumArray(arr) {
  let sum = 0;
  // Bug was i=1 instead of i=0
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}`,
      explanation: "Arrays in JavaScript are zero-indexed, meaning the first element is at index 0. Starting the loop at `i = 1` skips the first element, causing the sum to be incorrect.",
      testCases: [{ input: '[1, 2, 3]', expected: 6 }, { input: '[10, -2, 5]', expected: 13 }]
    },
    {
      title: "Max Value",
      description: "This function finds the maximum value in an array. However, it fails in certain edge cases. Fix the flaw!",
      buggyCode: `function findMax(arr) {
  if (arr.length === 0) return null;
  let max = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
}`,
      solution: `function findMax(arr) {
  if (arr.length === 0) return null;
  // Bug was initializing max to 0 instead of the first element
  let max = arr[0];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
}`,
      explanation: "If the array contains only negative numbers, initializing `max = 0` ensures it will wrongly return 0 (which isn't even in the array!). Initializing it to the first item `arr[0]` is safe.",
      testCases: [{ input: '[1, 5, 2]', expected: 5 }, { input: '[-10, -5, -20]', expected: -5 }]
    }
  ],
  Medium: [
    {
      title: "Defective Palindrome Checker",
      description: "Checks if a string is a palindrome. Notice how the array logic bounds are incorrect, causing symmetric letters to not match.",
      buggyCode: `function isPalindrome(str) {
  const cleaned = str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  for (let i = 0; i < cleaned.length / 2; i++) {
    if (cleaned[i] !== cleaned[cleaned.length - i]) {
      return false;
    }
  }
  return true;
}`,
      solution: `function isPalindrome(str) {
  const cleaned = str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  for (let i = 0; i < cleaned.length / 2; i++) {
    if (cleaned[i] !== cleaned[cleaned.length - 1 - i]) {
      return false;
    }
  }
  return true;
}`,
      explanation: "The last character in a string of length N is at index N - 1. So you must compare `cleaned[i]` against `cleaned[cleaned.length - 1 - i]`.",
      testCases: [{ input: '"A man, a plan, a canal: Panama"', expected: true }, { input: '"race a car"', expected: false }]
    },
    {
      title: "Two Sum Target",
      description: "Returns true if there are two unique numbers that add up to the target. It currently has a flaw where it can use the same element twice.",
      buggyCode: `function hasTwoSum(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      if (arr[i] + arr[j] === target) {
        return true;
      }
    }
  }
  return false;
}`,
      solution: `function hasTwoSum(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    // Start j at i+1 to avoid using the same element twice
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] + arr[j] === target) {
        return true;
      }
    }
  }
  return false;
}`,
      explanation: "The nested loop `j = 0` allows the function to sum an element with itself. If the array is [3] and target is 6, it incorrectly returns true `3+3=6`. We must start `j` at `i + 1`.",
      testCases: [{ input: '[[1, 2, 3], 4]', expected: true }, { input: '[[3], 6]', expected: false }]
    }
  ],
  Hard: [
    {
      title: "Valid Parentheses",
      description: "Given a string of brackets, determine if it is valid. There is a deep edge case bug here.",
      buggyCode: `function isValidParentheses(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (let char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      const top = stack.pop();
      if (top !== map[char]) {
        return false;
      }
    }
  }
  return true;
}`,
      solution: `function isValidParentheses(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (let char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      const top = stack.pop();
      if (top !== map[char]) return false;
    }
  }
  // Check if stack is fully empty at the end
  return stack.length === 0;
}`,
      explanation: "If the input string is just `[` or `((`, all characters are pushed to the stack and the loop finishes. The algorithm returned true without checking if the stack had unresolved brackets!",
      testCases: [{ input: '"()[]{}"', expected: true }, { input: '"("', expected: false }, { input: '"([)]"', expected: false }]
    }
  ]
};

const AlgorithmDebugger = () => {
  const [started, setStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('Easy');
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  
  const currentPuzzle = PUZZLES[difficulty][puzzleIdx];
  const [code, setCode] = useState('');
  const [results, setResults] = useState([]);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [failed, setFailed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // Load code when puzzle changes
  React.useEffect(() => {
    if (currentPuzzle) {
      setCode(currentPuzzle.buggyCode);
      setAttempts(0);
      setGameOver(false);
      setFailed(false);
      setResults([]);
      setErrorMsg('');
    }
  }, [currentPuzzle, puzzleIdx, difficulty]);

  const handleRunCode = () => {
    if (attempts >= 3) return;
    
    const currentAttempt = attempts + 1;
    setAttempts(currentAttempt);
    setErrorMsg('');
    const newResults = [];
    let allPassed = true;

    try {
      // Safe function evaluation wrapper for the specific test case payload
      const funcBody = `
        ${code || ''}
        return typeof ${currentPuzzle.buggyCode.split('(')[0].replace('function ', '').trim()} !== 'undefined' ? 
               ${currentPuzzle.buggyCode.split('(')[0].replace('function ', '').trim()} : null;
      `;
      const userFunc = new Function(funcBody)();
      
      if (!userFunc) throw new Error("Function name altered. Please keep the original function name.");

      for (let test of currentPuzzle.testCases) {
        // Evaluate inputs. If it's multiple args (like an array and a target), we parse it differently.
        const parsedInput = JSON.parse(test.input);
        
        let actual;
        // if input is parsed as an array and currentPuzzle is two parameters, we apply it. 
        // For simplicity, our hardcoded inputs are structured so they can be applied correctly.
        if (Array.isArray(parsedInput) && currentPuzzle.title === "Two Sum Target") {
           actual = userFunc(parsedInput[0], parsedInput[1]);
        } else {
           actual = userFunc(parsedInput);
        }
        
        const passed = actual === test.expected;
        if (!passed) allPassed = false;
        
        newResults.push({
          input: test.input,
          expected: test.expected,
          actual: actual,
          passed
        });
      }
      
      setResults(newResults);

      if (allPassed) {
        const base = difficulty === 'Easy' ? 500 : (difficulty === 'Medium' ? 1000 : 2000);
        const finalScore = Math.max(100, base - (attempts * 100));
        setScore(finalScore);
        endGame(finalScore, true);
      } else if (currentAttempt >= 3) {
        endGame(0, false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Syntax or Runtime Error');
      if (currentAttempt >= 3) {
        endGame(0, false);
      }
    }
  };

  const endGame = async (finalScore, isWin) => {
    setGameOver(true);
    setFailed(!isWin);
    try {
      await API.post('/game/score', { game_name: `Algorithm Debugger (${difficulty})`, score: finalScore });
    } catch (err) {
      console.error('Failed to submit score');
    }
  };

  const nextPuzzle = () => {
    if (puzzleIdx + 1 < PUZZLES[difficulty].length) {
      setPuzzleIdx(puzzleIdx + 1);
    } else {
      // Loop back to 0 or advance to Medium etc. We will just loop back in the same difficulty.
      setPuzzleIdx(0);
    }
  };

  if (!started) {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ padding: '3rem', marginTop: '2rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Debugger Rules</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            You will be presented with a continuous flow of logic algorithms that have subtle bugs. <br/>
            Fix the code inside the editor within <strong>3 attempts</strong> per puzzle.<br/>
          </p>
          
          <h3 style={{ marginBottom: '1rem' }}>Select Difficulty:</h3>
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
            Initialize Compiler
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
          {difficulty} Level
        </span>
      </div>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
        {currentPuzzle.description}
      </p>

      {gameOver ? (
        <div className="glass-panel animate-fade-in" style={{ padding: '3rem', textAlign: 'left' }}>
          {failed ? (
            <>
              <h2 className="text-gradient" style={{ fontSize: '2.5rem', color: 'var(--danger-color)' }}>Execution Failed</h2>
              <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>Exceeded 3 attempts limit. Points Awarded: 0</p>
              
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                <h3 style={{ color: 'var(--danger-color)', marginBottom: '0.5rem' }}>Explanation:</h3>
                <p style={{ lineHeight: '1.6' }}>{currentPuzzle.explanation}</p>
              </div>

              <h3 style={{ marginTop: '2rem', color: 'var(--success-color)' }}>Correct Solution:</h3>
              <div style={{ background: '#1d1f21', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                <textarea
                  value={currentPuzzle.solution}
                  readOnly
                  spellCheck={false}
                  style={{
                    width: '100%',
                    fontFamily: '"Fira Code", monospace',
                    fontSize: 14,
                    color: '#10b981',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    minHeight: '200px'
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <h2 className="text-gradient" style={{ fontSize: '2.5rem' }}>Algorithm Patched!</h2>
              <p style={{ fontSize: '1.5rem', margin: '1rem 0' }}>Score: {score} pts</p>
              <p style={{ color: 'var(--text-secondary)' }}>Took {attempts} attempts to fix.</p>
            </>
          )}
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '3rem' }}>
            <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--accent-color)' }} onClick={() => navigate('/')}>
              Exit Run
            </button>
            <button className="btn-primary" onClick={nextPuzzle}>
              Load Next Puzzle
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1rem', background: '#1d1f21', borderRadius: '12px', border: '1px solid #333' }}>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              style={{
                width: '100%',
                fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                fontSize: 14,
                color: '#f8fafc',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                minHeight: '250px'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-primary" onClick={handleRunCode} style={{ background: 'var(--success-color)' }}>
                ▶ Compile & Test
              </button>
              <span style={{ color: attempts >= 2 ? 'var(--danger-color)' : 'var(--text-secondary)' }}>Attempts Left: {3 - attempts}</span>
            </div>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                <strong>Compilation Error:</strong> {errorMsg}
              </div>
            )}

            {results.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Test Results</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {results.map((res, i) => (
                    <div key={i} style={{ 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      background: 'rgba(255,255,255,0.05)',
                      borderLeft: `4px solid ${res.passed ? 'var(--success-color)' : 'var(--danger-color)'}` 
                    }}>
                      <div style={{fontFamily: 'monospace'}}>Input: {res.input}</div>
                      <div>Expected: {res.expected.toString()} | Actual: {res.actual !== undefined ? res.actual.toString() : 'undefined'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

export default AlgorithmDebugger;
