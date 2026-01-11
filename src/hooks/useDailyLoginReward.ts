import { useEffect, useRef } from "react";
import { useSparkEnergy } from "./useSparkEnergy";
import { usePurchasedItems } from "./usePurchasedItems";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { triggerHaptic } from "@/utils/haptics";
import { fireSuperSparkConfetti } from "@/utils/superSparkConfetti";

/**
 * Hook to automatically award daily login energy AND
 * grant a free Super Chispa when reaching a 7-day streak
 * Should be used once at the app root level
 * Animation is triggered automatically via emitEnergyGain in useSparkEnergy
 */
export function useDailyLoginReward() {
  const { user } = useAuth();
  const { sparkEnergy, earnEnergy, canDoAction, isLoading } = useSparkEnergy();
  const { recordPurchase } = usePurchasedItems();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only check once per session when user is logged in and data is loaded
    if (!user || isLoading || hasCheckedRef.current || !sparkEnergy) return;

    const checkLogin = async () => {
      if (!canDoAction("daily_login")) return;
      
      const today = new Date().toISOString().split("T")[0];
      if (sparkEnergy.last_activity_date === today) return;
      
      hasCheckedRef.current = true;
      
      try {
        const result = await earnEnergy({ 
          action: "daily_login",
          description: "Login diario"
        });
        
        if (result && result.amount > 0) {
          console.log("[SparkEnergy] Daily login reward awarded:", result.amount);
          
          // Check if new streak is a multiple of 7 (7, 14, 21, etc.)
          if (result.newStreak && result.newStreak > 0 && result.newStreak % 7 === 0) {
            await grantStreakSuperSpark(result.newStreak);
          }
        }
      } catch (error) {
        console.error("[SparkEnergy] Failed to award daily login:", error);
      }
    };

    const grantStreakSuperSpark = async (streak: number) => {
      try {
        // Record a free super spark as a reward
        await recordPurchase("super_spark");
        
        // Wait a bit for the energy animation to complete
        setTimeout(() => {
          fireSuperSparkConfetti();
          triggerHaptic('success');
          
          toast.success(`🎁 ¡Racha de ${streak} días!`, {
            description: "Has ganado una Super Chispa gratis ⚡",
            duration: 5000,
          });
        }, 1500);
        
        console.log(`[SparkEnergy] Awarded free Super Spark for ${streak}-day streak`);
      } catch (error) {
        console.error("[SparkEnergy] Failed to award streak Super Spark:", error);
      }
    };

    // Small delay to ensure everything is loaded
    const timer = setTimeout(checkLogin, 2000);
    return () => clearTimeout(timer);
  }, [user, isLoading, sparkEnergy, earnEnergy, canDoAction, recordPurchase]);
}

export default useDailyLoginReward;
