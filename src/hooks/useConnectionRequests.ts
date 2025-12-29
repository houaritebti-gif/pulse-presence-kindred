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

// Fetch sent connection requests
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
        .neq("status", "rejected")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ConnectionRequestWithProfile[];
    },
    enabled: !!profile?.id,
  });
};

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
