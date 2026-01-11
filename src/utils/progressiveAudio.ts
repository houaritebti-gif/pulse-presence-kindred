/**
 * Progressive audio feedback using Web Audio API
 * Creates subtle, pleasant tones that increase in pitch during gestures
 */

let audioContext: AudioContext | null = null;
let currentOscillator: OscillatorNode | null = null;
let currentGain: GainNode | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  
  // Resume if suspended (autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  return audioContext;
};

/**
 * Start a progressive tone that increases in pitch
 * Call updateProgressiveTone to change pitch based on progress
 */
export const startProgressiveTone = (): void => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // Stop any existing tone
  stopProgressiveTone();
  
  try {
    // Create oscillator with soft sine wave
    currentOscillator = ctx.createOscillator();
    currentOscillator.type = 'sine';
    currentOscillator.frequency.setValueAtTime(280, ctx.currentTime); // Start low (C4-ish)
    
    // Create gain node for volume control - very subtle
    currentGain = ctx.createGain();
    currentGain.gain.setValueAtTime(0, ctx.currentTime);
    // Fade in gently
    currentGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.1);
    
    // Connect: oscillator -> gain -> destination
    currentOscillator.connect(currentGain);
    currentGain.connect(ctx.destination);
    
    currentOscillator.start();
  } catch {
    // Silently fail if audio fails
    currentOscillator = null;
    currentGain = null;
  }
};

/**
 * Update the progressive tone based on progress (0-1)
 * Frequency increases from 280Hz to 520Hz (roughly C4 to C5)
 */
export const updateProgressiveTone = (progress: number): void => {
  const ctx = getAudioContext();
  if (!ctx || !currentOscillator || !currentGain) return;
  
  try {
    // Map progress to frequency (280Hz to 520Hz - pleasant range)
    const minFreq = 280;
    const maxFreq = 520;
    const frequency = minFreq + (maxFreq - minFreq) * Math.pow(progress, 1.5);
    
    // Smooth frequency transition
    currentOscillator.frequency.setTargetAtTime(frequency, ctx.currentTime, 0.05);
    
    // Slightly increase volume as progress increases, max 0.08
    const volume = 0.04 + (progress * 0.04);
    currentGain.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
  } catch {
    // Ignore errors
  }
};

/**
 * Stop the progressive tone with a gentle fade out
 */
export const stopProgressiveTone = (): void => {
  const ctx = getAudioContext();
  
  if (currentGain && ctx) {
    try {
      // Fade out quickly
      currentGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    } catch {
      // Ignore
    }
  }
  
  if (currentOscillator) {
    try {
      // Stop after fade out
      setTimeout(() => {
        currentOscillator?.stop();
        currentOscillator?.disconnect();
        currentGain?.disconnect();
        currentOscillator = null;
        currentGain = null;
      }, 100);
    } catch {
      currentOscillator = null;
      currentGain = null;
    }
  }
};

/**
 * Play a success chime when gesture completes
 */
export const playSuccessChime = (): void => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(587, ctx.currentTime); // D5
    oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.08); // G5
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.25);
  } catch {
    // Silently fail
  }
};

/**
 * Check if audio is supported
 */
export const isProgressiveAudioSupported = (): boolean => {
  return typeof window !== 'undefined' && 
    !!(window.AudioContext || (window as any).webkitAudioContext);
};
