import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cacheProfile, getCachedProfile } from "@/utils/profileCacheDB";
import { Profile } from "./useProfile";

interface PrefetchableProfile {
  id: string;
  name?: string | null;
  avatar_url?: string | null;
}

/**
 * Prefetch profile data into IndexedDB cache when profiles become visible.
 * Uses a queue system to avoid overwhelming the network.
 */
export const useProfilePrefetch = () => {
  const prefetchedRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) return;
    
    isProcessingRef.current = true;
    
    while (queueRef.current.length > 0) {
      const profileId = queueRef.current.shift();
      if (!profileId) continue;
      
      try {
        // Check if already cached
        const cached = await getCachedProfile(profileId);
        if (cached) {
          console.log('[Prefetch] Already cached:', profileId);
          continue;
        }

        // Small delay between requests to be gentle on the network
        await new Promise(resolve => setTimeout(resolve, 100));

        // Fetch profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", profileId)
          .maybeSingle();

        if (!profile) continue;

        // Fetch related data in parallel
        const [tribesRes, musicRes, interestsRes] = await Promise.all([
          supabase.from("profile_tribes").select("tribe").eq("profile_id", profileId),
          supabase.from("profile_music_styles").select("style").eq("profile_id", profileId),
          supabase.from("profile_interests").select("interest").eq("profile_id", profileId),
        ]);

        // Cache the profile
        await cacheProfile(
          profileId,
          profile as Profile,
          tribesRes.data?.map(t => t.tribe) || [],
          musicRes.data?.map(m => m.style) || [],
          interestsRes.data?.map(i => i.interest) || []
        );

        console.log('[Prefetch] Cached profile:', profileId);
      } catch (error) {
        console.warn('[Prefetch] Failed to prefetch:', profileId, error);
      }
    }
    
    isProcessingRef.current = false;
  }, []);

  const prefetchProfile = useCallback((profileId: string) => {
    // Skip if already prefetched or in queue
    if (prefetchedRef.current.has(profileId) || queueRef.current.includes(profileId)) {
      return;
    }

    prefetchedRef.current.add(profileId);
    queueRef.current.push(profileId);
    
    // Start processing queue (debounced)
    setTimeout(processQueue, 50);
  }, [processQueue]);

  const prefetchProfiles = useCallback((profileIds: string[]) => {
    profileIds.forEach(prefetchProfile);
  }, [prefetchProfile]);

  return { prefetchProfile, prefetchProfiles };
};

/**
 * Hook that uses IntersectionObserver to prefetch profiles when cards become visible.
 * Attach the returned ref to profile card containers.
 */
export const useVisibilityPrefetch = (profileId: string | undefined) => {
  const { prefetchProfile } = useProfilePrefetch();
  const elementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasPrefetchedRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !profileId || hasPrefetchedRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasPrefetchedRef.current) {
          hasPrefetchedRef.current = true;
          prefetchProfile(profileId);
          // Disconnect after prefetching
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: "200px", // Start prefetching before fully visible
        threshold: 0,
      }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [profileId, prefetchProfile]);

  return elementRef;
};

/**
 * Prefetch adjacent profiles in a list (for swipe-based navigation).
 * Call this when the current index changes.
 */
export const usePrefetchAdjacent = (
  profiles: PrefetchableProfile[],
  currentIndex: number,
  prefetchCount: number = 3
) => {
  const { prefetchProfiles } = useProfilePrefetch();

  useEffect(() => {
    if (profiles.length === 0 || currentIndex < 0) return;

    // Prefetch next N profiles from current position
    const profilesToPrefetch: string[] = [];
    
    for (let i = 1; i <= prefetchCount; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < profiles.length && profiles[nextIndex]?.id) {
        profilesToPrefetch.push(profiles[nextIndex].id);
      }
    }

    if (profilesToPrefetch.length > 0) {
      console.log('[Prefetch] Prefetching adjacent profiles:', profilesToPrefetch.length);
      prefetchProfiles(profilesToPrefetch);
    }
  }, [currentIndex, profiles, prefetchCount, prefetchProfiles]);
};
