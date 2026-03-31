import React, { createContext, useState, useEffect, useRef } from 'react';

export const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // You can replace this URL with any direct link to an mp3/ogg background track!
    // We are using a subtle sci-fi / ambient track as the global BGM.
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/science_fiction/alien_breath.ogg');
    
    // Setting up the audio element for looping BGM
    audioRef.current.loop = true;
    audioRef.current.volume = 0.15; // Kept low so it doesn't overpower

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

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
