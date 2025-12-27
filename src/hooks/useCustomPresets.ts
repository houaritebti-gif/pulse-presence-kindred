import { useState, useEffect, useCallback } from "react";
import { ImageFilterValues } from "@/components/ImageFilters";

export interface CustomPreset {
  id: string;
  name: string;
  values: ImageFilterValues;
  gradient: string;
  createdAt: number;
}

const STORAGE_KEY = "lovable-custom-filter-presets";

// Generate a random gradient for custom presets
const GRADIENT_OPTIONS = [
  "from-emerald-400 to-teal-600",
  "from-violet-500 to-purple-700",
  "from-rose-400 to-pink-600",
  "from-sky-400 to-blue-600",
  "from-lime-400 to-green-600",
  "from-fuchsia-500 to-pink-700",
  "from-indigo-400 to-blue-700",
  "from-amber-400 to-yellow-600",
];

const getRandomGradient = (): string => {
  return GRADIENT_OPTIONS[Math.floor(Math.random() * GRADIENT_OPTIONS.length)];
};

export function useCustomPresets() {
  const [presets, setPresets] = useState<CustomPreset[]>([]);

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
      console.error("Error loading custom presets:", error);
    }
  }, []);

  // Save presets to localStorage whenever they change
  const saveToStorage = useCallback((newPresets: CustomPreset[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
    } catch (error) {
      console.error("Error saving custom presets:", error);
    }
  }, []);

  const addPreset = useCallback((name: string, values: ImageFilterValues) => {
    const newPreset: CustomPreset = {
      id: `custom-${Date.now()}`,
      name: name.trim() || `Preset ${presets.length + 1}`,
      values: { ...values },
      gradient: getRandomGradient(),
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

  const updatePreset = useCallback((id: string, values: ImageFilterValues) => {
    const updated = presets.map((p) =>
      p.id === id ? { ...p, values: { ...values } } : p
    );
    setPresets(updated);
    saveToStorage(updated);
  }, [presets, saveToStorage]);

  return {
    presets,
    addPreset,
    deletePreset,
    updatePreset,
  };
}
