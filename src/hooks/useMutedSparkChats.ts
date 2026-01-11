import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { triggerHaptic } from "@/utils/haptics";
import { toast } from "sonner";

export const useMutedSparkChats = () => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const { data: mutedChats = [], isLoading } = useQuery({
    queryKey: ["muted-spark-chats", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from("muted_spark_chats")
        .select("chat_id")
        .eq("profile_id", profile.id);

      if (error) throw error;
      return data.map(row => row.chat_id);
    },
    enabled: !!profile?.id,
  });

  const muteChat = useMutation({
    mutationFn: async (chatId: string) => {
      if (!profile?.id) throw new Error("No profile");
      
      const { error } = await supabase
        .from("muted_spark_chats")
        .insert({ profile_id: profile.id, chat_id: chatId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["muted-spark-chats"] });
      triggerHaptic("light");
      toast.success("Chat silenciado");
    },
    onError: () => {
      toast.error("Error al silenciar el chat");
    },
  });

  const unmuteChat = useMutation({
    mutationFn: async (chatId: string) => {
      if (!profile?.id) throw new Error("No profile");
      
      const { error } = await supabase
        .from("muted_spark_chats")
        .delete()
        .eq("profile_id", profile.id)
        .eq("chat_id", chatId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["muted-spark-chats"] });
      triggerHaptic("light");
      toast.success("Notificaciones activadas");
    },
    onError: () => {
      toast.error("Error al activar notificaciones");
    },
  });

  const isChatMuted = (chatId: string) => {
    return mutedChats.includes(chatId);
  };

  const toggleMute = async (chatId: string) => {
    if (isChatMuted(chatId)) {
      await unmuteChat.mutateAsync(chatId);
    } else {
      await muteChat.mutateAsync(chatId);
    }
  };

  return {
    mutedChats,
    isLoading,
    isChatMuted,
    toggleMute,
    muteChat,
    unmuteChat,
  };
};
