import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileInterest {
  id: string;
  profile_id: string;
  interest: string;
}

export const useProfileInterests = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ["profile_interests", profileId],
    queryFn: async () => {
      if (!profileId) return [];

      const { data, error } = await supabase
        .from("profile_interests")
        .select("*")
        .eq("profile_id", profileId);

      if (error) throw error;
      return data as ProfileInterest[];
    },
    enabled: !!profileId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useUpdateInterests = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profileId,
      interests,
    }: {
      profileId: string;
      interests: string[];
    }) => {
      // Delete existing interests
      const { error: deleteError } = await supabase
        .from("profile_interests")
        .delete()
        .eq("profile_id", profileId);

      if (deleteError) throw deleteError;

      // Insert new interests
      if (interests.length > 0) {
        const { error: insertError } = await supabase
          .from("profile_interests")
          .insert(
            interests.map((interest) => ({
              profile_id: profileId,
              interest,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["profile_interests", variables.profileId],
      });
      queryClient.invalidateQueries({
        queryKey: ["public_profile"],
      });
    },
  });
};
