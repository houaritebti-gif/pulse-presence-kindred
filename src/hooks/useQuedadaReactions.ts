import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useEffect } from "react";

const REACTION_EMOJIS = ["❤️", "😂", "🔥", "👏", "😮", "😢"];

interface Reaction {
  id: string;
  message_id: string;
  profile_id: string;
  emoji: string;
  created_at: string;
}

interface ReactionGroup {
  emoji: string;
  count: number;
  hasReacted: boolean;
  profiles: string[];
}

export const useQuedadaReactions = (quedadaId: string | undefined) => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  // Fetch all reactions for a quedada's messages
  const { data: reactions, isLoading } = useQuery({
    queryKey: ["quedada-reactions", quedadaId],
    queryFn: async () => {
      if (!quedadaId) return [];

      // First get all message IDs for this quedada
      const { data: messages } = await supabase
        .from("quedada_messages")
        .select("id")
        .eq("quedada_id", quedadaId);

      if (!messages?.length) return [];

      const messageIds = messages.map((m) => m.id);

      const { data, error } = await supabase
        .from("quedada_message_reactions")
        .select("*")
        .in("message_id", messageIds);

      if (error) {
        console.error("Error fetching reactions:", error);
        return [];
      }

      return data as Reaction[];
    },
    enabled: !!quedadaId,
    staleTime: 1000 * 60 * 2, // 2 minutes - has realtime updates
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!quedadaId) return;

    const channel = supabase
      .channel(`quedada-reactions-${quedadaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quedada_message_reactions",
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["quedada-reactions", quedadaId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quedadaId, queryClient]);

  // Add reaction mutation
  const addReaction = useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => {
      if (!profile?.id) throw new Error("No profile");

      const { error } = await supabase
        .from("quedada_message_reactions")
        .insert({
          message_id: messageId,
          profile_id: profile.id,
          emoji,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["quedada-reactions", quedadaId],
      });
    },
  });

  // Remove reaction mutation
  const removeReaction = useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => {
      if (!profile?.id) throw new Error("No profile");

      const { error } = await supabase
        .from("quedada_message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("profile_id", profile.id)
        .eq("emoji", emoji);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["quedada-reactions", quedadaId],
      });
    },
  });

  // Toggle reaction (add if not exists, remove if exists)
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!profile?.id) return;

    const existingReaction = reactions?.find(
      (r) =>
        r.message_id === messageId &&
        r.profile_id === profile.id &&
        r.emoji === emoji
    );

    if (existingReaction) {
      await removeReaction.mutateAsync({ messageId, emoji });
    } else {
      await addReaction.mutateAsync({ messageId, emoji });
    }

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);
  };

  // Get grouped reactions for a message
  const getMessageReactions = (messageId: string): ReactionGroup[] => {
    if (!reactions) return [];

    const messageReactions = reactions.filter((r) => r.message_id === messageId);
    const grouped: Record<string, ReactionGroup> = {};

    messageReactions.forEach((r) => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = {
          emoji: r.emoji,
          count: 0,
          hasReacted: false,
          profiles: [],
        };
      }
      grouped[r.emoji].count++;
      grouped[r.emoji].profiles.push(r.profile_id);
      if (r.profile_id === profile?.id) {
        grouped[r.emoji].hasReacted = true;
      }
    });

    return Object.values(grouped).sort((a, b) => b.count - a.count);
  };

  return {
    reactions,
    isLoading,
    toggleReaction,
    getMessageReactions,
    availableEmojis: REACTION_EMOJIS,
    isToggling: addReaction.isPending || removeReaction.isPending,
  };
};
