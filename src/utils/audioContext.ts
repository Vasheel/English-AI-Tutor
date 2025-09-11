// src/utils/audioContext.ts
export const initializeAudioContext = async () => {
    try {
      // Create and resume audio context on user interaction
      const audioContext = new (window.AudioContext || window.AudioContext)();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      return audioContext;
    } catch (error) {
      console.warn('Could not initialize audio context:', error);
      return null;
    }
  };
  
  export const resumeAudioContext = async () => {
    try {
      if (window.AudioContext || window.AudioContext) {
        const audioContext = new (window.AudioContext || window.AudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
      }
    } catch (error) {
      console.warn('Could not resume audio context:', error);
    }
  };