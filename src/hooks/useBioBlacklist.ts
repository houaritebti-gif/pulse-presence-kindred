import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BlacklistWord {
  id: string;
  word: string;
  created_at: string;
  created_by: string | null;
}

// Hook to fetch all blacklisted words (ADMIN ONLY - will fail for non-admins)
export const useBioBlacklist = () => {
  return useQuery({
    queryKey: ["bio-blacklist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bio_blacklist")
        .select("*")
        .order("word", { ascending: true });

      // Non-admins will get RLS error - return empty array
      if (error) {
        console.log("Bio blacklist access restricted to admins");
        return [];
      }
      return data as BlacklistWord[];
    },
  });
};

// Hook to check if text contains blacklisted words
// NOTE: This is now a NO-OP for non-admins. Server-side validation via 
// validate_profile_bio trigger handles the actual enforcement.
export const useCheckBlacklistedWords = () => {
  const { data: blacklist } = useBioBlacklist();

  const checkText = (text: string): string[] => {
    // Non-admins won't have access to blacklist, return empty
    // Server-side trigger will catch violations on save
    if (!blacklist || blacklist.length === 0 || !text) return [];
    
    const lowerText = text.toLowerCase();
    return blacklist
      .filter(item => lowerText.includes(item.word.toLowerCase()))
      .map(item => item.word);
  };

  return { checkText, blacklist: blacklist || [] };
};

// Hook to add a word to the blacklist (ADMIN ONLY)
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
        if (error.code === "42501") {
          throw new Error("Solo los administradores pueden añadir palabras");
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

// Hook to remove a word from the blacklist (ADMIN ONLY)
export const useRemoveBlacklistWord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wordId: string) => {
      const { error } = await supabase
        .from("bio_blacklist")
        .delete()
        .eq("id", wordId);

      if (error) {
        if (error.code === "42501") {
          throw new Error("Solo los administradores pueden eliminar palabras");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bio-blacklist"] });
      toast.success("Palabra eliminada de la blacklist");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
