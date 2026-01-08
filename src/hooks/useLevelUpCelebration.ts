import { useEffect, useRef, useState, useCallback } from "react";
import { SparkLevelInfo, getSparkLevel } from "@/hooks/useSparkEnergy";

interface LevelUpState {
  isOpen: boolean;
  newLevel: SparkLevelInfo | null;
  previousLevel: SparkLevelInfo | null;
}

/**
 * Hook to detect and celebrate level-up events in the Spark Energy system.
 * Tracks the user's total earned energy and triggers a celebration when they reach a new level.
 */
export function useLevelUpCelebration(totalEarned: number | undefined) {
  const [celebrationState, setCelebrationState] = useState<LevelUpState>({
    isOpen: false,
    newLevel: null,
    previousLevel: null,
  });
  
  // Track previous level to detect changes
  const previousLevelRef = useRef<SparkLevelInfo | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (totalEarned === undefined) return;
    
    const currentLevel = getSparkLevel(totalEarned);
    
    // Initialize on first load (don't trigger celebration)
    if (!initializedRef.current) {
      previousLevelRef.current = currentLevel;
      initializedRef.current = true;
      return;
    }
    
    // Check if level increased
    const previousLevel = previousLevelRef.current;
    if (previousLevel && currentLevel.level > previousLevel.level) {
      // Level up detected!
      setCelebrationState({
        isOpen: true,
        newLevel: currentLevel,
        previousLevel: previousLevel,
      });
    }
    
    // Update ref for next comparison
    previousLevelRef.current = currentLevel;
  }, [totalEarned]);

  const closeCelebration = useCallback(() => {
    setCelebrationState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    ...celebrationState,
    closeCelebration,
  };
}
