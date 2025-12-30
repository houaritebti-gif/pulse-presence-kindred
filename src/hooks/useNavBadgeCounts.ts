import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface NavBadgeCounts {
  unreadSparks: number;
  unreadQuedadas: number;
  unreadNotifications: number;
  unreadGhostMessages: number;
  pendingConnections: number;
  totalAlerts: number;
}

/**
 * Consolidated hook to fetch all badge counts in a single query
 * This reduces the number of parallel queries on every page load
 */
export const useNavBadgeCounts = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["nav_badge_counts", profile?.id],
    queryFn: async (): Promise<NavBadgeCounts> => {
      if (!profile?.id) {
        return {
          unreadSparks: 0,
          unreadQuedadas: 0,
          unreadNotifications: 0,
          unreadGhostMessages: 0,
          pendingConnections: 0,
          totalAlerts: 0,
        };
      }

      // Execute all count queries in parallel
      const [
        sparkChatsResult,
        quedadaCountResult,
        notificationsResult,
        ghostMessagesResult,
        connectionRequestsResult,
      ] = await Promise.all([
        // 1. Spark chats with unread messages
        getUnreadSparkCount(profile.id),
        // 2. Quedadas with unread messages
        getUnreadQuedadaCount(profile.id),
        // 3. Unread notifications count
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", profile.id)
          .is("read_at", null),
        // 4. Unread ghost messages count
        supabase
          .from("ghost_messages")
          .select("*", { count: "exact", head: true })
          .eq("to_profile_id", profile.id)
          .is("read_at", null),
        // 5. Pending connection requests count
        supabase
          .from("connection_requests")
          .select("*", { count: "exact", head: true })
          .eq("to_profile_id", profile.id)
          .eq("status", "pending"),
      ]);

      const unreadSparks = sparkChatsResult;
      const unreadQuedadas = quedadaCountResult;
      const unreadNotifications = notificationsResult.count || 0;
      const unreadGhostMessages = ghostMessagesResult.count || 0;
      const pendingConnections = connectionRequestsResult.count || 0;

      return {
        unreadSparks,
        unreadQuedadas,
        unreadNotifications,
        unreadGhostMessages,
        pendingConnections,
        totalAlerts: unreadNotifications + unreadGhostMessages + pendingConnections,
      };
    },
    enabled: !!profile?.id,
    staleTime: 30 * 1000, // 30 seconds - badges don't need to be super fresh
    refetchInterval: 60 * 1000, // Refetch every minute in background
  });
};

/**
 * Get unread spark messages count efficiently
 */
async function getUnreadSparkCount(profileId: string): Promise<number> {
  // Get all active spark chats for this user
  const { data: chats } = await supabase
    .from("spark_chats")
    .select("id, profile_a_id, profile_b_id, extinguished_by_a, extinguished_by_b")
    .or(`profile_a_id.eq.${profileId},profile_b_id.eq.${profileId}`);

  if (!chats || chats.length === 0) return 0;

  // Filter out extinguished chats
  const activeChats = chats.filter((chat) => {
    const isA = chat.profile_a_id === profileId;
    const extinguished = isA ? chat.extinguished_by_a : chat.extinguished_by_b;
    return !extinguished;
  });

  if (activeChats.length === 0) return 0;

  // Get read status for all chats
  const chatIds = activeChats.map((c) => c.id);
  const { data: readStatus } = await supabase
    .from("spark_read_status")
    .select("chat_id, last_read_at")
    .eq("profile_id", profileId)
    .in("chat_id", chatIds);

  const readStatusMap = new Map(
    readStatus?.map((rs) => [rs.chat_id, new Date(rs.last_read_at)]) || []
  );

  // Count unread messages across all chats
  let totalUnread = 0;
  await Promise.all(
    activeChats.map(async (chat) => {
      const lastRead = readStatusMap.get(chat.id);

      let query = supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("chat_id", chat.id)
        .neq("sender_profile_id", profileId);

      if (lastRead) {
        query = query.gt("created_at", lastRead.toISOString());
      }

      const { count } = await query;
      totalUnread += count || 0;
    })
  );

  return totalUnread;
}

/**
 * Get unread quedada messages count efficiently
 */
async function getUnreadQuedadaCount(profileId: string): Promise<number> {
  // Get quedadas where user is creator or attendee
  const [creatorResult, attendeeResult] = await Promise.all([
    supabase
      .from("quedadas")
      .select("id")
      .eq("creator_profile_id", profileId)
      .gt("event_date", new Date().toISOString()),
    supabase
      .from("quedada_attendees")
      .select("quedada_id")
      .eq("profile_id", profileId),
  ]);

  const quedadaIds = new Set<string>();
  creatorResult.data?.forEach((q) => quedadaIds.add(q.id));
  attendeeResult.data?.forEach((qa) => quedadaIds.add(qa.quedada_id));

  if (quedadaIds.size === 0) return 0;

  const quedadaIdArray = Array.from(quedadaIds);

  // Get read status for all quedadas
  const { data: readStatus } = await supabase
    .from("quedada_read_status")
    .select("quedada_id, last_read_at")
    .eq("profile_id", profileId)
    .in("quedada_id", quedadaIdArray);

  const readStatusMap = new Map(
    readStatus?.map((rs) => [rs.quedada_id, new Date(rs.last_read_at)]) || []
  );

  // Count unread messages
  let totalUnread = 0;
  await Promise.all(
    quedadaIdArray.map(async (quedadaId) => {
      const lastRead = readStatusMap.get(quedadaId);

      let query = supabase
        .from("quedada_messages")
        .select("*", { count: "exact", head: true })
        .eq("quedada_id", quedadaId)
        .neq("sender_profile_id", profileId);

      if (lastRead) {
        query = query.gt("created_at", lastRead.toISOString());
      }

      const { count } = await query;
      totalUnread += count || 0;
    })
  );

  return totalUnread;
}
