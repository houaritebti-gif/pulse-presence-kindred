import { useState, useCallback } from "react";
import { GenderType } from "@/constants/profileOptions";

const STORAGE_KEY = "kiki_onboarding_progress";

export interface OnboardingState {
  step: number;
  name: string;
  city: string;
  zone: string;
  birthdate: string | null;
  selectedGender: GenderType | null;
  selectedGenderPreferences: GenderType[];
  selectedInterests: string[];
  selectedVibe: string | null;
  selectedTribes: string[];
  selectedMusicStyles: string[];
  avatarUrl: string | null;
  bio: string;
  selectedLookingFor: string[];
  // Dynamic optional details as object
  optionalDetails: Record<string, boolean>;
}

const defaultState: OnboardingState = {
  step: 1,
  name: "",
  city: "Madrid",
  zone: "",
  birthdate: null,
  selectedGender: null,
  selectedGenderPreferences: [],
  selectedInterests: [],
  selectedVibe: null,
  selectedTribes: [],
  selectedMusicStyles: [],
  avatarUrl: null,
  bio: "",
  selectedLookingFor: [],
  optionalDetails: {},
};

// Migration function to convert old format to new format
const migrateOldState = (parsed: any): OnboardingState => {
  // If already has optionalDetails, use it
  if (parsed.optionalDetails) {
    return { ...defaultState, ...parsed };
  }
  
  // Migrate from old individual fields to new optionalDetails object
  const optionalDetails: Record<string, boolean> = {};
  
  if (parsed.hasTattoos) optionalDetails.has_tattoos = true;
  if (parsed.hasPiercings) optionalDetails.has_piercings = true;
  if (parsed.alternativeAesthetic) optionalDetails.alternative_aesthetic = true;
  if (parsed.coloredHair) optionalDetails.colored_hair = true;
  if (parsed.shavedHead) optionalDetails.shaved_head = true;
  if (parsed.vintageStyle) optionalDetails.vintage_style = true;
  if (parsed.gothicStyle) optionalDetails.gothic_style = true;
  
  // Remove old fields and add new optionalDetails
  const { 
    hasTattoos, hasPiercings, alternativeAesthetic, 
    coloredHair, shavedHead, vintageStyle, gothicStyle,
    ...rest 
  } = parsed;
  
  return { ...defaultState, ...rest, optionalDetails };
};

export const useOnboardingPersistence = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load saved state from localStorage
  const loadState = useCallback((): OnboardingState => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate and merge with defaults in case new fields were added
        return migrateOldState(parsed);
      }
    } catch (e) {
      console.warn("Failed to load onboarding state:", e);
    }
    return defaultState;
  }, []);

  // Save state to localStorage
  const saveState = useCallback((state: Partial<OnboardingState>) => {
    try {
      const current = loadState();
      const updated = { ...current, ...state };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save onboarding state:", e);
    }
  }, [loadState]);

  // Clear saved state (call on successful completion)
  const clearState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear onboarding state:", e);
    }
  }, []);

  // Get initial state
  const getInitialState = useCallback(() => {
    const state = loadState();
    setIsLoaded(true);
    return state;
  }, [loadState]);

  return {
    loadState,
    saveState,
    clearState,
    getInitialState,
    isLoaded,
    defaultState,
  };
};