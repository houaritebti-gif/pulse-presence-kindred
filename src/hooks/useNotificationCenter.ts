import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface Notification {
  id: string;
  profile_id: string;
  type: string;
  title: string;
  description: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

// Get all notifications for current user
export const useNotifications = () => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!profile?.id,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "notifications",
          filter: `profile_id=eq.${profile.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", profile.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  return query;
};

// Get unread count
export const useUnreadNotificationCount = () => {
  const { data: notifications } = useNotifications();
  return notifications?.filter(n => !n.read_at).length || 0;
};

// Mark notification as read
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", profile?.id] });
    },
  });
};

// Mark all as read
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("No profile");

      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("profile_id", profile.id)
        .is("read_at", null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", profile?.id] });
    },
  });
};

// Create a notification (used internally)
export const createNotification = async (notification: {
  profile_id: string;
  type: string;
  title: string;
  description?: string;
  link?: string;
}) => {
  const { error } = await supabase
    .from("notifications")
    .insert({
      profile_id: notification.profile_id,
      type: notification.type,
      title: notification.title,
      description: notification.description || null,
      link: notification.link || null,
    });

  if (error) {
    console.error("Error creating notification:", error);
  }
};
