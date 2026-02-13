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
  { value: "bigender", label: "Bigénero" },
  { value: "demigender", label: "Demigénero" },
  { value: "demiboy", label: "Demichico" },
  { value: "demigirl", label: "Demichica" },
  { value: "pangender", label: "Pangénero" },
  { value: "androgynous", label: "Andrógino/a" },
  { value: "neutrois", label: "Neutrois" },
  { value: "xenogender", label: "Xenogénero" },
  { value: "two_spirit", label: "Two-Spirit" },
  { value: "muxe", label: "Muxe" },
  { value: "hijra", label: "Hijra" },
  { value: "fa_afafine", label: "Fa'afafine" },
  { value: "questioning", label: "Cuestionando" },
  { value: "other", label: "Otro" },
  { value: "prefer_not_to_say", label: "Prefiero no decir" },
] as const;

export const ALL_GENDERS = [...GENDERS_MAIN, ...GENDERS_EXTENDED] as const;

export type GenderType = typeof ALL_GENDERS[number]["value"];

// ═══════════════════════════════════════════
// TRIBES – 16 closed list, max 3 selectable
// ═══════════════════════════════════════════
export const TRIBES = [
  { value: "Punk / Garage", emoji: "🎸" },
  { value: "Gótica / Dark", emoji: "🦇" },
  { value: "Alternativa", emoji: "🌀" },
  { value: "Artística", emoji: "🎨" },
  { value: "Rave", emoji: "🔊" },
  { value: "Indie", emoji: "🎹" },
  { value: "Queer Scene", emoji: "🌈" },
  { value: "Bohemia", emoji: "🎭" },
  { value: "Vintage", emoji: "📻" },
  { value: "Geek", emoji: "🤓" },
  { value: "Otaku", emoji: "🎌" },
  { value: "Drag", emoji: "👑" },
  { value: "Cultura Digital", emoji: "💻" },
  { value: "Activista", emoji: "✊" },
  { value: "Espiritual", emoji: "🕯️" },
  { value: "Nómada", emoji: "🌍" },
] as const;

export type TribeType = typeof TRIBES[number]["value"];

// ═══════════════════════════════════════════
// MUSIC – 10 flat categories, max 3 selectable
// No sub-genres, each category IS the selectable item
// ═══════════════════════════════════════════
export const MUSIC_STYLES = [
  { value: "Oscura / Dark", emoji: "🖤" },
  { value: "Punk / Garage", emoji: "🎸" },
  { value: "Rock / Alternativo", emoji: "🤘" },
  { value: "Electrónica / Club", emoji: "🎧" },
  { value: "Indie / Pop alternativo", emoji: "🎹" },
  { value: "Hip-Hop / R&B", emoji: "🎤" },
  { value: "Reguetón / Urbana", emoji: "🔥" },
  { value: "Salsa / Tropical", emoji: "💃" },
  { value: "Jazz / Soul / Funk", emoji: "🎷" },
  { value: "Clásica / Instrumental", emoji: "🎻" },
] as const;

// Keep MUSIC_CATEGORIES for backward compatibility but now flat
export const MUSIC_CATEGORIES = MUSIC_STYLES.map(s => ({
  name: s.value,
  styles: [s.value],
}));

// Flatten all music styles for validation
export const ALL_MUSIC_STYLES = MUSIC_STYLES.map(s => s.value);

// ═══════════════════════════════════════════
// VIBES – 12, max 3 selectable (multi-select)
// ═══════════════════════════════════════════
export const VIBES = [
  { value: "Libre", emoji: "🦋" },
  { value: "Salvaje", emoji: "🐆" },
  { value: "Magnética", emoji: "🧲" },
  { value: "Nocturna", emoji: "🌙" },
  { value: "Creativa", emoji: "🎨" },
  { value: "Alternativa", emoji: "🖤" },
  { value: "Inquieta", emoji: "⚡" },
  { value: "Chill", emoji: "😎" },
  { value: "Misteriosa", emoji: "🔮" },
  { value: "Caótica", emoji: "🌪️" },
  { value: "Zen", emoji: "🧘" },
  { value: "Curiosa", emoji: "✨" },
] as const;

// ═══════════════════════════════════════════
// OPTIONAL DETAILS – Lifestyle, Relationships, Family, Health
// ═══════════════════════════════════════════
export const OPTIONAL_DETAILS = [
  // Lifestyle
  { key: "vegan_vegetarian", label: "Vegano / Vegetariano", emoji: "🌱", category: "lifestyle" },
  { key: "flexitarian", label: "Flexitariano", emoji: "🥗", category: "lifestyle" },
  { key: "no_food_labels", label: "Sin etiquetas alimentarias", emoji: "🍽️", category: "lifestyle" },
  { key: "sober", label: "Sobrio", emoji: "💧", category: "lifestyle" },
  { key: "social", label: "Social", emoji: "🥂", category: "lifestyle" },
  { key: "fitness", label: "Fitness", emoji: "💪", category: "lifestyle" },
  { key: "spiritual", label: "Espiritual", emoji: "🕯️", category: "lifestyle" },
  { key: "minimalist", label: "Minimalista", emoji: "◻️", category: "lifestyle" },
  { key: "eco_sustainable", label: "Eco / Sostenible", emoji: "♻️", category: "lifestyle" },
  { key: "digital_nomad", label: "Nómada digital", emoji: "🌍", category: "lifestyle" },

  // Relationship style
  { key: "monogamous", label: "Monógama", emoji: "💑", category: "relationship" },
  { key: "non_monogamous", label: "No monógama", emoji: "💞", category: "relationship" },
  { key: "open_relationship", label: "Abierta", emoji: "💫", category: "relationship" },
  { key: "relationship_anarchy", label: "Anarquía relacional", emoji: "🏴", category: "relationship" },
  { key: "exploring", label: "Explorando", emoji: "🔍", category: "relationship" },
  { key: "not_defined", label: "No definido", emoji: "❓", category: "relationship" },

  // Family
  { key: "no_kids", label: "Sin hijos", emoji: "👤", category: "family" },
  { key: "has_kids", label: "Con hijos", emoji: "👶", category: "family" },
  { key: "wants_kids", label: "Quiero hijos", emoji: "🍼", category: "family" },
  { key: "no_wants_kids", label: "No quiero hijos", emoji: "🚫👶", category: "family" },
  { key: "prefer_not_say_kids", label: "Prefiero no decirlo", emoji: "🤐", category: "family" },

  // Health
  { key: "on_prep", label: "PrEP", emoji: "💊", category: "health" },
  { key: "hiv_undetectable", label: "VIH indetectable", emoji: "🔬", category: "health" },
  { key: "recent_test", label: "Test reciente", emoji: "✅", category: "health" },
  { key: "prefer_to_talk", label: "Prefiero hablarlo", emoji: "💬", category: "health" },
] as const;

export type OptionalDetailKey = typeof OPTIONAL_DETAILS[number]["key"];

// ═══════════════════════════════════════════
// LOOKING FOR – what you're searching for
// ═══════════════════════════════════════════
export const LOOKING_FOR_OPTIONS = [
  { value: "Amistades", emoji: "👯" },
  { value: "Buenas vibras", emoji: "✨" },
  { value: "Aventuras", emoji: "🚀" },
  { value: "Pasar el rato", emoji: "🎉" },
  { value: "Conexiones reales", emoji: "💫" },
  { value: "Lo que surja", emoji: "🌊" },
  { value: "Relación seria", emoji: "💕" },
  { value: "Algo casual", emoji: "🔥" },
  { value: "Compañero/a de actividades", emoji: "🎯" },
  { value: "Networking", emoji: "🤝" },
  { value: "Compañero/a de piso", emoji: "🏠" },
  { value: "Colabs artísticas", emoji: "🎨" },
  { value: "Buddy de gym", emoji: "💪" },
  { value: "Compañero/a de viaje", emoji: "✈️" },
  { value: "Cita para eventos", emoji: "🎭" },
  { value: "Aprender idiomas", emoji: "🗣️" },
  { value: "Comunidad queer", emoji: "🌈" },
  { value: "Mentoría", emoji: "📚" },
] as const;

// ═══════════════════════════════════════════
// INTERESTS – closed list, max 5 selectable
// ═══════════════════════════════════════════
export interface CulturalInterest {
  value: string;
  emoji: string;
}

export interface CulturalInterestCategory {
  name: string;
  emoji: string;
  interests: CulturalInterest[];
}

export const CULTURAL_INTERESTS_CATEGORIES: CulturalInterestCategory[] = [
  {
    name: "Cultura & Escena",
    emoji: "🎤",
    interests: [
      { value: "Conciertos en directo", emoji: "🎤" },
      { value: "Cultura club", emoji: "🌃" },
      { value: "Festivales", emoji: "🎪" },
      { value: "Cine independiente", emoji: "🎬" },
      { value: "Cine de terror", emoji: "👻" },
      { value: "Películas de culto", emoji: "💀" },
      { value: "Cabaret", emoji: "🎪" },
      { value: "Burlesque", emoji: "💋" },
      { value: "Stand-up", emoji: "🎙️" },
      { value: "Improv", emoji: "🎭" },
      { value: "Spoken word", emoji: "📝" },
      { value: "Fanzines", emoji: "📰" },
    ],
  },
  {
    name: "Arte & Creatividad",
    emoji: "🎨",
    interests: [
      { value: "Arte contemporáneo", emoji: "🎨" },
      { value: "Fotografía", emoji: "📷" },
      { value: "Diseño", emoji: "✏️" },
      { value: "Ilustración", emoji: "🖼️" },
      { value: "Street art", emoji: "🎭" },
      { value: "Tatuajes", emoji: "🖋️" },
      { value: "Performance", emoji: "🎪" },
      { value: "Escritura creativa", emoji: "✍️" },
      { value: "DJ", emoji: "🎛️" },
      { value: "Producción musical", emoji: "🎵" },
      { value: "Moda alternativa", emoji: "👗" },
      { value: "Dirección creativa", emoji: "🎬" },
    ],
  },
  {
    name: "Cultura Digital & Tech",
    emoji: "💻",
    interests: [
      { value: "Inteligencia artificial", emoji: "🤖" },
      { value: "UX/UI", emoji: "📱" },
      { value: "Programación", emoji: "💻" },
      { value: "Startups", emoji: "🚀" },
      { value: "Cultura digital", emoji: "🌐" },
      { value: "Videojuegos", emoji: "🎮" },
    ],
  },
  {
    name: "Vida & Ocio",
    emoji: "🍸",
    interests: [
      { value: "Viajes", emoji: "✈️" },
      { value: "Bares con personalidad", emoji: "🍸" },
      { value: "Cafés especiales", emoji: "☕" },
      { value: "Vino", emoji: "🍷" },
      { value: "Cócteles", emoji: "🍹" },
      { value: "Naturaleza", emoji: "🌿" },
      { value: "Senderismo", emoji: "🥾" },
      { value: "Surf", emoji: "🏄" },
      { value: "Skate", emoji: "🛹" },
      { value: "Yoga", emoji: "🧘" },
      { value: "Meditación", emoji: "🪷" },
      { value: "Astrología", emoji: "🔮" },
    ],
  },
  {
    name: "Comunidad & Pensamiento",
    emoji: "✊",
    interests: [
      { value: "Activismo", emoji: "✊" },
      { value: "Feminismo", emoji: "♀️" },
      { value: "Cultura queer", emoji: "🏳️‍🌈" },
      { value: "Derechos humanos", emoji: "⚖️" },
      { value: "Filosofía", emoji: "💭" },
      { value: "Psicología", emoji: "🧠" },
      { value: "Literatura", emoji: "📚" },
      { value: "Política cultural", emoji: "🗳️" },
    ],
  },
  {
    name: "Extra",
    emoji: "✨",
    interests: [
      { value: "Series", emoji: "📺" },
      { value: "Documentales", emoji: "🎞️" },
      { value: "Podcast", emoji: "🎧" },
      { value: "Cocina creativa", emoji: "👨‍🍳" },
      { value: "Mercadillos", emoji: "🧺" },
      { value: "Viajar sin plan", emoji: "🌊" },
      { value: "Minimalismo", emoji: "◻️" },
      { value: "Diseño de interiores", emoji: "🏠" },
      { value: "Fotografía analógica", emoji: "📸" },
      { value: "Artes escénicas", emoji: "🎭" },
      { value: "Clubbing internacional", emoji: "🌃" },
      { value: "Cultura underground", emoji: "🖤" },
    ],
  },
];

// Flatten all interests for backward compatibility
export const CULTURAL_INTERESTS: CulturalInterest[] = CULTURAL_INTERESTS_CATEGORIES.flatMap(cat => cat.interests);

export type CulturalInterestType = string;

export type MusicStyleType = typeof ALL_MUSIC_STYLES[number];
export type VibeType = typeof VIBES[number]["value"];
export type LookingForType = typeof LOOKING_FOR_OPTIONS[number]["value"];

// Helper function to get optional details by category
export const getOptionalDetailsByCategory = (category: string) => 
  OPTIONAL_DETAILS.filter(detail => detail.category === category);

// Categories for optional details display
export const OPTIONAL_DETAIL_CATEGORIES = [
  { key: "lifestyle", label: "Estilo de vida", emoji: "🌱" },
  { key: "relationship", label: "Relaciones", emoji: "💞" },
  { key: "family", label: "Familia", emoji: "👨‍👩‍👧" },
  { key: "health", label: "Salud", emoji: "❤️‍🩹" },
] as const;
