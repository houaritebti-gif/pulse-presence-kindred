import { memo, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface PresenceCardSkeletonProps {
  /** Animation delay in ms for staggered animations */
  delay?: number;
  /** Whether this is for the fullscreen card view */
  isFullScreen?: boolean;
  /** Show enhanced shimmer effect */
  showShimmer?: boolean;
}

/**
 * Animated skeleton for presence cards with premium shimmer effect
 * Optimized for mobile with smooth animations and reduced motion support
 */
export const PresenceCardSkeleton = memo(({ 
  delay = 0, 
  isFullScreen = false,
  showShimmer = true
}: PresenceCardSkeletonProps) => {
  const prefersReducedMotion = useReducedMotion();

  // Shimmer overlay component
  const ShimmerOverlay = () => (
    !prefersReducedMotion && showShimmer ? (
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ 
          duration: 1.8, 
          repeat: Infinity, 
          repeatDelay: 1,
          ease: "easeInOut"
        }}
      />
    ) : null
  );

  if (isFullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: prefersReducedMotion ? 0.1 : 0.3, 
          delay: delay / 1000,
          ease: [0.22, 1, 0.36, 1]
        }}
        className="relative w-full aspect-[3/4] max-h-[calc(100vh-180px)] min-h-[500px] rounded-3xl overflow-hidden bg-card shadow-2xl"
      >
        {/* Main photo skeleton */}
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
        
        <ShimmerOverlay />
        
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
            <Skeleton className="h-4 w-4 rounded-full" />
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

  // Standard list skeleton - optimized for mobile
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: prefersReducedMotion ? 0.1 : 0.35, 
        delay: delay / 1000,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={cn(
        "relative bg-card rounded-2xl p-4 border border-border/50 shadow-md overflow-hidden",
        "active:scale-[0.99] transition-transform"
      )}
    >
      <ShimmerOverlay />
      
      {/* Header with avatar and name */}
      <div className="flex items-start gap-3 mb-3">
        <motion.div
          animate={!prefersReducedMotion ? { 
            opacity: [0.5, 0.8, 0.5] 
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Skeleton className="w-14 h-14 rounded-full" />
        </motion.div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>

      {/* Photo carousel placeholder */}
      <Skeleton className="w-full h-40 rounded-xl mb-3" />

      {/* Tribes/Music tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 w-9 rounded-xl" />
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
