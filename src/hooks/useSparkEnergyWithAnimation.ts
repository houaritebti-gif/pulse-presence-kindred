import { useCallback } from "react";
import { useSparkEnergy } from "@/hooks/useSparkEnergy";
import { useEnergyGainAnimation } from "@/components/EnergyGainAnimation";

/**
 * Extended hook that wraps useSparkEnergy and triggers floating +X animations
 * when energy is earned.
 */
export function useSparkEnergyWithAnimation() {
  const sparkEnergy = useSparkEnergy();
  const { showEnergyGain } = useEnergyGainAnimation();

  const earnEnergyWithAnimation = useCallback(
    async (params: Parameters<typeof sparkEnergy.earnEnergy>[0]) => {
      const result = await sparkEnergy.earnEnergy(params);
      
      // Show floating animation with the earned amount
      if (result && result.amount > 0) {
        showEnergyGain(result.amount);
      }
      
      return result;
    },
    [sparkEnergy.earnEnergy, showEnergyGain]
  );

  return {
    ...sparkEnergy,
    earnEnergy: earnEnergyWithAnimation,
    // Also expose the raw function for cases where animation is not wanted
    earnEnergyWithoutAnimation: sparkEnergy.earnEnergy,
  };
}

export default useSparkEnergyWithAnimation;
