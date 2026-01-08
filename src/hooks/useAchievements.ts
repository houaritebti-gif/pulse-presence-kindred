import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { triggerHaptic } from "@/utils/haptics";
import { sendPushNotification } from "@/utils/pushNotifications";
import { fireEpicAchievementConfetti, fireLegendaryAchievementConfetti } from "@/utils/sparkConfetti";

// Achievement definitions
export type AchievementKey = 
  | 'first_spark_sent'
  | 'first_match'
  | 'first_ghost_message'
  | 'first_quedada_joined'
  | 'streak_3_days'
  | 'streak_7_days'
  | 'streak_14_days'
  | 'streak_30_days'
  | 'energy_100'
  | 'energy_500'
  | 'energy_1000'
  | 'energy_2500'
  | 'energy_5000'
  | 'sparks_10'
  | 'sparks_50'
  | 'sparks_100'
  | 'sparks_250'
  | 'profile_complete'
  | 'identity_verified'
  | 'early_adopter';

export interface AchievementDefinition {
  key: AchievementKey;
  name: string;
  description: string;
  emoji: string;
  category: 'social' | 'streak' | 'energy' | 'milestone' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Social achievements
  { key: 'first_spark_sent', name: 'Primera Chispa', description: 'Envía tu primera chispa', emoji: '✨', category: 'social', rarity: 'common' },
  { key: 'first_match', name: 'Conexión', description: 'Consigue tu primer match', emoji: '🔥', category: 'social', rarity: 'common' },
  { key: 'first_ghost_message', name: 'Mensaje Fantasma', description: 'Envía tu primer mensaje fantasma', emoji: '👻', category: 'social', rarity: 'common' },
  { key: 'first_quedada_joined', name: 'Sociable', description: 'Únete a tu primera quedada', emoji: '🎉', category: 'social', rarity: 'common' },
  
  // Streak achievements
  { key: 'streak_3_days', name: 'En Racha', description: 'Mantén una racha de 3 días', emoji: '🔥', category: 'streak', rarity: 'common' },
  { key: 'streak_7_days', name: 'Semana Ardiente', description: 'Mantén una racha de 7 días', emoji: '🌟', category: 'streak', rarity: 'uncommon' },
  { key: 'streak_14_days', name: 'Imparable', description: 'Mantén una racha de 14 días', emoji: '💫', category: 'streak', rarity: 'rare' },
  { key: 'streak_30_days', name: 'Leyenda', description: 'Mantén una racha de 30 días', emoji: '👑', category: 'streak', rarity: 'legendary' },
  
  // Energy achievements
  { key: 'energy_100', name: 'Chispazo', description: 'Acumula 100 de energía total', emoji: '⚡', category: 'energy', rarity: 'common' },
  { key: 'energy_500', name: 'Electrizante', description: 'Acumula 500 de energía total', emoji: '💥', category: 'energy', rarity: 'uncommon' },
  { key: 'energy_1000', name: 'Alta Tensión', description: 'Acumula 1000 de energía total', emoji: '🌩️', category: 'energy', rarity: 'rare' },
  { key: 'energy_2500', name: 'Supernova', description: 'Acumula 2500 de energía total', emoji: '☀️', category: 'energy', rarity: 'epic' },
  { key: 'energy_5000', name: 'Energía Infinita', description: 'Acumula 5000 de energía total', emoji: '🌌', category: 'energy', rarity: 'legendary' },
  
  // Milestone achievements
  { key: 'sparks_10', name: 'Encendido', description: 'Envía 10 chispas', emoji: '🕯️', category: 'milestone', rarity: 'common' },
  { key: 'sparks_50', name: 'Fogonero', description: 'Envía 50 chispas', emoji: '🔥', category: 'milestone', rarity: 'uncommon' },
  { key: 'sparks_100', name: 'Pirotécnico', description: 'Envía 100 chispas', emoji: '🎆', category: 'milestone', rarity: 'rare' },
  { key: 'sparks_250', name: 'Maestro del Fuego', description: 'Envía 250 chispas', emoji: '🐉', category: 'milestone', rarity: 'epic' },
  
  // Special achievements
  { key: 'profile_complete', name: 'Perfil Completo', description: 'Completa todos los campos de tu perfil', emoji: '📝', category: 'special', rarity: 'uncommon' },
  { key: 'identity_verified', name: 'Verificado', description: 'Verifica tu identidad', emoji: '✅', category: 'special', rarity: 'rare' },
  { key: 'early_adopter', name: 'Early Adopter', description: 'Uno de los primeros usuarios', emoji: '🚀', category: 'special', rarity: 'legendary' },
];

export const getAchievementDefinition = (key: AchievementKey): AchievementDefinition | undefined => {
  return ACHIEVEMENTS.find(a => a.key === key);
};

export const getRarityColor = (rarity: AchievementDefinition['rarity']): string => {
  switch (rarity) {
    case 'common': return 'text-muted-foreground';
    case 'uncommon': return 'text-green-500';
    case 'rare': return 'text-blue-500';
    case 'epic': return 'text-purple-500';
    case 'legendary': return 'text-amber-500';
    default: return 'text-muted-foreground';
  }
};

export const getRarityBgColor = (rarity: AchievementDefinition['rarity']): string => {
  switch (rarity) {
    case 'common': return 'bg-muted/50';
    case 'uncommon': return 'bg-green-500/10';
    case 'rare': return 'bg-blue-500/10';
    case 'epic': return 'bg-purple-500/10';
    case 'legendary': return 'bg-amber-500/10 ring-1 ring-amber-500/30';
    default: return 'bg-muted/50';
  }
};

export const getRarityLabel = (rarity: AchievementDefinition['rarity']): string => {
  switch (rarity) {
    case 'common': return 'Común';
    case 'uncommon': return 'Poco común';
    case 'rare': return 'Raro';
    case 'epic': return 'Épico';
    case 'legendary': return 'Legendario';
    default: return '';
  }
};

interface UnlockedAchievement {
  id: string;
  profile_id: string;
  achievement_key: string;
  unlocked_at: string;
  metadata: Record<string, unknown>;
}

export const useAchievements = () => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  // Fetch user's unlocked achievements
  const { data: unlockedAchievements, isLoading } = useQuery({
    queryKey: ['achievements', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('profile_id', profile.id)
        .order('unlocked_at', { ascending: false });
      
      if (error) throw error;
      return data as UnlockedAchievement[];
    },
    enabled: !!profile?.id,
  });

  // Unlock achievement mutation
  const unlockMutation = useMutation({
    mutationFn: async (achievementKey: AchievementKey) => {
      if (!profile?.id) throw new Error('No profile');
      
      // Check if already unlocked
      const existing = unlockedAchievements?.find(a => a.achievement_key === achievementKey);
      if (existing) return null;
      
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          profile_id: profile.id,
          achievement_key: achievementKey,
        })
        .select()
        .single();
      
      if (error) {
        // Ignore duplicate key errors (already unlocked)
        if (error.code === '23505') return null;
        throw error;
      }
      
      return data;
    },
    onSuccess: async (data, achievementKey) => {
      if (data) {
        const achievement = getAchievementDefinition(achievementKey);
        if (achievement && profile?.id) {
          triggerHaptic('success');
          
          // Fire special confetti for epic and legendary achievements
          if (achievement.rarity === 'legendary') {
            fireLegendaryAchievementConfetti();
          } else if (achievement.rarity === 'epic') {
            fireEpicAchievementConfetti();
          }
          
          toast.success(
            `🏆 ¡Logro desbloqueado!`,
            { 
              description: `${achievement.emoji} ${achievement.name}: ${achievement.description}`,
              duration: 5000,
            }
          );
          
          // Send push notification for users not active in app
          sendPushNotification({
            profileId: profile.id,
            title: `🏆 ¡Logro desbloqueado!`,
            body: `${achievement.emoji} ${achievement.name}: ${achievement.description}`,
            url: '/achievements',
            tag: `achievement-${achievementKey}`,
          });
        }
        queryClient.invalidateQueries({ queryKey: ['achievements', profile?.id] });
      }
    },
  });

  // Check if an achievement is unlocked
  const isUnlocked = (key: AchievementKey): boolean => {
    return unlockedAchievements?.some(a => a.achievement_key === key) ?? false;
  };

  // Get unlock date for an achievement
  const getUnlockDate = (key: AchievementKey): Date | null => {
    const achievement = unlockedAchievements?.find(a => a.achievement_key === key);
    return achievement ? new Date(achievement.unlocked_at) : null;
  };

  // Helper to check and unlock achievements based on conditions
  const checkAndUnlock = async (key: AchievementKey) => {
    if (!isUnlocked(key)) {
      await unlockMutation.mutateAsync(key);
    }
  };

  // Check streak achievements
  const checkStreakAchievements = async (currentStreak: number) => {
    if (currentStreak >= 3 && !isUnlocked('streak_3_days')) {
      await checkAndUnlock('streak_3_days');
    }
    if (currentStreak >= 7 && !isUnlocked('streak_7_days')) {
      await checkAndUnlock('streak_7_days');
    }
    if (currentStreak >= 14 && !isUnlocked('streak_14_days')) {
      await checkAndUnlock('streak_14_days');
    }
    if (currentStreak >= 30 && !isUnlocked('streak_30_days')) {
      await checkAndUnlock('streak_30_days');
    }
  };

  // Check energy achievements
  const checkEnergyAchievements = async (totalEnergy: number) => {
    if (totalEnergy >= 100 && !isUnlocked('energy_100')) {
      await checkAndUnlock('energy_100');
    }
    if (totalEnergy >= 500 && !isUnlocked('energy_500')) {
      await checkAndUnlock('energy_500');
    }
    if (totalEnergy >= 1000 && !isUnlocked('energy_1000')) {
      await checkAndUnlock('energy_1000');
    }
    if (totalEnergy >= 2500 && !isUnlocked('energy_2500')) {
      await checkAndUnlock('energy_2500');
    }
    if (totalEnergy >= 5000 && !isUnlocked('energy_5000')) {
      await checkAndUnlock('energy_5000');
    }
  };

  // Check sparks sent achievements
  const checkSparksSentAchievements = async (totalSparks: number) => {
    if (totalSparks >= 1 && !isUnlocked('first_spark_sent')) {
      await checkAndUnlock('first_spark_sent');
    }
    if (totalSparks >= 10 && !isUnlocked('sparks_10')) {
      await checkAndUnlock('sparks_10');
    }
    if (totalSparks >= 50 && !isUnlocked('sparks_50')) {
      await checkAndUnlock('sparks_50');
    }
    if (totalSparks >= 100 && !isUnlocked('sparks_100')) {
      await checkAndUnlock('sparks_100');
    }
    if (totalSparks >= 250 && !isUnlocked('sparks_250')) {
      await checkAndUnlock('sparks_250');
    }
  };

  return {
    achievements: ACHIEVEMENTS,
    unlockedAchievements,
    isLoading,
    isUnlocked,
    getUnlockDate,
    checkAndUnlock,
    checkStreakAchievements,
    checkEnergyAchievements,
    checkSparksSentAchievements,
    unlockedCount: unlockedAchievements?.length ?? 0,
    totalCount: ACHIEVEMENTS.length,
  };
};
