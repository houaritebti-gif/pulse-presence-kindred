import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "./useProfile";

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
  hasVisibilityBoost?: boolean;
}

const PRESENCE_PAGE_SIZE = 20;

export const usePresenceList = (showAllProfiles: boolean = false) => {
  const queryClient = useQueryClient();

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
      let visibilityBoostMap: Record<string, boolean> = {};
      
      if (profileIds.length > 0) {
        const [tribesResult, musicResult, interestsResult, visibilityBoostResult] = await Promise.all([
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

        // Map visibility boost
        (visibilityBoostResult.data || []).forEach(v => {
          visibilityBoostMap[v.profile_id] = true;
        });
      }

      const items = (presenceData || []).map(p => ({
        ...p,
        tribes: tribesMap[p.profile?.id] || [],
        musicStyles: musicMap[p.profile?.id] || [],
        interests: interestsMap[p.profile?.id] || [],
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
  });

  // Flatten pages for easy consumption
  const data = useMemo(() => 
    query.data?.pages.flatMap(page => page.items) || [],
    [query.data?.pages]
  );

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("presence-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "presence" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["presence_list"] });
        }
      )
      .subscribe();

    return () => {
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
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["my_presence", profile?.id],
    queryFn: async () => {
      if (!profile) return null;

      const { data, error } = await supabase
        .from("presence")
        .select("*")
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 3, // 3 minutes
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

// Heartbeat to keep presence alive
export const usePresenceHeartbeat = () => {
  const { mutate: setPresence } = useSetPresence();
  const { data: myPresence } = useMyPresence();

  useEffect(() => {
    if (!myPresence?.is_present) return;

    const interval = setInterval(() => {
      setPresence({ isPresent: true, visibleToOthers: myPresence.visible_to_others });
    }, 30000); // Pulse every 30 seconds

    return () => clearInterval(interval);
  }, [myPresence, setPresence]);
};
