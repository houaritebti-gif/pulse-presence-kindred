import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDailyChallenges } from "./useDailyChallenges";
import { useProfile } from "./useProfile";

/**
 * Hook that automatically tracks user actions for daily challenges.
 * Should be called once in a top-level component (e.g., App).
 */
export const useDailyChallengeTracker = () => {
  const { data: profile } = useProfile();
  const { trackAction, initializeChallenges } = useDailyChallenges();
  const location = useLocation();
  const trackedPagesRef = useRef<Set<string>>(new Set());
  const lastDateRef = useRef<string>("");

  // Reset tracked pages at midnight
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (lastDateRef.current !== today) {
      trackedPagesRef.current.clear();
      lastDateRef.current = today;
    }
  }, [location.pathname]);

  // Initialize challenges on mount
  useEffect(() => {
    if (profile?.id) {
      initializeChallenges();
    }
  }, [profile?.id]);

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
      trackAction(action);
    }

    // Track presence activation
    if (path === '/presence') {
      // We'll track this when presence is actually activated, not just page view
    }
  }, [location.pathname, profile?.id, trackAction]);

  return { trackAction };
};

export default useDailyChallengeTracker;
