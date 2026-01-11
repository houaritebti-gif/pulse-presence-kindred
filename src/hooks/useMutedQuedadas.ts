import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { triggerHaptic } from "@/utils/haptics";
import { toast } from "sonner";

export const useMutedQuedadas = () => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const { data: mutedQuedadas = [], isLoading } = useQuery({
    queryKey: ["muted-quedadas", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from("muted_quedadas")
        .select("quedada_id")
        .eq("profile_id", profile.id);

      if (error) throw error;
      return data.map(row => row.quedada_id);
    },
    enabled: !!profile?.id,
  });

  const muteQuedada = useMutation({
    mutationFn: async (quedadaId: string) => {
      if (!profile?.id) throw new Error("No profile");
      
      const { error } = await supabase
        .from("muted_quedadas")
        .insert({ profile_id: profile.id, quedada_id: quedadaId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["muted-quedadas"] });
      triggerHaptic("light");
      toast.success("Quedada silenciada");
    },
    onError: () => {
      toast.error("Error al silenciar la quedada");
    },
  });

  const unmuteQuedada = useMutation({
    mutationFn: async (quedadaId: string) => {
      if (!profile?.id) throw new Error("No profile");
      
      const { error } = await supabase
        .from("muted_quedadas")
        .delete()
        .eq("profile_id", profile.id)
        .eq("quedada_id", quedadaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["muted-quedadas"] });
      triggerHaptic("light");
      toast.success("Notificaciones activadas");
    },
    onError: () => {
      toast.error("Error al activar notificaciones");
    },
  });

  const isQuedadaMuted = (quedadaId: string) => {
    return mutedQuedadas.includes(quedadaId);
  };

  const toggleMute = async (quedadaId: string) => {
    if (isQuedadaMuted(quedadaId)) {
      await unmuteQuedada.mutateAsync(quedadaId);
    } else {
      await muteQuedada.mutateAsync(quedadaId);
    }
  };

  return {
    mutedQuedadas,
    isLoading,
    isQuedadaMuted,
    toggleMute,
    muteQuedada,
    unmuteQuedada,
  };
};
