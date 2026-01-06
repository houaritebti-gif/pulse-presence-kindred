import { useMemo, useCallback } from "react";

interface UseStaggerAnimationOptions {
  /** Total number of items to animate */
  itemCount: number;
  /** Base delay before first item animates (ms) */
  baseDelay?: number;
  /** Delay between each item (ms) */
  staggerDelay?: number;
  /** Animation duration for each item (ms) */
  duration?: number;
  /** Whether to use spring-like easing */
  useSpring?: boolean;
  /** Maximum delay cap to prevent long waits on large lists */
  maxDelay?: number;
}

interface StaggerAnimationResult {
  /** Get animation style for an item at given index */
  getAnimationStyle: (index: number) => React.CSSProperties;
  /** Get animation classes for an item */
  getAnimationClasses: (index?: number) => string;
  /** Check if all animations have completed */
  totalDuration: number;
  /** Get combined style and class for easy application */
  getItemProps: (index: number) => {
    className: string;
    style: React.CSSProperties;
  };
}

/**
 * Hook for creating staggered entry animations on list items
 * Features spring-like easing and delay capping for large lists
 */
export const useStaggerAnimation = ({
  itemCount,
  baseDelay = 50,
  staggerDelay = 60,
  duration = 450,
  useSpring = true,
  maxDelay = 800,
}: UseStaggerAnimationOptions): StaggerAnimationResult => {
  const getAnimationStyle = useCallback((index: number): React.CSSProperties => {
    // Calculate delay with optional capping
    const rawDelay = baseDelay + index * staggerDelay;
    const cappedDelay = maxDelay ? Math.min(rawDelay, maxDelay) : rawDelay;
    
    return {
      animationDelay: `${cappedDelay}ms`,
      animationDuration: `${duration}ms`,
      animationFillMode: "forwards",
      animationTimingFunction: useSpring 
        ? "cubic-bezier(0.22, 1, 0.36, 1)" 
        : "ease-out",
    };
  }, [baseDelay, staggerDelay, duration, useSpring, maxDelay]);

  const getAnimationClasses = useCallback((): string => 
    "opacity-0 animate-stagger-fade-up", 
  []);

  const getItemProps = useCallback((index: number) => ({
    className: getAnimationClasses(),
    style: getAnimationStyle(index),
  }), [getAnimationClasses, getAnimationStyle]);

  const totalDuration = useMemo(() => {
    const lastItemDelay = Math.min(baseDelay + (itemCount - 1) * staggerDelay, maxDelay || Infinity);
    return lastItemDelay + duration;
  }, [itemCount, baseDelay, staggerDelay, duration, maxDelay]);

  return {
    getAnimationStyle,
    getAnimationClasses,
    totalDuration,
    getItemProps,
  };
};

export default useStaggerAnimation;
