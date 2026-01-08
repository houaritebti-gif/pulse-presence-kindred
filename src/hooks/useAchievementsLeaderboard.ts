import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ACHIEVEMENTS } from "@/hooks/useAchievements";

export interface LeaderboardEntry {
  profileId: string;
  name: string | null;
  avatarUrl: string | null;
  city: string | null;
  identityVerified: boolean;
  achievementCount: number;
  totalEnergy: number;
  bestRarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  achievementKeys: string[];
}

const RARITY_ORDER = {
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

export function useAchievementsLeaderboard(limit: number = 50) {
  return useQuery({
    queryKey: ["achievements-leaderboard", limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      // Fetch all achievements with profile data
      const { data: achievements, error } = await supabase
        .from("user_achievements")
        .select(`
          profile_id,
          achievement_key,
          profiles!inner(
            id,
            name,
            avatar_url,
            city,
            identity_verified
          )
        `)
        .order("unlocked_at", { ascending: false });

      if (error) throw error;

      // Group by profile and calculate stats
      const profileMap = new Map<string, {
        profile: {
          id: string;
          name: string | null;
          avatar_url: string | null;
          city: string | null;
          identity_verified: boolean | null;
        };
        achievements: string[];
      }>();

      for (const achievement of achievements || []) {
        const profileId = achievement.profile_id;
        const profile = achievement.profiles as unknown as {
          id: string;
          name: string | null;
          avatar_url: string | null;
          city: string | null;
          identity_verified: boolean | null;
        };

        if (!profileMap.has(profileId)) {
          profileMap.set(profileId, {
            profile,
            achievements: [],
          });
        }

        profileMap.get(profileId)!.achievements.push(achievement.achievement_key);
      }

      // Convert to leaderboard entries
      const entries: LeaderboardEntry[] = [];

      for (const [profileId, data] of profileMap) {
        // Calculate best rarity and total energy
        let bestRarity: LeaderboardEntry["bestRarity"] = "common";
        let totalEnergy = 0;

        for (const key of data.achievements) {
          const achievementDef = ACHIEVEMENTS.find(a => a.key === key);
          if (achievementDef) {
            totalEnergy += achievementDef.energyReward || 0;
            const currentRarityOrder = RARITY_ORDER[bestRarity];
            const achievementRarityOrder = RARITY_ORDER[achievementDef.rarity];
            if (achievementRarityOrder > currentRarityOrder) {
              bestRarity = achievementDef.rarity;
            }
          }
        }

        entries.push({
          profileId,
          name: data.profile.name,
          avatarUrl: data.profile.avatar_url,
          city: data.profile.city,
          identityVerified: data.profile.identity_verified || false,
          achievementCount: data.achievements.length,
          totalEnergy,
          bestRarity,
          achievementKeys: data.achievements,
        });
      }

      // Sort by achievement count (desc), then by total energy (desc)
      entries.sort((a, b) => {
        if (b.achievementCount !== a.achievementCount) {
          return b.achievementCount - a.achievementCount;
        }
        return b.totalEnergy - a.totalEnergy;
      });

      return entries.slice(0, limit);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
