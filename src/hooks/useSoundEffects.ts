
import { useCallback } from 'react';

export const useSoundEffects = () => {
  const playSound = useCallback((type: 'correct' | 'incorrect' | 'click' | 'success' | 'levelup') => {
    // Create audio context for better browser compatibility
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    };

    switch (type) {
      case 'correct':
        // Happy ascending tone
        playTone(523, 0.2); // C5
        setTimeout(() => playTone(659, 0.2), 100); // E5
        setTimeout(() => playTone(784, 0.3), 200); // G5
        break;
      case 'incorrect':
        // Descending disappointed tone
        playTone(220, 0.3, 'sawtooth');
        setTimeout(() => playTone(175, 0.4, 'sawtooth'), 150);
        break;
      case 'click':
        // Short click sound
        playTone(800, 0.1, 'square');
        break;
      case 'success':
        // Victory fanfare
        playTone(523, 0.15);
        setTimeout(() => playTone(659, 0.15), 80);
        setTimeout(() => playTone(784, 0.15), 160);
        setTimeout(() => playTone(1047, 0.4), 240);
        break;
      case 'levelup':
        // Level up sound
        playTone(392, 0.2);
        setTimeout(() => playTone(523, 0.2), 100);
        setTimeout(() => playTone(659, 0.2), 200);
        setTimeout(() => playTone(1047, 0.5), 300);
        break;
    }
  }, []);

  return { playSound };
};
