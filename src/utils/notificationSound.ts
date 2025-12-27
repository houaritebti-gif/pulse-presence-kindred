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

// Celebration sound for completing onboarding or achievements
export const playCelebrationSound = () => {
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    // Play a triumphant ascending arpeggio
    const notes = [
      { freq: 523, time: 0 },      // C5
      { freq: 659, time: 0.1 },    // E5
      { freq: 784, time: 0.2 },    // G5
      { freq: 1047, time: 0.3 },   // C6
      { freq: 1319, time: 0.45 },  // E6
      { freq: 1568, time: 0.6 },   // G6
    ];
    
    notes.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.3);
      
      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + 0.35);
    });
    
    // Add a final chord
    setTimeout(() => {
      const chordFreqs = [523, 659, 784, 1047]; // C major chord
      chordFreqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.9);
      });
    }, 700);
    
    // Vibrate celebration pattern
    if ("vibrate" in navigator && isVibrationEnabled()) {
      navigator.vibrate([100, 50, 100, 50, 200, 100, 300]);
    }
  } catch (error) {
    console.log("Could not play celebration sound:", error);
  }
};

// Subtle success sound for retry success toasts
export const playSuccessSound = () => {
  if (isSoundMuted()) return;
  if (isInDndPeriod()) return;
  
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    // Simple ascending two-note chime (very subtle)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);
    
    osc1.type = "sine";
    osc2.type = "sine";
    
    // First note: G5
    osc1.frequency.setValueAtTime(784, ctx.currentTime);
    gain1.gain.setValueAtTime(0.06, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    // Second note: C6 (starts slightly after)
    osc2.frequency.setValueAtTime(1047, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.08);
    osc1.stop(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.log("Could not play success sound:", error);
  }
};

// Subtle click sound for theme toggle
export const playThemeToggleSound = () => {
  if (isSoundMuted()) return;
  
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    // Soft "click" sound - very short and subtle
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch (error) {
    console.log("Could not play theme toggle sound:", error);
  }
};
