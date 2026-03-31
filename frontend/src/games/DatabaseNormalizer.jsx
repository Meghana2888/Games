import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const PUZZLES_BANK = {
  Easy: [
    { 
      type: 'split', nf: '1NF', title: "Atomicity Breach", 
      description: "This table violates First Normal Form (1NF) because 'Phone_Numbers' contains multiple comma-separated values for a single student. Select the exact columns that must be extracted to form a new, dedicated junction table to satisfy 1NF.",
      originalTable: ['StudentID (PK)', 'Name', 'Phone_Numbers'],
      targetCols: ['StudentID (PK)', 'Phone_Numbers'],
      explanation: "1NF requires each attribute to be atomic. 'Phone_Numbers' contains comma-separated lists, so it must be extracted into a new table linking the primary key 'StudentID' to individual phone numbers." 
    },
    { 
      type: 'multiple-choice', nf: '1NF', title: "Repeating Column Groups", 
      description: "You have a table containing: StudentID, Class1, Class2, Class3. How do you correctly normalize this to 1NF?", 
      options: ["A: Combine them into a single 'Classes' column separated by commas", "B: Create a new Enrollments(StudentID, Class) table", "C: Keep it as is since the maximum classes is fixed at 3"], 
      answerIndex: 1, 
      explanation: "Repeating column groups (Class1, Class2...) violate 1NF because they hardcode relationships. Creating a separate 1-to-many junction table (Enrollments) is the proper 1NF standard." 
    },
    { 
      type: 'split', nf: '1NF', title: "Composite Address Field", 
      description: "The 'FullAddress' column holds 'Street, City, Zipcode'. Technically this breaks atomicity. Which columns would you select to extract so you can begin breaking it down?", 
      originalTable: ['EmpID (PK)', 'FullAddress', 'Salary'], 
      targetCols: ['EmpID (PK)', 'FullAddress'], 
      explanation: "To strictly normalize a composite attribute like FullAddress, it should be extracted and completely broken down into discrete atomic columns (Street, City, State, Zip) if it is causing data mining anomalies." 
    }
  ],
  Medium: [
    { 
      type: 'split', nf: '2NF', title: "Partial Dependencies", 
      description: "The Primary Key is composite: (EnrollmentID, CourseID). However, 'CourseName' and 'Credits' depend ONLY on 'CourseID', not the entire key. Select the columns to extract into a dedicated 'Courses' table to satisfy 2NF.",
      originalTable: ['EnrollmentID (PK)', 'CourseID (PK)', 'Grade', 'CourseName', 'Credits'],
      targetCols: ['CourseID (PK)', 'CourseName', 'Credits'],
      explanation: "2NF strictly prohibits partial dependencies. Because 'CourseName' and 'Credits' rely only on 'CourseID' (half of the composite key), they must be extracted into their own Courses table." 
    },
    { 
      type: 'multiple-choice', nf: '3NF', title: "The Transitive Trap", 
      description: "We are given the universal table Employees(EmpID (PK), Name, DeptID, DeptName). `DeptName` depends dynamically on `DeptID`, which is not a primary key. Which schema successfully enforces 3NF?",
      options: [
        "A: Employees(EmpID, Name, DeptID, DeptName)",
        "B: Employees(EmpID, Name) INNER JOIN Departments(DeptID)",
        "C: Employees(EmpID, Name, DeptID) AND Departments(DeptID, DeptName)",
        "D: Employees(EmpID, Name, DeptName) AND Departments(DeptName, DeptID)"
      ],
      answerIndex: 2,
      explanation: "3NF demands no transitive dependencies. Because 'DeptName' relies on a non-key attribute ('DeptID'), it must be separated into a distinct 'Departments' lookup table, leaving 'DeptID' as a Foreign Key in Employees." 
    },
    { 
      type: 'split', nf: '3NF', title: "Redundant Order Detail", 
      description: "Orders(OrderID (PK), CustomerID, CustomerEmail, OrderDate). CustomerEmail changes predictably whenever CustomerID changes. This is a classic 3NF violation. Extract the columns necessary to isolate this transitive dependency.", 
      originalTable: ['OrderID (PK)', 'CustomerID', 'CustomerEmail', 'OrderDate'], 
      targetCols: ['CustomerID', 'CustomerEmail'], 
      explanation: "CustomerEmail is wholly dependent on the non-key attribute CustomerID, not the OrderID. Extracting them into a discrete Customers table satisfies 3NF and prevents update anomalies." 
    }
  ],
  Hard: [
    { 
      type: 'split', nf: 'BCNF', title: "Boyce-Codd Violator", 
      description: "A student can have multiple tutors, but each tutor only teaches one subject. The Primary Key is (Student, Subject). 'Tutor' fully determines 'Subject', but 'Tutor' is NOT a candidate key! Split this table to strictly achieve BCNF.",
      originalTable: ['Student (PK)', 'Subject (PK)', 'Tutor'],
      targetCols: ['Tutor', 'Subject'],
      explanation: "In BCNF, every determinant must be a candidate key! 'Tutor' determines 'Subject', yet it is not a primary key. It must be brutally isolated into a Tutor(Tutor (PK), Subject) table to fix the anomaly." 
    },
    { 
      type: 'multiple-choice', nf: '4NF', title: "Multi-valued Anomaly", 
      description: "A Professor teaches multiple Subjects, and uses multiple independent Tools for each. Prof(ProfID, Subject, Tool). There is no direct relationship between Subject and Tool. Which schema satisfies 4NF?",
      options: [
        "A: Prof_Subjects(ProfID, Subject) AND Prof_Tools(ProfID, Tool)",
        "B: Prof_Master(ProfID, Subject, Tool)",
        "C: Prof(ProfID) AND Tools(Subject, Tool)",
        "D: Prof(ProfID, Tool) AND Subjects(Subject, Tool)"
      ],
      answerIndex: 0,
      explanation: "4NF dictates that independent multi-valued facts (Subjects taught vs Tools used) must be completely isolated in their own individual tables to prevent catastrophic Cartesian cross-product anomalies." 
    },
    { 
      type: 'split', nf: 'BCNF', title: "Overlapping Keys", 
      description: "A clinic schedule uses (Doctor, Time) OR (Room, Time) as overlapping candidate keys. But 'Doctor' inherently determines 'Room'. Split the table to achieve flawless BCNF.", 
      originalTable: ['Time (PK)', 'Doctor (PK)', 'Room', 'Patient'], 
      targetCols: ['Doctor', 'Room'], 
      explanation: "Because Doctor determines Room, 'Doctor' acts as a determinant but is not a complete candidate key. Extracting (Doctor, Room) forcefully resolves the BCNF constraint." 
    }
  ]
};

export default function DatabaseNormalizer() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [failed, setFailed] = useState(false);
  const [score, setScore] = useState(0);

  const [difficulty, setDifficulty] = useState('Medium');
  const [puzzlePool, setPuzzlePool] = useState([]);
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  
  // State for split game mode
  const [selectedCols, setSelectedCols] = useState([]);

  // Get current puzzle
  const currentPuzzle = puzzlePool[puzzleIdx];

  const startGame = () => {
    // Deep shuffle the selected difficulty
    const shuffled = [...PUZZLES_BANK[difficulty]].sort(() => Math.random() - 0.5);
    // Shuffle options for multiple choice if they exist
    const processed = shuffled.map(p => {
      if (p.type === 'multiple-choice') {
        const trueAnswer = p.options[p.answerIndex];
        const newOpts = [...p.options].sort(() => Math.random() - 0.5);
        const newAnsIdx = newOpts.indexOf(trueAnswer);
        return { ...p, options: newOpts, answerIndex: newAnsIdx };
      }
      return p;
    });

    setPuzzlePool(processed);
    setStarted(true);
    setGameOver(false);
    setFailed(false);
    setScore(0);
    setPuzzleIdx(0);
    setAttemptsLeft(3);
    setSelectedCols([]);
  };

  const submitScore = async (finalScore) => {
    try {
      await API.post('/game/score', { game_name: `Database Normalizer (${difficulty})`, score: finalScore });
    } catch (e) {
      console.error("Score submit failed", e);
    }
  };

  const handleFail = () => {
    setGameOver(true);
    setFailed(true);
    submitScore(score);
  };

  const handleWin = (finalScore) => {
    setGameOver(true);
    setFailed(false);
    submitScore(finalScore);
  };

  const checkSplitAnswer = () => {
    if (!currentPuzzle.targetCols) return;
    
    const sortedSelected = [...selectedCols].sort();
    const sortedTarget = [...currentPuzzle.targetCols].sort();

    const isCorrect = sortedSelected.length === sortedTarget.length && 
                      sortedSelected.every((val, index) => val === sortedTarget[index]);

    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer();
    }
  };

  const checkChoiceAnswer = (idx) => {
    if (idx === currentPuzzle.answerIndex) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer();
    }
  };

  const handleCorrectAnswer = () => {
    const points = 500 + (attemptsLeft * 200);
    const newScore = score + points;
    setScore(newScore);

    if (puzzleIdx + 1 < puzzlePool.length) {
      setPuzzleIdx(puzzleIdx + 1);
      setAttemptsLeft(3);
      setSelectedCols([]);
    } else {
      handleWin(newScore + 1000); // 1000 completion bonus
    }
  };

  const handleIncorrectAnswer = () => {
    if (attemptsLeft <= 1) {
      setAttemptsLeft(0);
      handleFail();
    } else {
      setAttemptsLeft(prev => prev - 1);
    }
  };

  const toggleCol = (colStr) => {
    setSelectedCols(prev => {
      if (prev.includes(colStr)) {
        return prev.filter(c => c !== colStr);
      }
      return [...prev, colStr];
    });
  };

  if (!started) {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ padding: '3rem', marginTop: '5vh', width: '100%' }}>
          <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '1rem', color: '#10b981' }}>Database Normalizer</h1>
          <p style={{ fontSize: '1.2rem', color: '#cbd5e1', marginBottom: '2rem', lineHeight: '1.6' }}>
            Act as the Lead Database Architect. <br/>
            Analyze severely unnormalized schema fragments and enforce strict structural integrity!
          </p>

          <div style={{ padding: '25px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '2rem', textAlign: 'left' }}>
            <h3 style={{ color: '#f59e0b', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>🕹️ How To Play:</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', lineHeight: '1.8' }}>
              <li style={{ marginBottom: '10px' }}><strong>Split Puzzles:</strong> You will see a table simulation. Click the column headers (turning them green) that must be extracted to a new table to solve the specified Normal Form violation!</li>
              <li style={{ marginBottom: '10px' }}><strong>Multiple Choice:</strong> For complex abstract structures, click the correct schematic layout that resolves the transitive anomaly.</li>
              <li style={{ marginBottom: '10px' }}><strong>Relaxed Mechanics:</strong> There are NO time limits. Use pure logical deduction.</li>
              <li><strong>Database Corruption:</strong> You only have <strong style={{ color: '#ef4444' }}>3 Attempts</strong> per level. Failing 3 times crashes the system!</li>
            </ul>
          </div>

          <h3 style={{ marginBottom: '1rem', color: '#f8fafc' }}>Select Architect Difficulty:</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
            {['Easy', 'Medium', 'Hard'].map(lvl => (
              <button 
                key={lvl}
                className="btn-primary" 
                style={{ 
                  background: difficulty === lvl ? '#10b981' : 'rgba(255,255,255,0.1)',
                  fontWeight: difficulty === lvl ? 'bold' : 'normal',
                  border: difficulty === lvl ? 'none' : '1px solid rgba(255,255,255,0.2)'
                }}
                onClick={() => setDifficulty(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button className="btn-primary" style={{ padding: '15px 40px', fontSize: '1.3rem', background: '#3b82f6', width: '100%', maxWidth: '300px' }} onClick={startGame}>
            Initialize Architecture
          </button>
        </div>

        <div style={{ padding: '2rem', marginTop: 'auto', display: 'flex', justifyContent: 'center', width: '100%' }}>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
            Exit To Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'rgba(0,0,0,0.4)', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid #333' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#3b82f6', color: '#fff', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold' }}>
            Schema {puzzleIdx + 1} / {puzzlePool.length}
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f8fafc' }}>{currentPuzzle.title}</span>
        </div>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>TARGET</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>{currentPuzzle.nf}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>ATTEMPTS LEFT</span>
            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '5px' }}>
              {[1, 2, 3].map(n => (
                <div key={n} style={{ width: '15px', height: '15px', borderRadius: '50%', background: n <= attemptsLeft ? '#10b981' : '#ef4444' }} />
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>SCORE</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{score}</span>
          </div>
        </div>
      </div>

      {!gameOver ? (
        <div className="glass-panel" style={{ flexGrow: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '2.5rem', color: '#cbd5e1' }}>
            {currentPuzzle.description}
          </p>

          {currentPuzzle.type === 'split' && (
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', marginBottom: '2rem', overflowX: 'auto', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                  <thead>
                    <tr>
                      {currentPuzzle.originalTable.map((col, idx) => {
                        const isSelected = selectedCols.includes(col);
                        return (
                          <th 
                            key={idx} 
                            onClick={() => toggleCol(col)}
                            title="Click to queue for extraction"
                            style={{ 
                              padding: '1.5rem', 
                              cursor: 'pointer', 
                              border: `2px solid ${isSelected ? '#10b981' : '#333'}`, 
                              background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                              color: isSelected ? '#10b981' : '#f8fafc',
                              fontSize: '1.1rem',
                              transition: 'all 0.2s ease',
                              userSelect: 'none'
                            }}
                          >
                            {col}
                            {isSelected && <div style={{ fontSize: '0.8rem', marginTop: '10px' }}>Extracting...</div>}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {currentPuzzle.originalTable.map((col, idx) => (
                        <td key={idx} style={{ padding: '1rem', borderTop: '1px solid #333', color: '#64748b' }}>[Data Instance]</td>
                      ))}
                    </tr>
                    <tr>
                      {currentPuzzle.originalTable.map((col, idx) => (
                        <td key={idx} style={{ padding: '1rem', borderTop: '1px solid #222', color: '#64748b' }}>[Data Instance]</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <button 
                className="btn-primary" 
                onClick={checkSplitAnswer}
                disabled={selectedCols.length === 0}
                style={{ 
                  padding: '15px 40px', 
                  fontSize: '1.3rem', 
                  marginTop: 'auto',
                  background: selectedCols.length === 0 ? 'var(--text-secondary)' : '#3b82f6',
                  boxShadow: selectedCols.length > 0 ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none',
                  cursor: selectedCols.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Extract Selected Columns to New Table
              </button>
            </div>
          )}

          {currentPuzzle.type === 'multiple-choice' && (
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentPuzzle.options.map((opt, idx) => (
                <button 
                  key={idx} 
                  className="btn-primary" 
                  onClick={() => checkChoiceAnswer(idx)}
                  style={{ 
                    padding: '1.5rem', 
                    fontSize: '1.2rem', 
                    textAlign: 'left', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid #333',
                    fontFamily: 'monospace'
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

        </div>
      ) : (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', border: `1px solid ${failed ? '#ef4444' : '#10b981'}` }}>
          <h2 style={{ fontSize: '3rem', color: failed ? '#ef4444' : '#10b981', marginBottom: '1rem' }}>
            {failed ? 'Database Anomalies Detected (Game Over)' : 'Architecture Fully Normalized!'}
          </h2>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '12px', display: 'inline-block', marginBottom: '2rem', width: '100%' }}>
            <p style={{ fontSize: '1.5rem', color: '#cbd5e1' }}>Final Architecture Grade:</p>
            <p style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#f59e0b', margin: '1rem 0' }}>{score} pts</p>
            
            {failed && currentPuzzle && (
              <div style={{ marginTop: '2rem', padding: '1.5rem', borderTop: '1px solid #333', textAlign: 'left' }}>
                <h4 style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '1.3rem' }}>Mission Failed: {currentPuzzle.title}</h4>
                <p style={{ color: '#cbd5e1', fontSize: '1.1rem', marginBottom: '1rem', lineHeight: '1.6' }}>
                  <strong>Correct Approach:</strong> {currentPuzzle.explanation}
                </p>
                {currentPuzzle.type === 'split' && (
                  <p style={{ color: '#10b981', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                    Columns that needed extraction: [ {currentPuzzle.targetCols.join(', ')} ]
                  </p>
                )}
                {currentPuzzle.type === 'multiple-choice' && (
                  <p style={{ color: '#10b981', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                    Correct Schema: {currentPuzzle.options[currentPuzzle.answerIndex]}
                  </p>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn-primary" style={{ background: '#3b82f6' }} onClick={startGame}>
              Start Fresh Schema Assessment
            </button>
            <button className="btn-primary" style={{ border: '1px solid var(--danger-color)', background: 'transparent' }} onClick={() => navigate('/')}>
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Footer controls during active game */}
      {!gameOver && (
        <div style={{ padding: '2rem 0', marginTop: 'auto', display: 'flex', justifyContent: 'center', width: '100%' }}>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer' }}>
            Abort Extraction
          </button>
        </div>
      )}

    </div>
  );
}
