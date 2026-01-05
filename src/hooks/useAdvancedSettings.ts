// Advanced settings hook for app customization
import { useState, useEffect } from "react";

const STORAGE_KEYS = {
  THEME: "kiki_theme",
  REDUCE_MOTION: "kiki_reduce_motion",
  TEXT_SIZE: "kiki_text_size",
  COMPACT_MODE: "kiki_compact_mode",
  HIGH_CONTRAST: "kiki_high_contrast",
} as const;

export type Theme = "light" | "dark" | "system";
export type TextSize = "small" | "normal" | "large";

export const getTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
};

export const setTheme = (theme: Theme) => {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  applyTheme(theme);
};

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  
  // Add transitioning class for smooth animation
  root.classList.add("theme-transitioning");
  
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
  }
  
  // Remove transitioning class after animation completes
  setTimeout(() => {
    root.classList.remove("theme-transitioning");
  }, 300);
};

export const getReduceMotion = (): boolean => {
  const stored = localStorage.getItem(STORAGE_KEYS.REDUCE_MOTION);
  if (stored !== null) {
    return stored === "true";
  }
  // Default to system preference
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const setReduceMotion = (reduce: boolean) => {
  localStorage.setItem(STORAGE_KEYS.REDUCE_MOTION, String(reduce));
  applyReduceMotion(reduce);
};

export const applyReduceMotion = (reduce: boolean) => {
  document.documentElement.classList.toggle("reduce-motion", reduce);
};

export const getTextSize = (): TextSize => {
  const stored = localStorage.getItem(STORAGE_KEYS.TEXT_SIZE);
  if (stored === "small" || stored === "normal" || stored === "large") {
    return stored;
  }
  return "normal";
};

export const setTextSize = (size: TextSize) => {
  localStorage.setItem(STORAGE_KEYS.TEXT_SIZE, size);
  applyTextSize(size);
};

export const applyTextSize = (size: TextSize) => {
  const root = document.documentElement;
  root.classList.remove("text-size-small", "text-size-normal", "text-size-large");
  root.classList.add(`text-size-${size}`);
};

export const getCompactMode = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.COMPACT_MODE) === "true";
};

export const setCompactMode = (compact: boolean) => {
  localStorage.setItem(STORAGE_KEYS.COMPACT_MODE, String(compact));
  applyCompactMode(compact);
};

export const applyCompactMode = (compact: boolean) => {
  document.documentElement.classList.toggle("compact-mode", compact);
};

export const getHighContrast = (): boolean => {
  const stored = localStorage.getItem(STORAGE_KEYS.HIGH_CONTRAST);
  if (stored !== null) {
    return stored === "true";
  }
  // Default to system preference using prefers-contrast media query
  return window.matchMedia("(prefers-contrast: more)").matches;
};

export const setHighContrast = (enabled: boolean) => {
  localStorage.setItem(STORAGE_KEYS.HIGH_CONTRAST, String(enabled));
  applyHighContrast(enabled);
};

export const applyHighContrast = (enabled: boolean) => {
  document.documentElement.classList.toggle("high-contrast", enabled);
};

// Initialize settings on app load
export const initializeAdvancedSettings = () => {
  applyTheme(getTheme());
  applyReduceMotion(getReduceMotion());
  applyTextSize(getTextSize());
  applyCompactMode(getCompactMode());
  applyHighContrast(getHighContrast());

  // Listen for system theme changes
  const themeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleThemeChange = () => {
    if (getTheme() === "system") {
      applyTheme("system");
    }
  };
  themeMediaQuery.addEventListener("change", handleThemeChange);

  // Listen for system high contrast preference changes
  const contrastMediaQuery = window.matchMedia("(prefers-contrast: more)");
  const handleContrastChange = () => {
    // Only auto-apply if user hasn't explicitly set a preference
    const stored = localStorage.getItem(STORAGE_KEYS.HIGH_CONTRAST);
    if (stored === null) {
      applyHighContrast(contrastMediaQuery.matches);
    }
  };
  contrastMediaQuery.addEventListener("change", handleContrastChange);
};

export const useAdvancedSettings = () => {
  const [theme, setThemeState] = useState<Theme>(getTheme);
  const [reduceMotion, setReduceMotionState] = useState<boolean>(getReduceMotion);
  const [textSize, setTextSizeState] = useState<TextSize>(getTextSize);
  const [compactMode, setCompactModeState] = useState<boolean>(getCompactMode);
  const [highContrast, setHighContrastState] = useState<boolean>(getHighContrast);

  useEffect(() => {
    initializeAdvancedSettings();
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setThemeState(newTheme);
    setTheme(newTheme);
  };

  const handleReduceMotionChange = (reduce: boolean) => {
    setReduceMotionState(reduce);
    setReduceMotion(reduce);
  };

  const handleTextSizeChange = (size: TextSize) => {
    setTextSizeState(size);
    setTextSize(size);
  };

  const handleCompactModeChange = (compact: boolean) => {
    setCompactModeState(compact);
    setCompactMode(compact);
  };

  const handleHighContrastChange = (enabled: boolean) => {
    setHighContrastState(enabled);
    setHighContrast(enabled);
  };

  return {
    theme,
    reduceMotion,
    textSize,
    compactMode,
    highContrast,
    setTheme: handleThemeChange,
    setReduceMotion: handleReduceMotionChange,
    setTextSize: handleTextSizeChange,
    setCompactMode: handleCompactModeChange,
    setHighContrast: handleHighContrastChange,
  };
};
