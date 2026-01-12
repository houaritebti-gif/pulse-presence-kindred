// Hook to calculate profile completeness percentage
import { useMemo } from "react";
import { Profile } from "@/hooks/useProfile";

interface ProfileCompletenessResult {
  percentage: number;
  missingFields: string[];
  completedFields: string[];
  totalFields: number;
}

interface ProfileField {
  key: string;
  label: string;
  check: (profile: any, extra?: any) => boolean;
  weight: number; // Some fields are more important
}

const PROFILE_FIELDS: ProfileField[] = [
  { key: "name", label: "Nombre", check: (p) => !!p?.name?.trim(), weight: 1 },
  { key: "avatar", label: "Foto de perfil", check: (p) => !!p?.avatar_url, weight: 1 },
  { key: "birthdate", label: "Fecha de nacimiento", check: (p) => !!p?.birthdate, weight: 1 },
  { key: "gender", label: "Género", check: (p) => !!p?.gender, weight: 1 },
  { key: "city", label: "Ciudad", check: (p) => !!p?.city, weight: 1 },
  { key: "bio", label: "Bio", check: (p) => !!p?.bio?.trim(), weight: 1 },
  { key: "vibe", label: "Vibra", check: (p) => !!p?.vibe, weight: 0.5 },
  { key: "looking_for", label: "Qué buscas", check: (p) => p?.looking_for?.length > 0, weight: 1 },
  { key: "tribes", label: "Tribus", check: (_, e) => e?.tribes?.length > 0, weight: 0.5 },
  { key: "music_styles", label: "Estilos musicales", check: (_, e) => e?.musicStyles?.length > 0, weight: 0.5 },
  { key: "interests", label: "Intereses culturales", check: (_, e) => e?.interests?.length >= 3, weight: 1 },
  { key: "photos", label: "Galería de fotos", check: (_, e) => e?.photos?.length > 0, weight: 0.5 },
];

/**
 * Calculate profile completeness based on filled fields
 */
export const calculateProfileCompleteness = (
  profile: Profile | null | undefined,
  extra?: {
    tribes?: string[];
    musicStyles?: string[];
    interests?: string[];
    photos?: { photo_url: string }[];
  }
): ProfileCompletenessResult => {
  if (!profile) {
    return {
      percentage: 0,
      missingFields: PROFILE_FIELDS.map(f => f.label),
      completedFields: [],
      totalFields: PROFILE_FIELDS.length,
    };
  }

  const missingFields: string[] = [];
  const completedFields: string[] = [];
  let totalWeight = 0;
  let completedWeight = 0;

  for (const field of PROFILE_FIELDS) {
    totalWeight += field.weight;
    if (field.check(profile, extra)) {
      completedWeight += field.weight;
      completedFields.push(field.label);
    } else {
      missingFields.push(field.label);
    }
  }

  const percentage = Math.round((completedWeight / totalWeight) * 100);

  return {
    percentage,
    missingFields,
    completedFields,
    totalFields: PROFILE_FIELDS.length,
  };
};

/**
 * Hook to get profile completeness for the current user
 */
export const useProfileCompleteness = (
  profile: Profile | null | undefined,
  tribes?: string[],
  musicStyles?: string[],
  interests?: string[],
  photos?: { photo_url: string }[]
): ProfileCompletenessResult => {
  return useMemo(() => {
    return calculateProfileCompleteness(profile, {
      tribes,
      musicStyles,
      interests,
      photos,
    });
  }, [profile, tribes, musicStyles, interests, photos]);
};
