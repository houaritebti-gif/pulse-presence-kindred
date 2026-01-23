// Gender options - main 3 + "other" opens extended list
export const GENDERS_MAIN = [
  { value: "woman", label: "Mujer" },
  { value: "man", label: "Hombre" },
  { value: "non_binary", label: "No binario" },
] as const;

export const GENDERS_EXTENDED = [
  { value: "trans_woman", label: "Mujer trans" },
  { value: "trans_man", label: "Hombre trans" },
  { value: "genderqueer", label: "Genderqueer" },
  { value: "genderfluid", label: "Género fluido" },
  { value: "agender", label: "Agénero" },
  { value: "two_spirit", label: "Two-Spirit" },
  { value: "other", label: "Otro" },
  { value: "prefer_not_to_say", label: "Prefiero no decir" },
] as const;

export const ALL_GENDERS = [...GENDERS_MAIN, ...GENDERS_EXTENDED] as const;

export type GenderType = typeof ALL_GENDERS[number]["value"];

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

// Optional details / Aesthetic options
export const OPTIONAL_DETAILS = [
  { key: "has_tattoos", label: "Tatuajes", emoji: "🖋️" },
  { key: "has_piercings", label: "Piercings", emoji: "💎" },
  { key: "alternative_aesthetic", label: "Estética alternativa", emoji: "🖤" },
  { key: "colored_hair", label: "Pelo de colores", emoji: "🌈" },
  { key: "shaved_head", label: "Cabeza rapada / Undercut", emoji: "💈" },
  { key: "vintage_style", label: "Ropa vintage / Thrift", emoji: "👗" },
  { key: "gothic_style", label: "Estilo gótico / Dark", emoji: "🦇" },
] as const;

export type OptionalDetailKey = typeof OPTIONAL_DETAILS[number]["key"];

// Looking for options with emojis
export const LOOKING_FOR_OPTIONS = [
  { value: "Amistades", emoji: "👯" },
  { value: "Buenas vibras", emoji: "✨" },
  { value: "Aventuras", emoji: "🚀" },
  { value: "Pasar el rato", emoji: "🎉" },
  { value: "Conexiones reales", emoji: "💫" },
  { value: "Lo que surja", emoji: "🌊" },
] as const;

// Interest type definition
export interface CulturalInterest {
  value: string;
  emoji: string;
}

export interface CulturalInterestCategory {
  name: string;
  emoji: string;
  interests: CulturalInterest[];
}

// Cultural interests organized by categories
export const CULTURAL_INTERESTS_CATEGORIES: CulturalInterestCategory[] = [
  {
    name: "Música y eventos",
    emoji: "🎵",
    interests: [
      { value: "Conciertos en directo", emoji: "🎤" },
      { value: "Cultura club", emoji: "🌃" },
      { value: "Vinilos", emoji: "💿" },
      { value: "Festivales", emoji: "🎪" },
      { value: "DJ / producción musical", emoji: "🎛️" },
      { value: "Karaoke", emoji: "🎙️" },
    ],
  },
  {
    name: "Arte y creatividad",
    emoji: "🎨",
    interests: [
      { value: "Arte", emoji: "🎨" },
      { value: "Fotografía", emoji: "📷" },
      { value: "Diseño", emoji: "✏️" },
      { value: "Arquitectura", emoji: "🏛️" },
      { value: "Moda", emoji: "👗" },
      { value: "Estética underground", emoji: "🖤" },
      { value: "Tattoos", emoji: "🖋️" },
      { value: "Graffiti / Street art", emoji: "🎭" },
      { value: "DIY / crafts", emoji: "✂️" },
      { value: "Cerámica", emoji: "🏺" },
    ],
  },
  {
    name: "Cine y series",
    emoji: "🎬",
    interests: [
      { value: "Cine independiente", emoji: "🎬" },
      { value: "Cine de terror y fantástico", emoji: "👻" },
      { value: "Documentales", emoji: "🎞️" },
      { value: "Series", emoji: "📺" },
      { value: "Cine clásico", emoji: "🎥" },
    ],
  },
  {
    name: "Cultura pop y gaming",
    emoji: "🎮",
    interests: [
      { value: "Anime", emoji: "🎌" },
      { value: "Manga", emoji: "📖" },
      { value: "Videojuegos", emoji: "🎮" },
      { value: "Cosplay", emoji: "🦸" },
      { value: "K-pop / K-culture", emoji: "💜" },
    ],
  },
  {
    name: "Lectura y aprendizaje",
    emoji: "📚",
    interests: [
      { value: "Libros", emoji: "📚" },
      { value: "Cómics / novela gráfica", emoji: "💬" },
      { value: "Poesía", emoji: "🪶" },
      { value: "Podcasts", emoji: "🎧" },
      { value: "Historia", emoji: "🏛️" },
      { value: "Filosofía", emoji: "💭" },
      { value: "Idiomas", emoji: "🗣️" },
    ],
  },
  {
    name: "Social y gastronomía",
    emoji: "🍸",
    interests: [
      { value: "Salir de noche", emoji: "🌙" },
      { value: "Bares con personalidad", emoji: "🍸" },
      { value: "Cafés especiales", emoji: "☕" },
      { value: "Brunch", emoji: "🥐" },
      { value: "Vino / catas", emoji: "🍷" },
      { value: "Cócteles", emoji: "🍹" },
      { value: "Foodie / gastronomía", emoji: "🍴" },
      { value: "Cocinar", emoji: "👨‍🍳" },
    ],
  },
  {
    name: "Viajes y experiencias",
    emoji: "✈️",
    interests: [
      { value: "Viajes", emoji: "✈️" },
      { value: "Vida urbana", emoji: "🏙️" },
      { value: "Escapadas rurales", emoji: "🏕️" },
      { value: "Roadtrips", emoji: "🚗" },
      { value: "Mochilero", emoji: "🎒" },
    ],
  },
  {
    name: "Bienestar",
    emoji: "🧘",
    interests: [
      { value: "Cuidado interior", emoji: "🧘" },
      { value: "Yoga / meditación", emoji: "🪷" },
      { value: "Astrología / tarot", emoji: "🔮" },
      { value: "Plantas", emoji: "🌱" },
      { value: "Mascotas", emoji: "🐾" },
    ],
  },
  {
    name: "Deporte y actividades",
    emoji: "⚽",
    interests: [
      { value: "Deportes", emoji: "⚽" },
      { value: "Gym / fitness", emoji: "💪" },
      { value: "Correr", emoji: "🏃" },
      { value: "Bicicleta", emoji: "🚴" },
      { value: "Natación", emoji: "🏊" },
      { value: "Senderismo", emoji: "🥾" },
      { value: "Skate / roller", emoji: "🛹" },
      { value: "Baile", emoji: "💃" },
    ],
  },
  {
    name: "Personalidad",
    emoji: "✨",
    interests: [
      { value: "Humor irónico", emoji: "😏" },
      { value: "Memes", emoji: "🤣" },
      { value: "Activismo", emoji: "✊" },
      { value: "Sostenibilidad", emoji: "♻️" },
      { value: "Tech / startups", emoji: "💻" },
      { value: "Emprendimiento", emoji: "🚀" },
      { value: "Inversiones / crypto", emoji: "📈" },
      { value: "420 friendly", emoji: "🍃" },
    ],
  },
];

// Flatten all interests for backward compatibility
export const CULTURAL_INTERESTS: CulturalInterest[] = CULTURAL_INTERESTS_CATEGORIES.flatMap(cat => cat.interests);

export type CulturalInterestType = string;

export type MusicStyleType = typeof ALL_MUSIC_STYLES[number];
export type VibeType = typeof VIBES[number]["value"];
export type LookingForType = typeof LOOKING_FOR_OPTIONS[number]["value"];
