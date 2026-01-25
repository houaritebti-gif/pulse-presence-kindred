import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "./useProfile";
import { useOnlineStatus } from "./useOnlineStatus";

export interface ProfilePromptData {
  id: string;
  prompt_key: string;
  answer: string;
  display_order: number;
}

export interface PresenceWithProfile {
  id: string;
  profile_id: string;
  is_present: boolean;
  last_pulse: string;
  visible_to_others: boolean;
  profile: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    vibe: string | null;
    city: string | null;
    has_tattoos: boolean | null;
    has_piercings: boolean | null;
    alternative_aesthetic: boolean | null;
    looking_for: string[] | null;
    email_verified: boolean | null;
    identity_verified: boolean | null;
    gender: string | null;
    birthdate: string | null;
  };
  tribes: string[];
  musicStyles: string[];
  interests: string[];
  prompts: ProfilePromptData[];
  hasVisibilityBoost?: boolean;
}

const PRESENCE_PAGE_SIZE = 20;
const MAX_RETRIES = 6; // Increased for mobile resilience
const BASE_DELAY_MS = 800; // Slightly faster initial retry
const MAX_DELAY_MS = 20000; // Reduced max delay for better UX
const REALTIME_DEBOUNCE_MS = 2000; // Debounce realtime updates to avoid excessive refetches
const MOBILE_TIMEOUT_MS = 25000; // 25 second timeout for mobile connections

// Detect if we're likely on a mobile device
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
};

// Calculate exponential backoff delay with jitter - faster on mobile
const calculateBackoffDelay = (attempt: number): number => {
  const isMobile = isMobileDevice();
  const baseDelay = isMobile ? BASE_DELAY_MS * 0.75 : BASE_DELAY_MS;
  const maxDelay = isMobile ? MAX_DELAY_MS * 0.6 : MAX_DELAY_MS;
  
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(2, attempt),
    maxDelay
  );
  // Add jitter (±20%)
  const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
  return Math.round(exponentialDelay + jitter);
};

// Check if error is retryable (network errors, timeouts, 5xx errors)
const isRetryableError = (error: unknown): boolean => {
  if (!error) return false;
  
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) return true;
  if (error instanceof TypeError && error.message.includes('network')) return true;
  
  // AbortError from timeout
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  
  // Supabase/Postgres errors
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; status?: number; message?: string };
    // Connection errors
    if (err.code === 'PGRST301' || err.code === 'PGRST000') return true;
    // Server errors (5xx)
    if (err.status && err.status >= 500) return true;
    // Timeout
    if (err.message?.toLowerCase().includes('timeout')) return true;
    if (err.message?.toLowerCase().includes('network')) return true;
    if (err.message?.toLowerCase().includes('aborted')) return true;
    if (err.message?.toLowerCase().includes('failed to fetch')) return true;
  }
  
  return false;
};

export const usePresenceList = (showAllProfiles: boolean = true) => {
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear retry count when online status changes to online
  useEffect(() => {
    if (isOnline) {
      setRetryCount(0);
    }
  }, [isOnline]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const query = useInfiniteQuery({
    queryKey: ["presence_list", showAllProfiles],
    queryFn: async ({ pageParam = 0 }) => {
      // Get presence entries that are visible
      // If showAllProfiles is true, show all profiles that have ever been present
      // If false, only show profiles active in last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      let queryBuilder = supabase
        .from("presence")
        .select(`
          *,
          profile:profiles(id, name, avatar_url, vibe, city, has_tattoos, has_piercings, alternative_aesthetic, looking_for, email_verified, identity_verified, gender, birthdate)
        `)
        .eq("visible_to_others", true)
        .order("last_pulse", { ascending: false })
        .range(pageParam * PRESENCE_PAGE_SIZE, (pageParam + 1) * PRESENCE_PAGE_SIZE - 1);

      // Only apply active filter if not showing all profiles
      if (!showAllProfiles) {
        queryBuilder = queryBuilder
          .eq("is_present", true)
          .gte("last_pulse", fiveMinutesAgo);
      }

      const { data: presenceData, error: presenceError } = await queryBuilder;

      if (presenceError) throw presenceError;

      // Get tribes for each profile
      const profileIds = presenceData?.map(p => p.profile?.id).filter(Boolean) || [];
      
      let tribesMap: Record<string, string[]> = {};
      let musicMap: Record<string, string[]> = {};
      let interestsMap: Record<string, string[]> = {};
      let promptsMap: Record<string, ProfilePromptData[]> = {};
      let visibilityBoostMap: Record<string, boolean> = {};
      
      if (profileIds.length > 0) {
        const [tribesResult, musicResult, interestsResult, promptsResult, visibilityBoostResult] = await Promise.all([
          supabase
            .from("profile_tribes")
            .select("profile_id, tribe")
            .in("profile_id", profileIds),
          supabase
            .from("profile_music_styles")
            .select("profile_id, style")
            .in("profile_id", profileIds),
          supabase
            .from("profile_interests")
            .select("profile_id, interest")
            .in("profile_id", profileIds),
          supabase
            .from("profile_prompts")
            .select("id, profile_id, prompt_key, answer, display_order")
            .in("profile_id", profileIds)
            .order("display_order", { ascending: true }),
          // Check for active visibility boosts from spark shop
          supabase
            .from("spark_purchased_items")
            .select("profile_id")
            .eq("item_key", "visibility_boost")
            .gt("expires_at", new Date().toISOString())
            .in("profile_id", profileIds)
        ]);

        tribesMap = (tribesResult.data || []).reduce((acc, t) => {
          if (!acc[t.profile_id]) acc[t.profile_id] = [];
          acc[t.profile_id].push(t.tribe);
          return acc;
        }, {} as Record<string, string[]>);

        musicMap = (musicResult.data || []).reduce((acc, m) => {
          if (!acc[m.profile_id]) acc[m.profile_id] = [];
          acc[m.profile_id].push(m.style);
          return acc;
        }, {} as Record<string, string[]>);

        interestsMap = (interestsResult.data || []).reduce((acc, i) => {
          if (!acc[i.profile_id]) acc[i.profile_id] = [];
          acc[i.profile_id].push(i.interest);
          return acc;
        }, {} as Record<string, string[]>);

        promptsMap = (promptsResult.data || []).reduce((acc, p) => {
          if (!acc[p.profile_id]) acc[p.profile_id] = [];
          acc[p.profile_id].push({
            id: p.id,
            prompt_key: p.prompt_key,
            answer: p.answer,
            display_order: p.display_order
          });
          return acc;
        }, {} as Record<string, ProfilePromptData[]>);

        // Map visibility boost
        (visibilityBoostResult.data || []).forEach(v => {
          visibilityBoostMap[v.profile_id] = true;
        });
      }

      // Reset retry count on success
      setRetryCount(0);

      const items = (presenceData || []).map(p => ({
        ...p,
        tribes: tribesMap[p.profile?.id] || [],
        musicStyles: musicMap[p.profile?.id] || [],
        interests: interestsMap[p.profile?.id] || [],
        prompts: promptsMap[p.profile?.id] || [],
        hasVisibilityBoost: visibilityBoostMap[p.profile?.id] || false,
      })) as PresenceWithProfile[];

      return {
        items,
        nextPage: items.length === PRESENCE_PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 2, // 2 minutes - has realtime updates
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchOnMount: false, // Don't refetch when component mounts if data is fresh
    refetchOnWindowFocus: false, // Disable automatic refetch on window focus - we have realtime
    retry: (failureCount, error) => {
      // Only retry retryable errors up to MAX_RETRIES
      if (!isRetryableError(error)) return false;
      return failureCount < MAX_RETRIES;
    },
    retryDelay: (attemptIndex) => calculateBackoffDelay(attemptIndex),
  });

  // Flatten pages for easy consumption
  const data = useMemo(() => 
    query.data?.pages.flatMap(page => page.items) || [],
    [query.data?.pages]
  );

  // Subscribe to realtime updates with debounce to avoid excessive refetches
  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout | null = null;
    
    const channel = supabase
      .channel("presence-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "presence" },
        () => {
          // Debounce invalidation to avoid multiple rapid refetches
          if (debounceTimeout) {
            clearTimeout(debounceTimeout);
          }
          debounceTimeout = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["presence_list"] });
          }, REALTIME_DEBOUNCE_MS);
        }
      )
      .subscribe();

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    ...query,
    data,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
};

export const useMyPresence = () => {
  const { data: profile, isLoading: profileLoading } = useProfile();

  return useQuery({
    queryKey: ["my_presence", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from("presence")
        .select("*")
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id && !profileLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes - longer cache
    gcTime: 1000 * 60 * 15, // 15 minutes in garbage collection
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnWindowFocus: false, // We have realtime updates
    retry: (failureCount, error) => {
      if (!isRetryableError(error)) return false;
      return failureCount < MAX_RETRIES;
    },
    retryDelay: (attemptIndex) => calculateBackoffDelay(attemptIndex),
  });
};

export const useSetPresence = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ isPresent, visibleToOthers = true, notifyHighCompatibility = false }: { 
      isPresent: boolean; 
      visibleToOthers?: boolean;
      notifyHighCompatibility?: boolean;
    }) => {
      if (!profile) throw new Error("No profile");

      // Use upsert to avoid race conditions with duplicate key errors
      const { error } = await supabase
        .from("presence")
        .upsert({
          profile_id: profile.id,
          is_present: isPresent,
          visible_to_others: visibleToOthers,
          last_pulse: new Date().toISOString(),
        }, {
          onConflict: 'profile_id'
        });

      if (error) throw error;

      // Notify high compatibility users when going online (only on initial connect)
      if (isPresent && visibleToOthers && notifyHighCompatibility) {
        try {
          await supabase.functions.invoke('notify-high-compatibility', {
            body: { profile_id: profile.id },
          });
        } catch (e) {
          // Don't fail the presence update if notification fails
          console.log('[Presence] High compatibility notification failed:', e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_presence", profile?.id] });
      queryClient.invalidateQueries({ queryKey: ["presence_list"] });
    },
  });
};

// Heartbeat to keep presence alive - uses stable references to avoid re-renders
export const usePresenceHeartbeat = () => {
  const { mutate: setPresence } = useSetPresence();
  const { data: myPresence } = useMyPresence();
  const presenceRef = useRef(myPresence);
  
  // Keep ref updated
  useEffect(() => {
    presenceRef.current = myPresence;
  }, [myPresence]);

  useEffect(() => {
    if (!myPresence?.is_present) return;

    const interval = setInterval(() => {
      const current = presenceRef.current;
      if (current?.is_present) {
        setPresence({ isPresent: true, visibleToOthers: current.visible_to_others ?? true });
      }
    }, 30000); // Pulse every 30 seconds

    return () => clearInterval(interval);
  }, [myPresence?.is_present, setPresence]);
};
