// Tribes MVP - closed list with emojis
export const TRIBES = [
  { value: "Punk / Garage", emoji: "🎸" },
  { value: "Gótica / Dark", emoji: "🦇" },
  { value: "Electrónica", emoji: "🎧" },
  { value: "Alternativa", emoji: "🌀" },
  { value: "Artística", emoji: "🎨" },
  { value: "Queer Scene", emoji: "🌈" },
  { value: "Urbana", emoji: "🏙️" },
  { value: "Indie", emoji: "🎹" },
  { value: "Intelectual", emoji: "📚" },
  { value: "Esotérica", emoji: "🔮" },
  { value: "Glam", emoji: "💎" },
  { value: "Natural", emoji: "🌿" },
] as const;

export type TribeType = typeof TRIBES[number]["value"];

// Music styles MVP - grouped by categories
export const MUSIC_CATEGORIES = [
  {
    name: "Oscura / alternativa",
    styles: ["Post-punk", "Darkwave", "Coldwave", "Gothic", "Industrial"],
  },
  {
    name: "Rock / guitarras",
    styles: ["Rock", "Punk", "Garage", "Grunge", "Indie rock"],
  },
  {
    name: "Electrónica / club",
    styles: ["Techno", "House", "EBM", "Electro", "Acid"],
  },
  {
    name: "Pop / alternativo",
    styles: ["Indie pop", "Synth-pop", "New wave"],
  },
  {
    name: "Urbana / latina",
    styles: ["Reggaeton", "Hip hop", "Trap", "R&B"],
  },
  {
    name: "Tropical / latina",
    styles: ["Salsa", "Bachata", "Cumbia"],
  },
  {
    name: "Americana / raíz",
    styles: ["Folk", "Country", "Americana"],
  },
  {
    name: "Tribal / ritual",
    styles: ["Tribal"],
  },
  {
    name: "Jazz / soul / funk",
    styles: ["Jazz", "Soul", "Funk"],
  },
  {
    name: "Experimental / otros",
    styles: ["Experimental", "Electrónica alternativa"],
  },
] as const;

// Flatten all music styles for validation
export const ALL_MUSIC_STYLES = MUSIC_CATEGORIES.flatMap(cat => cat.styles);

// Vibes with emojis
export const VIBES = [
  { value: "Tranqui", emoji: "🌙" },
  { value: "Intensa", emoji: "🔥" },
  { value: "Curiosa", emoji: "✨" },
  { value: "Misteriosa", emoji: "🖤" },
  { value: "Libre", emoji: "🦋" },
] as const;

// Optional details
export const OPTIONAL_DETAILS = [
  { key: "has_tattoos", label: "Tatuajes" },
  { key: "has_piercings", label: "Piercings" },
  { key: "alternative_aesthetic", label: "Estética alternativa" },
] as const;

export type MusicStyleType = typeof ALL_MUSIC_STYLES[number];
export type VibeType = typeof VIBES[number]["value"];
