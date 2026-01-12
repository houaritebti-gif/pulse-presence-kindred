// Hook to track visited profiles using IndexedDB cache
import { useState, useEffect, useCallback } from "react";
import { getCachedProfile } from "@/utils/profileCacheDB";

// In-memory cache of visited profile IDs for quick lookups
const visitedProfilesCache = new Set<string>();
let isInitialized = false;

/**
 * Hook to check if profiles have been visited (cached in IndexedDB)
 * This is a lightweight check that doesn't block rendering
 */
export const useVisitedProfiles = () => {
  const [visitedIds, setVisitedIds] = useState<Set<string>>(visitedProfilesCache);

  // Check if a specific profile has been visited
  const isProfileVisited = useCallback((profileId: string): boolean => {
    return visitedIds.has(profileId);
  }, [visitedIds]);

  // Mark a profile as visited (this happens automatically when cached)
  const markAsVisited = useCallback((profileId: string) => {
    visitedProfilesCache.add(profileId);
    setVisitedIds(new Set(visitedProfilesCache));
  }, []);

  return {
    visitedIds,
    isProfileVisited,
    markAsVisited,
  };
};

/**
 * Check if a single profile has been visited (async)
 * Returns true if the profile exists in the cache
 */
export const checkProfileVisited = async (profileId: string): Promise<boolean> => {
  if (visitedProfilesCache.has(profileId)) {
    return true;
  }
  
  try {
    const cached = await getCachedProfile(profileId);
    if (cached) {
      visitedProfilesCache.add(profileId);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Hook to load visited state for a list of profile IDs
 */
export const useVisitedProfilesLoader = (profileIds: string[]) => {
  const [visitedMap, setVisitedMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profileIds.length === 0) {
      setIsLoading(false);
      return;
    }

    const loadVisitedStatus = async () => {
      const results: Record<string, boolean> = {};
      
      // Check in batches to avoid overwhelming IndexedDB
      for (const id of profileIds) {
        // Quick check from memory first
        if (visitedProfilesCache.has(id)) {
          results[id] = true;
        } else {
          // Check IndexedDB
          try {
            const cached = await getCachedProfile(id);
            if (cached) {
              visitedProfilesCache.add(id);
              results[id] = true;
            } else {
              results[id] = false;
            }
          } catch {
            results[id] = false;
          }
        }
      }
      
      setVisitedMap(results);
      setIsLoading(false);
    };

    loadVisitedStatus();
  }, [profileIds.join(',')]);

  return { visitedMap, isLoading };
};
