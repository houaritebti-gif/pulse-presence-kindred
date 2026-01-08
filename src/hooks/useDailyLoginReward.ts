import { useEffect, useRef } from "react";
import { useSparkEnergy } from "./useSparkEnergy";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to automatically award daily login energy
 * Should be used once at the app root level
 * Animation is triggered automatically via emitEnergyGain in useSparkEnergy
 */
export function useDailyLoginReward() {
  const { user } = useAuth();
  const { sparkEnergy, earnEnergy, canDoAction, isLoading } = useSparkEnergy();
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
        }
      } catch (error) {
        console.error("[SparkEnergy] Failed to award daily login:", error);
      }
    };

    // Small delay to ensure everything is loaded
    const timer = setTimeout(checkLogin, 2000);
    return () => clearTimeout(timer);
  }, [user, isLoading, sparkEnergy, earnEnergy, canDoAction]);
}

export default useDailyLoginReward;
