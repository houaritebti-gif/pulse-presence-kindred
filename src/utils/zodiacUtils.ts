// Zodiac sign calculation utilities

export interface ZodiacSign {
  name: string;
  emoji: string;
  dateRange: string;
}

const ZODIAC_SIGNS: { name: string; emoji: string; startMonth: number; startDay: number; endMonth: number; endDay: number }[] = [
  { name: "Capricornio", emoji: "♑", startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
  { name: "Acuario", emoji: "♒", startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
  { name: "Piscis", emoji: "♓", startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
  { name: "Aries", emoji: "♈", startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
  { name: "Tauro", emoji: "♉", startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
  { name: "Géminis", emoji: "♊", startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
  { name: "Cáncer", emoji: "♋", startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
  { name: "Leo", emoji: "♌", startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  { name: "Virgo", emoji: "♍", startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  { name: "Libra", emoji: "♎", startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
  { name: "Escorpio", emoji: "♏", startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  { name: "Sagitario", emoji: "♐", startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
];

/**
 * Get zodiac sign from a birthdate string
 */
export const getZodiacSign = (birthdate: string | null | undefined): ZodiacSign | null => {
  if (!birthdate) return null;
  
  const birth = new Date(birthdate);
  const month = birth.getMonth() + 1; // JavaScript months are 0-indexed
  const day = birth.getDate();
  
  for (const sign of ZODIAC_SIGNS) {
    // Handle Capricorn which spans two years
    if (sign.startMonth === 12) {
      if ((month === 12 && day >= sign.startDay) || (month === 1 && day <= sign.endDay)) {
        return { name: sign.name, emoji: sign.emoji, dateRange: `${sign.startDay}/12 - ${sign.endDay}/01` };
      }
    } else if (
      (month === sign.startMonth && day >= sign.startDay) ||
      (month === sign.endMonth && day <= sign.endDay)
    ) {
      return { name: sign.name, emoji: sign.emoji, dateRange: `${sign.startDay}/${sign.startMonth} - ${sign.endDay}/${sign.endMonth}` };
    }
  }
  
  return null;
};

/**
 * Get birth year from birthdate
 */
export const getBirthYear = (birthdate: string | null | undefined): number | null => {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  return birth.getFullYear();
};
