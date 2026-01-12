import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AchievementKey, getAchievementDefinition } from "./useAchievements";

interface PublicAchievement {
  id: string;
  profile_id: string;
  achievement_key: string;
  unlocked_at: string;
}

export const usePublicAchievements = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['public_achievements', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('profile_id', profileId)
        .order('unlocked_at', { ascending: false });
      
      if (error) throw error;
      return data as PublicAchievement[];
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAchievementsVisibility = (profileId: string | undefined) => {
  const { data, isLoading } = useQuery({
    queryKey: ['achievements_visibility', profileId],
    queryFn: async () => {
      if (!profileId) return { show_achievements: true };
      
      const { data, error } = await supabase
        .from('profiles')
        .select('show_achievements')
        .eq('id', profileId)
        .maybeSingle();
      
      if (error) throw error;
      return { show_achievements: (data as any)?.show_achievements ?? true };
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5,
  });
  
  return {
    showAchievements: data?.show_achievements ?? true,
    isLoading,
  };
};

export const usePublicAchievementBadges = (profileId: string | undefined) => {
  const { data: achievements, isLoading } = usePublicAchievements(profileId);
  
  const unlockedWithDetails = achievements?.map(a => ({
    ...a,
    definition: getAchievementDefinition(a.achievement_key as AchievementKey),
  })).filter(a => a.definition) || [];
  
  // Sort by rarity (legendary first) then by unlock date
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
  const sorted = unlockedWithDetails.sort((a, b) => {
    const rarityA = rarityOrder[a.definition!.rarity];
    const rarityB = rarityOrder[b.definition!.rarity];
    if (rarityA !== rarityB) return rarityA - rarityB;
    return new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime();
  });
  
  return {
    achievements: sorted,
    isLoading,
    count: sorted.length,
  };
};
