import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { sendPushNotification } from "@/utils/pushNotifications";

export interface Quedada {
  id: string;
  creator_profile_id: string;
  title: string;
  description: string | null;
  city: string;
  location_hint: string | null;
  event_date: string;
  max_attendees: number | null;
  private_attendees: boolean;
  created_at: string;
  creator?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  attendee_count?: number;
  is_attending?: boolean;
  has_unread?: boolean;
}

export interface QuedadaAttendee {
  id: string;
  quedada_id: string;
  profile_id: string;
  created_at: string;
  profile?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
}

// Get all quedadas for current user's city
export const useQuedadas = () => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["quedadas", profile?.city],
    queryFn: async () => {
      if (!profile) return [];

      // Get quedadas with attendees
      const { data, error } = await supabase
        .from("quedadas")
        .select(`
          *,
          creator:profiles!quedadas_creator_profile_id_fkey(id, name, avatar_url),
          quedada_attendees(id, profile_id)
        `)
        .order("event_date", { ascending: true });

      if (error) throw error;

      // Get read status for all quedadas the user is part of
      const quedadaIds = (data || [])
        .filter(q => 
          q.creator_profile_id === profile.id || 
          q.quedada_attendees?.some((a: { profile_id: string }) => a.profile_id === profile.id)
        )
        .map(q => q.id);

      const { data: readStatus } = await supabase
        .from("quedada_read_status")
        .select("quedada_id, last_read_at")
        .eq("profile_id", profile.id)
        .in("quedada_id", quedadaIds.length > 0 ? quedadaIds : ["00000000-0000-0000-0000-000000000000"]);

      const readStatusMap = new Map(
        (readStatus || []).map(r => [r.quedada_id, new Date(r.last_read_at)])
      );

      // Get latest message for each quedada
      const { data: latestMessages } = await supabase
        .from("quedada_messages")
        .select("quedada_id, created_at")
        .in("quedada_id", quedadaIds.length > 0 ? quedadaIds : ["00000000-0000-0000-0000-000000000000"])
        .order("created_at", { ascending: false });

      // Group by quedada_id and get the latest
      const latestMessageMap = new Map<string, Date>();
      (latestMessages || []).forEach(m => {
        if (!latestMessageMap.has(m.quedada_id)) {
          latestMessageMap.set(m.quedada_id, new Date(m.created_at));
        }
      });

      return (data || []).map(q => {
        const isCreator = q.creator_profile_id === profile.id;
        const isAttending = q.quedada_attendees?.some((a: { profile_id: string }) => a.profile_id === profile.id) || false;
        const canAccessChat = isCreator || isAttending;
        
        let hasUnread = false;
        if (canAccessChat) {
          const lastRead = readStatusMap.get(q.id);
          const latestMessage = latestMessageMap.get(q.id);
          hasUnread = latestMessage ? (!lastRead || latestMessage > lastRead) : false;
        }

        return {
          ...q,
          attendee_count: q.quedada_attendees?.length || 0,
          is_attending: isAttending,
          has_unread: hasUnread,
        };
      }) as Quedada[];
    },
    enabled: !!profile?.id,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!profile?.city) return;

    const channel = supabase
      .channel("quedadas-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quedadas" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["quedadas", profile.city] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quedada_attendees" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["quedadas", profile.city] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.city, queryClient]);

  return query;
};

// Get attendees for a specific quedada
export const useQuedadaAttendees = (quedadaId: string | undefined) => {
  return useQuery({
    queryKey: ["quedada_attendees", quedadaId],
    queryFn: async () => {
      if (!quedadaId) return [];

      const { data, error } = await supabase
        .from("quedada_attendees")
        .select(`
          *,
          profile:profiles(id, name, avatar_url)
        `)
        .eq("quedada_id", quedadaId);

      if (error) throw error;
      return data as QuedadaAttendee[];
    },
    enabled: !!quedadaId,
  });
};

// Create a quedada
export const useCreateQuedada = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (quedada: {
      title: string;
      description?: string;
      location_hint?: string;
      event_date: string;
      max_attendees?: number;
      private_attendees?: boolean;
    }) => {
      if (!profile) throw new Error("No profile");

      const { data, error } = await supabase
        .from("quedadas")
        .insert({
          creator_profile_id: profile.id,
          city: profile.city || "Madrid",
          title: quedada.title,
          description: quedada.description || null,
          location_hint: quedada.location_hint || null,
          event_date: quedada.event_date,
          max_attendees: quedada.max_attendees || null,
          private_attendees: quedada.private_attendees || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quedadas", profile?.city] });
    },
  });
};

// Join a quedada
export const useJoinQuedada = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ quedadaId, creatorProfileId, quedadaTitle }: { quedadaId: string; creatorProfileId?: string; quedadaTitle?: string }) => {
      if (!profile) throw new Error("No profile");

      const { error } = await supabase
        .from("quedada_attendees")
        .insert({
          quedada_id: quedadaId,
          profile_id: profile.id,
        });

      if (error) throw error;
      
      // Send push notification to creator
      if (creatorProfileId && creatorProfileId !== profile.id) {
        sendPushNotification({
          profileId: creatorProfileId,
          title: `🎉 ${profile.name || "Alguien"} se ha unido a tu quedada`,
          body: quedadaTitle || "Tu quedada tiene un nuevo asistente",
          url: `/quedada/${quedadaId}`,
          tag: `attendee-${quedadaId}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quedadas", profile?.city] });
    },
  });
};

// Leave a quedada
export const useLeaveQuedada = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (quedadaId: string) => {
      if (!profile) throw new Error("No profile");

      const { error } = await supabase
        .from("quedada_attendees")
        .delete()
        .eq("quedada_id", quedadaId)
        .eq("profile_id", profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quedadas", profile?.city] });
    },
  });
};

// Expel attendee from a quedada (creator only)
export const useExpelAttendee = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ 
      quedadaId, 
      attendeeProfileId,
      quedadaTitle 
    }: { 
      quedadaId: string; 
      attendeeProfileId: string;
      quedadaTitle?: string;
    }) => {
      if (!profile) throw new Error("No profile");

      const { error } = await supabase
        .from("quedada_attendees")
        .delete()
        .eq("quedada_id", quedadaId)
        .eq("profile_id", attendeeProfileId);

      if (error) throw error;

      // Create notification for expelled user
      await supabase
        .from("notifications")
        .insert({
          profile_id: attendeeProfileId,
          type: "quedada_expelled",
          title: "Has sido removido de una quedada",
          description: quedadaTitle 
            ? `Ya no formas parte de "${quedadaTitle}"`
            : "El organizador te ha removido del evento",
          link: "/quedadas",
        });

      // Send push notification to expelled user
      sendPushNotification({
        profileId: attendeeProfileId,
        title: "😔 Has sido removido de una quedada",
        body: quedadaTitle 
          ? `Ya no formas parte de "${quedadaTitle}"`
          : "El organizador te ha removido del evento",
        url: "/quedadas",
        tag: `expelled-${quedadaId}`,
      });
    },
    onSuccess: (_, { quedadaId }) => {
      queryClient.invalidateQueries({ queryKey: ["quedadas", profile?.city] });
      queryClient.invalidateQueries({ queryKey: ["quedada", quedadaId] });
      queryClient.invalidateQueries({ queryKey: ["quedada_attendees", quedadaId] });
    },
  });
};

// Delete a quedada
export const useDeleteQuedada = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (quedadaId: string) => {
      const { error } = await supabase
        .from("quedadas")
        .delete()
        .eq("id", quedadaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quedadas", profile?.city] });
    },
  });
};

// Update a quedada
export const useUpdateQuedada = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({
      quedadaId,
      updates,
    }: {
      quedadaId: string;
      updates: {
        title?: string;
        description?: string | null;
        location_hint?: string | null;
        event_date?: string;
        max_attendees?: number | null;
        private_attendees?: boolean;
      };
    }) => {
      const { error } = await supabase
        .from("quedadas")
        .update(updates)
        .eq("id", quedadaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quedadas", profile?.city] });
    },
  });
};

// Quedada messages types and hooks
export interface QuedadaMessage {
  id: string;
  quedada_id: string;
  sender_profile_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
}

// Get messages for a quedada
export const useQuedadaMessages = (quedadaId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["quedada_messages", quedadaId],
    queryFn: async () => {
      if (!quedadaId) return [];

      const { data, error } = await supabase
        .from("quedada_messages")
        .select(`
          *,
          sender:profiles!quedada_messages_sender_profile_id_fkey(id, name, avatar_url)
        `)
        .eq("quedada_id", quedadaId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      return data as QuedadaMessage[];
    },
    enabled: !!quedadaId,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!quedadaId) return;

    const channel = supabase
      .channel(`quedada-messages-${quedadaId}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "quedada_messages",
          filter: `quedada_id=eq.${quedadaId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["quedada_messages", quedadaId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quedadaId, queryClient]);

  return query;
};

// Send a message in a quedada
export const useSendQuedadaMessage = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ 
      quedadaId, 
      content, 
      recipientProfileIds,
      quedadaTitle 
    }: { 
      quedadaId: string; 
      content: string;
      recipientProfileIds?: string[];
      quedadaTitle?: string;
    }) => {
      if (!profile) throw new Error("No profile");

      const { data, error } = await supabase
        .from("quedada_messages")
        .insert({
          quedada_id: quedadaId,
          sender_profile_id: profile.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Send push notifications to all recipients (except sender)
      if (recipientProfileIds && recipientProfileIds.length > 0) {
        const recipients = recipientProfileIds.filter(id => id !== profile.id);
        for (const recipientId of recipients) {
          sendPushNotification({
            profileId: recipientId,
            title: `💬 ${profile.name || "Alguien"} en ${quedadaTitle || "una quedada"}`,
            body: content.length > 50 ? content.substring(0, 50) + "..." : content,
            url: `/quedada/${quedadaId}`,
            tag: `quedada-message-${quedadaId}`,
          });
        }
      }
      
      return data;
    },
    onSuccess: (_, { quedadaId }) => {
      queryClient.invalidateQueries({ queryKey: ["quedada_messages", quedadaId] });
    },
  });
};

// Get a single quedada by ID
export const useQuedada = (quedadaId: string | undefined) => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["quedada", quedadaId],
    queryFn: async () => {
      if (!quedadaId) return null;

      const { data, error } = await supabase
        .from("quedadas")
        .select(`
          *,
          creator:profiles!quedadas_creator_profile_id_fkey(id, name, avatar_url),
          quedada_attendees(id, profile_id, profile:profiles(id, name, avatar_url))
        `)
        .eq("id", quedadaId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;

      return {
        ...data,
        attendee_count: data.quedada_attendees?.length || 0,
        is_attending: data.quedada_attendees?.some((a: { profile_id: string }) => a.profile_id === profile?.id) || false,
        is_creator: data.creator_profile_id === profile?.id,
      };
    },
    enabled: !!quedadaId && !!profile?.id,
  });
};

// Mark quedada chat as read
export const useMarkQuedadaRead = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (quedadaId: string) => {
      if (!profile) throw new Error("No profile");

      const { error } = await supabase
        .from("quedada_read_status")
        .upsert(
          {
            profile_id: profile.id,
            quedada_id: quedadaId,
            last_read_at: new Date().toISOString(),
          },
          { onConflict: "profile_id,quedada_id" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quedadas", profile?.city] });
    },
  });
};
