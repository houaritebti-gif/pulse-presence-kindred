import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GenderType } from "@/constants/profileOptions";

export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  vibe: string | null;
  city: string | null;
  bio: string | null;
  looking_for: string[] | null;
  has_tattoos: boolean | null;
  has_piercings: boolean | null;
  alternative_aesthetic: boolean | null;
  colored_hair: boolean | null;
  shaved_head: boolean | null;
  vintage_style: boolean | null;
  gothic_style: boolean | null;
  share_typing_status: boolean | null;
  email_verified: boolean | null;
  identity_verified: boolean | null;
  birthdate: string | null;
  gender: GenderType | null;
  // Visibility settings
  show_birth_year: boolean | null;
  show_zodiac: boolean | null;
  show_gender: boolean | null;
  show_city: boolean | null;
  show_vibe: boolean | null;
  show_tribes: boolean | null;
  show_music_styles: boolean | null;
  show_interests: boolean | null;
  show_looking_for: boolean | null;
  show_aesthetic_details: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileTribe {
  id: string;
  profile_id: string;
  tribe: string;
}

export interface ProfileMusicStyle {
  id: string;
  profile_id: string;
  style: string;
}

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes - profile doesn't change often
  });
};

export const useProfileTribes = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ["profile_tribes", profileId],
    queryFn: async () => {
      if (!profileId) return [];

      const { data, error } = await supabase
        .from("profile_tribes")
        .select("*")
        .eq("profile_id", profileId);

      if (error) throw error;
      return data as ProfileTribe[];
    },
    enabled: !!profileId,
  });
};

export const useProfileMusicStyles = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ["profile_music_styles", profileId],
    queryFn: async () => {
      if (!profileId) return [];

      const { data, error } = await supabase
        .from("profile_music_styles")
        .select("*")
        .eq("profile_id", profileId);

      if (error) throw error;
      return data as ProfileMusicStyle[];
    },
    enabled: !!profileId,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, "name" | "vibe" | "city" | "bio" | "looking_for" | "avatar_url" | "has_tattoos" | "has_piercings" | "alternative_aesthetic" | "colored_hair" | "shaved_head" | "vintage_style" | "gothic_style" | "share_typing_status" | "birthdate" | "gender">>) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update(updates as any)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
};

export const useUpdateTribes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, tribes }: { profileId: string; tribes: string[] }) => {
      // Delete existing tribes
      await supabase
        .from("profile_tribes")
        .delete()
        .eq("profile_id", profileId);

      // Insert new tribes
      if (tribes.length > 0) {
        const { error } = await supabase
          .from("profile_tribes")
          .insert(tribes.map(tribe => ({ profile_id: profileId, tribe })));

        if (error) throw error;
      }
    },
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: ["profile_tribes", profileId] });
    },
  });
};

export const useUpdateMusicStyles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, styles }: { profileId: string; styles: string[] }) => {
      // Delete existing styles
      await supabase
        .from("profile_music_styles")
        .delete()
        .eq("profile_id", profileId);

      // Insert new styles (max 5)
      const limitedStyles = styles.slice(0, 5);
      if (limitedStyles.length > 0) {
        const { error } = await supabase
          .from("profile_music_styles")
          .insert(limitedStyles.map(style => ({ profile_id: profileId, style })));

        if (error) throw error;
      }
    },
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: ["profile_music_styles", profileId] });
    },
  });
};
