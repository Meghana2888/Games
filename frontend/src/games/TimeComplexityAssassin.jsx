import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const WIN_QUOTES = [
  "System stabilized! You are a master of efficiency.",
  "Run successfully optimized. O(1) performance!",
  "Elite engineering detected. The server is cooling down."
];

const LOSS_QUOTES = [
  "Critical thermal event. Memory overhead exceeded.",
  "System crashed! Your complexity dragged the server down.",
  "O(N!) detected... The datacenter is on fire."
];

const MISSIONS_BANK = {
  Easy: [
    { target: "Linear Search on Sorted Array", slowTime: "O(N)", weapon: "Binary Search", optimalTime: "O(log N)", options: ["Binary Search", "DFS", "Merge Sort", "Insertion Sort"], hint: "Divide and conquer the sorted space!" },
    { target: "Bubble Sort", slowTime: "O(N^2)", weapon: "Merge Sort", optimalTime: "O(N log N)", options: ["Merge Sort", "Quick Select", "Dijkstra", "Radix Sort"], hint: "Halve, sort, and combine." },
    { target: "Finding the Maximum Element", slowTime: "O(N)", weapon: "Max Heap Extraction", optimalTime: "O(1)", options: ["Binary Search", "Max Heap Extraction", "Prim's Algorithm", "BFS"], hint: "A tree structure keeps the largest item at the top." },
    { target: "Nested Loop Duplicate Check", slowTime: "O(N^2)", weapon: "Hash Set", optimalTime: "O(N)", options: ["Hash Set", "Linked List", "Adjacency Matrix", "Queue"], hint: "Constant O(1) lookups." },
    { target: "Array Insert at Index 0", slowTime: "O(N)", weapon: "Linked List Insert", optimalTime: "O(1)", options: ["Linked List Insert", "Stack Push", "Selection Sort", "Binary Search"], hint: "Just rewire the head pointer." }
  ],
  Medium: [
    { target: "Shortest Path (Adjacency Matrix)", slowTime: "O(V^3)", weapon: "Dijkstra (Min-Heap)", optimalTime: "O((V+E) log V)", options: ["Dijkstra (Min-Heap)", "Kruskal", "A* Search", "Floyd-Warshall"], hint: "A greedy approach using priority." },
    { target: "Substring Matching (Naive)", slowTime: "O(N*M)", weapon: "KMP Algorithm", optimalTime: "O(N + M)", options: ["KMP Algorithm", "Binary Search", "Merge Sort", "Tarjan"], hint: "Use a prefix table to avoid redundant comparisons." },
    { target: "Finding Cycles (DFS Recursion Stack)", slowTime: "O(V+E)", weapon: "Union-Find (Disjoint Set)", optimalTime: "O(E alpha(V))", options: ["KMP Algorithm", "Union-Find (Disjoint Set)", "Dijkstra", "Z-Algorithm"], hint: "Track connectedness efficiently." },
    { target: "Find Kth Largest (Sorting)", slowTime: "O(N log N)", weapon: "Quickselect", optimalTime: "O(N)", options: ["Merge Sort", "Binary Search", "Quickselect", "BFS"], hint: "Partition around a pivot without sorting the rest." },
    { target: "Matrix Multiplication (Standard)", slowTime: "O(N^3)", weapon: "Strassen Algorithm", optimalTime: "O(N^2.81)", options: ["Kruskal", "A* Search", "Strassen Algorithm", "Floyd-Warshall"], hint: "Reduce 8 recursive multiplications to 7." }
  ],
  Hard: [
    { target: "All-Pairs Shortest Path (N*Dijkstra)", slowTime: "O(V^3 log V)", weapon: "Floyd-Warshall", optimalTime: "O(V^3)", options: ["Floyd-Warshall", "Bellman-Ford", "Tarjan", "Hopcroft-Karp"], hint: "Dynamic programming for dense graphs." },
    { target: "Minimum Spanning Tree (Dense Graph V^2)", slowTime: "O(E log E)", weapon: "Prim's (Adjacency Matrix)", optimalTime: "O(V^2)", options: ["Kruskal", "Prim's (Adjacency Matrix)", "Dijkstra", "Edmonds-Karp"], hint: "Greedy vertex inclusion works better dense." },
    { target: "Maximum Bipartite Matching (Max Flow)", slowTime: "O(V E^2)", weapon: "Hopcroft-Karp", optimalTime: "O(E sqrt(V))", options: ["Floyd-Warshall", "Hopcroft-Karp", "Bellman-Ford", "KMP Algorithm"], hint: "Augmenting paths with BFS and DFS levels." },
    { target: "Longest Palindromic Boundary (DP)", slowTime: "O(N^2)", weapon: "Manacher's Algorithm", optimalTime: "O(N)", options: ["Z-Algorithm", "KMP Algorithm", "Rabin-Karp", "Manacher's Algorithm"], hint: "Exploit palindrome symmetry centers." },
    { target: "String Pattern Search (Multiple Needles)", slowTime: "O(N * K)", weapon: "Aho-Corasick", optimalTime: "O(N + M + Z)", options: ["Aho-Corasick", "Suffix Tree", "Rabin-Karp", "KMP Algorithm"], hint: "A Trie combined with failure links." }
  ]
};

const checkComplexity = (input, answer) => {
  const normalize = (str) => {
    // Remove all whitespace, lowercase entirely, allowing "o(n)" or "O(N)"
    let stripped = str.replace(/\s+/g, '').toLowerCase();

    // standardize variations (e.g. replace * with missing, etc)
    // we basically just want an exact character match once whitespace is stripped
    return stripped;
  };
  return normalize(input) === normalize(answer);
};

export default function TimeComplexityAssassin() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [active, setActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState('Medium');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [quote, setQuote] = useState("");

  const [missionPool, setMissionPool] = useState([]);
  const [currentMission, setCurrentMission] = useState(null);

  // Two-step combat state
  // 0: Select Weapon (Option Button)
  // 1: Confirm Caliber (Text Input)
  const [combatPhase, setCombatPhase] = useState(0);
  const [complexityInput, setComplexityInput] = useState("");
  const [inputError, setInputError] = useState("");

  // Server Load specific state
  const [systemLoad, setSystemLoad] = useState(0); // 0 to 100
  const loadIntervalRef = useRef(null);

  // Clean up
  useEffect(() => {
    return () => stopLoadTimer();
  }, []);

  // Check Crash
  useEffect(() => {
    if (systemLoad >= 100 && active && !gameOver) {
      handleFail("CRITICAL OVERLOAD: 100% System CPU Exceeded.");
    }
  }, [systemLoad, active, gameOver]);

  const stopLoadTimer = () => {
    if (loadIntervalRef.current) clearInterval(loadIntervalRef.current);
  };

  const startLoadTimer = (baseSpeedModifier) => {
    stopLoadTimer();
    // Frequency of tick
    const tickMs = 100;

    // Difficulty modifier
    let diffMult = difficulty === 'Hard' ? 1.5 : (difficulty === 'Medium' ? 1.0 : 0.6);
    // Level modifier (gets faster as levels go up)
    let levelMult = 1 + (level * 0.1);

    // How much to add per tick
    // Base is 1% every 200ms approx roughly 20 seconds to reach 100%
    const increment = 0.5 * diffMult * levelMult;

    loadIntervalRef.current = setInterval(() => {
      setSystemLoad(prev => {
        const next = prev + increment;
        if (next >= 100) return 100;
        return next;
      });
    }, tickMs);
  };

  const startGame = () => {
    const shuffled = [...MISSIONS_BANK[difficulty]].sort(() => Math.random() - 0.5);
    // each mission option needs shuffling too
    const processed = shuffled.map(m => ({
      ...m,
      options: [...m.options].sort(() => Math.random() - 0.5)
    }));

    setMissionPool(processed);
    setCurrentMission(processed[0]);

    setScore(0);
    setLevel(1);
    setStreak(0);
    setActive(true);
    setGameOver(false);
    setQuote("");
    setCombatPhase(0);
    setComplexityInput("");
    setInputError("");
    setSystemLoad(0);

    startLoadTimer(1.0);
  };

  const getRandomQuote = (isWin) => {
    const arr = isWin ? WIN_QUOTES : LOSS_QUOTES;
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const handleFail = async (reason) => {
    setActive(false);
    setGameOver(true);
    stopLoadTimer();
    setSystemLoad(100);
    setQuote(getRandomQuote(streak >= 5));
    try {
      await API.post('/game/score', { game_name: `Time Complexity Assassin (${difficulty})`, score: score });
    } catch (e) {
      console.error("Score submit failed", e);
    }
  };

  const handlePenalty = () => {
    // Add an instant 15% spike to the system load for a wrong answer
    setSystemLoad(prev => prev + 15);
    setInputError("INVALID TARGET.");
    setTimeout(() => setInputError(""), 1000);
  };

  const handleSelectWeapon = (opt) => {
    if (opt === currentMission.weapon) {
      setCombatPhase(1); // Proceed to input typing
      setInputError("");
      // Drop the load slightly as a reward for moving fast
      setSystemLoad(prev => Math.max(0, prev - 10));
    } else {
      handlePenalty();
    }
  };

  const executeAssassination = (e) => {
    e.preventDefault();
    if (checkComplexity(complexityInput, currentMission.optimalTime)) {
      // SUCCESS!

      // Calculate score based on how fast they killed it (lower load = higher score)
      const loadInverted = 100 - systemLoad;
      const points = 100 + Math.floor(loadInverted * 5) + (level * 25);

      setScore(s => s + points);
      setStreak(s => s + 1);

      const newStreak = streak + 1;
      let newLevel = level;
      if (newStreak % 3 === 0) {
        newLevel += 1;
        setLevel(newLevel);
      }

      // Next Mission
      const nextPool = [...missionPool];
      nextPool.shift();

      if (nextPool.length === 0) {
        const reshuffled = [...MISSIONS_BANK[difficulty]].sort(() => Math.random() - 0.5);
        const processed = reshuffled.map(m => ({ ...m, options: [...m.options].sort(() => Math.random() - 0.5) }));
        setMissionPool(processed);
        setCurrentMission(processed[0]);
      } else {
        setMissionPool(nextPool);
        setCurrentMission(nextPool[0]);
      }

      // Reset
      setCombatPhase(0);
      setComplexityInput("");
      setInputError("");
      setSystemLoad(0);
      startLoadTimer(1.0);

    } else {
      handlePenalty();
    }
  };

  const getLoadColor = () => {
    if (systemLoad < 50) return '#10b981'; // Green
    if (systemLoad < 80) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {(!active && !gameOver) && (
        <div className="glass-panel" style={{ textAlign: 'center', marginTop: '5vh', width: '100%' }}>
          <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ef4444', textShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}>Time Complexity Assassin</h1>
          <p style={{ fontSize: '1.2rem', color: '#cbd5e1', marginBottom: '2rem', lineHeight: '1.6' }}>
            Warning: Wildly inefficient algorithms are currently crashing our remote server! <br />
            Identify the slow process, select the optimal <strong>Assassin Algorithm</strong> to hack it, and type its <strong>Exact Time Complexity</strong> to execute the kill. <br />
            If the System Load hits 100%, we're toasted.
          </p>

          <h3 style={{ marginBottom: '1rem', color: '#f8fafc' }}>Select Danger Level:</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
            {['Easy', 'Medium', 'Hard'].map(lvl => (
              <button
                key={lvl}
                className="btn-primary"
                style={{
                  background: difficulty === lvl ? '#ef4444' : 'rgba(255,255,255,0.1)',
                  fontWeight: difficulty === lvl ? 'bold' : 'normal',
                  border: difficulty === lvl ? 'none' : '1px solid rgba(255,255,255,0.2)'
                }}
                onClick={() => setDifficulty(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button className="btn-primary" style={{ padding: '15px 40px', fontSize: '1.3rem', background: '#3b82f6', boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' }} onClick={startGame}>
            Enter Target Terminal
          </button>
        </div>
      )}

      {active && currentMission && (
        <div style={{ zIndex: 10, width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Header Stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.5)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #333' }}>
            <div>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'block' }}>TARGET ELIMINATION STREAK</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{streak}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'block' }}>SYSTEM LOAD</span>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'monospace', color: getLoadColor(), animation: systemLoad > 80 ? 'pulse 0.5s infinite' : 'none' }}>
                {Math.floor(systemLoad)}%
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'block' }}>BOUNTY SCORE</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{score}</span>
            </div>
          </div>

          {/* Load Bar Visualizer */}
          <div style={{ width: '100%', height: '15px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', marginBottom: '2rem', border: '1px solid #333' }}>
            <div style={{ width: `${systemLoad}%`, height: '100%', background: getLoadColor(), transition: 'width 0.1s linear, background-color 0.3s' }} />
          </div>

          <div className="glass-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '2.5rem' }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <span style={{ color: '#ef4444', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>Target Identified</span>
              <h2 style={{ fontSize: '2.2rem', margin: '0.5rem 0', fontFamily: 'monospace' }}>{currentMission.target}</h2>
              <span style={{ background: '#ef4444', color: '#fff', padding: '4px 12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '1.2rem' }}>Lagging at {currentMission.slowTime}</span>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '12px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

              {combatPhase === 0 ? (
                <>
                  <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#60a5fa' }}>STEP 1: Select Assassin Algorithm</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    {currentMission.options.map((opt, i) => (
                      <button key={i} className="btn-primary" style={{ padding: '1.2rem', fontSize: '1.1rem', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', minHeight: '60px' }} onClick={() => handleSelectWeapon(opt)}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  {inputError && <p style={{ color: '#ef4444', textAlign: 'center', marginTop: '1rem', fontWeight: 'bold', animation: 'shake 0.3s' }}>{inputError} (+15% Load Penalty)</p>}
                </>
              ) : (
                <>
                  <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: '#10b981' }}>STEP 2: Confirm Caliber</h3>
                  <p style={{ textAlign: 'center', color: '#cbd5e1', marginBottom: '2rem' }}>
                    You selected <strong>{currentMission.weapon}</strong>. <br />
                    Type its exact Time Complexity (e.g. <code>O(N)</code>, <code>O(N log N)</code>, <code>O(1)</code>) to execute.
                  </p>

                  <form onSubmit={executeAssassination} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                    <input
                      type="text"
                      autoFocus
                      className="input-field"
                      value={complexityInput}
                      onChange={(e) => setComplexityInput(e.target.value)}
                      placeholder="e.g. O(N log N)"
                      style={{ width: '100%', fontSize: '1.5rem', textAlign: 'center', padding: '15px', fontFamily: 'monospace', textTransform: 'uppercase' }}
                    />
                    <button type="submit" className="btn-primary" style={{ background: '#ef4444', width: '100%', padding: '15px', fontSize: '1.2rem' }}>
                      EXECUTE KILL
                    </button>
                    {inputError && <p style={{ color: '#ef4444', textAlign: 'center', fontWeight: 'bold' }}>{inputError} (+15% Load Penalty)</p>}
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="glass-panel" style={{ textAlign: 'center', marginTop: '5vh', width: '100%', border: `1px solid ${streak >= 5 ? '#10b981' : '#ef4444'}` }}>
          <h2 style={{ fontSize: '3rem', color: streak >= 5 ? '#10b981' : '#ef4444', marginBottom: '1rem', fontFamily: 'monospace' }}>
            {streak >= 5 ? 'SYSTEM SAVED' : 'SYSTEM CRASH'}
          </h2>
          <p style={{ fontSize: '1.3rem', fontStyle: 'italic', marginBottom: '2rem', color: '#cbd5e1' }}>
            &gt; "{quote}"
          </p>
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', display: 'inline-block' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f8fafc' }}>Total Bounty: <strong style={{ color: '#f59e0b' }}>{score}</strong> pts</p>
            <p style={{ color: '#94a3b8' }}>You survived to Level {level} identifying {streak} bottlenecks on {difficulty} mode.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn-primary" style={{ background: '#ef4444' }} onClick={startGame}>
              Reboot & Retry
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '2rem', marginTop: 'auto', display: 'flex', justifyContent: 'center', width: '100%', zIndex: 10 }}>
        <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer' }}>
          Exit To Dashboard
        </button>
      </div>

    </div>
  );
}
