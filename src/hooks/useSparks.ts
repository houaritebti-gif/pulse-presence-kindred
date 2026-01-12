import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { sendPushNotification } from "@/utils/pushNotifications";
import { vibrateDevice } from "@/utils/notificationSound";

export interface SparkChat {
  id: string;
  profile_a_id: string;
  profile_b_id: string;
  created_at: string;
  extinguished_by_a: boolean;
  extinguished_by_b: boolean;
  unread_count?: number;
  last_message_at?: string;
  last_message_content?: string;
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
  updated_at: string | null;
}

const SPARKS_PAGE_SIZE = 15;

// Get all active spark chats for current user with pagination
export const useSparkChats = () => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["spark_chats", profile?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!profile) return { items: [], nextPage: undefined };

      // Fetch blocked users directly in queryFn to avoid nested hooks
      const { data: blockedData } = await supabase
        .from("user_blocks")
        .select("blocked_profile_id")
        .eq("blocker_profile_id", profile.id);

      const blockedSet = new Set(blockedData?.map(b => b.blocked_profile_id) || []);

      // Fetch read status for all chats
      const { data: readStatusData } = await supabase
        .from("spark_read_status")
        .select("chat_id, last_read_at")
        .eq("profile_id", profile.id);

      const readStatusMap = new Map(
        readStatusData?.map(rs => [rs.chat_id, new Date(rs.last_read_at)]) || []
      );

      const { data, error } = await supabase
        .from("spark_chats")
        .select(`
          *,
          profile_a:profiles!spark_chats_profile_a_id_fkey(id, name, avatar_url, vibe),
          profile_b:profiles!spark_chats_profile_b_id_fkey(id, name, avatar_url, vibe)
        `)
        .or(`profile_a_id.eq.${profile.id},profile_b_id.eq.${profile.id}`)
        .order("created_at", { ascending: false })
        .range(pageParam * SPARKS_PAGE_SIZE, (pageParam + 1) * SPARKS_PAGE_SIZE - 1);

      if (error) throw error;

      // Get chat IDs for fetching message counts
      const chatIds = (data || [])
        .filter(chat => {
          const isA = chat.profile_a_id === profile.id;
          const extinguished = isA ? chat.extinguished_by_a : chat.extinguished_by_b;
          const otherProfileId = isA ? chat.profile_b_id : chat.profile_a_id;
          return !extinguished && !blockedSet.has(otherProfileId);
        })
        .map(chat => chat.id);

      // Fetch unread counts and last message for each chat
      const unreadCounts = new Map<string, number>();
      const lastMessages = new Map<string, { created_at: string; content: string }>();
      
      await Promise.all(
        chatIds.map(async (chatId) => {
          const lastRead = readStatusMap.get(chatId);
          
          // Get unread count
          let countQuery = supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("chat_id", chatId)
            .neq("sender_profile_id", profile.id);
          
          if (lastRead) {
            countQuery = countQuery.gt("created_at", lastRead.toISOString());
          }
          
          const { count } = await countQuery;
          unreadCounts.set(chatId, count || 0);

          // Get last message
          const { data: lastMsg } = await supabase
            .from("chat_messages")
            .select("created_at, content")
            .eq("chat_id", chatId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (lastMsg) {
            lastMessages.set(chatId, { created_at: lastMsg.created_at, content: lastMsg.content });
          }
        })
      );

      // Filter out extinguished chats, blocked users, and map to include other_profile
      const chats = (data || [])
        .filter(chat => {
          const isA = chat.profile_a_id === profile.id;
          const extinguished = isA ? chat.extinguished_by_a : chat.extinguished_by_b;
          const otherProfileId = isA ? chat.profile_b_id : chat.profile_a_id;
          return !extinguished && !blockedSet.has(otherProfileId);
        })
        .map(chat => {
          const isA = chat.profile_a_id === profile.id;
          const lastMsg = lastMessages.get(chat.id);
          return {
            ...chat,
            other_profile: isA ? chat.profile_b : chat.profile_a,
            unread_count: unreadCounts.get(chat.id) || 0,
            last_message_at: lastMsg?.created_at || chat.created_at,
            last_message_content: lastMsg?.content,
          } as SparkChat;
        });

      // Sort by last message (most recent first)
      const sortedChats = chats.sort((a, b) => {
        const timeA = new Date(a.last_message_at || a.created_at).getTime();
        const timeB = new Date(b.last_message_at || b.created_at).getTime();
        return timeB - timeA;
      });

      return {
        items: sortedChats,
        nextPage: sortedChats.length === SPARKS_PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!profile?.id,
    staleTime: 60 * 1000, // 1 minute - chats update frequently but not instantly needed
  });

  // Flatten pages for easy consumption
  const data = useMemo(() => 
    query.data?.pages.flatMap(page => page.items) || [],
    [query.data?.pages]
  );

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

  return {
    ...query,
    data,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
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

// Get the spark chat ID with a specific profile (if exists)
export const useSparkChatWith = (otherProfileId: string | undefined) => {
  const { data: chats } = useSparkChats();
  
  if (!otherProfileId || !chats) return null;
  
  const chat = chats.find(c => c.other_profile?.id === otherProfileId);
  return chat?.id || null;
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
      // Backend will filter out muted chats
      if (recipientProfileId && recipientProfileId !== profile.id) {
        sendPushNotification({
          profileId: recipientProfileId,
          title: `💬 ${profile.name || "Alguien"} te ha enviado un mensaje`,
          body: content.length > 50 ? content.substring(0, 50) + "..." : content,
          url: `/spark/${chatId}`,
          tag: `message-${chatId}`,
          sparkChatId: chatId,
        });
      }
      
      return data;
    },
    onSuccess: (_, { chatId }) => {
      vibrateDevice("message");
      queryClient.invalidateQueries({ queryKey: ["chat_messages", chatId] });
    },
  });
};

// Delete a message
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, chatId }: { messageId: string; chatId: string }) => {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
      return chatId;
    },
    onSuccess: (chatId) => {
      queryClient.invalidateQueries({ queryKey: ["chat_messages", chatId] });
      queryClient.invalidateQueries({ queryKey: ["spark_chats"] });
    },
  });
};

// Edit a message
export const useEditMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, chatId, content }: { messageId: string; chatId: string; content: string }) => {
      const { error } = await supabase
        .from("chat_messages")
        .update({ content })
        .eq("id", messageId);

      if (error) throw error;
      return chatId;
    },
    onSuccess: (chatId) => {
      queryClient.invalidateQueries({ queryKey: ["chat_messages", chatId] });
      queryClient.invalidateQueries({ queryKey: ["spark_chats"] });
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

// Ghost message limits by tier
const GHOST_MESSAGE_LIMITS = {
  free: 5,
  plus: 15,
  premium: Infinity,
} as const;

// Check daily ghost message limit based on subscription tier + purchased extras
export const useGhostMessageLimit = () => {
  const { data: profile } = useProfile();
  const { tier } = useSubscriptionTier(profile?.id);

  const baseDailyLimit = GHOST_MESSAGE_LIMITS[tier] || 5;

  return useQuery({
    queryKey: ["ghost_message_count", profile?.id, tier],
    queryFn: async () => {
      if (!profile) return { count: 0, remaining: baseDailyLimit, canSend: true, limit: baseDailyLimit, tier, extraAvailable: 0 };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's sent messages count
      const { count, error } = await supabase
        .from("ghost_messages")
        .select("*", { count: "exact", head: true })
        .eq("from_profile_id", profile.id)
        .gte("created_at", today.toISOString());

      if (error) throw error;

      // Get available purchased extra messages
      const { data: purchasedItems } = await supabase
        .from("spark_purchased_items")
        .select("quantity, used_quantity, expires_at")
        .eq("profile_id", profile.id)
        .in("item_key", ["ghost_message_1", "ghost_message_3"])
        .or("expires_at.is.null,expires_at.gt.now()");

      const extraAvailable = (purchasedItems || []).reduce((sum, item) => {
        const available = item.quantity - item.used_quantity;
        return sum + Math.max(0, available);
      }, 0);

      const sentToday = count || 0;
      const totalLimit = baseDailyLimit === Infinity ? Infinity : baseDailyLimit + extraAvailable;
      const remaining = totalLimit === Infinity ? Infinity : Math.max(0, totalLimit - sentToday);
      const canSend = totalLimit === Infinity || sentToday < totalLimit;

      return {
        count: sentToday,
        remaining,
        canSend,
        limit: baseDailyLimit,
        totalLimit,
        tier,
        extraAvailable,
        usedExtras: Math.max(0, sentToday - baseDailyLimit),
      };
    },
    enabled: !!profile?.id,
  });
};

// Check if user can send a second chance message (Premium OR purchased with energy)
export const useCanSendSecondChance = (targetProfileId: string | undefined) => {
  const { data: profile } = useProfile();
  const { tier } = useSubscriptionTier(profile?.id);

  return useQuery({
    queryKey: ["can_second_chance", profile?.id, targetProfileId, tier],
    queryFn: async () => {
      if (!profile?.id || !targetProfileId) {
        return { canSend: false, reason: 'no_target', hasPurchased: false };
      }

      // Check if user has premium OR purchased second_chance item
      const { data: purchasedItems } = await supabase
        .from("spark_purchased_items")
        .select("quantity, used_quantity, expires_at")
        .eq("profile_id", profile.id)
        .eq("item_key", "second_chance")
        .or("expires_at.is.null,expires_at.gt.now()");

      const availableSecondChances = (purchasedItems || []).reduce((sum, item) => {
        return sum + Math.max(0, item.quantity - item.used_quantity);
      }, 0);

      const hasPurchasedSecondChance = availableSecondChances > 0;
      const canUseSecondChance = tier === 'premium' || hasPurchasedSecondChance;

      if (!canUseSecondChance) {
        return { canSend: false, reason: 'premium_or_purchase_required', hasPurchased: false };
      }

      // Check if we already sent a message to this person
      const { data: existingMessages, error } = await supabase
        .from("ghost_messages")
        .select("id, created_at, is_second_chance")
        .eq("from_profile_id", profile.id)
        .eq("to_profile_id", targetProfileId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!existingMessages || existingMessages.length === 0) {
        return { canSend: false, reason: 'no_first_message', hasPurchased: hasPurchasedSecondChance };
      }

      // Already sent a second chance
      if (existingMessages.some(m => m.is_second_chance)) {
        return { canSend: false, reason: 'already_sent_second', hasPurchased: hasPurchasedSecondChance };
      }

      // Check if 7 days have passed since the first message (for premium users)
      // Purchased second chances bypass the 7 day wait
      if (!hasPurchasedSecondChance) {
        const firstMessage = existingMessages[existingMessages.length - 1];
        const daysSinceFirst = Math.floor(
          (Date.now() - new Date(firstMessage.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceFirst < 7) {
          return { canSend: false, reason: 'too_soon', daysRemaining: 7 - daysSinceFirst, hasPurchased: false };
        }
      }

      return { canSend: true, reason: null, hasPurchased: hasPurchasedSecondChance, availableSecondChances };
    },
    enabled: !!profile?.id && !!targetProfileId,
  });
};

// Helper hook to get subscription tier from profile id
const useSubscriptionTier = (profileId: string | undefined) => {
  const query = useQuery({
    queryKey: ["subscription_tier", profileId],
    queryFn: async () => {
      if (!profileId) return 'free' as const;

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("tier, expires_at")
        .eq("profile_id", profileId)
        .maybeSingle();

      if (error || !data) return 'free' as const;

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return 'free' as const;
      }

      return (data.tier || 'free') as 'free' | 'plus' | 'premium';
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return { tier: query.data || 'free' as const, isLoading: query.isLoading };
};

// Mark spark chat as read
export const useMarkSparkRead = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (chatId: string) => {
      if (!profile) throw new Error("No profile");

      const { error } = await supabase
        .from("spark_read_status")
        .upsert({
          chat_id: chatId,
          profile_id: profile.id,
          last_read_at: new Date().toISOString(),
        }, {
          onConflict: "chat_id,profile_id",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spark_chats", profile?.id] });
    },
  });
};

// Get total unread spark messages count
export const useUnreadSparkCount = () => {
  const { data: chats } = useSparkChats();
  return chats?.reduce((sum, chat) => sum + (chat.unread_count || 0), 0) || 0;
};

// Get the other user's last read timestamp for a chat
export const useOtherUserReadStatus = (chatId: string | undefined, otherProfileId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["other_user_read_status", chatId, otherProfileId],
    queryFn: async () => {
      if (!chatId || !otherProfileId) return null;

      const { data, error } = await supabase
        .from("spark_read_status")
        .select("last_read_at")
        .eq("chat_id", chatId)
        .eq("profile_id", otherProfileId)
        .maybeSingle();

      if (error) throw error;
      return data?.last_read_at ? new Date(data.last_read_at) : null;
    },
    enabled: !!chatId && !!otherProfileId,
  });

  // Subscribe to realtime updates for read status changes
  useEffect(() => {
    if (!chatId || !otherProfileId) return;

    const channel = supabase
      .channel(`read-status-${chatId}-${otherProfileId}`)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "spark_read_status",
          filter: `chat_id=eq.${chatId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["other_user_read_status", chatId, otherProfileId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, otherProfileId, queryClient]);

  return query;
};

// Subscribe to realtime updates for unread messages in spark chats list
export const useSparkChatsRealtime = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  useEffect(() => {
    if (!profile?.id) return;

    // Listen for new chat messages to update unread counts
    const channel = supabase
      .channel("spark_chats_unread_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          // Only invalidate if the message is not from the current user
          const newMessage = payload.new as { sender_profile_id: string };
          if (newMessage.sender_profile_id !== profile.id) {
            queryClient.invalidateQueries({ queryKey: ["spark_chats", profile.id] });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spark_read_status",
          filter: `profile_id=eq.${profile.id}`,
        },
        () => {
          // When read status changes, update unread counts
          queryClient.invalidateQueries({ queryKey: ["spark_chats", profile.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);
};
