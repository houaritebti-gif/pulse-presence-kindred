export interface ProfilePrompt {
  key: string;
  question: string;
  emoji: string;
  placeholder: string;
  maxLength: number;
}

export const AVAILABLE_PROMPTS: ProfilePrompt[] = [
  {
    key: 'two_truths_lie',
    question: 'Dos verdades y una mentira',
    emoji: '🎭',
    placeholder: 'Ej: He nadado con tiburones, hablo 4 idiomas, nunca he visto Star Wars',
    maxLength: 200
  },
  {
    key: 'perfect_sunday',
    question: 'Mi plan perfecto de domingo',
    emoji: '☀️',
    placeholder: 'Ej: Brunch tardío, paseo por el parque, maratón de series...',
    maxLength: 150
  },
  {
    key: 'unpopular_opinion',
    question: 'Mi opinión impopular',
    emoji: '🔥',
    placeholder: 'Ej: La pizza con piña es la mejor',
    maxLength: 150
  },
  {
    key: 'superpower',
    question: 'El superpoder que elegiría',
    emoji: '✨',
    placeholder: 'Ej: Teletransportación para viajar gratis',
    maxLength: 150
  },
  {
    key: 'guilty_pleasure',
    question: 'Mi guilty pleasure',
    emoji: '🙈',
    placeholder: 'Ej: Reality shows de citas mientras como helado',
    maxLength: 150
  },
  {
    key: 'useless_skill',
    question: 'Mi talento más inútil',
    emoji: '🎪',
    placeholder: 'Ej: Puedo hacer el ruido del delfín',
    maxLength: 150
  },
  {
    key: 'best_travel',
    question: 'El mejor viaje de mi vida',
    emoji: '✈️',
    placeholder: 'Ej: Islandia viendo auroras boreales',
    maxLength: 150
  },
  {
    key: 'deal_breaker',
    question: 'Lo que no soporto',
    emoji: '🚫',
    placeholder: 'Ej: Gente que mastica con la boca abierta',
    maxLength: 150
  },
  {
    key: 'random_fact',
    question: 'Dato random sobre mí',
    emoji: '🎲',
    placeholder: 'Ej: Colecciono imanes de nevera de todos mis viajes',
    maxLength: 150
  },
  {
    key: 'dream_dinner',
    question: 'Cena ideal con 3 personas',
    emoji: '🍽️',
    placeholder: 'Ej: Freddie Mercury, mi abuela, y Bad Bunny',
    maxLength: 150
  },
  {
    key: 'if_i_won_lottery',
    question: 'Si ganara la lotería...',
    emoji: '💰',
    placeholder: 'Ej: Casa en la playa y viajar por el mundo',
    maxLength: 150
  },
  {
    key: 'worst_date',
    question: 'La peor cita de mi vida',
    emoji: '😬',
    placeholder: 'Ej: Me dejaron plantade en el restaurante',
    maxLength: 150
  }
];

export const getPromptByKey = (key: string): ProfilePrompt | undefined => {
  return AVAILABLE_PROMPTS.find(p => p.key === key);
};

export const MAX_PROMPTS_PER_PROFILE = 3;
