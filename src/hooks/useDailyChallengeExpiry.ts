import { useEffect, useRef } from 'react';
import { useProfile } from './useProfile';
import { useDailyChallenges } from './useDailyChallenges';
import { sendPushNotification } from '@/utils/pushNotifications';

const EXPIRY_NOTIFICATION_KEY = 'kiki-daily-challenge-expiry-notified';

/**
 * Hook that sends push notifications when daily challenges are about to expire.
 * Checks at 9 PM (21:00) local time if there are incomplete challenges.
 */
export const useDailyChallengeExpiry = () => {
  const { data: profile } = useProfile();
  const { challenges, pendingRewards } = useDailyChallenges();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!profile?.id) return;

    const checkExpiry = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const notifiedKey = `${EXPIRY_NOTIFICATION_KEY}-${today}`;
      
      // Check if already notified today
      if (localStorage.getItem(notifiedKey)) return;
      
      // Only notify after 9 PM (21:00)
      if (now.getHours() < 21) return;
      
      // Check for incomplete challenges
      const incompleteChallenges = challenges.filter(c => !c.isCompleted);
      const almostCompleteChallenges = challenges.filter(
        c => !c.isCompleted && c.currentProgress > 0 && c.currentProgress / c.targetValue >= 0.5
      );
      
      // Calculate hours until midnight
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const hoursLeft = Math.ceil((midnight.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      // Send notification if there are incomplete challenges
      if (incompleteChallenges.length > 0) {
        let title = '⏰ ¡Tus retos diarios expiran pronto!';
        let body = '';
        
        if (almostCompleteChallenges.length > 0) {
          // Prioritize almost complete challenges
          const challenge = almostCompleteChallenges[0];
          title = `${challenge.emoji} ¡Casi completas "${challenge.name}"!`;
          body = `Solo te quedan ${hoursLeft}h para terminar. ${challenge.currentProgress}/${challenge.targetValue}`;
        } else if (pendingRewards > 0) {
          // Remind about unclaimed rewards
          title = '🎁 ¡Tienes recompensas pendientes!';
          body = `Reclama tus ${pendingRewards} recompensas antes de medianoche`;
        } else {
          body = `Quedan ${hoursLeft}h para completar ${incompleteChallenges.length} reto${incompleteChallenges.length > 1 ? 's' : ''}`;
        }
        
        sendPushNotification({
          profileId: profile.id,
          title,
          body,
          url: '/profile',
          tag: 'daily-challenge-expiry',
        });
        
        // Mark as notified for today
        localStorage.setItem(notifiedKey, 'true');
      }
    };

    // Check immediately
    checkExpiry();
    
    // Check every 30 minutes
    checkIntervalRef.current = setInterval(checkExpiry, 30 * 60 * 1000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [profile?.id, challenges, pendingRewards]);
};

export default useDailyChallengeExpiry;
