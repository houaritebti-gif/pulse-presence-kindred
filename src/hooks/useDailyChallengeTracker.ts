import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useDailyChallenges } from "./useDailyChallenges";
import { useProfile } from "./useProfile";

/**
 * Hook that automatically tracks user actions for daily challenges.
 * Should be called once in a top-level component (e.g., App).
 * 
 * IMPORTANT: Uses refs to prevent redundant initialization and avoid
 * the duplicate key errors that can crash Safari on mobile.
 */
export const useDailyChallengeTracker = () => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { trackAction, initializeChallenges, isLoading: challengesLoading } = useDailyChallenges();
  const location = useLocation();
  const trackedPagesRef = useRef<Set<string>>(new Set());
  const lastDateRef = useRef<string>("");
  const hasInitializedRef = useRef(false);
  const initializingRef = useRef(false);

  // Reset tracked pages at midnight
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (lastDateRef.current !== today) {
      trackedPagesRef.current.clear();
      lastDateRef.current = today;
      hasInitializedRef.current = false; // Allow re-initialization on new day
    }
  }, [location.pathname]);

  // Initialize challenges on mount - with guards against multiple calls
  useEffect(() => {
    // Skip if already initialized, currently initializing, or data not ready
    if (hasInitializedRef.current || initializingRef.current) return;
    if (!profile?.id || profileLoading || challengesLoading) return;
    
    // Mark as initializing to prevent concurrent calls
    initializingRef.current = true;
    
    // Small delay to ensure query data is settled
    const timer = setTimeout(() => {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        initializeChallenges();
      }
      initializingRef.current = false;
    }, 300);
    
    return () => {
      clearTimeout(timer);
      initializingRef.current = false;
    };
  }, [profile?.id, profileLoading, challengesLoading, initializeChallenges]);

  // Memoized trackAction wrapper for stability
  const safeTrackAction = useCallback((action: string) => {
    if (!profile?.id) return;
    trackAction(action);
  }, [profile?.id, trackAction]);

  // Track page visits for challenges
  useEffect(() => {
    if (!profile?.id) return;

    const path = location.pathname;
    
    // Only track each page once per day
    if (trackedPagesRef.current.has(path)) return;
    trackedPagesRef.current.add(path);

    // Map routes to challenge actions
    const routeActions: Record<string, string> = {
      '/quedadas': 'quedadas_viewed',
      '/leaderboard': 'leaderboard_viewed',
      '/spark-energy': 'shop_opened',
    };

    const action = routeActions[path];
    if (action) {
      safeTrackAction(action);
    }

    // Track presence activation
    if (path === '/presence') {
      // We'll track this when presence is actually activated, not just page view
    }
  }, [location.pathname, profile?.id, safeTrackAction]);

  return { trackAction: safeTrackAction };
};

export default useDailyChallengeTracker;
