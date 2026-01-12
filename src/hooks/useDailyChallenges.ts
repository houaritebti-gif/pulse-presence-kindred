import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useSparkEnergy } from "@/hooks/useSparkEnergy";
import { toast } from "sonner";
import { triggerHaptic } from "@/utils/haptics";

// Daily challenge definitions
export interface ChallengeDefinition {
  key: string;
  name: string;
  description: string;
  emoji: string;
  targetValue: number;
  energyReward: number;
  category: "social" | "engagement" | "exploration";
}

// Available daily challenges (rotated based on day)
const ALL_CHALLENGES: ChallengeDefinition[] = [
  // Social challenges
  { key: "send_sparks_3", name: "Chispazos", description: "Envía 3 chispas", emoji: "✨", targetValue: 3, energyReward: 15, category: "social" },
  { key: "send_ghost_1", name: "Fantasma", description: "Envía un mensaje fantasma", emoji: "👻", targetValue: 1, energyReward: 10, category: "social" },
  { key: "reply_message_2", name: "Conversador", description: "Responde 2 mensajes en chats", emoji: "💬", targetValue: 2, energyReward: 12, category: "social" },
  
  // Engagement challenges
  { key: "visit_profiles_5", name: "Explorador", description: "Visita 5 perfiles", emoji: "👀", targetValue: 5, energyReward: 10, category: "exploration" },
  { key: "active_presence", name: "Presente", description: "Mantén tu presencia activa", emoji: "🌟", targetValue: 1, energyReward: 8, category: "engagement" },
  { key: "check_quedadas", name: "Social", description: "Revisa las quedadas disponibles", emoji: "🎉", targetValue: 1, energyReward: 5, category: "exploration" },
  
  // Exploration challenges
  { key: "view_leaderboard", name: "Competidor", description: "Consulta el ranking", emoji: "🏆", targetValue: 1, energyReward: 5, category: "exploration" },
  { key: "open_shop", name: "Comprador", description: "Visita la tienda Spark", emoji: "🛒", targetValue: 1, energyReward: 5, category: "exploration" },
];

// Get 3 challenges for today based on date seed
const getTodaysChallenges = (): ChallengeDefinition[] => {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Use seed to shuffle consistently for the day
  const shuffled = [...ALL_CHALLENGES].sort((a, b) => {
    const hashA = (seed * a.key.length) % 1000;
    const hashB = (seed * b.key.length) % 1000;
    return hashA - hashB;
  });
  
  // Return 3 challenges, trying to get one from each category
  const social = shuffled.find(c => c.category === "social");
  const engagement = shuffled.find(c => c.category === "engagement");
  const exploration = shuffled.find(c => c.category === "exploration");
  
  return [social, engagement, exploration].filter(Boolean) as ChallengeDefinition[];
};

interface ChallengeProgress {
  id: string;
  profile_id: string;
  challenge_key: string;
  challenge_date: string;
  current_progress: number;
  target_value: number;
  completed_at: string | null;
  reward_claimed: boolean;
  energy_reward: number;
}

export const useDailyChallenges = () => {
  const { data: profile } = useProfile();
  const { earnEnergy } = useSparkEnergy();
  const queryClient = useQueryClient();
  
  const todaysChallenges = getTodaysChallenges();
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's challenge progress
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['daily_challenges', profile?.id, today],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('daily_challenge_progress')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('challenge_date', today);
      
      if (error) throw error;
      return data as ChallengeProgress[];
    },
    enabled: !!profile?.id,
  });

  // Initialize challenges for today if needed
  const initializeMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('No profile');
      
      const existingKeys = progressData?.map(p => p.challenge_key) || [];
      const missingChallenges = todaysChallenges.filter(c => !existingKeys.includes(c.key));
      
      if (missingChallenges.length === 0) return;
      
      const inserts = missingChallenges.map(c => ({
        profile_id: profile.id,
        challenge_key: c.key,
        challenge_date: today,
        target_value: c.targetValue,
        energy_reward: c.energyReward,
        current_progress: 0,
      }));
      
      const { error } = await supabase
        .from('daily_challenge_progress')
        .insert(inserts);
      
      if (error && error.code !== '23505') throw error; // Ignore duplicates
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_challenges', profile?.id, today] });
    },
  });

  // Update challenge progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ challengeKey, increment }: { challengeKey: string; increment: number }) => {
      if (!profile?.id) throw new Error('No profile');
      
      const existing = progressData?.find(p => p.challenge_key === challengeKey);
      if (!existing || existing.completed_at) return null;
      
      const newProgress = Math.min(existing.current_progress + increment, existing.target_value);
      const isNowComplete = newProgress >= existing.target_value;
      
      const { data, error } = await supabase
        .from('daily_challenge_progress')
        .update({
          current_progress: newProgress,
          completed_at: isNowComplete ? new Date().toISOString() : null,
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.completed_at && !data.reward_claimed) {
        const challenge = todaysChallenges.find(c => c.key === data.challenge_key);
        if (challenge) {
          triggerHaptic('success');
          toast.success(`${challenge.emoji} ¡Reto completado!`, {
            description: `${challenge.name}: +${challenge.energyReward} ⚡ pendientes`,
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['daily_challenges', profile?.id, today] });
    },
  });

  // Claim reward
  const claimRewardMutation = useMutation({
    mutationFn: async (challengeKey: string) => {
      if (!profile?.id) throw new Error('No profile');
      
      const challenge = progressData?.find(p => p.challenge_key === challengeKey);
      if (!challenge || !challenge.completed_at || challenge.reward_claimed) {
        throw new Error('Cannot claim reward');
      }
      
      // Mark as claimed
      const { error } = await supabase
        .from('daily_challenge_progress')
        .update({ reward_claimed: true })
        .eq('id', challenge.id);
      
      if (error) throw error;
      
      // Award energy using the correct API
      await earnEnergy({ 
        action: 'daily_challenge', 
        description: `Reto diario: ${challengeKey}`,
        customAmount: challenge.energy_reward,
      });
      
      return challenge;
    },
    onSuccess: (challenge) => {
      if (challenge) {
        const def = todaysChallenges.find(c => c.key === challenge.challenge_key);
        triggerHaptic('success');
        toast.success(`+${challenge.energy_reward} ⚡ reclamados`, {
          description: def?.name || 'Reto completado',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['daily_challenges', profile?.id, today] });
      queryClient.invalidateQueries({ queryKey: ['spark_energy'] });
    },
  });

  // Get combined challenge data with definitions
  const challenges = todaysChallenges.map(def => {
    const progress = progressData?.find(p => p.challenge_key === def.key);
    return {
      ...def,
      currentProgress: progress?.current_progress || 0,
      isCompleted: !!progress?.completed_at,
      rewardClaimed: progress?.reward_claimed || false,
    };
  });

  // Helper to track progress for specific actions
  const trackAction = async (action: string, count = 1) => {
    // Map actions to challenge keys
    const actionMap: Record<string, string[]> = {
      'spark_sent': ['send_sparks_3'],
      'ghost_sent': ['send_ghost_1'],
      'message_sent': ['reply_message_2'],
      'profile_visited': ['visit_profiles_5'],
      'presence_active': ['active_presence'],
      'quedadas_viewed': ['check_quedadas'],
      'leaderboard_viewed': ['view_leaderboard'],
      'shop_opened': ['open_shop'],
    };
    
    const challengeKeys = actionMap[action] || [];
    for (const key of challengeKeys) {
      if (todaysChallenges.some(c => c.key === key)) {
        await updateProgressMutation.mutateAsync({ challengeKey: key, increment: count });
      }
    }
  };

  // Calculate totals
  const completedCount = challenges.filter(c => c.isCompleted).length;
  const totalCount = challenges.length;
  const pendingRewards = challenges.filter(c => c.isCompleted && !c.rewardClaimed).length;
  const totalPendingEnergy = challenges
    .filter(c => c.isCompleted && !c.rewardClaimed)
    .reduce((sum, c) => sum + c.energyReward, 0);

  return {
    challenges,
    isLoading,
    completedCount,
    totalCount,
    pendingRewards,
    totalPendingEnergy,
    initializeChallenges: initializeMutation.mutate,
    trackAction,
    claimReward: claimRewardMutation.mutate,
    claimAllRewards: async () => {
      const pending = challenges.filter(c => c.isCompleted && !c.rewardClaimed);
      for (const c of pending) {
        await claimRewardMutation.mutateAsync(c.key);
      }
    },
  };
};
