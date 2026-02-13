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
  { value: "Hippie", emoji: "☮️" },
  { value: "Rave", emoji: "🔊" },
  { value: "K-Pop / K-Culture", emoji: "💜" },
  { value: "Gamer", emoji: "🎮" },
  { value: "Geek / Nerd", emoji: "🤓" },
  { value: "Metalera", emoji: "🤘" },
  { value: "Skater", emoji: "🛹" },
  { value: "Drag / Ballroom", emoji: "👑" },
  { value: "Bear / Leather", emoji: "🐻" },
  { value: "Fitness", emoji: "💪" },
  { value: "Cosplayer", emoji: "🦸" },
  { value: "Techie", emoji: "💻" },
  { value: "Bohemia", emoji: "🎭" },
  { value: "Vintage", emoji: "📻" },
] as const;

export type TribeType = typeof TRIBES[number]["value"];

// Music styles MVP - grouped by categories
export const MUSIC_CATEGORIES = [
  {
    name: "Oscura / alternativa",
    styles: ["Post-punk", "Darkwave", "Gothic", "Industrial"],
  },
  {
    name: "Rock / guitarras",
    styles: ["Rock", "Punk", "Grunge", "Indie rock", "Metal", "Shoegaze", "Post-rock"],
  },
  {
    name: "Electrónica / club",
    styles: ["Techno", "House", "EBM", "Electro", "Minimal", "Trance", "Drum and bass"],
  },
  {
    name: "Pop / alternativo",
    styles: ["Indie pop", "Synth-pop", "New wave", "Dream pop", "K-pop"],
  },
  {
    name: "Urbana / hip hop",
    styles: ["Hip hop", "Trap", "R&B", "Rap"],
  },
  {
    name: "Latina / reggaetón",
    styles: ["Reggaeton", "Latin trap", "Neo-perreo"],
  },
  {
    name: "Tropical / tradicional",
    styles: ["Salsa", "Cumbia", "Tango", "Bossa nova", "Flamenco"],
  },
  {
    name: "Folk / raíz",
    styles: ["Folk", "Country", "Blues"],
  },
  {
    name: "Reggae / dub",
    styles: ["Reggae", "Dub", "Ska"],
  },
  {
    name: "Jazz / soul / funk",
    styles: ["Jazz", "Soul", "Funk", "Disco", "Neo-soul"],
  },
  {
    name: "Clásica / orquestal",
    styles: ["Clásica", "Ópera", "Banda sonora"],
  },
  {
    name: "Mundial / étnica",
    styles: ["Afrobeat", "World music", "Celtic"],
  },
  {
    name: "Experimental / otros",
    styles: ["Experimental", "Ambient", "Vaporwave", "IDM"],
  },
] as const;

// Flatten all music styles for validation
export const ALL_MUSIC_STYLES = MUSIC_CATEGORIES.flatMap(cat => cat.styles);

// Vibes with emojis - expanded
export const VIBES = [
  { value: "Tranqui", emoji: "🌙" },
  { value: "Intensa", emoji: "🔥" },
  { value: "Curiosa", emoji: "✨" },
  { value: "Misteriosa", emoji: "🖤" },
  { value: "Libre", emoji: "🦋" },
  { value: "Romántica", emoji: "💕" },
  { value: "Aventurera", emoji: "🚀" },
  { value: "Creativa", emoji: "🎨" },
  { value: "Melancólica", emoji: "🌧️" },
  { value: "Salvaje", emoji: "🐆" },
  { value: "Zen", emoji: "🧘" },
  { value: "Caótica", emoji: "🌪️" },
  { value: "Soñadora", emoji: "☁️" },
  { value: "Chill", emoji: "😎" },
  { value: "Energética", emoji: "⚡" },
  { value: "Noctámbula", emoji: "🦉" },
] as const;

// Optional details / Aesthetic options - expanded with more categories
export const OPTIONAL_DETAILS = [
  // Aesthetic
  { key: "has_tattoos", label: "Tatuajes", emoji: "🖋️", category: "aesthetic" },
  { key: "has_piercings", label: "Piercings", emoji: "💎", category: "aesthetic" },
  { key: "alternative_aesthetic", label: "Estética alternativa", emoji: "🖤", category: "aesthetic" },
  { key: "colored_hair", label: "Pelo de colores", emoji: "🌈", category: "aesthetic" },
  { key: "shaved_head", label: "Cabeza rapada / Undercut", emoji: "💈", category: "aesthetic" },
  { key: "vintage_style", label: "Ropa vintage / Thrift", emoji: "👗", category: "aesthetic" },
  { key: "gothic_style", label: "Estilo gótico / Dark", emoji: "🦇", category: "aesthetic" },
  { key: "has_beard", label: "Barba", emoji: "🧔", category: "aesthetic" },
  { key: "has_glasses", label: "Gafas", emoji: "👓", category: "aesthetic" },
  { key: "has_scars", label: "Cicatrices visibles", emoji: "⚔️", category: "body" },
  
  // Body type
  { key: "body_slim", label: "Delgado/a", emoji: "🧍", category: "body" },
  { key: "body_athletic", label: "Atlético/a", emoji: "💪", category: "body" },
  { key: "body_average", label: "Normal", emoji: "👤", category: "body" },
  { key: "body_curvy", label: "Curvy", emoji: "🍑", category: "body" },
  { key: "body_plus", label: "Grande / Plus size", emoji: "🐻", category: "body" },
  
  // Disabilities / conditions (optional disclosure)
  { key: "has_disability", label: "Tengo alguna discapacidad", emoji: "♿", category: "accessibility" },
  { key: "wheelchair_user", label: "Usuario/a de silla de ruedas", emoji: "🦽", category: "accessibility" },
  { key: "visual_impairment", label: "Discapacidad visual", emoji: "👁️", category: "accessibility" },
  { key: "hearing_impairment", label: "Discapacidad auditiva", emoji: "👂", category: "accessibility" },
  { key: "chronic_illness", label: "Enfermedad crónica", emoji: "💊", category: "accessibility" },
  { key: "neurodivergent", label: "Neurodivergente", emoji: "🧠", category: "accessibility" },
  { key: "has_prosthetic", label: "Prótesis / Amputación", emoji: "🦾", category: "accessibility" },
  
  // Religion / spirituality
  { key: "spiritual", label: "Espiritual", emoji: "🕯️", category: "beliefs" },
  { key: "atheist", label: "Ateo/a", emoji: "🔬", category: "beliefs" },
  { key: "agnostic", label: "Agnóstico/a", emoji: "❓", category: "beliefs" },
  { key: "buddhist", label: "Budista", emoji: "☸️", category: "beliefs" },
  { key: "christian", label: "Cristiano/a", emoji: "✝️", category: "beliefs" },
  { key: "jewish", label: "Judío/a", emoji: "✡️", category: "beliefs" },
  { key: "muslim", label: "Musulmán/a", emoji: "☪️", category: "beliefs" },
  { key: "hindu", label: "Hindú", emoji: "🕉️", category: "beliefs" },
  { key: "pagan", label: "Pagano/a / Wicca", emoji: "🌙", category: "beliefs" },
  { key: "other_religion", label: "Otra religión", emoji: "🙏", category: "beliefs" },
  
  // Lifestyle
  { key: "vegan", label: "Vegano/a", emoji: "🌱", category: "lifestyle" },
  { key: "vegetarian", label: "Vegetariano/a", emoji: "🥗", category: "lifestyle" },
  { key: "sober", label: "No bebo alcohol", emoji: "🚫🍺", category: "lifestyle" },
  { key: "sober_curious", label: "Sober curious", emoji: "💧", category: "lifestyle" },
  { key: "smoker", label: "Fumador/a", emoji: "🚬", category: "lifestyle" },
  { key: "non_smoker", label: "No fumador/a", emoji: "🚭", category: "lifestyle" },
  { key: "cannabis_friendly", label: "420 friendly", emoji: "🍃", category: "lifestyle" },
  { key: "party_drugs", label: "Party friendly", emoji: "💊", category: "lifestyle" },
  { key: "drug_free", label: "Drug free", emoji: "🚫💊", category: "lifestyle" },
  
  // Relationship style
  { key: "polyamorous", label: "Poliamoroso/a", emoji: "💞", category: "relationship" },
  { key: "open_relationship", label: "Relación abierta", emoji: "💫", category: "relationship" },
  { key: "monogamous", label: "Monógamo/a", emoji: "💑", category: "relationship" },
  { key: "relationship_anarchy", label: "Anarquía relacional", emoji: "🏴", category: "relationship" },
  
  // Kids / pets
  { key: "has_kids", label: "Tengo hijos", emoji: "👶", category: "family" },
  { key: "wants_kids", label: "Quiero tener hijos", emoji: "🍼", category: "family" },
  { key: "no_kids", label: "No quiero hijos", emoji: "🚫👶", category: "family" },
  { key: "has_pets", label: "Tengo mascotas", emoji: "🐾", category: "family" },
  
  // Other
  { key: "hiv_positive", label: "VIH positivo", emoji: "🔴", category: "health" },
  { key: "on_prep", label: "Tomo PrEP", emoji: "💊", category: "health" },
] as const;

export type OptionalDetailKey = typeof OPTIONAL_DETAILS[number]["key"];

// Looking for options with emojis - expanded
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

// Cultural interests organized by categories - expanded
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
      { value: "Jam sessions", emoji: "🎸" },
      { value: "Open mics", emoji: "🎤" },
      { value: "Raves", emoji: "🔊" },
      { value: "Bandas tributo", emoji: "🎵" },
      { value: "Música en vivo", emoji: "🎹" },
      { value: "Coleccionar música", emoji: "📀" },
      { value: "Cantar", emoji: "🎶" },
      { value: "Tocar instrumentos", emoji: "🎻" },
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
      { value: "Escultura", emoji: "🗿" },
      { value: "Ilustración", emoji: "🖼️" },
      { value: "Collage", emoji: "📰" },
      { value: "Performance art", emoji: "🎪" },
      { value: "Bordado / Tejido", emoji: "🧶" },
      { value: "Joyería handmade", emoji: "💍" },
      { value: "Lettering / Caligrafía", emoji: "✒️" },
      { value: "Pintura digital", emoji: "🖥️" },
      { value: "Animación", emoji: "🎞️" },
      { value: "3D / Modelado", emoji: "🧊" },
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
      { value: "Cine de autor", emoji: "🎭" },
      { value: "Cine asiático", emoji: "🎌" },
      { value: "Cine europeo", emoji: "🇪🇺" },
      { value: "Ciencia ficción", emoji: "🚀" },
      { value: "Film noir", emoji: "🎩" },
      { value: "Cortometrajes", emoji: "📽️" },
      { value: "True crime", emoji: "🔍" },
      { value: "Películas LGBTQ+", emoji: "🏳️‍🌈" },
      { value: "Comedia", emoji: "😂" },
      { value: "Drama", emoji: "🎭" },
      { value: "Animación / Pixar", emoji: "🎨" },
      { value: "Películas de culto", emoji: "💀" },
      { value: "Maratones de películas", emoji: "🍿" },
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
      { value: "Retrogaming", emoji: "👾" },
      { value: "Juegos de mesa", emoji: "🎲" },
      { value: "Rol / D&D", emoji: "🐉" },
      { value: "TCG / cartas", emoji: "🃏" },
      { value: "E-sports", emoji: "🏆" },
      { value: "Streaming", emoji: "📡" },
      { value: "Nintendo", emoji: "🍄" },
      { value: "PlayStation", emoji: "🎯" },
      { value: "PC gaming", emoji: "💻" },
      { value: "VR / Realidad virtual", emoji: "🥽" },
      { value: "Indie games", emoji: "🎲" },
      { value: "Cultura otaku", emoji: "🇯🇵" },
      { value: "Comics / Marvel / DC", emoji: "🦇" },
      { value: "Star Wars", emoji: "⭐" },
      { value: "Harry Potter", emoji: "⚡" },
      { value: "Señor de los Anillos", emoji: "💍" },
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
      { value: "Ciencia", emoji: "🔬" },
      { value: "Psicología", emoji: "🧠" },
      { value: "Escritura creativa", emoji: "✍️" },
      { value: "Ensayo", emoji: "📝" },
      { value: "Fanzines", emoji: "📰" },
      { value: "Ciencia ficción literaria", emoji: "🚀" },
      { value: "Fantasía épica", emoji: "🐉" },
      { value: "Novela romántica", emoji: "💕" },
      { value: "Thriller / misterio", emoji: "🔍" },
      { value: "Autoayuda", emoji: "💪" },
      { value: "Biografías", emoji: "📖" },
      { value: "Audiolibros", emoji: "🎧" },
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
      { value: "Cerveza artesanal", emoji: "🍺" },
      { value: "Mercados locales", emoji: "🧺" },
      { value: "Comida vegana", emoji: "🥬" },
      { value: "Street food", emoji: "🌮" },
      { value: "Repostería", emoji: "🧁" },
      { value: "Comida asiática", emoji: "🍜" },
      { value: "Comida mexicana", emoji: "🌯" },
      { value: "Comida italiana", emoji: "🍝" },
      { value: "Sushi", emoji: "🍣" },
      { value: "BBQ", emoji: "🍖" },
      { value: "Té / infusiones", emoji: "🍵" },
      { value: "Picnics", emoji: "🧺" },
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
      { value: "Turismo cultural", emoji: "🏛️" },
      { value: "Playa", emoji: "🏖️" },
      { value: "Montaña", emoji: "⛰️" },
      { value: "Ciudades europeas", emoji: "🇪🇺" },
      { value: "Asia", emoji: "🌏" },
      { value: "Latinoamérica", emoji: "🌎" },
      { value: "USA / Canadá", emoji: "🇺🇸" },
      { value: "África", emoji: "🌍" },
      { value: "Oceanía", emoji: "🦘" },
      { value: "Cruceros", emoji: "🛳️" },
      { value: "Camping", emoji: "⛺" },
      { value: "Glamping", emoji: "🏕️" },
      { value: "Turismo gastronómico", emoji: "🍽️" },
      { value: "Viajes LGBTQ+ friendly", emoji: "🏳️‍🌈" },
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
      { value: "Mindfulness", emoji: "🧠" },
      { value: "Terapia", emoji: "💬" },
      { value: "Skincare", emoji: "✨" },
      { value: "Aromaterapia", emoji: "🕯️" },
      { value: "Rituales", emoji: "🌙" },
      { value: "Spa / masajes", emoji: "💆" },
      { value: "Nutrición", emoji: "🥗" },
      { value: "Ayuno intermitente", emoji: "⏰" },
      { value: "Cristales / piedras", emoji: "💎" },
      { value: "Reiki", emoji: "🙌" },
      { value: "Breathwork", emoji: "🌬️" },
      { value: "Journaling", emoji: "📓" },
      { value: "Manifestación", emoji: "✨" },
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
      { value: "Escalada", emoji: "🧗" },
      { value: "Surf", emoji: "🏄" },
      { value: "Artes marciales", emoji: "🥋" },
      { value: "Pilates", emoji: "🤸" },
      { value: "Crossfit", emoji: "🏋️" },
      { value: "Boxeo", emoji: "🥊" },
      { value: "Tenis / Pádel", emoji: "🎾" },
      { value: "Baloncesto", emoji: "🏀" },
      { value: "Fútbol", emoji: "⚽" },
      { value: "Volleyball", emoji: "🏐" },
      { value: "Snowboard / Ski", emoji: "🏂" },
      { value: "Kayak / Paddleboard", emoji: "🛶" },
      { value: "Polo acuático", emoji: "🤽" },
      { value: "Golf", emoji: "⛳" },
      { value: "Ultimate frisbee", emoji: "🥏" },
    ],
  },
  {
    name: "Escena y comunidad",
    emoji: "🌈",
    interests: [
      { value: "Cultura queer", emoji: "🏳️‍🌈" },
      { value: "Drag", emoji: "👑" },
      { value: "Ballroom", emoji: "💃" },
      { value: "Comunidad LGBTQ+", emoji: "🌈" },
      { value: "Activismo queer", emoji: "✊" },
      { value: "Safe spaces", emoji: "💜" },
      { value: "Orgullo", emoji: "🎉" },
      { value: "Historia LGBTQ+", emoji: "📚" },
      { value: "Allies", emoji: "🤝" },
      { value: "Trans visibility", emoji: "🏳️‍⚧️" },
      { value: "Queer art", emoji: "🎨" },
      { value: "Voguing", emoji: "💅" },
      { value: "Leather / kink community", emoji: "⛓️" },
      { value: "Bear community", emoji: "🐻" },
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
      { value: "Introvertido", emoji: "🌙" },
      { value: "Extrovertido", emoji: "☀️" },
      { value: "Noctámbulo", emoji: "🦉" },
      { value: "Madrugador", emoji: "🌅" },
      { value: "Feminismo", emoji: "♀️" },
      { value: "Antifascismo", emoji: "🚫" },
      { value: "Ecologismo", emoji: "🌍" },
      { value: "Voluntariado", emoji: "🤲" },
      { value: "Derechos animales", emoji: "🐾" },
      { value: "Política", emoji: "🗳️" },
      { value: "Justicia social", emoji: "⚖️" },
    ],
  },
  {
    name: "Teatro y escénicas",
    emoji: "🎭",
    interests: [
      { value: "Teatro", emoji: "🎭" },
      { value: "Musicales", emoji: "🎤" },
      { value: "Stand-up comedy", emoji: "🎙️" },
      { value: "Impro", emoji: "🎪" },
      { value: "Ópera", emoji: "🎶" },
      { value: "Danza contemporánea", emoji: "💃" },
      { value: "Circo", emoji: "🤹" },
      { value: "Monólogos", emoji: "🎭" },
      { value: "Ballet", emoji: "🩰" },
      { value: "Teatro experimental", emoji: "🔮" },
      { value: "Cabaret", emoji: "🎪" },
      { value: "Burlesque", emoji: "💋" },
      { value: "Spoken word", emoji: "🎤" },
      { value: "Poetry slam", emoji: "📝" },
    ],
  },
  {
    name: "Tecnología",
    emoji: "💻",
    interests: [
      { value: "Programación", emoji: "💻" },
      { value: "Diseño UX/UI", emoji: "📱" },
      { value: "Inteligencia artificial", emoji: "🤖" },
      { value: "Blockchain / Web3", emoji: "🔗" },
      { value: "Ciberseguridad", emoji: "🔒" },
      { value: "Open source", emoji: "🌐" },
      { value: "Home automation", emoji: "🏠" },
      { value: "Gadgets", emoji: "📟" },
      { value: "Drones", emoji: "🚁" },
      { value: "Impresión 3D", emoji: "🖨️" },
      { value: "Robótica", emoji: "🦾" },
    ],
  },
  {
    name: "Naturaleza y aire libre",
    emoji: "🌲",
    interests: [
      { value: "Jardinería", emoji: "🌻" },
      { value: "Huerto urbano", emoji: "🥕" },
      { value: "Observación de aves", emoji: "🦜" },
      { value: "Astronomía", emoji: "🔭" },
      { value: "Fotografía de naturaleza", emoji: "📸" },
      { value: "Buceo / snorkel", emoji: "🤿" },
      { value: "Pesca", emoji: "🎣" },
      { value: "Acampada", emoji: "🏕️" },
      { value: "Paseos por la playa", emoji: "🏖️" },
      { value: "Recogida de setas", emoji: "🍄" },
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
  { key: "aesthetic", label: "Estética", emoji: "🖤" },
  { key: "body", label: "Cuerpo", emoji: "👤" },
  { key: "accessibility", label: "Accesibilidad", emoji: "♿" },
  { key: "beliefs", label: "Creencias", emoji: "🕯️" },
  { key: "lifestyle", label: "Estilo de vida", emoji: "🌱" },
  { key: "relationship", label: "Relaciones", emoji: "💞" },
  { key: "family", label: "Familia", emoji: "👨‍👩‍👧" },
  { key: "health", label: "Salud", emoji: "❤️‍🩹" },
] as const;