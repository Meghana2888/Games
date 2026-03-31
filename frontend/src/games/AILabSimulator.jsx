import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const SCENARIOS = [
  {
    id: 1,
    title: "Project 1: Spam Filter Prediction",
    description: "Your dataset contains 10,000 text emails with boolean labels (Spam/Not Spam). You need to build a text classifier to run efficiently on an older campus mail server.",
    task: "Select the most appropriate model architecture:",
    options: [
      { text: "Recurrent Neural Network (LSTM)", computeCost: 70, points: 20, feedback: "Overkill! LSTMs drained your compute budget unnecessarily.", optimal: false },
      { text: "Naive Bayes Classifier", computeCost: 10, points: 50, feedback: "Perfect! Naive Bayes is extremely lightweight and standard for basic spam filtering.", optimal: true },
      { text: "Massive Transformer (BERT)", computeCost: 90, points: 10, feedback: "Way too heavy! You used 90% of your compute on a simple text binary classification.", optimal: false }
    ]
  },
  {
    id: 2,
    title: "Project 2: Housing Prices Diagnostics",
    description: "You trained a Deep Decision Tree to predict housing prices. Your evaluation metrics returned the following results:",
    visual: "overfit", // Render custom SVG
    task: "The model memorized the training set but failed to generalize. Diagnose and fix the issue.",
    options: [
      { text: "A: Increase Tree Depth", computeCost: 30, points: -10, feedback: "Wrong! Making the tree deeper caused it to overfit even more.", optimal: false },
      { text: "B: Apply Pruning (Reduce Max Depth)", computeCost: 5, points: 50, feedback: "Correct! Pruning the tree reduced variance and fixed the overfitting issue.", optimal: true },
      { text: "C: Train for 100 More Epochs", computeCost: 50, points: -20, feedback: "Wrong! Over-training a tree just wastes compute and memorizes noise.", optimal: false }
    ]
  },
  {
    id: 3,
    title: "Project 3: Medical Diagnostics",
    description: "You fit a simple Logistic Regression model on a highly complex, non-linear medical imaging dataset. The metrics show:",
    visual: "underfit", // Render custom SVG
    task: "The model is too simple to capture the underlying patterns. How will you resolve this?",
    options: [
      { text: "Add more L2 Regularization (Ridge)", computeCost: 10, points: -10, feedback: "Wrong! Regularization reduces complexity, making the underfitting worse.", optimal: false },
      { text: "Reduce the Dataset Size", computeCost: 5, points: -20, feedback: "Wrong! Removing data never solves underfitting.", optimal: false },
      { text: "Upgrade to a Non-linear Model (e.g. Random Forest)", computeCost: 30, points: 50, feedback: "Correct! You injected needed complexity to map the non-linear boundaries.", optimal: true }
    ]
  },
  {
    id: 4,
    title: "Final Project: Real-time Animal Vision",
    description: "For your capstone, you must deploy an app that classifies 100 distinct animal species from a live smartphone camera feed.",
    task: "Compute is running low. Select your final architecture strategy:",
    options: [
      { text: "Train a CNN from Scratch (ResNet-152 architecture)", computeCost: 80, points: 10, feedback: "You ran out of compute! Training ResNet from scratch takes days.", optimal: false },
      { text: "Use Transfer Learning (Pre-trained MobileNetV2)", computeCost: 20, points: 60, feedback: "Brilliant! Transfer learning on MobileNet saved massive compute and deployed successfully.", optimal: true },
      { text: "K-Nearest Neighbors on Raw Pixels", computeCost: 40, points: 0, feedback: "Terrible idea. KNN on raw image pixels is slow and highly inaccurate.", optimal: false }
    ]
  }
];

const AILabSimulator = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [gameState, setGameState] = useState('intro'); // intro, playing, gameover, victory
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [compute, setCompute] = useState(100);
  const [grade, setGrade] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const startGame = () => {
    setGameState('playing');
    setCompute(100);
    setGrade(0);
    setCurrentScenarioIndex(0);
    setFeedback(null);
  };

  const handleOptionSelect = (option) => {
    const nextCompute = compute - option.computeCost;
    let nextGrade = grade + option.points;

    setCompute(Math.max(0, nextCompute));
    setGrade(nextGrade);
    
    setFeedback({
      text: option.feedback,
      success: option.optimal
    });

    setTimeout(() => {
      setFeedback(null);
      if (nextCompute <= 0) {
        endGame(false, "Out of Compute Power! Your AWS credits expired.");
      } else if (currentScenarioIndex + 1 >= SCENARIOS.length) {
        if (nextGrade >= 120) {
          endGame(true, "Semester Passed! You earned your AI Degree.");
        } else {
          endGame(false, "Academic Probation. Your model accuracy was too low to graduate.");
        }
      } else {
        setCurrentScenarioIndex(prev => prev + 1);
      }
    }, 3000);
  };

  const endGame = async (won, message) => {
    setGameState(won ? 'victory' : 'gameover');
    setFeedback({ text: message, final: true });

    if (won && user) {
      try {
        await API.post('/game/score', {
          game_name: 'AI Lab Simulator',
          score: grade + compute // Bonus points for remaining compute
        });
      } catch (err) {
        console.error('Failed to save AI Lab score:', err);
      }
    }
  };

  // --- Visual Renderers ---
  const renderOverfitChart = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
      <svg width="400" height="200" viewBox="0 0 400 200" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Axes */}
        <line x1="40" y1="170" x2="380" y2="170" stroke="var(--text-secondary)" strokeWidth="2"/>
        <line x1="40" y1="20" x2="40" y2="170" stroke="var(--text-secondary)" strokeWidth="2"/>
        <text x="200" y="190" fill="var(--text-secondary)" fontSize="12" textAnchor="middle">Model Complexity / Epochs</text>
        <text x="15" y="100" fill="var(--text-secondary)" fontSize="12" transform="rotate(-90 15,100)" textAnchor="middle">Error Rate</text>
        
        {/* Training Error: Goes to zero */}
        <path d="M40 100 Q 150 40 380 160" stroke="#10b981" strokeWidth="3" fill="none" />
        <text x="330" y="150" fill="#10b981" fontSize="14" fontWeight="bold">Train Error (1%)</text>
        
        {/* Validation Error: U-Shape Overfit */}
        <path d="M40 110 Q 150 50 250 120 T 380 40" stroke="#ef4444" strokeWidth="3" fill="none" strokeDasharray="5,5"/>
        <text x="300" y="30" fill="#ef4444" fontSize="14" fontWeight="bold">Validation Error (45%)</text>
      </svg>
    </div>
  );

  const renderUnderfitChart = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
      <svg width="400" height="200" viewBox="0 0 400 200" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Axes */}
        <line x1="40" y1="170" x2="380" y2="170" stroke="var(--text-secondary)" strokeWidth="2"/>
        <line x1="40" y1="20" x2="40" y2="170" stroke="var(--text-secondary)" strokeWidth="2"/>
        <text x="200" y="190" fill="var(--text-secondary)" fontSize="12" textAnchor="middle">Model Complexity / Epochs</text>
        
        {/* Both errors high and parallel */}
        <path d="M40 50 L 380 70" stroke="#10b981" strokeWidth="3" fill="none" />
        <text x="280" y="60" fill="#10b981" fontSize="14" fontWeight="bold">Train Error (45%)</text>
        
        <path d="M40 40 L 380 50" stroke="#ef4444" strokeWidth="3" fill="none" strokeDasharray="5,5"/>
        <text x="280" y="35" fill="#ef4444" fontSize="14" fontWeight="bold">Validation Error (47%)</text>
      </svg>
    </div>
  );

  if (gameState === 'intro') {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '800px', width: '100%', padding: '4rem 3rem', textAlign: 'center' }}>
          <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '1.5rem', textShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}>AI Lab Simulator</h1>
          <p style={{ fontSize: '1.3rem', color: '#cbd5e1', marginBottom: '3rem', lineHeight: '1.6' }}>
            Welcome to the Applied Machine Learning Lab. Your semester grade depends on selecting the most optimal algorithm architectures and diagnosing faulty models.
            <br/><br/>
            <strong>Beware:</strong> You are on an academic AWS tier with limited <strong style={{color: '#f59e0b'}}>Compute Power</strong>. Training massive deep learning models for simple tasks will bankrupt your credits and fail your semester!
          </p>
          <button className="btn-primary" style={{ fontSize: '1.5rem', padding: '15px 50px', background: 'var(--success-color)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }} onClick={startGame}>
            Enroll in Course
          </button>
        </div>
        
        <div style={{ padding: '2rem', marginTop: '3rem' }}>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer' }}>
            Exit To Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover' || gameState === 'victory') {
    return (
      <div className="game-container animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '4rem 3rem', textAlign: 'center', border: `1px solid ${gameState === 'victory' ? '#10b981' : '#ef4444'}` }}>
          <h1 style={{ fontSize: '3.5rem', color: gameState === 'victory' ? 'var(--success-color)' : 'var(--danger-color)', marginBottom: '1rem', fontFamily: 'monospace' }}>
            {gameState === 'victory' ? 'SEMESTER PASSED!' : 'SEMESTER FAILED'}
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>{feedback?.text}</p>
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '2rem', borderRadius: '12px', margin: '2rem 0', display: 'inline-block' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f8fafc' }}>Final AI Grade: <strong style={{ color: '#10b981', fontSize: '2rem' }}>{grade}</strong> pts</p>
            <p style={{ fontSize: '1.2rem', color: '#f8fafc' }}>Remaining Compute: <strong style={{ color: '#f59e0b', fontSize: '1.5rem' }}>{compute}%</strong></p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button className="btn-primary" style={{ padding: '15px 30px', fontSize: '1.2rem', background: gameState === 'victory' ? 'var(--success-color)' : 'var(--danger-color)' }} onClick={startGame}>
              Re-take Semester
            </button>
          </div>
        </div>

        <div style={{ padding: '2rem', marginTop: '2rem' }}>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer' }}>
            Exit To Dashboard
          </button>
        </div>
      </div>
    );
  }

  const scenario = SCENARIOS[currentScenarioIndex];

  return (
    <div className="game-container animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', minHeight: '100vh', alignItems: 'center' }}>
      
      {/* Top Banner Dashboard */}
      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'rgba(0,0,0,0.5)', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid #333' }}>
        <div>
          <span style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Academic Timeline</span>
          <h2 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Project {currentScenarioIndex + 1} / {SCENARIOS.length}</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '3rem' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'block' }}>COURSE GRADE</span>
            <span style={{ fontWeight: 'bold', fontSize: '1.8rem', color: '#10b981' }}>{grade} pts</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'block' }}>REMAINING COMPUTE</span>
            <span style={{ fontWeight: 'bold', fontSize: '1.8rem', fontFamily: 'monospace', color: compute < 30 ? 'var(--danger-color)' : '#f59e0b', animation: compute < 30 ? 'pulse 0.5s infinite' : 'none' }}>
              {compute}%
            </span>
            <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '5px' }}>
               <div style={{ width: `${compute}%`, height: '100%', background: compute < 30 ? 'var(--danger-color)' : '#f59e0b', transition: 'width 0.3s ease' }}/>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '1000px', flexGrow: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* Disable interactiveness while feedback is showing */}
        {feedback && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.8)', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', padding: '2rem', textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '2.5rem', color: feedback.success ? 'var(--success-color)' : 'var(--danger-color)', marginBottom: '1rem' }}>
              {feedback.success ? 'Excellent Choice!' : 'Critical Error!'}
            </h2>
            <p style={{ fontSize: '1.5rem', color: 'white', maxWidth: '600px', lineHeight: '1.5' }}>{feedback.text}</p>
          </div>
        )}

        <h3 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>{scenario.title}</h3>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>{scenario.description}</p>
        
        {scenario.visual === 'overfit' && renderOverfitChart()}
        {scenario.visual === 'underfit' && renderUnderfitChart()}

        <p style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f8fafc' }}>Target: {scenario.task}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1, justifyContent: 'center' }}>
          {scenario.options.map((option, index) => (
             <button 
               key={index} 
               onClick={() => handleOptionSelect(option)}
               className="btn-primary" 
               style={{ 
                 display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                 padding: '1.5rem 2rem', fontSize: '1.2rem', textAlign: 'left',
                 background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'
               }}
             >
               <span style={{ flex: 1, paddingRight: '2rem' }}>{option.text}</span>
               <span style={{ 
                 background: 'rgba(0,0,0,0.4)', padding: '8px 15px', borderRadius: '4px', 
                 fontSize: '0.9rem', color: '#f59e0b', fontFamily: 'monospace', fontWeight: 'bold',
                 minWidth: '120px', textAlign: 'center'
               }}>
                 -{option.computeCost}% Compute
               </span>
             </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '2rem', marginTop: 'auto', display: 'flex', justifyContent: 'center', width: '100%', zIndex: 10 }}>
        <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '15px 40px', fontSize: '1.2rem', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer' }}>
          Drop Course & Exit
        </button>
      </div>

    </div>
  );
};

export default AILabSimulator;
