import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useAchievements } from "@/hooks/useAchievements";
import { useSparkEnergy } from "@/hooks/useSparkEnergy";

/**
 * Hook that automatically checks and unlocks achievements based on user activity.
 * Should be called once in a top-level component (e.g., App or Profile).
 */
export const useAchievementChecker = () => {
  const { data: profile } = useProfile();
  const { 
    isUnlocked, 
    checkAndUnlock, 
    checkStreakAchievements, 
    checkEnergyAchievements,
    checkSparksSentAchievements,
  } = useAchievements();
  const { sparkEnergy } = useSparkEnergy();
  
  const lastCheckedEnergy = useRef<number>(0);
  const lastCheckedStreak = useRef<number>(0);

  // Check streak and energy achievements when sparkEnergy changes
  useEffect(() => {
    if (!sparkEnergy || !profile?.id) return;

    // Only check if values actually changed
    if (sparkEnergy.total_earned !== lastCheckedEnergy.current) {
      lastCheckedEnergy.current = sparkEnergy.total_earned;
      checkEnergyAchievements(sparkEnergy.total_earned);
    }

    if (sparkEnergy.current_streak !== lastCheckedStreak.current) {
      lastCheckedStreak.current = sparkEnergy.current_streak;
      checkStreakAchievements(sparkEnergy.current_streak);
    }
  }, [sparkEnergy?.total_earned, sparkEnergy?.current_streak, profile?.id]);

  // Check first match achievement
  useEffect(() => {
    if (!profile?.id || isUnlocked('first_match')) return;

    const checkFirstMatch = async () => {
      const { count } = await supabase
        .from('spark_chats')
        .select('*', { count: 'exact', head: true })
        .or(`profile_a_id.eq.${profile.id},profile_b_id.eq.${profile.id}`);

      if (count && count > 0) {
        checkAndUnlock('first_match');
      }
    };

    checkFirstMatch();
  }, [profile?.id, isUnlocked]);

  // Check first ghost message achievement
  useEffect(() => {
    if (!profile?.id || isUnlocked('first_ghost_message')) return;

    const checkFirstGhost = async () => {
      const { count } = await supabase
        .from('ghost_messages')
        .select('*', { count: 'exact', head: true })
        .eq('from_profile_id', profile.id);

      if (count && count > 0) {
        checkAndUnlock('first_ghost_message');
      }
    };

    checkFirstGhost();
  }, [profile?.id, isUnlocked]);

  // Check first quedada joined achievement
  useEffect(() => {
    if (!profile?.id || isUnlocked('first_quedada_joined')) return;

    const checkFirstQuedada = async () => {
      const { count } = await supabase
        .from('quedada_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id);

      if (count && count > 0) {
        checkAndUnlock('first_quedada_joined');
      }
    };

    checkFirstQuedada();
  }, [profile?.id, isUnlocked]);

  // Check sparks sent achievements
  useEffect(() => {
    if (!profile?.id) return;

    const checkSparksSent = async () => {
      const { count } = await supabase
        .from('sparks')
        .select('*', { count: 'exact', head: true })
        .eq('from_profile_id', profile.id);

      if (count && count > 0) {
        checkSparksSentAchievements(count);
      }
    };

    checkSparksSent();
  }, [profile?.id]);

  // Check identity verified achievement
  useEffect(() => {
    if (!profile?.id || isUnlocked('identity_verified')) return;

    if (profile.identity_verified) {
      checkAndUnlock('identity_verified');
    }
  }, [profile?.id, profile?.identity_verified, isUnlocked]);

  // Check profile complete achievement
  useEffect(() => {
    if (!profile?.id || isUnlocked('profile_complete')) return;

    const isComplete = 
      profile.name && 
      profile.avatar_url && 
      profile.bio && 
      profile.city && 
      profile.birthdate &&
      profile.gender;

    if (isComplete) {
      checkAndUnlock('profile_complete');
    }
  }, [profile, isUnlocked]);
};
