import React, { createContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const AudioContext = createContext();

// TRACK REGISTRY: Premium Royalty-Free Kevin MacLeod & Google Action URLs
const TRACKS = {
  // Relaxing ambient synthpad
  chill: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Voice%20Over%20Under.mp3',
  // Fast, quirky retro energy
  arcade: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Monkeys%20Spinning%20Monkeys.mp3',
  // Dark rhythmic tech-house
  cyber: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/The%20Complex.mp3',
  // High-BPM intense drum panic
  panic: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Cut%20and%20Run.mp3',
  // Eerie atmospheric drone
  mystery: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gathering%20Darkness.mp3',
  // Calm, steady electronic focus beat
  logic: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Cipher.mp3'
};

const SFX = {
  start: 'https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg'
};

const getVibeForPath = (path) => {
  if (path.includes('angry-chicken') || path.includes('speed-typist') || path.includes('emoji-memory')) {
    return 'arcade';
  }
  if (path.includes('wrong-answer') || path.includes('time-complexity-assassin') || path.includes('placement-run')) {
    return 'panic';
  }
  if (path.includes('escape-room') || path.includes('cipher-cracker')) {
    return 'mystery';
  }
  if (path.includes('algorithm-debugger') || path.includes('syntax-sleuth')) {
    return 'cyber';
  }
  if (path.includes('circuit-logic') || path.includes('database-normalizer') || path.includes('network-rescue') || path.includes('pattern-master') || path.includes('ai-lab-simulator') || path.includes('time-echo')) {
    return 'logic';
  }
  // Dashboard & Misc
  return 'chill'; 
};

export const AudioProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef(null);
  const sfxRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = 0.25; 
    
    sfxRef.current = new Audio();
    sfxRef.current.volume = 0.6; // SFX should be a bit louder over the bgm

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // Handle Background Music Routing
  useEffect(() => {
    if (!audioRef.current) return;

    const newVibe = getVibeForPath(location.pathname);
    const newSrc = TRACKS[newVibe] || TRACKS.chill; // fallback to chill if not found

    if (audioRef.current.src !== newSrc) {
      audioRef.current.src = newSrc;
      
      if (soundEnabled) {
        audioRef.current.play().catch(e => console.error('Audio play failed', e));
      }
    }
  }, [location.pathname, soundEnabled]);

  const toggleSound = () => {
    if (!audioRef.current) return;
    
    if (soundEnabled) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error('Audio play failed', e));
    }
    setSoundEnabled(!soundEnabled);
  };

  const playSFX = (type = 'start') => {
    if (!soundEnabled || !sfxRef.current) return;
    sfxRef.current.src = SFX[type] || SFX.start;
    sfxRef.current.currentTime = 0; // reset to beginning instantly
    sfxRef.current.play().catch(e => console.error('SFX play failed', e));
  };

  return (
    <AudioContext.Provider value={{ soundEnabled, toggleSound, playSFX }}>
      {children}
    </AudioContext.Provider>
  );
};
