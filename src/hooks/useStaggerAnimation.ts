import { useMemo } from "react";

interface UseStaggerAnimationOptions {
  /** Total number of items to animate */
  itemCount: number;
  /** Base delay before first item animates (ms) */
  baseDelay?: number;
  /** Delay between each item (ms) */
  staggerDelay?: number;
  /** Animation duration for each item (ms) */
  duration?: number;
}

interface StaggerAnimationResult {
  /** Get animation style for an item at given index */
  getAnimationStyle: (index: number) => React.CSSProperties;
  /** Get animation classes for an item */
  getAnimationClasses: () => string;
  /** Check if all animations have completed */
  totalDuration: number;
}

/**
 * Hook for creating staggered entry animations on list items
 */
export const useStaggerAnimation = ({
  itemCount,
  baseDelay = 50,
  staggerDelay = 80,
  duration = 400,
}: UseStaggerAnimationOptions): StaggerAnimationResult => {
  const result = useMemo(() => {
    const getAnimationStyle = (index: number): React.CSSProperties => ({
      animationDelay: `${baseDelay + index * staggerDelay}ms`,
      animationDuration: `${duration}ms`,
      animationFillMode: "forwards",
    });

    const getAnimationClasses = (): string => 
      "opacity-0 animate-fade-up";

    const totalDuration = baseDelay + (itemCount - 1) * staggerDelay + duration;

    return {
      getAnimationStyle,
      getAnimationClasses,
      totalDuration,
    };
  }, [itemCount, baseDelay, staggerDelay, duration]);

  return result;
};

export default useStaggerAnimation;
