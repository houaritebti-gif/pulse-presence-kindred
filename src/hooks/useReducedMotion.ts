import { useState, useEffect } from "react";

const REDUCE_MOTION_KEY = "kiki_reduce_motion";

/**
 * Get the manual reduce motion preference from localStorage
 * Returns null if user hasn't set a preference (use system default)
 */
const getManualReduceMotionPreference = (): boolean | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(REDUCE_MOTION_KEY);
  if (stored === "true") return true;
  if (stored === "false") return false;
  return null; // No preference set, use system
};

/**
 * Hook to detect if user prefers reduced motion
 * Checks manual setting first, then falls back to system preference
 * Returns true if animations should be reduced
 */
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    const manual = getManualReduceMotionPreference();
    if (manual !== null) return manual;
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    // Check for manual override first
    const manual = getManualReduceMotionPreference();
    if (manual !== null) {
      setPrefersReducedMotion(manual);
    } else {
      // Fall back to system preference
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
    }

    // Listen for system preference changes (only applies if no manual setting)
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const manualPref = getManualReduceMotionPreference();
      if (manualPref === null) {
        setPrefersReducedMotion(e.matches);
      }
    };
    mediaQuery.addEventListener("change", handleSystemChange);

    // Listen for localStorage changes (for when user toggles the setting)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === REDUCE_MOTION_KEY) {
        const manual = getManualReduceMotionPreference();
        if (manual !== null) {
          setPrefersReducedMotion(manual);
        } else {
          setPrefersReducedMotion(mediaQuery.matches);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom events for same-tab updates
    const handleCustomEvent = () => {
      const manual = getManualReduceMotionPreference();
      if (manual !== null) {
        setPrefersReducedMotion(manual);
      } else {
        setPrefersReducedMotion(mediaQuery.matches);
      }
    };
    window.addEventListener("reduceMotionChanged", handleCustomEvent);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("reduceMotionChanged", handleCustomEvent);
    };
  }, []);

  return prefersReducedMotion;
};

/**
 * Get reduced motion variants for Framer Motion animations
 * Returns appropriate animation config based on user preference
 */
export const getReducedMotionTransition = (reducedMotion: boolean) => ({
  duration: reducedMotion ? 0 : 0.3,
  ease: reducedMotion ? "linear" : [0.25, 0.46, 0.45, 0.94],
});

/**
 * Get exit animation config that respects reduced motion
 */
export const getExitAnimationConfig = (
  direction: "left" | "right" | "up" | "down" | null,
  reducedMotion: boolean
) => {
  if (reducedMotion) {
    // Instant opacity fade for reduced motion
    return { opacity: 0, transition: { duration: 0.1 } };
  }

  switch (direction) {
    case "left":
      return { x: -500, opacity: 0, transition: { duration: 0.3 } };
    case "right":
      return { x: 500, opacity: 0, transition: { duration: 0.3 } };
    case "up":
      return { y: -500, opacity: 0, scale: 1.1, transition: { duration: 0.3 } };
    case "down":
      return { y: 500, opacity: 0, transition: { duration: 0.3 } };
    default:
      return undefined;
  }
};
