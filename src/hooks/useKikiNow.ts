import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { toast } from "sonner";

// Check if current user has an active boost
export const useMyKikiNowBoost = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["my_kiki_now_boost", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from("kiki_now_boosts")
        .select("*")
        .eq("profile_id", profile.id)
        .gte("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refresh every minute to update time remaining
  });
};

// Get all active boosts (for checking if profiles are boosted)
export const useActiveBoostedProfiles = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["active_boosts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kiki_now_boosts")
        .select("profile_id, expires_at")
        .gte("expires_at", new Date().toISOString());

      if (error) throw error;
      
      // Return a Set of boosted profile IDs for easy lookup
      const boostedIds = new Set(data?.map(b => b.profile_id) || []);
      return { boostedIds, boosts: data || [] };
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refresh every minute
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("kiki-now-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kiki_now_boosts" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["active_boosts"] });
          queryClient.invalidateQueries({ queryKey: ["presence_list"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

// Check if a specific profile is boosted
export const useIsProfileBoosted = (profileId: string | undefined) => {
  const { data } = useActiveBoostedProfiles();
  
  if (!profileId || !data?.boostedIds) return false;
  return data.boostedIds.has(profileId);
};

// Check if current user has an active KIKI Now boost (boolean)
export const useHasActiveKikiNowBoost = () => {
  const { data: boost, isLoading } = useMyKikiNowBoost();
  
  return {
    data: !!boost && new Date(boost.expires_at) > new Date(),
    isLoading,
  };
};

// Create checkout session for KIKI Now
export const useCreateKikiNowCheckout = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-kiki-now-checkout");
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data.url as string;
    },
    onSuccess: (url) => {
      // Open checkout in new tab
      window.open(url, "_blank");
    },
    onError: (error: Error) => {
      toast.error("Error al iniciar el pago: " + error.message);
    },
  });
};

// Verify payment and activate boost
export const useVerifyKikiNowBoost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.functions.invoke("verify-kiki-now-boost", {
        body: { session_id: sessionId },
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      if (!data.already_active) {
        toast.success("🚀 ¡KIKI Now activado! Estarás destacado durante 1 hora");
      }
      queryClient.invalidateQueries({ queryKey: ["my_kiki_now_boost"] });
      queryClient.invalidateQueries({ queryKey: ["active_boosts"] });
      queryClient.invalidateQueries({ queryKey: ["presence_list"] });
    },
    onError: (error: Error) => {
      toast.error("Error al activar el boost: " + error.message);
    },
  });
};

// Calculate time remaining for boost
export const getBoostTimeRemaining = (expiresAt: string): { minutes: number; seconds: number; expired: boolean } => {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { minutes: 0, seconds: 0, expired: true };
  }
  
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return { minutes, seconds, expired: false };
};