import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { sendPushNotification } from "@/utils/pushNotifications";

export interface SparkChat {
  id: string;
  profile_a_id: string;
  profile_b_id: string;
  created_at: string;
  extinguished_by_a: boolean;
  extinguished_by_b: boolean;
  other_profile?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    vibe: string | null;
  };
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_profile_id: string;
  content: string;
  created_at: string;
}

// Get all active spark chats for current user
export const useSparkChats = () => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["spark_chats", profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .from("spark_chats")
        .select(`
          *,
          profile_a:profiles!spark_chats_profile_a_id_fkey(id, name, avatar_url, vibe),
          profile_b:profiles!spark_chats_profile_b_id_fkey(id, name, avatar_url, vibe)
        `)
        .or(`profile_a_id.eq.${profile.id},profile_b_id.eq.${profile.id}`);

      if (error) throw error;

      // Filter out extinguished chats and map to include other_profile
      return (data || [])
        .filter(chat => {
          const isA = chat.profile_a_id === profile.id;
          const extinguished = isA ? chat.extinguished_by_a : chat.extinguished_by_b;
          return !extinguished;
        })
        .map(chat => {
          const isA = chat.profile_a_id === profile.id;
          return {
            ...chat,
            other_profile: isA ? chat.profile_b : chat.profile_a,
          } as SparkChat;
        });
    },
    enabled: !!profile?.id,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("spark-chats-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "spark_chats" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["spark_chats", profile.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  return query;
};

// Get spark count for notification badge
export const useSparkCount = () => {
  const { data: chats } = useSparkChats();
  return chats?.length || 0;
};

// Check if there's a mutual spark with a specific profile
export const useHasSparkWith = (otherProfileId: string | undefined) => {
  const { data: chats } = useSparkChats();
  
  if (!otherProfileId || !chats) return false;
  
  return chats.some(
    chat => chat.other_profile?.id === otherProfileId
  );
};

// Get chat messages for a specific chat
export const useChatMessages = (chatId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["chat_messages", chatId],
    queryFn: async () => {
      if (!chatId) return [];

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!chatId,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat-messages-${chatId}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "chat_messages",
          filter: `chat_id=eq.${chatId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat_messages", chatId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, queryClient]);

  return query;
};

// Send a message in a chat
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ chatId, content, recipientProfileId }: { chatId: string; content: string; recipientProfileId?: string }) => {
      if (!profile) throw new Error("No profile");

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          chat_id: chatId,
          sender_profile_id: profile.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Send push notification to recipient
      if (recipientProfileId && recipientProfileId !== profile.id) {
        sendPushNotification({
          profileId: recipientProfileId,
          title: `💬 ${profile.name || "Alguien"} te ha enviado un mensaje`,
          body: content.length > 50 ? content.substring(0, 50) + "..." : content,
          url: `/spark/${chatId}`,
          tag: `message-${chatId}`,
        });
      }
      
      return data;
    },
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ["chat_messages", chatId] });
    },
  });
};

// Extinguish a spark (close chat)
export const useExtinguishSpark = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (chatId: string) => {
      if (!profile) throw new Error("No profile");

      // Get the chat to determine which field to update
      const { data: chat } = await supabase
        .from("spark_chats")
        .select("profile_a_id, profile_b_id")
        .eq("id", chatId)
        .single();

      if (!chat) throw new Error("Chat not found");

      const isA = chat.profile_a_id === profile.id;
      const updateField = isA ? "extinguished_by_a" : "extinguished_by_b";

      const { error } = await supabase
        .from("spark_chats")
        .update({ [updateField]: true })
        .eq("id", chatId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spark_chats", profile?.id] });
    },
  });
};

// Check daily ghost message limit (5 per day)
export const useGhostMessageLimit = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["ghost_message_count", profile?.id],
    queryFn: async () => {
      if (!profile) return { count: 0, remaining: 5 };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from("ghost_messages")
        .select("*", { count: "exact", head: true })
        .eq("from_profile_id", profile.id)
        .gte("created_at", today.toISOString());

      if (error) throw error;

      const sentToday = count || 0;
      return {
        count: sentToday,
        remaining: Math.max(0, 5 - sentToday),
        canSend: sentToday < 5,
      };
    },
    enabled: !!profile?.id,
  });
};
