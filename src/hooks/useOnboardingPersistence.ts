import { useState, useEffect, useCallback } from "react";
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
  hasTattoos: boolean;
  hasPiercings: boolean;
  alternativeAesthetic: boolean;
  coloredHair: boolean;
  shavedHead: boolean;
  vintageStyle: boolean;
  gothicStyle: boolean;
  avatarUrl: string | null;
  bio: string;
  selectedLookingFor: string[];
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
  hasTattoos: false,
  hasPiercings: false,
  alternativeAesthetic: false,
  coloredHair: false,
  shavedHead: false,
  vintageStyle: false,
  gothicStyle: false,
  avatarUrl: null,
  bio: "",
  selectedLookingFor: [],
};

export const useOnboardingPersistence = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load saved state from localStorage
  const loadState = useCallback((): OnboardingState => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults in case new fields were added
        return { ...defaultState, ...parsed };
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
