import { useState, useRef, useCallback, TouchEvent } from "react";
import { triggerHaptic } from "@/utils/haptics";
import { vibrateDevice } from "@/utils/notificationSound";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const hasTriggeredHaptic = useRef(false);
  const lastHapticDistance = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start if we're at the top of the page
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      hasTriggeredHaptic.current = false;
      lastHapticDistance.current = 0;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0 && window.scrollY === 0) {
      // Apply resistance curve for natural feel
      const resistance = 0.4 * (1 - Math.min(diff / (maxPull * 3), 0.7));
      const distance = Math.min(diff * resistance, maxPull);
      setPullDistance(distance);
      
      // Progressive haptic feedback at 25%, 50%, 75%
      const progressPercent = (distance / threshold) * 100;
      
      if (progressPercent >= 25 && lastHapticDistance.current < 25) {
        triggerHaptic("selection");
        lastHapticDistance.current = 25;
      } else if (progressPercent >= 50 && lastHapticDistance.current < 50) {
        triggerHaptic("light");
        lastHapticDistance.current = 50;
      } else if (progressPercent >= 75 && lastHapticDistance.current < 75) {
        triggerHaptic("medium");
        lastHapticDistance.current = 75;
      }
      
      // Strong haptic when reaching threshold
      if (distance >= threshold && !hasTriggeredHaptic.current) {
        triggerHaptic("success");
        hasTriggeredHaptic.current = true;
      }
    }
  }, [isPulling, isRefreshing, maxPull, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      vibrateDevice("message");
      
      try {
        await onRefresh();
        // Success haptic after refresh completes
        triggerHaptic("success");
      } finally {
        setIsRefreshing(false);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
    hasTriggeredHaptic.current = false;
    lastHapticDistance.current = 0;
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    shouldTrigger: pullDistance >= threshold,
  };
};
