import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GenderType } from "@/constants/profileOptions";

export interface ProfileGenderPreference {
  id: string;
  profile_id: string;
  gender_preference: GenderType;
  created_at: string;
}

export const useProfileGenderPreferences = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ["profile_gender_preferences", profileId],
    queryFn: async () => {
      if (!profileId) return [];

      const { data, error } = await supabase
        .from("profile_gender_preferences")
        .select("*")
        .eq("profile_id", profileId);

      if (error) throw error;
      return data as ProfileGenderPreference[];
    },
    enabled: !!profileId,
  });
};

export const useUpdateGenderPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, preferences }: { profileId: string; preferences: GenderType[] }) => {
      // Delete existing preferences
      await supabase
        .from("profile_gender_preferences")
        .delete()
        .eq("profile_id", profileId);

      // Insert new preferences
      if (preferences.length > 0) {
        const { error } = await supabase
          .from("profile_gender_preferences")
          .insert(preferences.map(pref => ({ 
            profile_id: profileId, 
            gender_preference: pref 
          })));

        if (error) throw error;
      }
    },
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: ["profile_gender_preferences", profileId] });
    },
  });
};