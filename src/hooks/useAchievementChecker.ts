import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useAchievements } from "@/hooks/useAchievements";
import { useSparkEnergy } from "@/hooks/useSparkEnergy";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { useProfileInterests } from "@/hooks/useInterests";
import { useChallengeStreak } from "@/hooks/useChallengeStreak";

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
    checkSuperSparkAchievements,
    checkChallengeStreakAchievements,
    isLoading: achievementsLoading,
  } = useAchievements();
  const { sparkEnergy } = useSparkEnergy();
  const { data: photos } = useProfilePhotos(profile?.id);
  const { data: interests } = useProfileInterests(profile?.id);
  const { data: challengeStreakData } = useChallengeStreak();
  
  const lastCheckedEnergy = useRef<number>(0);
  const lastCheckedStreak = useRef<number>(0);
  const lastCheckedSuperSparks = useRef<number>(0);
  const lastCheckedChallengeStreak = useRef<number>(0);

  // CRITICAL: Don't run any checks until achievements are loaded
  // This prevents duplicate inserts when isUnlocked returns false for unloaded data
  const isReady = !achievementsLoading && !!profile?.id;

  // Check streak and energy achievements when sparkEnergy changes
  useEffect(() => {
    if (!sparkEnergy || !isReady) return;

    // Only check if values actually changed
    if (sparkEnergy.total_earned !== lastCheckedEnergy.current) {
      lastCheckedEnergy.current = sparkEnergy.total_earned;
      checkEnergyAchievements(sparkEnergy.total_earned);
    }

    if (sparkEnergy.current_streak !== lastCheckedStreak.current) {
      lastCheckedStreak.current = sparkEnergy.current_streak;
      checkStreakAchievements(sparkEnergy.current_streak);
    }
  }, [sparkEnergy?.total_earned, sparkEnergy?.current_streak, isReady]);

  // Check first match achievement
  useEffect(() => {
    if (!isReady || isUnlocked('first_match')) return;

    const checkFirstMatch = async () => {
      const { count } = await supabase
        .from('spark_chats')
        .select('*', { count: 'exact', head: true })
        .or(`profile_a_id.eq.${profile!.id},profile_b_id.eq.${profile!.id}`);

      if (count && count > 0) {
        checkAndUnlock('first_match');
      }
    };

    checkFirstMatch();
  }, [isReady, isUnlocked]);

  // Check first ghost message achievement
  useEffect(() => {
    if (!isReady || isUnlocked('first_ghost_message')) return;

    const checkFirstGhost = async () => {
      const { count } = await supabase
        .from('ghost_messages')
        .select('*', { count: 'exact', head: true })
        .eq('from_profile_id', profile!.id);

      if (count && count > 0) {
        checkAndUnlock('first_ghost_message');
      }
    };

    checkFirstGhost();
  }, [isReady, isUnlocked]);

  // Check first quedada joined achievement
  useEffect(() => {
    if (!isReady || isUnlocked('first_quedada_joined')) return;

    const checkFirstQuedada = async () => {
      const { count } = await supabase
        .from('quedada_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile!.id);

      if (count && count > 0) {
        checkAndUnlock('first_quedada_joined');
      }
    };

    checkFirstQuedada();
  }, [isReady, isUnlocked]);

  // Check sparks sent achievements
  useEffect(() => {
    if (!isReady) return;

    const checkSparksSent = async () => {
      const { count } = await supabase
        .from('sparks')
        .select('*', { count: 'exact', head: true })
        .eq('from_profile_id', profile!.id);

      if (count && count > 0) {
        checkSparksSentAchievements(count);
      }
    };

    checkSparksSent();
  }, [isReady]);

  // Check super sparks sent achievements
  useEffect(() => {
    if (!isReady) return;

    const checkSuperSparksSent = async () => {
      const { count } = await supabase
        .from('ghost_messages')
        .select('*', { count: 'exact', head: true })
        .eq('from_profile_id', profile!.id)
        .eq('is_super_spark', true);

      if (count && count > 0 && count !== lastCheckedSuperSparks.current) {
        lastCheckedSuperSparks.current = count;
        checkSuperSparkAchievements(count);
      }
    };

    checkSuperSparksSent();
  }, [isReady]);

  // Check identity verified achievement
  useEffect(() => {
    if (!isReady || isUnlocked('identity_verified')) return;

    if (profile!.identity_verified) {
      checkAndUnlock('identity_verified');
    }
  }, [isReady, profile?.identity_verified, isUnlocked]);

  // Check profile complete achievement
  useEffect(() => {
    if (!isReady || isUnlocked('profile_complete')) return;

    const isComplete = 
      profile!.name && 
      profile!.avatar_url && 
      profile!.bio && 
      profile!.city && 
      profile!.birthdate &&
      profile!.gender;

    if (isComplete) {
      checkAndUnlock('profile_complete');
    }
  }, [profile, isReady, isUnlocked]);

  // ========== ONBOARDING ACHIEVEMENTS ==========

  // Check tutorial completed achievement (from localStorage)
  useEffect(() => {
    if (!isReady || isUnlocked('tutorial_completed')) return;

    const tutorialCompleted = localStorage.getItem('kiki-tutorial-completed');
    if (tutorialCompleted === 'true') {
      checkAndUnlock('tutorial_completed');
    }
  }, [isReady, isUnlocked]);

  // Check first photo uploaded achievement
  useEffect(() => {
    if (!isReady || isUnlocked('first_photo_uploaded')) return;

    // Check both avatar and gallery photos
    const hasPhoto = profile!.avatar_url || (photos && photos.length > 0);
    if (hasPhoto) {
      checkAndUnlock('first_photo_uploaded');
    }
  }, [isReady, profile?.avatar_url, photos, isUnlocked]);

  // Check bio written achievement
  useEffect(() => {
    if (!isReady || isUnlocked('bio_written')) return;

    if (profile!.bio && profile!.bio.trim().length >= 10) {
      checkAndUnlock('bio_written');
    }
  }, [isReady, profile?.bio, isUnlocked]);

  // Check interests selected achievement
  useEffect(() => {
    if (!isReady || isUnlocked('interests_selected')) return;

    if (interests && interests.length >= 3) {
      checkAndUnlock('interests_selected');
    }
  }, [isReady, interests, isUnlocked]);

  // Check first presence achievement
  useEffect(() => {
    if (!isReady || isUnlocked('first_presence')) return;

    const checkFirstPresence = async () => {
      const { data, error } = await supabase
        .from('presence')
        .select('id, is_present, profile_id')
        .eq('profile_id', profile!.id)
        .maybeSingle();

      // Ignore 406 errors from RLS or missing data
      if (error && error.code !== 'PGRST116') {
        console.warn('[AchievementChecker] Error checking presence:', error.message);
        return;
      }

      if (data?.is_present) {
        checkAndUnlock('first_presence');
      }
    };

    checkFirstPresence();
  }, [isReady, isUnlocked]);

  // Check daily challenge streak achievements
  useEffect(() => {
    if (!isReady || !challengeStreakData) return;

    const { currentStreak } = challengeStreakData;
    
    if (currentStreak !== lastCheckedChallengeStreak.current) {
      lastCheckedChallengeStreak.current = currentStreak;
      checkChallengeStreakAchievements(currentStreak);
    }
  }, [isReady, challengeStreakData?.currentStreak, checkChallengeStreakAchievements]);
};
