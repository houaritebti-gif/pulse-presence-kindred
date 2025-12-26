// Simple notification sounds using Web Audio API
// No external files needed - generates sounds programmatically

let audioContext: AudioContext | null = null;

const SOUND_MUTED_KEY = "kiki_sound_muted";
const VIBRATION_ENABLED_KEY = "kiki_vibration_enabled";
const DND_ENABLED_KEY = "kiki_dnd_enabled";
const DND_START_KEY = "kiki_dnd_start";
const DND_END_KEY = "kiki_dnd_end";

export const isSoundMuted = (): boolean => {
  return localStorage.getItem(SOUND_MUTED_KEY) === "true";
};

export const setSoundMuted = (muted: boolean): void => {
  localStorage.setItem(SOUND_MUTED_KEY, muted ? "true" : "false");
};

export const isVibrationEnabled = (): boolean => {
  const stored = localStorage.getItem(VIBRATION_ENABLED_KEY);
  return stored === null ? true : stored === "true";
};

export const setVibrationEnabled = (enabled: boolean): void => {
  localStorage.setItem(VIBRATION_ENABLED_KEY, enabled ? "true" : "false");
};

// Do Not Disturb functions
export const isDndEnabled = (): boolean => {
  return localStorage.getItem(DND_ENABLED_KEY) === "true";
};

export const setDndEnabled = (enabled: boolean): void => {
  localStorage.setItem(DND_ENABLED_KEY, enabled ? "true" : "false");
};

export const getDndHours = (): { start: number; end: number } => {
  const start = parseInt(localStorage.getItem(DND_START_KEY) || "23", 10);
  const end = parseInt(localStorage.getItem(DND_END_KEY) || "7", 10);
  return { start, end };
};

export const setDndHours = (start: number, end: number): void => {
  localStorage.setItem(DND_START_KEY, start.toString());
  localStorage.setItem(DND_END_KEY, end.toString());
};

export const isInDndPeriod = (): boolean => {
  if (!isDndEnabled()) return false;
  
  const { start, end } = getDndHours();
  const now = new Date();
  const currentHour = now.getHours();
  
  // Handle overnight periods (e.g., 23:00 - 07:00)
  if (start > end) {
    return currentHour >= start || currentHour < end;
  }
  // Handle same-day periods (e.g., 14:00 - 18:00)
  return currentHour >= start && currentHour < end;
};

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

// Vibration patterns for different notification types (in milliseconds)
const VIBRATION_PATTERNS = {
  spark: [100, 50, 100, 50, 150], // Quick double tap + longer
  message: [80, 80, 80], // Two quick taps
  quedada: [150, 100, 150], // Friendly pattern
  ghost: [50, 30, 50, 30, 50], // Mysterious light pattern
  default: [100], // Single short buzz
};

// Vibrate device if supported
export const vibrateDevice = (type: "spark" | "message" | "quedada" | "ghost" | "default" = "default") => {
  if (!isVibrationEnabled()) return;
  if (isInDndPeriod()) return;
  
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(VIBRATION_PATTERNS[type] || VIBRATION_PATTERNS.default);
    } catch (error) {
      console.log("Vibration not available:", error);
    }
  }
};

// Play a simple "ding" notification sound
export const playNotificationSound = (type: "spark" | "message" | "quedada" | "ghost" | "default" = "default") => {
  // Check if sound is muted or in DND period
  if (isSoundMuted()) return;
  if (isInDndPeriod()) return;
  try {
    const ctx = getAudioContext();
    
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Different sounds for different notification types
    switch (type) {
      case "spark":
        // Sparkly ascending sound
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
        break;
        
      case "message":
        // Simple double beep
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;
        
      case "quedada":
        // Friendly chord
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        oscillator.type = "sine";
        osc2.type = "sine";
        oscillator.frequency.setValueAtTime(392, ctx.currentTime); // G4
        osc2.frequency.setValueAtTime(523, ctx.currentTime); // C5
        
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gain2.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        oscillator.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        osc2.stop(ctx.currentTime + 0.5);
        break;
      
      case "ghost":
        // Mysterious ethereal sound - descending with vibrato
        oscillator.type = "sine";
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        lfo.frequency.value = 6; // Vibrato speed
        lfoGain.gain.value = 15; // Vibrato depth
        
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // A4
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        
        lfo.start(ctx.currentTime);
        oscillator.start(ctx.currentTime);
        lfo.stop(ctx.currentTime + 0.6);
        oscillator.stop(ctx.currentTime + 0.6);
        break;
        
      default:
        // Simple notification ping
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(660, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    }
  } catch (error) {
    // Silently fail - audio is not critical
    console.log("Could not play notification sound:", error);
  }
};

// Combined function to play sound and vibrate
export const notifyUser = (type: "spark" | "message" | "quedada" | "ghost" | "default" = "default") => {
  playNotificationSound(type);
  vibrateDevice(type);
};
