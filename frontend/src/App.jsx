import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { AudioProvider, AudioContext } from './context/AudioContext';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import EmojiMemory from './games/EmojiMemory';
import SpeedTypist from './games/SpeedTypist';
import AngryChicken from './games/AngryChicken';
import ColorMixing from './games/ColorMixing';
import WrongAnswer from './games/WrongAnswer';
import TimeEcho from './games/TimeEcho';
import EscapeRoom from './games/EscapeRoom';
import PatternMaster from './games/PatternMaster';
import VisualPuzzle from './games/VisualPuzzle';
import AlgorithmDebugger from './games/AlgorithmDebugger';
import CipherCracker from './games/CipherCracker';
import SyntaxSleuth from './games/SyntaxSleuth';
import CircuitLogic from './games/CircuitLogic';
import CustomImagePuzzle from './games/CustomImagePuzzle';
import PlacementRun from './games/PlacementRun';
import TimeComplexityAssassin from './games/TimeComplexityAssassin';
import DatabaseNormalizer from './games/DatabaseNormalizer';
import NetworkRescue from './games/NetworkRescue';
import AILabSimulator from './games/AILabSimulator';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { user } = useContext(AuthContext);
  const { soundEnabled, toggleSound } = useContext(AudioContext);
  const location = useLocation();
  const isGame = location.pathname.startsWith('/game/');

  return (
    <div className={isGame ? "game-fullscreen-container" : "app-container"}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/game/algorithm-debugger" element={
          <ProtectedRoute>
            <AlgorithmDebugger />
          </ProtectedRoute>
        } />
        
        <Route path="/game/cipher-cracker" element={
          <ProtectedRoute>
            <CipherCracker />
          </ProtectedRoute>
        } />
        
        <Route path="/game/syntax-sleuth" element={
          <ProtectedRoute>
            <SyntaxSleuth />
          </ProtectedRoute>
        } />
        
        <Route path="/game/circuit-logic" element={
          <ProtectedRoute>
            <CircuitLogic />
          </ProtectedRoute>
        } />

        <Route path="/game/placement-run" element={
          <ProtectedRoute>
            <PlacementRun />
          </ProtectedRoute>
        } />

        <Route path="/game/database-normalizer" element={
          <ProtectedRoute>
            <DatabaseNormalizer />
          </ProtectedRoute>
        } />
        
        <Route path="/game/network-rescue" element={
          <ProtectedRoute>
            <NetworkRescue />
          </ProtectedRoute>
        } />
        
        <Route path="/game/ai-lab-simulator" element={
          <ProtectedRoute>
            <AILabSimulator />
          </ProtectedRoute>
        } />

        <Route path="/game/time-complexity-assassin" element={
          <ProtectedRoute>
            <TimeComplexityAssassin />
          </ProtectedRoute>
        } />

        <Route path="/game/emoji-memory" element={
          <ProtectedRoute>
            <EmojiMemory />
          </ProtectedRoute>
        } />

        <Route path="/game/speed-typist" element={
          <ProtectedRoute>
            <SpeedTypist />
          </ProtectedRoute>
        } />

        <Route path="/game/angry-chicken" element={
          <ProtectedRoute>
            <AngryChicken />
          </ProtectedRoute>
        } />
        
        <Route path="/game/color-mixing" element={
          <ProtectedRoute>
            <ColorMixing />
          </ProtectedRoute>
        } />

        <Route path="/game/wrong-answer" element={
          <ProtectedRoute>
            <WrongAnswer />
          </ProtectedRoute>
        } />

        <Route path="/game/time-echo" element={
          <ProtectedRoute>
            <TimeEcho />
          </ProtectedRoute>
        } />

        <Route path="/game/escape-room" element={
          <ProtectedRoute>
            <EscapeRoom />
          </ProtectedRoute>
        } />

        <Route path="/game/pattern-master" element={
          <ProtectedRoute>
            <PatternMaster />
          </ProtectedRoute>
        } />

        <Route path="/game/visual-puzzle" element={
          <ProtectedRoute>
            <VisualPuzzle />
          </ProtectedRoute>
        } />

        <Route path="/game/custom-puzzle" element={
          <ProtectedRoute>
            <CustomImagePuzzle />
          </ProtectedRoute>
        } />
      </Routes>
      {user && (
        <button 
          className="btn-primary" 
          onClick={toggleSound} 
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            borderRadius: '50px',
            padding: '10px 20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            background: soundEnabled ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)'
          }}
        >
          {soundEnabled ? '🔊 BGM On' : '🔇 BGM Off'}
        </button>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AudioProvider>
    </AuthProvider>
  );
}

export default App;
