import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { notifyUser } from "@/utils/notificationSound";
import { useBlockedUsers } from "./useUserModeration";

export interface ReceivedGhostMessage {
  id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  is_premium_message: boolean;
  is_second_chance: boolean;
  from_profile: {
    id: string;
    name: string | null;
    vibe: string | null;
    avatar_url: string | null;
    city: string | null;
  };
  // Whether I've sent a ghost message back (means spark exists or will exist)
  hasSentBack: boolean;
}

export const useReceivedGhostMessages = () => {
  const { data: profile } = useProfile();
  const { data: blockedUsers } = useBlockedUsers();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["received_ghost_messages", profile?.id, blockedUsers],
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

      // Filter out messages from blocked users
      return (messages || [])
        .filter(msg => !blockedSet.has(msg.from_profile_id))
        .map(msg => ({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at || "",
          read_at: msg.read_at,
          is_premium_message: msg.is_premium_message || false,
          is_second_chance: msg.is_second_chance || false,
          from_profile: msg.from_profile as ReceivedGhostMessage["from_profile"],
          hasSentBack: sentToIds.has(msg.from_profile_id),
        })) as ReceivedGhostMessage[];
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
        () => {
          // Play ghost notification sound for new messages
          if (!isInitialLoad.current) {
            notifyUser("ghost");
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
