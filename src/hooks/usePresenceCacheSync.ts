/**
 * Background sync hook for presence cache
 * Automatically updates cached profiles when there's a good connection
 */

import { useEffect, useRef, useCallback } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { supabase } from "@/integrations/supabase/client";
import { cachePresenceProfile, getPresenceCacheStats } from "./usePresenceCache";
import { getCacheStats } from "@/utils/profileCacheDB";
import { PresenceWithProfile } from "./usePresence";

// Sync configuration
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes between syncs
const SYNC_BATCH_SIZE = 10; // Update 10 profiles per batch
const SYNC_BATCH_DELAY_MS = 500; // Delay between batches to avoid blocking
const MIN_CACHE_AGE_FOR_SYNC_MS = 30 * 60 * 1000; // Only sync profiles older than 30 minutes
const CONNECTION_QUALITY_CHECK_TIMEOUT_MS = 3000; // 3 seconds to check connection quality

// Storage key for last sync time
const LAST_SYNC_KEY = "kiki_presence_cache_last_sync";

/**
 * Check if connection is good enough for background sync
 */
const checkConnectionQuality = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECTION_QUALITY_CHECK_TIMEOUT_MS);
    
    const start = Date.now();
    const response = await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    const duration = Date.now() - start;
    
    // Consider connection "good" if response was fast (under 1.5s) and successful
    return response.ok && duration < 1500;
  } catch {
    return false;
  }
};

/**
 * Get cached profile IDs that need refresh
 */
const getStaleProfileIds = async (): Promise<string[]> => {
  try {
    const { getCacheStats: getDBStats } = await import("@/utils/profileCacheDB");
    const stats = await getDBStats();
    
    // If no profiles in cache, nothing to sync
    if (stats.validCount === 0) return [];
    
    // Get all cached profiles and filter by age
    const db = await openProfileDB();
    if (!db) return [];
    
    const staleIds: string[] = [];
    const now = Date.now();
    const cutoff = now - MIN_CACHE_AGE_FOR_SYNC_MS;
    
    const tx = db.transaction('profiles', 'readonly');
    const store = tx.objectStore('profiles');
    
    return new Promise((resolve) => {
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const profile = cursor.value;
          if (profile.cachedAt < cutoff && profile.expiresAt > now) {
            staleIds.push(profile.profileId);
          }
          cursor.continue();
        } else {
          resolve(staleIds.slice(0, SYNC_BATCH_SIZE * 3)); // Limit total to avoid too much work
        }
      };
      request.onerror = () => resolve([]);
    });
  } catch (error) {
    console.warn('[PresenceCacheSync] Error getting stale profiles:', error);
    return [];
  }
};

/**
 * Open IndexedDB for profile cache
 */
const openProfileDB = (): Promise<IDBDatabase | null> => {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('kiki_profile_cache', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

/**
 * Fetch fresh profile data from server
 */
const fetchFreshProfiles = async (profileIds: string[]): Promise<PresenceWithProfile[]> => {
  if (profileIds.length === 0) return [];
  
  try {
    const { data, error } = await supabase
      .from('presence')
      .select(`
        id,
        profile_id,
        is_present,
        last_pulse,
        visible_to_others,
        profile:profiles!inner(
          id,
          name,
          avatar_url,
          vibe,
          city,
          has_tattoos,
          has_piercings,
          alternative_aesthetic,
          looking_for,
          email_verified,
          identity_verified,
          gender,
          birthdate
        )
      `)
      .in('profile_id', profileIds)
      .eq('visible_to_others', true);
    
    if (error || !data) return [];
    
    // Fetch tribes, music styles, and interests for these profiles
    const [tribesData, stylesData, interestsData] = await Promise.all([
      supabase
        .from('profile_tribes')
        .select('profile_id, tribe')
        .in('profile_id', profileIds),
      supabase
        .from('profile_music_styles')
        .select('profile_id, style')
        .in('profile_id', profileIds),
      supabase
        .from('profile_interests')
        .select('profile_id, interest')
        .in('profile_id', profileIds),
    ]);
    
    // Build lookup maps
    const tribesMap = new Map<string, string[]>();
    const stylesMap = new Map<string, string[]>();
    const interestsMap = new Map<string, string[]>();
    
    tribesData.data?.forEach(t => {
      const existing = tribesMap.get(t.profile_id) || [];
      tribesMap.set(t.profile_id, [...existing, t.tribe]);
    });
    
    stylesData.data?.forEach(s => {
      const existing = stylesMap.get(s.profile_id) || [];
      stylesMap.set(s.profile_id, [...existing, s.style]);
    });
    
    interestsData.data?.forEach(i => {
      const existing = interestsMap.get(i.profile_id) || [];
      interestsMap.set(i.profile_id, [...existing, i.interest]);
    });
    
    return data.map(item => ({
      id: item.id,
      profile_id: item.profile_id,
      is_present: item.is_present ?? false,
      last_pulse: item.last_pulse ?? new Date().toISOString(),
      visible_to_others: item.visible_to_others ?? true,
      profile: Array.isArray(item.profile) ? item.profile[0] : item.profile,
      tribes: tribesMap.get(item.profile_id) || [],
      musicStyles: stylesMap.get(item.profile_id) || [],
      interests: interestsMap.get(item.profile_id) || [],
      hasVisibilityBoost: false,
    }));
  } catch (error) {
    console.warn('[PresenceCacheSync] Error fetching profiles:', error);
    return [];
  }
};

/**
 * Run idle callback or fallback to setTimeout
 */
const runWhenIdle = (callback: () => void, timeout = 5000): void => {
  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 100);
  }
};

/**
 * Hook for automatic background cache synchronization
 */
export const usePresenceCacheSync = (enabled = true) => {
  const { isOnline } = useOnlineStatus();
  const isSyncingRef = useRef(false);
  const lastSyncRef = useRef<number>(0);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load last sync time from storage
  useEffect(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (stored) {
      lastSyncRef.current = parseInt(stored, 10) || 0;
    }
  }, []);
  
  const performSync = useCallback(async () => {
    // Skip if already syncing, offline, or synced recently
    if (isSyncingRef.current || !isOnline) return;
    
    const now = Date.now();
    if (now - lastSyncRef.current < SYNC_INTERVAL_MS) return;
    
    // Check connection quality before syncing
    const goodConnection = await checkConnectionQuality();
    if (!goodConnection) {
      console.log('[PresenceCacheSync] Connection too slow for background sync');
      return;
    }
    
    isSyncingRef.current = true;
    console.log('[PresenceCacheSync] Starting background sync...');
    
    try {
      // Get profiles that need updating
      const staleIds = await getStaleProfileIds();
      if (staleIds.length === 0) {
        console.log('[PresenceCacheSync] No stale profiles to sync');
        return;
      }
      
      console.log(`[PresenceCacheSync] Found ${staleIds.length} profiles to sync`);
      
      // Process in batches to avoid blocking
      for (let i = 0; i < staleIds.length; i += SYNC_BATCH_SIZE) {
        const batch = staleIds.slice(i, i + SYNC_BATCH_SIZE);
        
        // Fetch fresh data
        const freshProfiles = await fetchFreshProfiles(batch);
        
        // Update cache with fresh data
        for (const profile of freshProfiles) {
          await cachePresenceProfile(profile);
        }
        
        console.log(`[PresenceCacheSync] Synced batch ${Math.floor(i / SYNC_BATCH_SIZE) + 1}`);
        
        // Delay between batches
        if (i + SYNC_BATCH_SIZE < staleIds.length) {
          await new Promise(resolve => setTimeout(resolve, SYNC_BATCH_DELAY_MS));
        }
      }
      
      // Update last sync time
      lastSyncRef.current = now;
      localStorage.setItem(LAST_SYNC_KEY, String(now));
      
      console.log('[PresenceCacheSync] Background sync complete');
    } catch (error) {
      console.warn('[PresenceCacheSync] Sync failed:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [isOnline]);
  
  // Set up periodic sync check
  useEffect(() => {
    if (!enabled) return;
    
    // Initial sync after a delay (let app load first)
    const initialTimeout = setTimeout(() => {
      runWhenIdle(() => {
        performSync();
      });
    }, 10000); // 10 seconds after mount
    
    // Periodic sync check
    syncIntervalRef.current = setInterval(() => {
      runWhenIdle(() => {
        performSync();
      });
    }, SYNC_INTERVAL_MS);
    
    return () => {
      clearTimeout(initialTimeout);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [enabled, performSync]);
  
  // Sync when coming back online
  useEffect(() => {
    if (isOnline && enabled) {
      // Delay to let connection stabilize
      const timeout = setTimeout(() => {
        runWhenIdle(() => {
          performSync();
        });
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [isOnline, enabled, performSync]);
  
  return {
    triggerSync: performSync,
    isSyncing: isSyncingRef.current,
  };
};

export default usePresenceCacheSync;