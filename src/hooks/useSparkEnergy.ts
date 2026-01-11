import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { emitEnergyGain } from "@/components/EnergyGainAnimation";
import { playEnergyGainSound } from "@/utils/notificationSound";

// =============================================
// TYPES
// =============================================

export interface SparkEnergy {
  id: string;
  profile_id: string;
  current_energy: number;
  total_earned: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SparkTransaction {
  id: string;
  profile_id: string;
  type: "earn" | "spend";
  amount: number;
  action: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type SparkLevel = 1 | 2 | 3 | 4 | 5;

export interface SparkLevelInfo {
  level: SparkLevel;
  name: string;
  emoji: string;
  minTotal: number;
  discount: number; // percentage discount on shop
  bonusGhostMessages: number;
}

// =============================================
// CONSTANTS
// =============================================

export const SPARK_LEVELS: SparkLevelInfo[] = [
  { level: 1, name: "Brasas", emoji: "🪨", minTotal: 0, discount: 0, bonusGhostMessages: 0 },
  { level: 2, name: "Llama", emoji: "🕯️", minTotal: 500, discount: 10, bonusGhostMessages: 0 },
  { level: 3, name: "Fuego", emoji: "🔥", minTotal: 1500, discount: 10, bonusGhostMessages: 1 },
  { level: 4, name: "Hoguera", emoji: "🏕️", minTotal: 3500, discount: 20, bonusGhostMessages: 1 },
  { level: 5, name: "Radiante", emoji: "💫", minTotal: 7000, discount: 20, bonusGhostMessages: 2 },
];

// Daily earning limits per action
export const DAILY_LIMITS: Record<string, number> = {
  daily_login: 1,
  explore_profiles: 1,
  send_ghost: 3,
  reply_ghost: 3,
  send_spark: 5,
  conversation_active: 2,
  join_quedada: 1,
  update_profile: 1, // weekly limit handled separately
};

// Energy amounts per action
export const ENERGY_AMOUNTS: Record<string, number> = {
  daily_login: 10,
  streak_bonus: 5, // per day, max 25
  explore_profiles: 15,
  send_ghost: 10,
  reply_ghost: 15,
  send_spark: 10,
  mutual_spark: 30,
  conversation_active: 15,
  join_quedada: 25,
  update_profile: 10,
  complete_profile: 100, // one-time
};

// Daily max earning cap
export const DAILY_MAX_ENERGY = 100;

// Shop items with costs
export const SHOP_ITEMS = {
  ghost_message_1: { cost: 50, name: "+1 Ghost Message", description: "Un mensaje extra hoy" },
  ghost_message_3: { cost: 120, name: "+3 Ghost Messages", description: "Pack de 3 mensajes" },
  super_spark: { cost: 100, name: "Super Chispa ⚡", description: "¡Destaca tu interés!" },
  super_spark_3: { cost: 250, name: "3x Super Chispa ⚡", description: "Pack de 3 super chispas" },
  highlighted_message: { cost: 80, name: "Mensaje Destacado ✨", description: "Tu ghost llega con brillo" },
  reveal_spark: { cost: 100, name: "Ver quién te sparkó", description: "Revela 1 perfil" },
  visibility_boost: { cost: 150, name: "Boost 1h", description: "Apareces más arriba" },
  second_chance: { cost: 75, name: "Segunda Oportunidad", description: "Reenviar a alguien" },
  extra_filter: { cost: 60, name: "Filtro Extra 24h", description: "Desbloquea 1 filtro" },
  profile_theme: { cost: 200, name: "Tema Especial 7d", description: "Borde visual temporal" },
  badge_loyal: { cost: 300, name: "Badge Chispa Fiel 🌟", description: "Badge permanente" },
} as const;

export type ShopItemKey = keyof typeof SHOP_ITEMS;

// =============================================
// HELPER FUNCTIONS
// =============================================

export function getSparkLevel(totalEarned: number): SparkLevelInfo {
  for (let i = SPARK_LEVELS.length - 1; i >= 0; i--) {
    if (totalEarned >= SPARK_LEVELS[i].minTotal) {
      return SPARK_LEVELS[i];
    }
  }
  return SPARK_LEVELS[0];
}

export function getNextLevel(currentLevel: SparkLevel): SparkLevelInfo | null {
  const nextIndex = SPARK_LEVELS.findIndex(l => l.level === currentLevel) + 1;
  return nextIndex < SPARK_LEVELS.length ? SPARK_LEVELS[nextIndex] : null;
}

export function getProgressToNextLevel(totalEarned: number): number {
  const currentLevel = getSparkLevel(totalEarned);
  const nextLevel = getNextLevel(currentLevel.level);
  
  if (!nextLevel) return 100; // Max level
  
  const progressInLevel = totalEarned - currentLevel.minTotal;
  const levelRange = nextLevel.minTotal - currentLevel.minTotal;
  
  return Math.min(100, Math.round((progressInLevel / levelRange) * 100));
}

// =============================================
// HOOK
// =============================================

export function useSparkEnergy() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const profileId = profile?.id;

  // Fetch current spark energy
  const { data: sparkEnergy, isLoading, error } = useQuery({
    queryKey: ["spark-energy", profileId],
    queryFn: async (): Promise<SparkEnergy | null> => {
      if (!profileId) return null;

      const { data, error } = await supabase
        .from("profile_spark_energy")
        .select("*")
        .eq("profile_id", profileId)
        .maybeSingle();

      if (error) throw error;

      // Create initial record if doesn't exist
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from("profile_spark_energy")
          .insert({ profile_id: profileId })
          .select()
          .single();

        if (insertError) throw insertError;
        return newData as SparkEnergy;
      }

      return data as SparkEnergy;
    },
    enabled: !!profileId,
    staleTime: 30000, // 30 seconds
  });

  // Fetch today's transactions to check limits
  const { data: todayTransactions } = useQuery({
    queryKey: ["spark-transactions-today", profileId],
    queryFn: async (): Promise<SparkTransaction[]> => {
      if (!profileId) return [];

      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("spark_transactions")
        .select("*")
        .eq("profile_id", profileId)
        .eq("type", "earn")
        .gte("created_at", today);

      if (error) throw error;
      return (data || []) as SparkTransaction[];
    },
    enabled: !!profileId,
    staleTime: 10000,
  });

  // Fetch recent transactions for history
  const { data: recentTransactions } = useQuery({
    queryKey: ["spark-transactions-recent", profileId],
    queryFn: async (): Promise<SparkTransaction[]> => {
      if (!profileId) return [];

      const { data, error } = await supabase
        .from("spark_transactions")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as SparkTransaction[];
    },
    enabled: !!profileId,
    staleTime: 30000,
  });

  // Calculate today's earned energy
  const todayEarned = todayTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const canEarnMore = todayEarned < DAILY_MAX_ENERGY;

  // Check action limit for today
  const getActionCountToday = (action: string): number => {
    return todayTransactions?.filter(t => t.action === action).length || 0;
  };

  const canDoAction = (action: string): boolean => {
    if (!canEarnMore) return false;
    const limit = DAILY_LIMITS[action];
    if (limit === undefined) return true; // No limit
    return getActionCountToday(action) < limit;
  };

  // Earn energy mutation
  const earnEnergyMutation = useMutation({
    mutationFn: async ({ 
      action, 
      description,
      customAmount,
      metadata = {}
    }: { 
      action: string; 
      description?: string;
      customAmount?: number;
      metadata?: Record<string, unknown>;
    }) => {
      if (!profileId || !sparkEnergy) throw new Error("No profile");

      // Check daily cap
      if (todayEarned >= DAILY_MAX_ENERGY) {
        throw new Error("Has alcanzado el límite diario de energía");
      }

      // Check action limit
      const limit = DAILY_LIMITS[action];
      if (limit !== undefined && getActionCountToday(action) >= limit) {
        throw new Error(`Has alcanzado el límite de ${action} por hoy`);
      }

      // Calculate amount (respect daily cap)
      const baseAmount = customAmount || ENERGY_AMOUNTS[action] || 10;
      const remainingToday = DAILY_MAX_ENERGY - todayEarned;
      const amount = Math.min(baseAmount, remainingToday);

      // Check streak
      const today = new Date().toISOString().split("T")[0];
      const lastDate = sparkEnergy.last_activity_date;
      let newStreak = sparkEnergy.current_streak;
      let streakBonus = 0;

      if (lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (lastDate === yesterdayStr) {
          // Continue streak
          newStreak = sparkEnergy.current_streak + 1;
          streakBonus = Math.min(newStreak * ENERGY_AMOUNTS.streak_bonus, 25);
        } else if (lastDate !== today) {
          // Break streak (unless it's first activity)
          newStreak = lastDate ? 1 : 1;
        }
      }

      // Insert transaction
      const { error: txError } = await supabase
        .from("spark_transactions")
        .insert({
          profile_id: profileId,
          type: "earn",
          amount: amount + streakBonus,
          action,
          description: description || null,
          metadata: { ...metadata, streak_bonus: streakBonus },
        });

      if (txError) throw txError;

      // Update energy
      const newTotal = sparkEnergy.total_earned + amount + streakBonus;
      const { error: updateError } = await supabase
        .from("profile_spark_energy")
        .update({
          current_energy: sparkEnergy.current_energy + amount + streakBonus,
          total_earned: newTotal,
          current_streak: newStreak,
          longest_streak: Math.max(sparkEnergy.longest_streak, newStreak),
          last_activity_date: today,
        })
        .eq("profile_id", profileId);

      if (updateError) throw updateError;

      return { amount: amount + streakBonus, streakBonus, newStreak };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["spark-energy", profileId] });
      queryClient.invalidateQueries({ queryKey: ["spark-transactions-today", profileId] });
      queryClient.invalidateQueries({ queryKey: ["spark-transactions-recent", profileId] });
      
      // Visual and audio feedback for energy gain
      emitEnergyGain(data.amount);
      playEnergyGainSound();
      
      if (data.streakBonus > 0) {
        toast.success(`+${data.amount}🔥 (incluye +${data.streakBonus} bonus racha día ${data.newStreak})`);
      }
      
      // Check achievements will be done by calling component to avoid circular deps
    },
    onError: (error) => {
      console.error("Error earning energy:", error);
    },
  });

  // Spend energy mutation
  const spendEnergyMutation = useMutation({
    mutationFn: async ({ 
      itemKey,
      metadata = {}
    }: { 
      itemKey: ShopItemKey;
      metadata?: Record<string, unknown>;
    }) => {
      if (!profileId || !sparkEnergy) throw new Error("No profile");

      const item = SHOP_ITEMS[itemKey];
      if (!item) throw new Error("Item no encontrado");

      // Apply level discount
      const levelInfo = getSparkLevel(sparkEnergy.total_earned);
      const discountedCost = Math.round(item.cost * (1 - levelInfo.discount / 100));

      if (sparkEnergy.current_energy < discountedCost) {
        throw new Error(`Necesitas ${discountedCost}🔥 (tienes ${sparkEnergy.current_energy})`);
      }

      // Insert transaction
      const { error: txError } = await supabase
        .from("spark_transactions")
        .insert({
          profile_id: profileId,
          type: "spend",
          amount: discountedCost,
          action: `buy_${itemKey}`,
          description: item.name,
          metadata: { ...metadata, original_cost: item.cost, discount: levelInfo.discount },
        });

      if (txError) throw txError;

      // Update energy
      const { error: updateError } = await supabase
        .from("profile_spark_energy")
        .update({
          current_energy: sparkEnergy.current_energy - discountedCost,
        })
        .eq("profile_id", profileId);

      if (updateError) throw updateError;

      return { item, cost: discountedCost, discount: levelInfo.discount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["spark-energy", profileId] });
      queryClient.invalidateQueries({ queryKey: ["spark-transactions-recent", profileId] });
      
      toast.success(`${data.item.name} desbloqueado! -${data.cost}🔥`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al canjear");
    },
  });

  // Check and award daily login
  const checkDailyLogin = async () => {
    if (!sparkEnergy || !canDoAction("daily_login")) return false;
    
    const today = new Date().toISOString().split("T")[0];
    if (sparkEnergy.last_activity_date === today) return false;

    try {
      await earnEnergyMutation.mutateAsync({ 
        action: "daily_login",
        description: "Login diario"
      });
      return true;
    } catch {
      return false;
    }
  };

  // Computed values
  const currentLevel = sparkEnergy ? getSparkLevel(sparkEnergy.total_earned) : SPARK_LEVELS[0];
  const nextLevel = getNextLevel(currentLevel.level);
  const progressToNext = sparkEnergy ? getProgressToNextLevel(sparkEnergy.total_earned) : 0;

  return {
    // Data
    sparkEnergy,
    isLoading,
    error,
    
    // Level info
    currentLevel,
    nextLevel,
    progressToNext,
    
    // Today's stats
    todayEarned,
    canEarnMore,
    remainingToday: DAILY_MAX_ENERGY - todayEarned,
    
    // Transactions
    recentTransactions,
    
    // Actions
    earnEnergy: earnEnergyMutation.mutateAsync,
    spendEnergy: spendEnergyMutation.mutateAsync,
    isEarning: earnEnergyMutation.isPending,
    isSpending: spendEnergyMutation.isPending,
    
    // Helpers
    canDoAction,
    getActionCountToday,
    checkDailyLogin,
    getItemCost: (itemKey: ShopItemKey) => {
      const item = SHOP_ITEMS[itemKey];
      if (!item || !sparkEnergy) return item?.cost || 0;
      const discount = currentLevel.discount;
      return Math.round(item.cost * (1 - discount / 100));
    },
    canAfford: (itemKey: ShopItemKey) => {
      const cost = SHOP_ITEMS[itemKey]?.cost || 0;
      const discountedCost = Math.round(cost * (1 - currentLevel.discount / 100));
      return (sparkEnergy?.current_energy || 0) >= discountedCost;
    },
    
    // Constants for UI
    SHOP_ITEMS,
    ENERGY_AMOUNTS,
    DAILY_LIMITS,
    DAILY_MAX_ENERGY,
    SPARK_LEVELS,
  };
}

export default useSparkEnergy;
