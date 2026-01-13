import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PresenceCardSkeletonProps {
  /** Animation delay in ms for staggered animations */
  delay?: number;
  /** Whether this is for the fullscreen card view */
  isFullScreen?: boolean;
}

/**
 * Animated skeleton for presence cards with shimmer effect
 * Provides a polished loading state that matches the card layout
 */
export const PresenceCardSkeleton = memo(({ 
  delay = 0, 
  isFullScreen = false 
}: PresenceCardSkeletonProps) => {
  if (isFullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.3, 
          delay: delay / 1000,
          ease: [0.22, 1, 0.36, 1]
        }}
        className="relative w-full aspect-[3/4] max-h-[calc(100vh-180px)] min-h-[500px] rounded-3xl overflow-hidden bg-card shadow-2xl"
      >
        {/* Main photo skeleton */}
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
        
        {/* Gradient overlay to match real card */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
        
        {/* Top badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        {/* Bottom content area */}
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
          {/* Name and age */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          
          {/* Location */}
          <div className="flex items-center gap-2">
            <Skeleton variant="circular" className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          
          {/* Tags row */}
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          
          {/* Compatibility bar */}
          <div className="flex items-center gap-2 pt-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-2 flex-1 rounded-full" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
        
        {/* Swipe indicators skeleton */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Skeleton className="h-12 w-12 rounded-full opacity-30" />
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Skeleton className="h-12 w-12 rounded-full opacity-30" />
        </div>
      </motion.div>
    );
  }

  // Standard list skeleton
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: delay / 1000,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="bg-card rounded-3xl p-6 border border-border/50 shadow-md"
    >
      {/* Header with avatar and name */}
      <div className="flex items-start gap-4 mb-4">
        <Skeleton variant="circular" className="w-16 h-16" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Photo carousel placeholder */}
      <Skeleton className="w-full h-48 rounded-2xl mb-4" />

      {/* Tribes/Music tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </motion.div>
  );
});

PresenceCardSkeleton.displayName = "PresenceCardSkeleton";

interface PresenceListSkeletonProps {
  count?: number;
  isFullScreen?: boolean;
}

/**
 * Skeleton list for presence loading state
 * Shows multiple animated skeleton cards with staggered entrance
 */
export const PresenceListSkeleton = memo(({ 
  count = 3,
  isFullScreen = false 
}: PresenceListSkeletonProps) => {
  if (isFullScreen) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <PresenceCardSkeleton isFullScreen delay={0} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <PresenceCardSkeleton key={index} delay={index * 100} />
      ))}
    </div>
  );
});

PresenceListSkeleton.displayName = "PresenceListSkeleton";

export default PresenceCardSkeleton;
