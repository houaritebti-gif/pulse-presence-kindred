import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BlacklistWord {
  id: string;
  word: string;
  created_at: string;
  created_by: string | null;
}

// Hook to fetch all blacklisted words
export const useBioBlacklist = () => {
  return useQuery({
    queryKey: ["bio-blacklist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bio_blacklist")
        .select("*")
        .order("word", { ascending: true });

      if (error) throw error;
      return data as BlacklistWord[];
    },
  });
};

// Hook to check if text contains blacklisted words (client-side)
export const useCheckBlacklistedWords = () => {
  const { data: blacklist } = useBioBlacklist();

  const checkText = (text: string): string[] => {
    if (!blacklist || !text) return [];
    
    const lowerText = text.toLowerCase();
    return blacklist
      .filter(item => lowerText.includes(item.word.toLowerCase()))
      .map(item => item.word);
  };

  return { checkText, blacklist };
};

// Hook to add a word to the blacklist
export const useAddBlacklistWord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (word: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .single();

      const { data, error } = await supabase
        .from("bio_blacklist")
        .insert({ 
          word: word.toLowerCase().trim(),
          created_by: profile?.id 
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Esta palabra ya está en la lista");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bio-blacklist"] });
      toast.success("Palabra añadida a la blacklist");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Hook to remove a word from the blacklist
export const useRemoveBlacklistWord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wordId: string) => {
      const { error } = await supabase
        .from("bio_blacklist")
        .delete()
        .eq("id", wordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bio-blacklist"] });
      toast.success("Palabra eliminada de la blacklist");
    },
    onError: () => {
      toast.error("Error al eliminar la palabra");
    },
  });
};
