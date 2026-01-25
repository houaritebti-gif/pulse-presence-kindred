/**
 * Hook for offline presence caching
 * Provides instant profile display from IndexedDB cache while fresh data loads
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { PresenceWithProfile } from "./usePresence";
import { 
  getCachedProfile, 
  cacheProfile, 
  CachedProfile 
} from "@/utils/profileCacheDB";
import { Profile } from "./useProfile";
import { GenderType } from "@/constants/profileOptions";

// In-memory LRU cache for super-fast access
const memoryCache = new Map<string, PresenceWithProfile>();
const MAX_MEMORY_CACHE = 50;

/**
 * Add profile to memory cache with LRU eviction
 */
const addToMemoryCache = (profileId: string, presence: PresenceWithProfile) => {
  // Remove oldest entries if at capacity
  if (memoryCache.size >= MAX_MEMORY_CACHE) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(profileId, presence);
};

/**
 * Get from memory cache and refresh LRU position
 */
const getFromMemoryCache = (profileId: string): PresenceWithProfile | undefined => {
  const value = memoryCache.get(profileId);
  if (value) {
    // Refresh position in LRU
    memoryCache.delete(profileId);
    memoryCache.set(profileId, value);
  }
  return value;
};

/**
 * Convert CachedProfile to PresenceWithProfile format
 */
const cachedToPresence = (cached: CachedProfile): PresenceWithProfile => ({
  id: `cached-${cached.profileId}`,
  profile_id: cached.profileId,
  is_present: false, // Unknown - will be updated by live data
  last_pulse: new Date(cached.cachedAt).toISOString(),
  visible_to_others: true,
  profile: {
    id: cached.profile.id,
    name: cached.profile.name,
    avatar_url: cached.profile.avatar_url,
    vibe: cached.profile.vibe,
    city: cached.profile.city,
    has_tattoos: cached.profile.has_tattoos,
    has_piercings: cached.profile.has_piercings,
    alternative_aesthetic: cached.profile.alternative_aesthetic,
    looking_for: cached.profile.looking_for,
    email_verified: cached.profile.email_verified,
    identity_verified: cached.profile.identity_verified,
    gender: cached.profile.gender,
    birthdate: cached.profile.birthdate,
    latitude: (cached.profile as any).latitude ?? null,
    longitude: (cached.profile as any).longitude ?? null,
    share_location: (cached.profile as any).share_location ?? null,
  },
  tribes: cached.tribes,
  musicStyles: cached.musicStyles,
  interests: cached.interests,
  prompts: cached.prompts || [],
  hasVisibilityBoost: false,
});

/**
 * Cache presence data for a profile
 */
export const cachePresenceProfile = async (presence: PresenceWithProfile): Promise<void> => {
  if (!presence.profile?.id) return;
  
  // Add to memory cache immediately
  addToMemoryCache(presence.profile.id, presence);
  
  // Persist to IndexedDB asynchronously
  try {
    const profile: Profile = {
      id: presence.profile.id,
      name: presence.profile.name,
      avatar_url: presence.profile.avatar_url,
      vibe: presence.profile.vibe,
      city: presence.profile.city,
      has_tattoos: presence.profile.has_tattoos,
      has_piercings: presence.profile.has_piercings,
      alternative_aesthetic: presence.profile.alternative_aesthetic,
      looking_for: presence.profile.looking_for,
      email_verified: presence.profile.email_verified,
      identity_verified: presence.profile.identity_verified,
      gender: presence.profile.gender as GenderType | null,
      birthdate: presence.profile.birthdate,
      user_id: '',
      bio: null,
      created_at: '',
      updated_at: '',
      gothic_style: null,
      colored_hair: null,
      shaved_head: null,
      vintage_style: null,
      show_tribes: null,
      show_music_styles: null,
      show_gender: null,
      show_city: null,
      show_birth_year: null,
      show_zodiac: null,
      show_vibe: null,
      show_looking_for: null,
      show_interests: null,
      show_aesthetic_details: null,
      share_typing_status: null,
    };
    
    await cacheProfile(
      presence.profile.id,
      profile,
      presence.tribes,
      presence.musicStyles,
      presence.interests
    );
  } catch (error) {
    console.warn('[PresenceCache] Failed to persist:', error);
  }
};

/**
 * Hook to provide cached presence profiles while loading fresh data
 */
export const usePresenceCache = (profileIds: string[]) => {
  const [cachedProfiles, setCachedProfiles] = useState<PresenceWithProfile[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  const loadedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (profileIds.length === 0) {
      setCachedProfiles([]);
      setIsLoadingCache(false);
      return;
    }

    const loadFromCache = async () => {
      const cached: PresenceWithProfile[] = [];
      const idsToLoad = profileIds.filter(id => !loadedIdsRef.current.has(id));
      
      if (idsToLoad.length === 0) {
        setIsLoadingCache(false);
        return;
      }

      for (const id of idsToLoad) {
        // Try memory cache first (instant)
        const memCached = getFromMemoryCache(id);
        if (memCached) {
          cached.push(memCached);
          loadedIdsRef.current.add(id);
          continue;
        }

        // Try IndexedDB cache
        try {
          const dbCached = await getCachedProfile(id);
          if (dbCached) {
            const presence = cachedToPresence(dbCached);
            cached.push(presence);
            addToMemoryCache(id, presence);
            loadedIdsRef.current.add(id);
          }
        } catch (error) {
          console.warn('[PresenceCache] Error reading cache for', id, error);
        }
      }

      if (cached.length > 0) {
        setCachedProfiles(prev => {
          // Merge with existing, avoiding duplicates
          const existingIds = new Set(prev.map(p => p.profile?.id));
          const newProfiles = cached.filter(p => !existingIds.has(p.profile?.id));
          return [...prev, ...newProfiles];
        });
      }

      setIsLoadingCache(false);
    };

    loadFromCache();
  }, [profileIds.join(',')]);

  return { cachedProfiles, isLoadingCache };
};

/**
 * Hook to cache profiles as they are viewed in the presence list
 */
export const usePresenceCacheWriter = () => {
  const cachedIdsRef = useRef<Set<string>>(new Set());

  const cacheProfiles = useCallback((profiles: PresenceWithProfile[]) => {
    // Cache profiles in background
    profiles.forEach(presence => {
      const profileId = presence.profile?.id;
      if (profileId && !cachedIdsRef.current.has(profileId)) {
        cachedIdsRef.current.add(profileId);
        // Non-blocking cache write
        cachePresenceProfile(presence).catch(() => {});
      }
    });
  }, []);

  return { cacheProfiles };
};

/**
 * Merge cached and live presence data
 * Live data takes precedence, cached fills gaps
 */
export const mergePresenceWithCache = (
  liveProfiles: PresenceWithProfile[],
  cachedProfiles: PresenceWithProfile[]
): PresenceWithProfile[] => {
  const liveIds = new Set(liveProfiles.map(p => p.profile?.id).filter(Boolean));
  
  // Add cached profiles that aren't in live data
  const fromCache = cachedProfiles.filter(
    cached => cached.profile?.id && !liveIds.has(cached.profile.id)
  );

  return [...liveProfiles, ...fromCache];
};

/**
 * Hook for complete presence caching strategy
 * Returns cached data immediately, then updates with live data
 */
export const usePresenceWithOfflineCache = (
  liveProfiles: PresenceWithProfile[],
  isLiveLoading: boolean
) => {
  const { cacheProfiles } = usePresenceCacheWriter();
  const [displayProfiles, setDisplayProfiles] = useState<PresenceWithProfile[]>([]);
  const [showingCached, setShowingCached] = useState(false);
  const initialCacheLoadedRef = useRef(false);
  
  // Extract profile IDs we want to potentially get from cache
  const cachedProfileIds = useMemo(() => {
    // On initial load, we don't have IDs yet - we'll load from general cache
    if (liveProfiles.length === 0 && isLiveLoading) {
      return [];
    }
    return liveProfiles.map(p => p.profile?.id).filter((id): id is string => !!id);
  }, [liveProfiles, isLiveLoading]);
  
  const { cachedProfiles, isLoadingCache } = usePresenceCache(cachedProfileIds);

  // Load cached profiles on initial mount for instant display
  useEffect(() => {
    const loadInitialCache = async () => {
      if (initialCacheLoadedRef.current) return;
      initialCacheLoadedRef.current = true;
      
      // Get all cached profiles from memory for initial display
      const initialCached: PresenceWithProfile[] = [];
      memoryCache.forEach((value) => {
        initialCached.push(value);
      });
      
      if (initialCached.length > 0) {
        setDisplayProfiles(initialCached);
        setShowingCached(true);
        console.log('[PresenceCache] Showing', initialCached.length, 'profiles from cache');
      }
    };
    
    if (isLiveLoading) {
      loadInitialCache();
    }
  }, [isLiveLoading]);

  // Update display when live data arrives
  useEffect(() => {
    if (liveProfiles.length > 0) {
      setDisplayProfiles(liveProfiles);
      setShowingCached(false);
      
      // Cache the live profiles for future offline use
      cacheProfiles(liveProfiles);
    }
  }, [liveProfiles, cacheProfiles]);

  // Merge cached data if we have some
  useEffect(() => {
    if (!isLoadingCache && cachedProfiles.length > 0 && liveProfiles.length > 0) {
      // Only merge if there are cached profiles not in live data
      const merged = mergePresenceWithCache(liveProfiles, cachedProfiles);
      if (merged.length > liveProfiles.length) {
        setDisplayProfiles(merged);
      }
    }
  }, [cachedProfiles, liveProfiles, isLoadingCache]);

  return {
    profiles: displayProfiles,
    showingCached,
    isLoadingCache,
  };
};

/**
 * Get presence cache statistics
 */
export const getPresenceCacheStats = (): { 
  memoryCount: number; 
  memorySizeKB: number;
} => {
  let estimatedSize = 0;
  memoryCache.forEach((value) => {
    // Rough estimate: JSON stringify to get byte size
    try {
      estimatedSize += JSON.stringify(value).length * 2; // UTF-16
    } catch {
      estimatedSize += 1024; // Default 1KB per entry
    }
  });
  
  return {
    memoryCount: memoryCache.size,
    memorySizeKB: Math.round(estimatedSize / 1024),
  };
};

/**
 * Clear all presence cache (memory and IndexedDB)
 */
export const clearPresenceCache = async (): Promise<void> => {
  // Clear memory cache
  memoryCache.clear();
  
  // Clear IndexedDB presence data
  try {
    const { clearAllCachedProfiles } = await import("@/utils/profileCacheDB");
    await clearAllCachedProfiles();
  } catch (error) {
    console.warn('[PresenceCache] Error clearing IndexedDB cache:', error);
  }
};

// Storage key for cache warning dismissal
const CACHE_WARNING_DISMISSED_KEY = "kiki_presence_cache_warning_dismissed";
const CACHE_SIZE_THRESHOLD_MB = 5; // Show warning when cache exceeds 5MB

/**
 * Check if cache warning should be shown
 */
export const shouldShowCacheWarning = async (): Promise<boolean> => {
  // Check if already dismissed today
  const dismissed = localStorage.getItem(CACHE_WARNING_DISMISSED_KEY);
  if (dismissed) {
    const dismissedDate = new Date(dismissed);
    const today = new Date();
    if (
      dismissedDate.getFullYear() === today.getFullYear() &&
      dismissedDate.getMonth() === today.getMonth() &&
      dismissedDate.getDate() === today.getDate()
    ) {
      return false; // Already dismissed today
    }
  }
  
  // Check cache size
  try {
    const { getCacheStats } = await import("@/utils/profileCacheDB");
    const stats = await getCacheStats();
    const memStats = getPresenceCacheStats();
    
    // Estimate total size (IndexedDB + memory)
    const totalProfiles = stats.validCount + memStats.memoryCount;
    const estimatedSizeKB = totalProfiles * 2; // ~2KB per profile average
    
    return estimatedSizeKB > CACHE_SIZE_THRESHOLD_MB * 1024;
  } catch {
    return false;
  }
};

/**
 * Dismiss cache warning for today
 */
export const dismissCacheWarning = (): void => {
  localStorage.setItem(CACHE_WARNING_DISMISSED_KEY, new Date().toISOString());
};
