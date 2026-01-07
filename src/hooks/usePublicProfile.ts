import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./useProfile";

export interface PublicProfileData {
  profile: Profile | null;
  tribes: string[];
  musicStyles: string[];
  interests: string[];
}

export const usePublicProfile = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ["public_profile", profileId],
    queryFn: async (): Promise<PublicProfileData> => {
      if (!profileId) {
        return { profile: null, tribes: [], musicStyles: [], interests: [] };
      }

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch tribes
      const { data: tribesData } = await supabase
        .from("profile_tribes")
        .select("tribe")
        .eq("profile_id", profileId);

      // Fetch music styles
      const { data: musicData } = await supabase
        .from("profile_music_styles")
        .select("style")
        .eq("profile_id", profileId);

      // Fetch interests
      const { data: interestsData } = await supabase
        .from("profile_interests")
        .select("interest")
        .eq("profile_id", profileId);

      return {
        profile: profile as Profile | null,
        tribes: tribesData?.map(t => t.tribe) || [],
        musicStyles: musicData?.map(m => m.style) || [],
        interests: interestsData?.map(i => i.interest) || [],
      };
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5, // 5 minutes - profiles don't change often
  });
};
