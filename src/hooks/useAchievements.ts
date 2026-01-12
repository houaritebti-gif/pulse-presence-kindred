import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { triggerHaptic } from "@/utils/haptics";
import { sendPushNotification } from "@/utils/pushNotifications";
import { 
  fireCommonAchievementConfetti,
  fireUncommonAchievementConfetti,
  fireRareAchievementConfetti,
  fireEpicAchievementConfetti, 
  fireLegendaryAchievementConfetti 
} from "@/utils/sparkConfetti";

// Achievement definitions
export type AchievementKey = 
  | 'first_spark_sent'
  | 'first_match'
  | 'first_ghost_message'
  | 'first_quedada_joined'
  | 'first_super_spark'
  | 'super_spark_5'
  | 'super_spark_10'
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
  | 'early_adopter'
  // Onboarding achievements
  | 'tutorial_completed'
  | 'first_photo_uploaded'
  | 'bio_written'
  | 'interests_selected'
  | 'first_presence'
  // Daily challenge streak achievements
  | 'challenge_streak_3'
  | 'challenge_streak_7'
  | 'challenge_streak_14'
  | 'challenge_streak_30';

export interface AchievementDefinition {
  key: AchievementKey;
  name: string;
  description: string;
  emoji: string;
  category: 'social' | 'streak' | 'energy' | 'milestone' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  energyReward: number; // Energy awarded when unlocked
}

// Energy rewards by rarity
const RARITY_ENERGY_REWARDS = {
  common: 10,
  uncommon: 25,
  rare: 50,
  epic: 100,
  legendary: 200,
} as const;

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Social achievements
  { key: 'first_spark_sent', name: 'Primera Chispa', description: 'Envía tu primera chispa', emoji: '✨', category: 'social', rarity: 'common', energyReward: RARITY_ENERGY_REWARDS.common },
  { key: 'first_match', name: 'Conexión', description: 'Consigue tu primer match', emoji: '🔥', category: 'social', rarity: 'common', energyReward: RARITY_ENERGY_REWARDS.common },
  { key: 'first_ghost_message', name: 'Mensaje Fantasma', description: 'Envía tu primer mensaje fantasma', emoji: '👻', category: 'social', rarity: 'common', energyReward: RARITY_ENERGY_REWARDS.common },
  { key: 'first_quedada_joined', name: 'Sociable', description: 'Únete a tu primera quedada', emoji: '🎉', category: 'social', rarity: 'common', energyReward: RARITY_ENERGY_REWARDS.common },
  
  // Super Spark achievements
  { key: 'first_super_spark', name: 'Super Interés', description: 'Envía tu primera Super Chispa', emoji: '⚡', category: 'social', rarity: 'uncommon', energyReward: RARITY_ENERGY_REWARDS.uncommon },
  { key: 'super_spark_5', name: 'Rayos', description: 'Envía 5 Super Chispas', emoji: '🌩️', category: 'milestone', rarity: 'rare', energyReward: RARITY_ENERGY_REWARDS.rare },
  { key: 'super_spark_10', name: 'Electrizante', description: 'Envía 10 Super Chispas', emoji: '⚡', category: 'milestone', rarity: 'epic', energyReward: RARITY_ENERGY_REWARDS.epic },
  
  // Streak achievements
  { key: 'streak_3_days', name: 'En Racha', description: 'Mantén una racha de 3 días', emoji: '🔥', category: 'streak', rarity: 'common', energyReward: RARITY_ENERGY_REWARDS.common },
  { key: 'streak_7_days', name: 'Semana Ardiente', description: 'Mantén una racha de 7 días', emoji: '🌟', category: 'streak', rarity: 'uncommon', energyReward: RARITY_ENERGY_REWARDS.uncommon },
  { key: 'streak_14_days', name: 'Imparable', description: 'Mantén una racha de 14 días', emoji: '💫', category: 'streak', rarity: 'rare', energyReward: RARITY_ENERGY_REWARDS.rare },
  { key: 'streak_30_days', name: 'Leyenda', description: 'Mantén una racha de 30 días', emoji: '👑', category: 'streak', rarity: 'legendary', energyReward: RARITY_ENERGY_REWARDS.legendary },
  
  // Energy achievements (no energy reward to avoid circular loop)
  { key: 'energy_100', name: 'Chispazo', description: 'Acumula 100 de energía total', emoji: '⚡', category: 'energy', rarity: 'common', energyReward: 0 },
  { key: 'energy_500', name: 'Alta Tensión', description: 'Acumula 500 de energía total', emoji: '💥', category: 'energy', rarity: 'uncommon', energyReward: 0 },
  { key: 'energy_1000', name: 'Potencia', description: 'Acumula 1000 de energía total', emoji: '🌩️', category: 'energy', rarity: 'rare', energyReward: 0 },
  { key: 'energy_2500', name: 'Supernova', description: 'Acumula 2500 de energía total', emoji: '☀️', category: 'energy', rarity: 'epic', energyReward: 0 },
  { key: 'energy_5000', name: 'Energía Infinita', description: 'Acumula 5000 de energía total', emoji: '🌌', category: 'energy', rarity: 'legendary', energyReward: 0 },
  
  // Milestone achievements
  { key: 'sparks_10', name: 'Encendido', description: 'Envía 10 chispas', emoji: '🕯️', category: 'milestone', rarity: 'common', energyReward: RARITY_ENERGY_REWARDS.common },
  { key: 'sparks_50', name: 'Fogonero', description: 'Envía 50 chispas', emoji: '🔥', category: 'milestone', rarity: 'uncommon', energyReward: RARITY_ENERGY_REWARDS.uncommon },
  { key: 'sparks_100', name: 'Pirotécnico', description: 'Envía 100 chispas', emoji: '🎆', category: 'milestone', rarity: 'rare', energyReward: RARITY_ENERGY_REWARDS.rare },
  { key: 'sparks_250', name: 'Maestro del Fuego', description: 'Envía 250 chispas', emoji: '🐉', category: 'milestone', rarity: 'epic', energyReward: RARITY_ENERGY_REWARDS.epic },
  
  // Special achievements
  { key: 'profile_complete', name: 'Perfil Completo', description: 'Completa todos los campos de tu perfil', emoji: '📝', category: 'special', rarity: 'uncommon', energyReward: RARITY_ENERGY_REWARDS.uncommon },
  { key: 'identity_verified', name: 'Verificado', description: 'Verifica tu identidad', emoji: '✅', category: 'special', rarity: 'rare', energyReward: RARITY_ENERGY_REWARDS.rare },
  { key: 'early_adopter', name: 'Early Adopter', description: 'Uno de los primeros usuarios', emoji: '🚀', category: 'special', rarity: 'legendary', energyReward: RARITY_ENERGY_REWARDS.legendary },
  
  // Onboarding achievements
  { key: 'tutorial_completed', name: 'Estudiante Aplicado', description: 'Completa el tutorial interactivo', emoji: '🎓', category: 'special', rarity: 'common', energyReward: RARITY_ENERGY_REWARDS.common },
  { key: 'first_photo_uploaded', name: 'Fotogénico', description: 'Sube tu primera foto', emoji: '📸', category: 'special', rarity: 'common', energyReward: RARITY_ENERGY_REWARDS.common },
  { key: 'bio_written', name: 'Escritor', description: 'Escribe tu bio por primera vez', emoji: '✍️', category: 'special', rarity: 'common', energyReward: RARITY_ENERGY_REWARDS.common },
  { key: 'interests_selected', name: 'Diverso', description: 'Selecciona tus intereses culturales', emoji: '🎭', category: 'special', rarity: 'common', energyReward: RARITY_ENERGY_REWARDS.common },
  { key: 'first_presence', name: 'Presente', description: 'Activa tu presencia por primera vez', emoji: '👋', category: 'special', rarity: 'common', energyReward: RARITY_ENERGY_REWARDS.common },
  
  // Daily challenge streak achievements
  { key: 'challenge_streak_3', name: 'Retador', description: 'Completa todos los retos 3 días seguidos', emoji: '🎯', category: 'streak', rarity: 'common', energyReward: RARITY_ENERGY_REWARDS.common },
  { key: 'challenge_streak_7', name: 'Semana Perfecta', description: 'Completa todos los retos 7 días seguidos', emoji: '🏅', category: 'streak', rarity: 'uncommon', energyReward: RARITY_ENERGY_REWARDS.uncommon },
  { key: 'challenge_streak_14', name: 'Maestro de Retos', description: 'Completa todos los retos 14 días seguidos', emoji: '🥇', category: 'streak', rarity: 'rare', energyReward: RARITY_ENERGY_REWARDS.rare },
  { key: 'challenge_streak_30', name: 'Leyenda de los Retos', description: 'Completa todos los retos 30 días seguidos', emoji: '👑', category: 'streak', rarity: 'legendary', energyReward: RARITY_ENERGY_REWARDS.legendary },
];

export const getAchievementDefinition = (key: AchievementKey): AchievementDefinition | undefined => {
  return ACHIEVEMENTS.find(a => a.key === key);
};

export const getRarityColor = (rarity: AchievementDefinition['rarity']): string => {
  switch (rarity) {
    case 'common': return 'text-slate-600 dark:text-slate-400';
    case 'uncommon': return 'text-green-600 dark:text-green-500';
    case 'rare': return 'text-blue-600 dark:text-blue-500';
    case 'epic': return 'text-purple-600 dark:text-purple-500';
    case 'legendary': return 'text-amber-600 dark:text-amber-500';
    default: return 'text-slate-600 dark:text-slate-400';
  }
};

export const getRarityBgColor = (rarity: AchievementDefinition['rarity']): string => {
  switch (rarity) {
    case 'common': return 'bg-slate-100 dark:bg-slate-800/50';
    case 'uncommon': return 'bg-green-100 dark:bg-green-900/30';
    case 'rare': return 'bg-blue-100 dark:bg-blue-900/30';
    case 'epic': return 'bg-purple-100 dark:bg-purple-900/30';
    case 'legendary': return 'bg-amber-100 dark:bg-amber-900/30 ring-1 ring-amber-500/40';
    default: return 'bg-slate-100 dark:bg-slate-800/50';
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
          
          // Fire confetti based on achievement rarity
          switch (achievement.rarity) {
            case 'legendary':
              fireLegendaryAchievementConfetti();
              break;
            case 'epic':
              fireEpicAchievementConfetti();
              break;
            case 'rare':
              fireRareAchievementConfetti();
              break;
            case 'uncommon':
              fireUncommonAchievementConfetti();
              break;
            case 'common':
              fireCommonAchievementConfetti();
              break;
          }
          
          // Award energy if the achievement has a reward
          if (achievement.energyReward > 0) {
            try {
              // First ensure energy record exists
              await supabase
                .from('profile_spark_energy')
                .upsert({
                  profile_id: profile.id,
                  current_energy: 0,
                  total_earned: 0,
                  current_streak: 0,
                  longest_streak: 0,
                }, { onConflict: 'profile_id', ignoreDuplicates: true });
              
              // Get current energy
              const { data: current } = await supabase
                .from('profile_spark_energy')
                .select('current_energy, total_earned')
                .eq('profile_id', profile.id)
                .single();
              
              if (current) {
                // Update energy
                await supabase
                  .from('profile_spark_energy')
                  .update({
                    current_energy: current.current_energy + achievement.energyReward,
                    total_earned: current.total_earned + achievement.energyReward,
                  })
                  .eq('profile_id', profile.id);
                
                // Log transaction
                await supabase.from('spark_transactions').insert({
                  profile_id: profile.id,
                  type: 'earn',
                  amount: achievement.energyReward,
                  action: 'achievement_unlock',
                  description: `Logro desbloqueado: ${achievement.name}`,
                  metadata: { achievement_key: achievementKey },
                });
              }
              
              // Invalidate energy queries to refresh UI
              queryClient.invalidateQueries({ queryKey: ['spark_energy'] });
            } catch (error) {
              console.error('Error awarding achievement energy:', error);
            }
          }
          
          const energyText = achievement.energyReward > 0 
            ? ` (+${achievement.energyReward} ⚡)` 
            : '';
          
          toast.success(
            `🏆 ¡Logro desbloqueado!${energyText}`,
            { 
              description: `${achievement.emoji} ${achievement.name}: ${achievement.description}`,
              duration: 5000,
            }
          );
          
          // Send push notification for users not active in app
          sendPushNotification({
            profileId: profile.id,
            title: `🏆 ¡Logro desbloqueado!${energyText}`,
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

  // Check super spark achievements
  const checkSuperSparkAchievements = async (totalSuperSparks: number) => {
    if (totalSuperSparks >= 1 && !isUnlocked('first_super_spark')) {
      await checkAndUnlock('first_super_spark');
    }
    if (totalSuperSparks >= 5 && !isUnlocked('super_spark_5')) {
      await checkAndUnlock('super_spark_5');
    }
    if (totalSuperSparks >= 10 && !isUnlocked('super_spark_10')) {
      await checkAndUnlock('super_spark_10');
    }
  };

  // Check daily challenge streak achievements
  const checkChallengeStreakAchievements = async (challengeStreak: number) => {
    if (challengeStreak >= 3 && !isUnlocked('challenge_streak_3')) {
      await checkAndUnlock('challenge_streak_3');
    }
    if (challengeStreak >= 7 && !isUnlocked('challenge_streak_7')) {
      await checkAndUnlock('challenge_streak_7');
    }
    if (challengeStreak >= 14 && !isUnlocked('challenge_streak_14')) {
      await checkAndUnlock('challenge_streak_14');
    }
    if (challengeStreak >= 30 && !isUnlocked('challenge_streak_30')) {
      await checkAndUnlock('challenge_streak_30');
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
    checkSuperSparkAchievements,
    checkChallengeStreakAchievements,
    unlockedCount: unlockedAchievements?.length ?? 0,
    totalCount: ACHIEVEMENTS.length,
  };
};
