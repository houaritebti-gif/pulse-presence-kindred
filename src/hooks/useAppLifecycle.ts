import { useEffect } from 'react';
import { useDailyLoginReward } from '@/hooks/useDailyLoginReward';
import { useAchievementChecker } from '@/hooks/useAchievementChecker';
import { useSuperSparkWelcome } from '@/hooks/useSuperSparkWelcome';
import { useDailyChallengeTracker } from '@/hooks/useDailyChallengeTracker';
import { useDailyChallengeExpiry } from '@/hooks/useDailyChallengeExpiry';

/**
 * Centralized hook for app-wide lifecycle management.
 * Consolidates gamification, rewards, and tracking hooks
 * that were previously scattered in KeyboardNavigationWrapper.
 */
export function useAppLifecycle() {
  // Award energy on daily login
  useDailyLoginReward();
  
  // Check and unlock achievements
  useAchievementChecker();
  
  // Show confetti for new Super Chispas
  useSuperSparkWelcome();
  
  // Track daily challenge progress
  useDailyChallengeTracker();
  
  // Notify when challenges are about to expire
  useDailyChallengeExpiry();
}
