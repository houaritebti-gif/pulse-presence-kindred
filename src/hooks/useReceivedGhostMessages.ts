import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { notifyUser } from "@/utils/notificationSound";
import { useBlockedUsers } from "./useUserModeration";
import { useActiveBoostedProfiles } from "./useKikiNow";

export interface ReceivedGhostMessage {
  id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  is_premium_message: boolean;
  is_second_chance: boolean;
  is_super_spark: boolean;
  from_profile: {
    id: string;
    name: string | null;
    vibe: string | null;
    avatar_url: string | null;
    city: string | null;
  };
  // Whether I've sent a ghost message back (means spark exists or will exist)
  hasSentBack: boolean;
  // Whether sender has an active KIKI Now boost
  hasKikiNowBoost: boolean;
}

export const useReceivedGhostMessages = () => {
  const { data: profile } = useProfile();
  const { data: blockedUsers } = useBlockedUsers();
  const { data: boostedData } = useActiveBoostedProfiles();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["received_ghost_messages", profile?.id, blockedUsers, boostedData?.boostedIds],
    queryFn: async () => {
      if (!profile?.id) return [];

      // Get messages received by the current user
      const { data: messages, error } = await supabase
        .from("ghost_messages")
        .select(`
          id,
          content,
          created_at,
          read_at,
          is_premium_message,
          is_second_chance,
          is_super_spark,
          from_profile_id,
          from_profile:profiles!ghost_messages_from_profile_id_fkey(
            id, name, vibe, avatar_url, city
          )
        `)
        .eq("to_profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get messages I've sent to check for mutual interest
      const { data: sentMessages } = await supabase
        .from("ghost_messages")
        .select("to_profile_id")
        .eq("from_profile_id", profile.id);

      const sentToIds = new Set(sentMessages?.map(m => m.to_profile_id) || []);
      const blockedSet = new Set(blockedUsers || []);
      const boostedIds = boostedData?.boostedIds || new Set();

      // Filter out messages from blocked users and sort by Super Spark and KIKI Now boost first
      const filteredMessages = (messages || [])
        .filter(msg => !blockedSet.has(msg.from_profile_id))
        .map(msg => ({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at || "",
          read_at: msg.read_at,
          is_premium_message: msg.is_premium_message || false,
          is_second_chance: msg.is_second_chance || false,
          is_super_spark: msg.is_super_spark || false,
          from_profile: msg.from_profile as ReceivedGhostMessage["from_profile"],
          hasSentBack: sentToIds.has(msg.from_profile_id),
          hasKikiNowBoost: boostedIds.has(msg.from_profile_id),
        })) as ReceivedGhostMessage[];

      // Sort: Super Sparks first, then KIKI Now boosted, then by created_at descending
      return filteredMessages.sort((a, b) => {
        // Super Sparks have highest priority
        if (a.is_super_spark && !b.is_super_spark) return -1;
        if (!a.is_super_spark && b.is_super_spark) return 1;
        // Then KIKI Now boosts
        if (a.hasKikiNowBoost && !b.hasKikiNowBoost) return -1;
        if (!a.hasKikiNowBoost && b.hasKikiNowBoost) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes - has realtime updates
  });

  // Track if this is initial load to avoid playing sound on mount
  const isInitialLoad = useRef(true);

  // Subscribe to realtime updates and play sound on new messages
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("received-ghost-messages")
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "ghost_messages",
          filter: `to_profile_id=eq.${profile.id}`
        },
        async (payload) => {
          // Play ghost notification sound for new messages
          if (!isInitialLoad.current) {
            const newMsg = payload.new as { is_super_spark?: boolean };
            // Super spark gets a special notification type
            notifyUser(newMsg?.is_super_spark ? "superSpark" : "ghost");
          }
          queryClient.invalidateQueries({ queryKey: ["received_ghost_messages", profile.id] });
        }
      )
      .subscribe();

    // Mark initial load as complete after a short delay
    const timeout = setTimeout(() => {
      isInitialLoad.current = false;
    }, 1000);

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  return query;
};

export const useUnreadGhostMessageCount = () => {
  const { data: messages } = useReceivedGhostMessages();
  return messages?.filter(m => !m.read_at).length || 0;
};

export const useMarkGhostMessageRead = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const markAsRead = async (messageId: string) => {
    const { error } = await supabase
      .from("ghost_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);

    if (!error && profile?.id) {
      queryClient.invalidateQueries({ queryKey: ["received_ghost_messages", profile.id] });
    }
  };

  return markAsRead;
};
