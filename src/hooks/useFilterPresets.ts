import { useState, useEffect, useCallback } from "react";
import { PresenceFilters } from "@/components/PresenceFilters";

export interface FilterPreset {
  id: string;
  name: string;
  emoji: string;
  filters: PresenceFilters;
  createdAt: number;
}

const STORAGE_KEY = "kiki_filter_presets";

// Emoji options for presets
const PRESET_EMOJIS = ["💫", "🔥", "💖", "⭐", "🌟", "✨", "🎯", "💎", "🦋", "🌈", "🎶", "🖤"];

const getRandomEmoji = (): string => {
  return PRESET_EMOJIS[Math.floor(Math.random() * PRESET_EMOJIS.length)];
};

// Default empty filters
const getEmptyFilters = (): PresenceFilters => ({
  tribes: [],
  musicStyles: [],
  details: [],
  lookingFor: [],
  genders: [],
  cities: [],
  interests: [],
  showAllProfiles: false,
  ageRange: undefined,
  minCompatibility: undefined,
});

export function useFilterPresets() {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPresets(parsed);
        }
      }
    } catch (error) {
      console.error("Error loading filter presets:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save presets to localStorage whenever they change
  const saveToStorage = useCallback((newPresets: FilterPreset[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
    } catch (error) {
      console.error("Error saving filter presets:", error);
    }
  }, []);

  const addPreset = useCallback((name: string, filters: PresenceFilters) => {
    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: name.trim() || `Preset ${presets.length + 1}`,
      emoji: getRandomEmoji(),
      filters: { ...filters },
      createdAt: Date.now(),
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    saveToStorage(updated);
    return newPreset;
  }, [presets, saveToStorage]);

  const deletePreset = useCallback((id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    saveToStorage(updated);
  }, [presets, saveToStorage]);

  const updatePreset = useCallback((id: string, name: string, filters: PresenceFilters) => {
    const updated = presets.map((p) =>
      p.id === id ? { ...p, name: name.trim() || p.name, filters: { ...filters } } : p
    );
    setPresets(updated);
    saveToStorage(updated);
  }, [presets, saveToStorage]);

  const getActiveFilterCount = useCallback((filters: PresenceFilters): number => {
    const hasAgeFilter = filters.ageRange && (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 99);
    const hasCompatibilityFilter = filters.minCompatibility && filters.minCompatibility > 0;
    
    return (
      (filters.tribes?.length ?? 0) +
      (filters.musicStyles?.length ?? 0) +
      (filters.details?.length ?? 0) +
      (filters.lookingFor?.length ?? 0) +
      (filters.genders?.length ?? 0) +
      (filters.cities?.length ?? 0) +
      (filters.interests?.length ?? 0) +
      (hasAgeFilter ? 1 : 0) +
      (hasCompatibilityFilter ? 1 : 0)
    );
  }, []);

  return {
    presets,
    isLoaded,
    addPreset,
    deletePreset,
    updatePreset,
    getActiveFilterCount,
    getEmptyFilters,
  };
}
