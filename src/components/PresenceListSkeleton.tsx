import { memo } from "react";
import { motion } from "framer-motion";
import { PresenceCardSkeleton } from "./PresenceCardSkeleton";
import LoadingProgressIndicator from "./LoadingProgressIndicator";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface PresenceListSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Whether to show progress indicator */
  showProgress?: boolean;
  /** Custom loading messages */
  loadingMessages?: string[];
}

/**
 * Skeleton list for presence loading state
 * Shows multiple animated skeleton cards with staggered entrance and progress indicator
 */
export const PresenceListSkeleton = memo(({ 
  count = 3,
  showProgress = true,
  loadingMessages
}: PresenceListSkeletonProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      {showProgress && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.3 }}
          className="mb-4"
        >
          <LoadingProgressIndicator 
            isLoading={true}
            messages={loadingMessages}
            size="sm"
            showIcon={true}
          />
        </motion.div>
      )}

      {/* Skeleton cards with stagger animation */}
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <PresenceCardSkeleton 
            key={index} 
            delay={index * 80}
            showShimmer={index < 2} // Only shimmer first 2 for performance
          />
        ))}
      </div>
    </div>
  );
});

PresenceListSkeleton.displayName = "PresenceListSkeleton";

export default PresenceListSkeleton;
