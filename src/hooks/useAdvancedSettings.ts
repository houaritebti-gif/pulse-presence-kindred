// Advanced settings hook for app customization
import { useState, useEffect } from "react";

const STORAGE_KEYS = {
  THEME: "kiki_theme",
  REDUCE_MOTION: "kiki_reduce_motion",
  TEXT_SIZE: "kiki_text_size",
  COMPACT_MODE: "kiki_compact_mode",
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
  
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
  }
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

// Initialize settings on app load
export const initializeAdvancedSettings = () => {
  applyTheme(getTheme());
  applyReduceMotion(getReduceMotion());
  applyTextSize(getTextSize());
  applyCompactMode(getCompactMode());

  // Listen for system theme changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => {
    if (getTheme() === "system") {
      applyTheme("system");
    }
  };
  mediaQuery.addEventListener("change", handleChange);
};

export const useAdvancedSettings = () => {
  const [theme, setThemeState] = useState<Theme>(getTheme);
  const [reduceMotion, setReduceMotionState] = useState<boolean>(getReduceMotion);
  const [textSize, setTextSizeState] = useState<TextSize>(getTextSize);
  const [compactMode, setCompactModeState] = useState<boolean>(getCompactMode);

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

  return {
    theme,
    reduceMotion,
    textSize,
    compactMode,
    setTheme: handleThemeChange,
    setReduceMotion: handleReduceMotionChange,
    setTextSize: handleTextSizeChange,
    setCompactMode: handleCompactModeChange,
  };
};
