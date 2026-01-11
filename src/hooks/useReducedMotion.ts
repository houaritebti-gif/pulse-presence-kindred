import { useState, useEffect } from "react";

/**
 * Hook to detect if user prefers reduced motion
 * Returns true if the user has requested the system minimize non-essential motion
 */
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
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
