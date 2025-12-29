// Simple notification sounds using Web Audio API
// No external files needed - generates sounds programmatically

let audioContext: AudioContext | null = null;

const SOUND_MUTED_KEY = "kiki_sound_muted";
const VIBRATION_ENABLED_KEY = "kiki_vibration_enabled";
const DND_ENABLED_KEY = "kiki_dnd_enabled";
const DND_START_KEY = "kiki_dnd_start";
const DND_END_KEY = "kiki_dnd_end";
const THEME_SOUND_ENABLED_KEY = "kiki_theme_sound_enabled";
const SYNC_SOUND_TYPE_KEY = "kiki_sync_sound_type";

export type SyncSoundType = 'default' | 'chime' | 'bubble' | 'whoosh' | 'minimal' | 'silent';

export const SYNC_SOUND_OPTIONS: { value: SyncSoundType; label: string }[] = [
  { value: 'default', label: 'Por defecto' },
  { value: 'chime', label: 'Campanilla' },
  { value: 'bubble', label: 'Burbuja' },
  { value: 'whoosh', label: 'Swoosh' },
  { value: 'minimal', label: 'Mínimo' },
  { value: 'silent', label: 'Silencio' },
];

export const getSyncSoundType = (): SyncSoundType => {
  const stored = localStorage.getItem(SYNC_SOUND_TYPE_KEY);
  return (stored as SyncSoundType) || 'default';
};

export const setSyncSoundType = (type: SyncSoundType): void => {
  localStorage.setItem(SYNC_SOUND_TYPE_KEY, type);
};

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

// Theme sound toggle
export const isThemeSoundEnabled = (): boolean => {
  const stored = localStorage.getItem(THEME_SOUND_ENABLED_KEY);
  return stored === null ? true : stored === "true";
};

export const setThemeSoundEnabled = (enabled: boolean): void => {
  localStorage.setItem(THEME_SOUND_ENABLED_KEY, enabled ? "true" : "false");
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
  connection: [120, 60, 120], // Warm invitation pattern
  default: [100], // Single short buzz
};

// Vibrate device if supported
export const vibrateDevice = (type: "spark" | "message" | "quedada" | "ghost" | "connection" | "default" = "default") => {
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
export const playNotificationSound = (type: "spark" | "message" | "quedada" | "ghost" | "connection" | "default" = "default") => {
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
      
      case "connection":
        // Warm invitation sound - friendly knock-like pattern with harmonic
        const connOsc1 = ctx.createOscillator();
        const connOsc2 = ctx.createOscillator();
        const connGain1 = ctx.createGain();
        const connGain2 = ctx.createGain();
        
        connOsc1.connect(connGain1);
        connOsc2.connect(connGain2);
        connGain1.connect(ctx.destination);
        connGain2.connect(ctx.destination);
        
        connOsc1.type = "sine";
        connOsc2.type = "triangle";
        
        // First "knock" - warm tone
        connOsc1.frequency.setValueAtTime(440, ctx.currentTime); // A4
        connGain1.gain.setValueAtTime(0.12, ctx.currentTime);
        connGain1.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 0.12);
        
        // Second "knock" - slightly higher, confirmation feel
        connOsc1.frequency.setValueAtTime(554, ctx.currentTime + 0.15); // C#5
        connGain1.gain.setValueAtTime(0.14, ctx.currentTime + 0.15);
        connGain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        
        // Harmonic undertone for warmth
        connOsc2.frequency.setValueAtTime(220, ctx.currentTime); // A3
        connGain2.gain.setValueAtTime(0.06, ctx.currentTime);
        connGain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        connOsc1.start(ctx.currentTime);
        connOsc2.start(ctx.currentTime);
        connOsc1.stop(ctx.currentTime + 0.4);
        connOsc2.stop(ctx.currentTime + 0.45);
        
        // Don't use the main oscillator
        oscillator.stop(ctx.currentTime);
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
export const notifyUser = (type: "spark" | "message" | "quedada" | "ghost" | "connection" | "default" = "default") => {
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

// Subtle AI chatbot response sound - soft, friendly "blip"
export const playChatbotResponseSound = () => {
  if (isSoundMuted()) return;
  if (isInDndPeriod()) return;
  
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    // Soft ascending "blip" - friendly AI response
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    
    // Gentle ascending tone
    osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
    osc.frequency.exponentialRampToValueAtTime(587, ctx.currentTime + 0.08); // D5
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (error) {
    console.log("Could not play chatbot response sound:", error);
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

// Queue added sound - soft descending "plop" indicating message queued
export const playQueueAddedSound = () => {
  if (isSoundMuted()) return;
  if (isInDndPeriod()) return;
  
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    // Soft "plop" sound - descending tone indicating queued
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    
    // Descending frequency (opposite of sync success)
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
    
    // Short vibration
    if ("vibrate" in navigator && isVibrationEnabled()) {
      navigator.vibrate([40]);
    }
  } catch (error) {
    console.log("Could not play queue added sound:", error);
  }
};

// Sync success sound for offline queue messages sent
export const playSyncSuccessSound = () => {
  if (isSoundMuted()) return;
  if (isInDndPeriod()) return;
  
  const soundType = getSyncSoundType();
  if (soundType === 'silent') return;
  
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    switch (soundType) {
      case 'chime':
        playSyncChime(ctx);
        break;
      case 'bubble':
        playSyncBubble(ctx);
        break;
      case 'whoosh':
        playSyncWhoosh(ctx);
        break;
      case 'minimal':
        playSyncMinimal(ctx);
        break;
      default:
        playSyncDefault(ctx);
    }
    
    // Subtle vibration
    if ("vibrate" in navigator && isVibrationEnabled()) {
      navigator.vibrate([50, 30, 80]);
    }
  } catch (error) {
    console.log("Could not play sync success sound:", error);
  }
};

// Default sync sound - uplifting whoosh + ding
const playSyncDefault = (ctx: AudioContext) => {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  const gain2 = ctx.createGain();
  const gain3 = ctx.createGain();
  
  osc1.connect(gain1);
  osc2.connect(gain2);
  osc3.connect(gain3);
  gain1.connect(ctx.destination);
  gain2.connect(ctx.destination);
  gain3.connect(ctx.destination);
  
  osc1.type = "sine";
  osc2.type = "sine";
  osc3.type = "sine";
  
  // Ascending sweep (whoosh)
  osc1.frequency.setValueAtTime(400, ctx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
  gain1.gain.setValueAtTime(0.05, ctx.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  
  // First ding: E5
  osc2.frequency.setValueAtTime(659, ctx.currentTime + 0.12);
  gain2.gain.setValueAtTime(0, ctx.currentTime);
  gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.12);
  gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
  
  // Second ding: G5 (higher, confirmation)
  osc3.frequency.setValueAtTime(784, ctx.currentTime + 0.22);
  gain3.gain.setValueAtTime(0, ctx.currentTime);
  gain3.gain.setValueAtTime(0.12, ctx.currentTime + 0.22);
  gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  
  osc1.start(ctx.currentTime);
  osc2.start(ctx.currentTime + 0.12);
  osc3.start(ctx.currentTime + 0.22);
  osc1.stop(ctx.currentTime + 0.25);
  osc2.stop(ctx.currentTime + 0.4);
  osc3.stop(ctx.currentTime + 0.55);
};

// Chime sound - melodic bell-like
const playSyncChime = (ctx: AudioContext) => {
  const notes = [784, 988, 1175]; // G5, B5, D6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.4);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.45);
  });
};

// Bubble sound - soft popping
const playSyncBubble = (ctx: AudioContext) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
};

// Whoosh sound - swift air movement
const playSyncWhoosh = (ctx: AudioContext) => {
  // Create noise-like effect with multiple oscillators
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.25);
  gain.gain.setValueAtTime(0.02, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.35);
};

// Minimal sound - single subtle ping
const playSyncMinimal = (ctx: AudioContext) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
};

// Preview sync sound (for settings)
export const previewSyncSound = (type: SyncSoundType) => {
  if (type === 'silent') return;
  
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    switch (type) {
      case 'chime':
        playSyncChime(ctx);
        break;
      case 'bubble':
        playSyncBubble(ctx);
        break;
      case 'whoosh':
        playSyncWhoosh(ctx);
        break;
      case 'minimal':
        playSyncMinimal(ctx);
        break;
      default:
        playSyncDefault(ctx);
    }
  } catch (error) {
    console.log("Could not preview sound:", error);
  }
};

// Subtle click sound for theme toggle
export const playThemeToggleSound = () => {
  if (isSoundMuted()) return;
  if (!isThemeSoundEnabled()) return;
  
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
