import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  vibe: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileTribe {
  id: string;
  profile_id: string;
  tribe: string;
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

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, "name" | "vibe" | "city" | "avatar_url">>) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
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
