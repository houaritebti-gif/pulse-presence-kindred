import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { toast } from "sonner";

// Report reason options
export const REPORT_REASONS = [
  { value: "harassment", label: "Acoso o intimidación" },
  { value: "spam", label: "Spam o publicidad" },
  { value: "fake_profile", label: "Perfil falso" },
  { value: "inappropriate", label: "Contenido inapropiado" },
  { value: "other", label: "Otro motivo" },
] as const;

export type ReportReason = typeof REPORT_REASONS[number]["value"];

// Get list of blocked user IDs
export const useBlockedUsers = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["blocked_users", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("user_blocks")
        .select("blocked_profile_id")
        .eq("blocker_profile_id", profile.id);

      if (error) throw error;
      return data?.map(b => b.blocked_profile_id) || [];
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes - blocks rarely change
  });
};

// Check if a specific user is blocked
export const useIsBlocked = (profileId: string | undefined) => {
  const { data: blockedIds } = useBlockedUsers();
  
  if (!profileId || !blockedIds) return false;
  return blockedIds.includes(profileId);
};

// Block a user
export const useBlockUser = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (blockedProfileId: string) => {
      if (!profile?.id) throw new Error("No profile");

      const { error } = await supabase
        .from("user_blocks")
        .insert({
          blocker_profile_id: profile.id,
          blocked_profile_id: blockedProfileId,
        });

      if (error) {
        if (error.code === "23505") {
          // Already blocked
          return;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked_users", profile?.id] });
      queryClient.invalidateQueries({ queryKey: ["presence_list"] });
      queryClient.invalidateQueries({ queryKey: ["spark_chats"] });
      toast.success("Usuario bloqueado");
    },
    onError: (error: Error) => {
      toast.error("Error al bloquear: " + error.message);
    },
  });
};

// Unblock a user
export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (blockedProfileId: string) => {
      if (!profile?.id) throw new Error("No profile");

      const { error } = await supabase
        .from("user_blocks")
        .delete()
        .eq("blocker_profile_id", profile.id)
        .eq("blocked_profile_id", blockedProfileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked_users", profile?.id] });
      toast.success("Usuario desbloqueado");
    },
    onError: (error: Error) => {
      toast.error("Error al desbloquear: " + error.message);
    },
  });
};

// Report a user
export const useReportUser = () => {
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ 
      reportedProfileId, 
      reason, 
      details 
    }: { 
      reportedProfileId: string; 
      reason: ReportReason; 
      details?: string;
    }) => {
      if (!profile?.id) throw new Error("No profile");

      const { error } = await supabase
        .from("user_reports")
        .insert({
          reporter_profile_id: profile.id,
          reported_profile_id: reportedProfileId,
          reason,
          details,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reporte enviado. Gracias por ayudarnos a mantener la comunidad segura.");
    },
    onError: (error: Error) => {
      toast.error("Error al enviar reporte: " + error.message);
    },
  });
};

// Status labels for user-facing display
export const REPORT_STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "En revisión", color: "text-amber-500", icon: "⏳" },
  reviewed: { label: "Revisado", color: "text-blue-500", icon: "👀" },
  resolved: { label: "Resuelto", color: "text-emerald-500", icon: "✅" },
  dismissed: { label: "Desestimado", color: "text-muted-foreground", icon: "❌" },
};

// Get user's report history
export const useMyReportHistory = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["my_reports", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("user_reports")
        .select(`
          id,
          reason,
          details,
          status,
          created_at,
          reported_profile:profiles!user_reports_reported_profile_id_fkey(
            id, name, avatar_url
          )
        `)
        .eq("reporter_profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Get full list of blocked users with profile info
export const useBlockedUsersList = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["blocked_users_list", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("user_blocks")
        .select(`
          id,
          created_at,
          blocked_profile:profiles!user_blocks_blocked_profile_id_fkey(
            id, name, avatar_url, vibe
          )
        `)
        .eq("blocker_profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes - blocks rarely change
  });
};
