import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get initial value from localStorage or use default
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Persist to localStorage when value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        
        if (typeof window !== "undefined") {
          localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Listen for changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

// Storage keys for the app
export const STORAGE_KEYS = {
  PRESENCE_FILTERS: "kiki_presence_filters",
  LAST_CITY: "kiki_last_city",
  SEEN_SPARKS: "kiki_seen_sparks",
  AI_CHAT_HISTORY: "kiki_ai_chat_history",
  CROP_GUIDE_SEEN: "kiki_crop_guide_seen",
  ADMIN_ALERT_THRESHOLD: "kiki_admin_alert_threshold",
  ADMIN_ALERTS_ENABLED: "kiki_admin_alerts_enabled",
  ADMIN_EMAIL_ALERTS_ENABLED: "kiki_admin_email_alerts_enabled",
} as const;
