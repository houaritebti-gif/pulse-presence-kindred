import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./useProfile";
import { 
  getCachedProfile, 
  cacheProfile, 
  clearExpiredProfiles 
} from "@/utils/profileCacheDB";

export interface PublicProfileData {
  profile: Profile | null;
  tribes: string[];
  musicStyles: string[];
  interests: string[];
  fromCache?: boolean;
}

// Clear expired profiles on module load (once per session)
let cleanupDone = false;
const runCleanup = async () => {
  if (cleanupDone) return;
  cleanupDone = true;
  try {
    await clearExpiredProfiles();
  } catch (e) {
    console.error('[ProfileCache] Cleanup error:', e);
  }
};

export const usePublicProfile = (profileId: string | undefined) => {
  // Run cleanup on first hook usage
  useEffect(() => {
    runCleanup();
  }, []);

  return useQuery({
    queryKey: ["public_profile", profileId],
    queryFn: async (): Promise<PublicProfileData> => {
      if (!profileId) {
        return { profile: null, tribes: [], musicStyles: [], interests: [] };
      }

      // 1. Try to get from IndexedDB cache first
      try {
        const cached = await getCachedProfile(profileId);
        if (cached) {
          // Return cached data immediately, but also fetch fresh data in background
          console.log('[ProfileCache] Serving from cache:', profileId);
          
          // Background refresh (non-blocking)
          fetchAndCacheProfile(profileId).catch(() => {});
          
          return {
            profile: cached.profile,
            tribes: cached.tribes,
            musicStyles: cached.musicStyles,
            interests: cached.interests,
            fromCache: true,
          };
        }
      } catch (cacheError) {
        console.warn('[ProfileCache] Cache read failed, fetching from network:', cacheError);
      }

      // 2. If not cached, fetch from Supabase
      return fetchAndCacheProfile(profileId);
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5, // 5 minutes - profiles don't change often
  });
};

/**
 * Fetch profile data from Supabase and cache it
 */
async function fetchAndCacheProfile(profileId: string): Promise<PublicProfileData> {
  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) throw profileError;

  // Fetch tribes
  const { data: tribesData } = await supabase
    .from("profile_tribes")
    .select("tribe")
    .eq("profile_id", profileId);

  // Fetch music styles
  const { data: musicData } = await supabase
    .from("profile_music_styles")
    .select("style")
    .eq("profile_id", profileId);

  // Fetch interests
  const { data: interestsData } = await supabase
    .from("profile_interests")
    .select("interest")
    .eq("profile_id", profileId);

  const result = {
    profile: profile as Profile | null,
    tribes: tribesData?.map(t => t.tribe) || [],
    musicStyles: musicData?.map(m => m.style) || [],
    interests: interestsData?.map(i => i.interest) || [],
  };

  // 3. Cache the fresh data (non-blocking)
  if (profile) {
    cacheProfile(
      profileId,
      profile as Profile,
      result.tribes,
      result.musicStyles,
      result.interests
    ).catch(e => console.warn('[ProfileCache] Failed to cache:', e));
  }

  return result;
}
