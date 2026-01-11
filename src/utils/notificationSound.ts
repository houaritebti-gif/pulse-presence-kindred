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
const ENERGY_SOUND_ENABLED_KEY = "kiki_energy_sound_enabled";
const ACTION_SOUNDS_ENABLED_KEY = "kiki_action_sounds_enabled";
const MASTER_VOLUME_KEY = "kiki_master_volume";

// Master volume control (0.0 - 1.0)
export const getMasterVolume = (): number => {
  const stored = localStorage.getItem(MASTER_VOLUME_KEY);
  return stored !== null ? parseFloat(stored) : 0.7; // Default 70%
};

export const setMasterVolume = (volume: number): void => {
  const clampedVolume = Math.max(0, Math.min(1, volume));
  localStorage.setItem(MASTER_VOLUME_KEY, clampedVolume.toString());
};

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

// Energy gain sound toggle
export const isEnergySoundEnabled = (): boolean => {
  const stored = localStorage.getItem(ENERGY_SOUND_ENABLED_KEY);
  return stored === null ? true : stored === "true"; // Default enabled
};

export const setEnergySoundEnabled = (enabled: boolean): void => {
  localStorage.setItem(ENERGY_SOUND_ENABLED_KEY, enabled ? "true" : "false");
};

// Action sounds toggle (Chispa, Super Chispa, Pasar)
export const isActionSoundsEnabled = (): boolean => {
  const stored = localStorage.getItem(ACTION_SOUNDS_ENABLED_KEY);
  return stored === null ? true : stored === "true"; // Default enabled
};

export const setActionSoundsEnabled = (enabled: boolean): void => {
  localStorage.setItem(ACTION_SOUNDS_ENABLED_KEY, enabled ? "true" : "false");
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

// Master gain node for volume control
let masterGainNode: GainNode | null = null;

const getMasterGainNode = () => {
  const ctx = getAudioContext();
  if (!masterGainNode) {
    masterGainNode = ctx.createGain();
    masterGainNode.connect(ctx.destination);
    masterGainNode.gain.value = getMasterVolume();
  }
  return masterGainNode;
};

// Update master volume dynamically
export const updateMasterGainVolume = () => {
  if (masterGainNode) {
    masterGainNode.gain.value = getMasterVolume();
  }
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
  superSpark: [150, 50, 100, 50, 100, 50, 200], // Electric pattern for super spark
  message: [80, 80, 80], // Two quick taps
  quedada: [150, 100, 150], // Friendly pattern
  ghost: [50, 30, 50, 30, 50], // Mysterious light pattern
  connection: [120, 60, 120], // Warm invitation pattern
  default: [100], // Single short buzz
};

// Vibrate device if supported
export const vibrateDevice = (type: "spark" | "superSpark" | "message" | "quedada" | "ghost" | "connection" | "default" = "default") => {
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
export const playNotificationSound = (type: "spark" | "superSpark" | "message" | "quedada" | "ghost" | "connection" | "default" = "default") => {
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
    const masterGain = getMasterGainNode();
    
    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    
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
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
        break;
      
      case "superSpark":
        // Electric super spark sound - dramatic ascending arpeggio
        const superOsc1 = ctx.createOscillator();
        const superOsc2 = ctx.createOscillator();
        const superOsc3 = ctx.createOscillator();
        const superGain1 = ctx.createGain();
        const superGain2 = ctx.createGain();
        const superGain3 = ctx.createGain();
        
        superOsc1.connect(superGain1);
        superOsc2.connect(superGain2);
        superOsc3.connect(superGain3);
        superGain1.connect(masterGain);
        superGain2.connect(masterGain);
        superGain3.connect(masterGain);
        
        superOsc1.type = "sine";
        superOsc2.type = "sine";
        superOsc3.type = "triangle";
        
        // Fast electric arpeggio
        superOsc1.frequency.setValueAtTime(523, ctx.currentTime); // C5
        superOsc1.frequency.setValueAtTime(659, ctx.currentTime + 0.05); // E5
        superOsc1.frequency.setValueAtTime(784, ctx.currentTime + 0.1); // G5
        superOsc1.frequency.setValueAtTime(1047, ctx.currentTime + 0.15); // C6
        
        superOsc2.frequency.setValueAtTime(392, ctx.currentTime + 0.08); // G4
        superOsc2.frequency.setValueAtTime(523, ctx.currentTime + 0.16); // C5
        
        superOsc3.frequency.setValueAtTime(262, ctx.currentTime); // C4 base
        
        superGain1.gain.setValueAtTime(0.18, ctx.currentTime);
        superGain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        superGain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.08);
        superGain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        superGain3.gain.setValueAtTime(0.08, ctx.currentTime);
        superGain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        superOsc1.start(ctx.currentTime);
        superOsc2.start(ctx.currentTime + 0.08);
        superOsc3.start(ctx.currentTime);
        superOsc1.stop(ctx.currentTime + 0.45);
        superOsc2.stop(ctx.currentTime + 0.5);
        superOsc3.stop(ctx.currentTime + 0.55);
        
        // Don't use the main oscillator
        oscillator.stop(ctx.currentTime);
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
        gain2.connect(masterGain);
        
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
        connGain1.connect(masterGain);
        connGain2.connect(masterGain);
        
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
export const notifyUser = (type: "spark" | "superSpark" | "message" | "quedada" | "ghost" | "connection" | "default" = "default") => {
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
    
    const masterGain = getMasterGainNode();
    
    notes.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(masterGain);
      
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
        gain.connect(masterGain);
        
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
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const masterGain = getMasterGainNode();
    
    osc.connect(gain);
    gain.connect(masterGain);
    
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
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const masterGain = getMasterGainNode();
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    
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
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const masterGain = getMasterGainNode();
    
    osc.connect(gain);
    gain.connect(masterGain);
    
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
  const masterGain = getMasterGainNode();
  
  osc1.connect(gain1);
  osc2.connect(gain2);
  osc3.connect(gain3);
  gain1.connect(masterGain);
  gain2.connect(masterGain);
  gain3.connect(masterGain);
  
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

const playSyncChime = (ctx: AudioContext) => {
  const notes = [784, 988, 1175]; // G5, B5, D6
  const masterGain = getMasterGainNode();
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.4);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.45);
  });
};

const playSyncBubble = (ctx: AudioContext) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const masterGain = getMasterGainNode();
  osc.connect(gain);
  gain.connect(masterGain);
  osc.type = "sine";
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
};

const playSyncWhoosh = (ctx: AudioContext) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const masterGain = getMasterGainNode();
  osc.connect(gain);
  gain.connect(masterGain);
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

const playSyncMinimal = (ctx: AudioContext) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const masterGain = getMasterGainNode();
  osc.connect(gain);
  gain.connect(masterGain);
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
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const masterGain = getMasterGainNode();
    
    osc.connect(gain);
    gain.connect(masterGain);
    
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

// Subtle energy gain sound - sparkly ascending "ding" for Spark Energy
export const playEnergyGainSound = () => {
  if (isSoundMuted()) return;
  if (isInDndPeriod()) return;
  if (!isEnergySoundEnabled()) return;
  
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const masterGain = getMasterGainNode();
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    
    osc1.type = "sine";
    osc2.type = "triangle"; // Adds sparkle
    
    // Main ascending tone (E5 → G5 → B5)
    osc1.frequency.setValueAtTime(659, ctx.currentTime); // E5
    osc1.frequency.setValueAtTime(784, ctx.currentTime + 0.06); // G5
    osc1.frequency.setValueAtTime(988, ctx.currentTime + 0.12); // B5
    
    // Harmonic shimmer (octave higher, quieter)
    osc2.frequency.setValueAtTime(1319, ctx.currentTime + 0.03); // E6
    osc2.frequency.setValueAtTime(1568, ctx.currentTime + 0.09); // G6
    osc2.frequency.setValueAtTime(1976, ctx.currentTime + 0.15); // B6
    
    // Gain envelopes - quick attack, smooth decay
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.setValueAtTime(0.1, ctx.currentTime + 0.06);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.04, ctx.currentTime + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.03);
    osc1.stop(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 0.28);
    
    // Light haptic feedback
    if ("vibrate" in navigator && isVibrationEnabled()) {
      navigator.vibrate([30, 20, 40]);
    }
  } catch (error) {
    console.log("Could not play energy gain sound:", error);
  }
};

// ===========================================
// ACTION SOUNDS (Swipe interactions)
// ===========================================

// Pass sound - soft "whoosh" to the left
export const playPassSound = () => {
  if (isSoundMuted()) return;
  if (isInDndPeriod()) return;
  if (!isActionSoundsEnabled()) return;
  
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const masterGain = getMasterGainNode();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    osc.type = "sawtooth";
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    
    // Descending pitch
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  } catch (error) {
    console.log("Could not play pass sound:", error);
  }
};

// Chispa sound - sparkly ascending with shimmer
export const playChispaSound = () => {
  if (isSoundMuted()) return;
  if (isInDndPeriod()) return;
  if (!isActionSoundsEnabled()) return;
  
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const masterGain = getMasterGainNode();
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    
    osc1.type = "sine";
    osc2.type = "triangle";
    
    // Main sparkle arpeggio
    osc1.frequency.setValueAtTime(659, ctx.currentTime); // E5
    osc1.frequency.setValueAtTime(784, ctx.currentTime + 0.06); // G5
    osc1.frequency.setValueAtTime(988, ctx.currentTime + 0.12); // B5
    
    // Harmonic shimmer
    osc2.frequency.setValueAtTime(1319, ctx.currentTime + 0.04); // E6
    osc2.frequency.setValueAtTime(1568, ctx.currentTime + 0.1); // G6
    
    gain1.gain.setValueAtTime(0.1, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    
    gain2.gain.setValueAtTime(0.04, ctx.currentTime + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.04);
    osc1.stop(ctx.currentTime + 0.28);
    osc2.stop(ctx.currentTime + 0.25);
  } catch (error) {
    console.log("Could not play chispa sound:", error);
  }
};

// Super Chispa sound - electric, powerful, dramatic
export const playSuperChispaSound = () => {
  if (isSoundMuted()) return;
  if (isInDndPeriod()) return;
  if (!isActionSoundsEnabled()) return;
  
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();
    const masterGain = getMasterGainNode();
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    gain3.connect(masterGain);
    
    osc1.type = "sine";
    osc2.type = "triangle";
    osc3.type = "sine";
    
    // Power chord base
    osc1.frequency.setValueAtTime(220, ctx.currentTime); // A3
    osc1.frequency.setValueAtTime(330, ctx.currentTime + 0.08); // E4
    osc1.frequency.setValueAtTime(440, ctx.currentTime + 0.16); // A4
    
    // Electric arpeggio
    osc2.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.setValueAtTime(554, ctx.currentTime + 0.05); // C#5
    osc2.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    osc2.frequency.setValueAtTime(1109, ctx.currentTime + 0.2); // C#6
    
    // High shimmer overtone
    osc3.frequency.setValueAtTime(1760, ctx.currentTime + 0.1); // A6
    osc3.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.3);
    
    // Dramatic swelling gains
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.setValueAtTime(0.12, ctx.currentTime + 0.15);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    
    gain2.gain.setValueAtTime(0.06, ctx.currentTime);
    gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    gain3.gain.setValueAtTime(0, ctx.currentTime);
    gain3.gain.setValueAtTime(0.04, ctx.currentTime + 0.1);
    gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc3.start(ctx.currentTime + 0.1);
    osc1.stop(ctx.currentTime + 0.5);
    osc2.stop(ctx.currentTime + 0.45);
    osc3.stop(ctx.currentTime + 0.4);
  } catch (error) {
    console.log("Could not play super chispa sound:", error);
  }
};

// View Profile sound - subtle "peek" sound
export const playViewProfileSound = () => {
  if (isSoundMuted()) return;
  if (isInDndPeriod()) return;
  if (!isActionSoundsEnabled()) return;
  
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const masterGain = getMasterGainNode();
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.type = "sine";
    
    // Short ascending inquiry
    osc.frequency.setValueAtTime(523, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(587, ctx.currentTime + 0.08); // D5
    
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (error) {
    console.log("Could not play view profile sound:", error);
  }
};

// Hay Vibra (mutual match) sound - celebratory!
export const playHayVibraSound = () => {
  if (isSoundMuted()) return;
  if (isInDndPeriod()) return;
  if (!isActionSoundsEnabled()) return;
  
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    // Triumphant match sound - exciting and celebratory
    const notes = [
      { freq: 523, time: 0 },      // C5
      { freq: 659, time: 0.08 },   // E5
      { freq: 784, time: 0.16 },   // G5
      { freq: 1047, time: 0.24 },  // C6
    ];
    
    const masterGain = getMasterGainNode();
    
    notes.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + time + 0.2);
      
      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + 0.25);
    });
    
    // Final chord
    setTimeout(() => {
      const chordFreqs = [523, 659, 784]; // C major
      chordFreqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.55);
      });
    }, 350);
    
    // Celebratory vibration
    if ("vibrate" in navigator && isVibrationEnabled()) {
      navigator.vibrate([80, 50, 80, 50, 150]);
    }
  } catch (error) {
    console.log("Could not play hay vibra sound:", error);
  }
};

// Sparkle Trail Sounds - different for each style

// Stars sparkle sound - magical twinkling
export const playSparkleStarsSound = () => {
  if (isSoundMuted()) return;
  if (isInDndPeriod()) return;
  if (!isActionSoundsEnabled()) return;
  
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const masterGain = getMasterGainNode();
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    
    osc1.type = "sine";
    osc2.type = "sine";
    
    // High sparkly notes
    osc1.frequency.setValueAtTime(2093, ctx.currentTime); // C7
    osc1.frequency.setValueAtTime(2637, ctx.currentTime + 0.05); // E7
    osc1.frequency.setValueAtTime(3136, ctx.currentTime + 0.1); // G7
    
    osc2.frequency.setValueAtTime(1568, ctx.currentTime + 0.02); // G6
    osc2.frequency.setValueAtTime(1976, ctx.currentTime + 0.07); // B6
    
    gain1.gain.setValueAtTime(0.04, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    
    gain2.gain.setValueAtTime(0.03, ctx.currentTime + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.02);
    osc1.stop(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.18);
  } catch (error) {
    console.log("Could not play sparkle stars sound:", error);
  }
};

// Fire sparkle sound - crackling, warm
export const playSparkleFireSound = () => {
  if (isSoundMuted()) return;
  if (isInDndPeriod()) return;
  if (!isActionSoundsEnabled()) return;
  
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    // Fire crackling - warm, low rumble with pops
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const noiseGain = ctx.createGain();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    
    // Create white noise for crackle
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Low pass filter for warmer crackle
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1500;
    
    const masterGain = getMasterGainNode();
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    
    osc1.type = "triangle";
    osc2.type = "sawtooth";
    
    // Warm low tones
    osc1.frequency.setValueAtTime(110, ctx.currentTime); // A2
    osc1.frequency.setValueAtTime(165, ctx.currentTime + 0.08); // E3
    
    osc2.frequency.setValueAtTime(220, ctx.currentTime + 0.03); // A3
    osc2.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.12);
    
    noiseGain.gain.setValueAtTime(0.02, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    
    gain1.gain.setValueAtTime(0.05, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    
    gain2.gain.setValueAtTime(0.03, ctx.currentTime + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    noise.start(ctx.currentTime);
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.03);
    noise.stop(ctx.currentTime + 0.15);
    osc1.stop(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.18);
  } catch (error) {
    console.log("Could not play sparkle fire sound:", error);
  }
};

// Hearts sparkle sound - soft, romantic, gentle
export const playSparkleHeartsSound = () => {
  if (isSoundMuted()) return;
  if (isInDndPeriod()) return;
  if (!isActionSoundsEnabled()) return;
  
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const masterGain = getMasterGainNode();
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    
    osc1.type = "sine";
    osc2.type = "sine";
    
    // Soft romantic notes - gentle third intervals
    osc1.frequency.setValueAtTime(523, ctx.currentTime); // C5
    osc1.frequency.setValueAtTime(659, ctx.currentTime + 0.08); // E5
    osc1.frequency.setValueAtTime(784, ctx.currentTime + 0.16); // G5
    
    osc2.frequency.setValueAtTime(392, ctx.currentTime); // G4
    osc2.frequency.setValueAtTime(494, ctx.currentTime + 0.1); // B4
    
    gain1.gain.setValueAtTime(0.04, ctx.currentTime);
    gain1.gain.setValueAtTime(0.05, ctx.currentTime + 0.1);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    
    gain2.gain.setValueAtTime(0.03, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.28);
    osc2.stop(ctx.currentTime + 0.22);
  } catch (error) {
    console.log("Could not play sparkle hearts sound:", error);
  }
};

// Generic function to play sparkle sound based on style
export const playSparkleTrailSound = (style: "stars" | "fire" | "hearts") => {
  switch (style) {
    case "stars":
      playSparkleStarsSound();
      break;
    case "fire":
      playSparkleFireSound();
      break;
    case "hearts":
      playSparkleHeartsSound();
      break;
  }
};
