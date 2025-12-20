import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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
  };
  tribes: string[];
}

export const usePresenceList = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["presence_list"],
    queryFn: async () => {
      // Get presence entries that are visible and active (pulsed in last 5 min)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data: presenceData, error: presenceError } = await supabase
        .from("presence")
        .select(`
          *,
          profile:profiles(id, name, avatar_url, vibe, city)
        `)
        .eq("is_present", true)
        .eq("visible_to_others", true)
        .gte("last_pulse", fiveMinutesAgo);

      if (presenceError) throw presenceError;

      // Get tribes for each profile
      const profileIds = presenceData?.map(p => p.profile?.id).filter(Boolean) || [];
      
      let tribesMap: Record<string, string[]> = {};
      if (profileIds.length > 0) {
        const { data: tribesData } = await supabase
          .from("profile_tribes")
          .select("profile_id, tribe")
          .in("profile_id", profileIds);

        tribesMap = (tribesData || []).reduce((acc, t) => {
          if (!acc[t.profile_id]) acc[t.profile_id] = [];
          acc[t.profile_id].push(t.tribe);
          return acc;
        }, {} as Record<string, string[]>);
      }

      return (presenceData || []).map(p => ({
        ...p,
        tribes: tribesMap[p.profile?.id] || [],
      })) as PresenceWithProfile[];
    },
  });

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

  return query;
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
  });
};

export const useSetPresence = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ isPresent, visibleToOthers = true }: { isPresent: boolean; visibleToOthers?: boolean }) => {
      if (!profile) throw new Error("No profile");

      const { data: existing } = await supabase
        .from("presence")
        .select("id")
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("presence")
          .update({
            is_present: isPresent,
            visible_to_others: visibleToOthers,
            last_pulse: new Date().toISOString(),
          })
          .eq("profile_id", profile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("presence")
          .insert({
            profile_id: profile.id,
            is_present: isPresent,
            visible_to_others: visibleToOthers,
            last_pulse: new Date().toISOString(),
          });

        if (error) throw error;
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
