import React, { useState } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';

const PUZZLES = {
  Easy: [
    {
      title: "Python 101",
      language: "python",
      description: "A simple Python script to check if a number is positive. Find the single syntax error.",
      buggyCode: `1 | def check_positive(num):
2 |     if num > 0
3 |         print("Positive")
4 |     else:
5 |         print("Negative or Zero")`,
      bugLine: "2",
      correctedPattern: /if\\s+num\\s*>\\s*0\\s*:/, // "if num > 0:"
      solution: "if num > 0:",
      explanation: "In Python, condition statements like 'if', 'else', 'elif', 'for', and 'while' must always end with a colon (:). Line 2 was missing this colon."
    },
    {
      title: "C Semicolons",
      language: "c",
      description: "A basic C program that assigns a variable and prints it. The compiler is throwing a fit.",
      buggyCode: `1 | #include <stdio.h>
2 | 
3 | int main() {
4 |     int x = 5
5 |     printf("%d", x);
6 |     return 0;
7 | }`,
      bugLine: "4",
      correctedPattern: /int\\s+x\\s*=\\s*5\\s*;/,
      solution: "int x = 5;",
      explanation: "In C, almost all statements must be explicitly terminated with a semicolon (;). Line 4 left it off!"
    }
  ],
  Medium: [
    {
      title: "Java Execution Context",
      language: "java",
      description: "This basic Java program is supposed to print 'Hello World', but it will not compile or run correctly.",
      buggyCode: `1 | public class Main {
2 |     public void main(String[] args) {
3 |         System.out.println("Hello World");
4 |     }
5 | }`,
      bugLine: "2",
      correctedPattern: /public\\s+static\\s+void\\s+main\\s*\\(\\s*String\\s*\\[\\s*\\]\\s*args\\s*\\)/,
      solution: "public static void main(String[] args) {",
      explanation: "In Java, the main entry point to a program must evaluate in a 'static' context so the JVM can execute it without creating an instance of the class first. It must be 'public static void main'."
    },
    {
      title: "Python Type Casting",
      language: "python",
      description: "A Python script designed to square a number provided by standard input. Why does it crash at runtime?",
      buggyCode: `1 | user_input = input("Enter a number: ")
2 | 
3 | def square_number(n):
4 |     return n * n
5 | 
6 | print(square_number(user_input))`,
      bugLine: "6", // Or line 1, but let's accept changing line 6
      correctedPattern: /print\\s*\\(\\s*square_number\\s*\\(\\s*in?t\\s*\\(\\s*user_input\\s*\\)\\s*\\)\\s*\\)/,
      solution: "print(square_number(int(user_input)))",
      explanation: "The input() function in Python strictly returns a String! When you try to multiply a string by a string (n * n), Python crashes with a TypeError. You must cast it to an int() first!"
    }
  ],
  Hard: [
    {
      title: "C Pointer Segfault",
      language: "c",
      description: "A C program that asks the user for their age. It compiles, but crashes with a Segmentation Fault 11 during execution.",
      buggyCode: `1 | #include <stdio.h>
2 | 
3 | int main() {
4 |     int age;
5 |     printf("Enter age: ");
6 |     scanf("%d", age);
7 |     printf("You are %d", age);
8 |     return 0;
9 | }`,
      bugLine: "6",
      correctedPattern: /scanf\\s*\\(\\s*"%d"\\s*,\\s*&age\\s*\\)\\s*;/,
      solution: 'scanf("%d", &age);',
      explanation: "The scanf function requires memory addresses (pointers) to assign values back to the variables! 'age' passes the uninitialized value of age rather than the memory location '&age', corrupting memory and causing a segfault."
    },
    {
      title: "Java Array Boundaries",
      language: "java",
      description: "A Java loop attempting to sum up an array. An exception is thrown deep within the JVM.",
      buggyCode: `1 | public int sumArray(int[] arr) {
2 |     int sum = 0;
3 |     for (int i = 0; i <= arr.length; i++) {
4 |         sum += arr[i];
5 |     }
6 |     return sum;
7 | }`,
      bugLine: "3",
      correctedPattern: /for\\s*\\(\\s*int\\s+i\\s*=\\s*0\\s*;\\s*i\\s*<\\s*arr\\.length\\s*;\\s*i\\+\\+\\s*\\)\\s*\\{?/,
      solution: "for (int i = 0; i < arr.length; i++) {",
      explanation: "Arrays in Java are exactly sized. The loop condition is 'i <= arr.length', meaning the final pass attempts to read at exactly 'arr.length', throwing an ArrayIndexOutOfBoundsException! It should be strictly less than (<)."
    }
  ]
};

const SyntaxSleuth = () => {
  const [started, setStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('Easy');
  const [puzzleIdx, setPuzzleIdx] = useState(0);

  const currentPuzzle = PUZZLES[difficulty][puzzleIdx];

  const [lineGuess, setLineGuess] = useState('');
  const [codeGuess, setCodeGuess] = useState('');
  
  const [attempts, setAttempts] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [failed, setFailed] = useState(false);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();

  // Reset state when puzzle changes
  React.useEffect(() => {
    if (currentPuzzle) {
      setLineGuess('');
      setCodeGuess('');
      setAttempts(0);
      setGameOver(false);
      setFailed(false);
      setErrorMsg('');
      setScore(0);
    }
  }, [currentPuzzle, puzzleIdx, difficulty]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (attempts >= 3) return;

    setErrorMsg('');
    const currentAttempt = attempts + 1;
    setAttempts(currentAttempt);

    // Validate
    const trimmedLine = lineGuess.trim();
    if (trimmedLine !== currentPuzzle.bugLine) {
      return triggerFail(currentAttempt, "Line identification incorrect.");
    }

    // Checking regular expression
    const isCodeMatch = currentPuzzle.correctedPattern.test(codeGuess.trim());

    if (isCodeMatch) {
      const base = difficulty === 'Easy' ? 500 : (difficulty === 'Medium' ? 1000 : 2000);
      const finalScore = Math.max(100, base - (currentAttempt * 100));
      setScore(finalScore);
      endGame(finalScore, true);
    } else {
      triggerFail(currentAttempt, "Code correction logic incorrect.");
    }
  };

  const triggerFail = (currentAttempt, reason) => {
    if (currentAttempt >= 3) {
      endGame(0, false);
    } else {
      setErrorMsg(`Compilation Failed: ${reason} (${3 - currentAttempt} attempts left)`);
    }
  };

  const endGame = async (finalScore, isWin) => {
    setGameOver(true);
    setFailed(!isWin);
    try {
      await API.post('/game/score', { game_name: `Syntax Sleuth (${difficulty})`, score: finalScore });
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

  const safeHighlight = (text, languageType) => {
    try {
      if (Prism.languages[languageType]) {
        return Prism.highlight(text, Prism.languages[languageType], languageType);
      }
      return text;
    } catch {
      return text;
    }
  };

  if (!started) {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ padding: '3rem', marginTop: '2rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Syntax Sleuth HQ</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            We've intercepted malfunctioning scripts written in C, Java, and Python.<br/><br/>
            <strong>Rules:</strong><br/>
            1. Read the code and locate the single line throwing compilation/runtime errors.<br/>
            2. Enter the faulty <strong>Line Number</strong>.<br/>
            3. Enter the <strong>Exact Corrected Code</strong> for that line to patch it.<br/>
            4. You have 3 attempts per script.
          </p>

          <h3 style={{ marginBottom: '1rem' }}>Select Compiler Level:</h3>
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
            Start Debugging
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
        <span style={{ padding: '4px 12px', background: 'var(--accent-color)', borderRadius: '12px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
          {currentPuzzle.language} | {difficulty}
        </span>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{currentPuzzle.description}</p>
      
      {gameOver ? (
        <div className="glass-panel animate-fade-in" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
          {failed ? (
            <>
              <h2 className="text-gradient" style={{ fontSize: '2.5rem', color: 'var(--danger-color)' }}>Patch Failed</h2>
              <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>Compiler crashed. Points Awarded: 0</p>
              
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem', textAlign: 'left' }}>
                <h3 style={{ color: 'var(--danger-color)', marginBottom: '0.5rem' }}>Compiler Diagnostic:</h3>
                <p style={{ lineHeight: '1.6' }}>{currentPuzzle.explanation}</p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '12px', marginTop: '1rem', textAlign: 'left' }}>
                <h3 style={{ color: 'var(--success-color)', marginBottom: '1rem' }}>The Corrected Line Was:</h3>
                <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', background: '#000', padding: '15px', color: '#10b981' }}>
                  {currentPuzzle.bugLine} | {currentPuzzle.solution}
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-gradient" style={{ fontSize: '2.5rem' }}>Bug Squashed!</h2>
              <p style={{ fontSize: '1.5rem', margin: '1rem 0' }}>Syntax confirmed. Network stable.</p>
              <p style={{ color: 'var(--success-color)', fontSize: '1.2rem' }}>Score Awarded: {score} pts</p>
            </>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '3rem' }}>
            <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--accent-color)' }} onClick={() => navigate('/')}>
              Exit Terminal
            </button>
            <button className="btn-primary" onClick={nextPuzzle}>
              Load Next File
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', background: '#1d1f21', borderRadius: '12px', border: '1px solid #333' }}>
            <textarea
              value={currentPuzzle.buggyCode}
              readOnly
              spellCheck={false}
              style={{
                width: '100%',
                fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                fontSize: 16,
                color: '#f8fafc',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                minHeight: '250px'
              }}
            />
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Submit Patch (Attempts: {3 - attempts} left)</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: '0 0 100px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Line #</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={lineGuess} 
                    onChange={e => setLineGuess(e.target.value)} 
                    placeholder="E.g. 4" 
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Corrected Code</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={codeGuess} 
                    onChange={e => setCodeGuess(e.target.value)} 
                    placeholder="Type the exact fixed line..." 
                    required
                    style={{ fontFamily: '"Fira Code", monospace' }}
                  />
                </div>
              </div>

              {errorMsg && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{errorMsg}</div>}
              
              <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', background: 'var(--success-color)', minWidth: '150px' }}>
                Execute Patch
              </button>
            </form>
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

export default SyntaxSleuth;
