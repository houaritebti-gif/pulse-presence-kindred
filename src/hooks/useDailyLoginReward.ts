import { useEffect, useRef } from "react";
import { useSparkEnergy } from "./useSparkEnergy";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to automatically award daily login energy
 * Should be used once at the app root level
 */
export function useDailyLoginReward() {
  const { user } = useAuth();
  const { sparkEnergy, checkDailyLogin, isLoading } = useSparkEnergy();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only check once per session when user is logged in and data is loaded
    if (!user || isLoading || hasCheckedRef.current || !sparkEnergy) return;

    const checkLogin = async () => {
      hasCheckedRef.current = true;
      const awarded = await checkDailyLogin();
      if (awarded) {
        console.log("[SparkEnergy] Daily login reward awarded");
      }
    };

    // Small delay to ensure everything is loaded
    const timer = setTimeout(checkLogin, 2000);
    return () => clearTimeout(timer);
  }, [user, isLoading, sparkEnergy, checkDailyLogin]);
}

export default useDailyLoginReward;
