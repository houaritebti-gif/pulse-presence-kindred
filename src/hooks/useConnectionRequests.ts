import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useEffect } from "react";
import { toast } from "sonner";

export interface ConnectionRequest {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  status: "pending" | "accepted" | "rejected";
  message: string | null;
  created_at: string;
  responded_at: string | null;
}

export interface ConnectionRequestWithProfile extends ConnectionRequest {
  from_profile?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    city: string | null;
  } | null;
  to_profile?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    city: string | null;
  } | null;
  from_tribes?: string[];
  to_tribes?: string[];
}

// Fetch sent connection requests (only pending)
export const useSentConnectionRequests = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["connection_requests", "sent", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("connection_requests")
        .select(`
          *,
          to_profile:profiles!connection_requests_to_profile_id_fkey(
            id, name, avatar_url, city
          )
        `)
        .eq("from_profile_id", profile.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ConnectionRequestWithProfile[];
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 3, // 3 minutes - has realtime updates
  });
};

// Fetch all active (accepted) connections with unread message counts
export const useActiveConnections = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["connection_requests", "active", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // Fetch connections where I sent and it was accepted
      const { data: sentAccepted, error: sentError } = await supabase
        .from("connection_requests")
        .select(`
          *,
          to_profile:profiles!connection_requests_to_profile_id_fkey(
            id, name, avatar_url, city
          )
        `)
        .eq("from_profile_id", profile.id)
        .eq("status", "accepted")
        .order("responded_at", { ascending: false });

      if (sentError) throw sentError;

      // Fetch connections where I received and accepted
      const { data: receivedAccepted, error: receivedError } = await supabase
        .from("connection_requests")
        .select(`
          *,
          from_profile:profiles!connection_requests_from_profile_id_fkey(
            id, name, avatar_url, city
          )
        `)
        .eq("to_profile_id", profile.id)
        .eq("status", "accepted")
        .order("responded_at", { ascending: false });

      if (receivedError) throw receivedError;

      // Normalize to a unified structure
      const baseConnections = [
        ...(sentAccepted || []).map(c => ({
          id: c.id,
          from_profile_id: c.from_profile_id,
          to_profile_id: c.to_profile_id,
          status: c.status as "accepted",
          message: c.message,
          created_at: c.created_at,
          responded_at: c.responded_at,
          connected_profile: c.to_profile,
          direction: "sent" as const,
        })),
        ...(receivedAccepted || []).map(c => ({
          id: c.id,
          from_profile_id: c.from_profile_id,
          to_profile_id: c.to_profile_id,
          status: c.status as "accepted",
          message: c.message,
          created_at: c.created_at,
          responded_at: c.responded_at,
          connected_profile: c.from_profile,
          direction: "received" as const,
        })),
      ];

      // Fetch spark chats and unread counts for each connection
      const connectedProfileIds = baseConnections
        .map(c => c.connected_profile?.id)
        .filter(Boolean) as string[];

      if (connectedProfileIds.length === 0) {
        return baseConnections.map(c => ({ ...c, unread_count: 0 }));
      }

      // Get all spark chats involving the current user
      const { data: sparkChats } = await supabase
        .from("spark_chats")
        .select("id, profile_a_id, profile_b_id, extinguished_by_a, extinguished_by_b")
        .or(`profile_a_id.eq.${profile.id},profile_b_id.eq.${profile.id}`);

      // Create map of connected profile -> chat
      const chatByProfileMap = new Map<string, { chatId: string; isA: boolean; extinguished: boolean }>();
      (sparkChats || []).forEach(chat => {
        const isA = chat.profile_a_id === profile.id;
        const otherProfileId = isA ? chat.profile_b_id : chat.profile_a_id;
        const extinguished = isA ? chat.extinguished_by_a : chat.extinguished_by_b;
        
        if (connectedProfileIds.includes(otherProfileId) && !extinguished) {
          chatByProfileMap.set(otherProfileId, { 
            chatId: chat.id, 
            isA, 
            extinguished: !!extinguished 
          });
        }
      });

      // Get read status for all relevant chats
      const chatIds = Array.from(chatByProfileMap.values()).map(c => c.chatId);
      const { data: readStatusData } = await supabase
        .from("spark_read_status")
        .select("chat_id, last_read_at")
        .eq("profile_id", profile.id)
        .in("chat_id", chatIds.length > 0 ? chatIds : ["00000000-0000-0000-0000-000000000000"]);

      const readStatusMap = new Map(
        readStatusData?.map(rs => [rs.chat_id, new Date(rs.last_read_at)]) || []
      );

      // Calculate unread counts for each connection
      const connections: ActiveConnection[] = await Promise.all(
        baseConnections.map(async (conn) => {
          const connectedId = conn.connected_profile?.id;
          if (!connectedId) return { ...conn, unread_count: 0 };

          const chatInfo = chatByProfileMap.get(connectedId);
          if (!chatInfo) return { ...conn, unread_count: 0 };

          const lastRead = readStatusMap.get(chatInfo.chatId);
          
          let countQuery = supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("chat_id", chatInfo.chatId)
            .neq("sender_profile_id", profile.id);
          
          if (lastRead) {
            countQuery = countQuery.gt("created_at", lastRead.toISOString());
          }
          
          const { count } = await countQuery;
          return { ...conn, unread_count: count || 0 };
        })
      );

      // Sort by unread first, then by responded_at
      return connections.sort((a, b) => {
        // Prioritize connections with unread messages
        if (a.unread_count > 0 && b.unread_count === 0) return -1;
        if (b.unread_count > 0 && a.unread_count === 0) return 1;
        
        return new Date(b.responded_at || b.created_at).getTime() - 
               new Date(a.responded_at || a.created_at).getTime();
      });
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export interface ActiveConnection {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  status: "pending" | "accepted" | "rejected";
  message: string | null;
  created_at: string;
  responded_at: string | null;
  connected_profile?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    city: string | null;
  } | null;
  direction: "sent" | "received";
  unread_count: number;
}

// Fetch received connection requests (only pending)
export const useReceivedConnectionRequests = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["connection_requests", "received", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("connection_requests")
        .select(`
          *,
          from_profile:profiles!connection_requests_from_profile_id_fkey(
            id, name, avatar_url, city
          )
        `)
        .eq("to_profile_id", profile.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch tribes for each requester
      const requestsWithTribes = await Promise.all(
        (data || []).map(async (request) => {
          if (!request.from_profile?.id) return { ...request, from_tribes: [] };
          
          const { data: tribes } = await supabase
            .from("profile_tribes")
            .select("tribe")
            .eq("profile_id", request.from_profile.id);

          return {
            ...request,
            from_tribes: tribes?.map(t => t.tribe) || [],
          };
        })
      );

      return requestsWithTribes as ConnectionRequestWithProfile[];
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes - has realtime updates
  });
};

// Count of pending received requests
export const usePendingConnectionRequestCount = () => {
  const { data: requests } = useReceivedConnectionRequests();
  return requests?.length || 0;
};

// Get connection status for a specific profile
export const useConnectionStatus = (targetProfileId: string | undefined) => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["connection_status", profile?.id, targetProfileId],
    queryFn: async () => {
      if (!profile?.id || !targetProfileId) return "none";

      const { data, error } = await supabase
        .from("connection_requests")
        .select("*")
        .or(`and(from_profile_id.eq.${profile.id},to_profile_id.eq.${targetProfileId}),and(from_profile_id.eq.${targetProfileId},to_profile_id.eq.${profile.id})`)
        .neq("status", "rejected")
        .maybeSingle();

      if (error) throw error;
      if (!data) return "none";

      if (data.status === "accepted") return "connected";
      if (data.from_profile_id === profile.id) return "pending_sent";
      return "pending_received";
    },
    enabled: !!profile?.id && !!targetProfileId,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
};

// Send a connection request
export const useSendConnectionRequest = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ toProfileId, message }: { toProfileId: string; message?: string }) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("connection_requests")
        .insert({
          from_profile_id: profile.id,
          to_profile_id: toProfileId,
          message: message?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { toProfileId }) => {
      queryClient.invalidateQueries({ queryKey: ["connection_requests"] });
      queryClient.invalidateQueries({ queryKey: ["connection_status", profile?.id, toProfileId] });
      toast.success("Solicitud enviada");
    },
    onError: (error) => {
      console.error("Error sending connection request:", error);
      toast.error("No se pudo enviar la solicitud");
    },
  });
};

// Accept a connection request
export const useAcceptConnectionRequest = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .from("connection_requests")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["connection_requests"] });
      queryClient.invalidateQueries({ queryKey: ["connection_status"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Conexión aceptada");
    },
    onError: (error) => {
      console.error("Error accepting connection request:", error);
      toast.error("No se pudo aceptar la solicitud");
    },
  });
};

// Reject a connection request (silently)
export const useRejectConnectionRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("connection_requests")
        .update({
          status: "rejected",
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection_requests"] });
      // No toast - silent rejection
    },
    onError: (error) => {
      console.error("Error rejecting connection request:", error);
    },
  });
};

// Cancel a sent request
export const useCancelConnectionRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("connection_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection_requests"] });
      queryClient.invalidateQueries({ queryKey: ["connection_status"] });
      toast.success("Solicitud cancelada");
    },
    onError: (error) => {
      console.error("Error canceling connection request:", error);
      toast.error("No se pudo cancelar la solicitud");
    },
  });
};

// Subscribe to realtime updates
export const useConnectionRequestsRealtime = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("connection_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "connection_requests",
          filter: `to_profile_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log("Connection request update:", payload);
          queryClient.invalidateQueries({ queryKey: ["connection_requests"] });
          
          if (payload.eventType === "INSERT") {
            toast.info("Nueva solicitud de conexión", {
              action: {
                label: "Ver",
                onClick: () => window.location.href = "/connections",
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);
};
