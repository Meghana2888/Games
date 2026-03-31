import React, { createContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const AudioContext = createContext();

// TRACK REGISTRY: Map custom URLs to different "vibes"
const TRACKS = {
  chill: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg',
  focus: 'https://actions.google.com/sounds/v1/science_fiction/alien_breath.ogg',
  intense: 'https://actions.google.com/sounds/v1/science_fiction/power_down.ogg' // Replace with high-bpm mp3 url
};

const getVibeForPath = (path) => {
  // High Intensity Games
  if (
    path.includes('speed-typist') || 
    path.includes('angry-chicken') || 
    path.includes('time-complexity-assassin') || 
    path.includes('placement-run') ||
    path.includes('escape-room')
  ) {
    return 'intense';
  }
  
  // Deep Focus / Hacking Games
  if (
    path.includes('circuit-logic') || 
    path.includes('database-normalizer') || 
    path.includes('algorithm-debugger') || 
    path.includes('syntax-sleuth') || 
    path.includes('network-rescue') || 
    path.includes('cipher-cracker') ||
    path.includes('ai-lab-simulator')
  ) {
    return 'focus';
  }

  // Default / Chill Games
  return 'chill'; 
};

export const AudioProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef(null);
  const location = useLocation();

  // Initialize the audio element once
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = 0.2; 

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Watch for Route Changes and Switch Track
  useEffect(() => {
    if (!audioRef.current) return;

    const newVibe = getVibeForPath(location.pathname);
    const newSrc = TRACKS[newVibe];

    // Only swap if the source actually changed
    if (audioRef.current.src !== newSrc) {
      audioRef.current.src = newSrc;
      
      // If sound is enabled, automatically play the new track
      if (soundEnabled) {
        // Crossfade or simple play
        audioRef.current.play().catch(e => console.error('Audio play failed', e));
      }
    }
  }, [location.pathname, soundEnabled]);

  const toggleSound = () => {
    if (!audioRef.current) return;
    
    if (soundEnabled) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => {
        console.error('Audio play failed', e);
      });
    }
    setSoundEnabled(!soundEnabled);
  };

  return (
    <AudioContext.Provider value={{ soundEnabled, toggleSound }}>
      {children}
    </AudioContext.Provider>
  );
};
