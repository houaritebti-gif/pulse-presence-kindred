import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface FullScreenPresenceSkeletonProps {
  /** Show stacked cards behind for visual depth */
  showStackedCards?: boolean;
}

const FullScreenPresenceSkeletonComponent = ({ showStackedCards = true }: FullScreenPresenceSkeletonProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative w-full max-w-md mx-auto px-4">
      {/* Stacked cards behind for depth effect */}
      {showStackedCards && !prefersReducedMotion && (
        <>
          {/* Third card (back) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 0.4, scale: 0.92 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="absolute inset-x-4 top-0 aspect-[3/4] max-h-[calc(100vh-180px)] min-h-[500px] rounded-3xl bg-gradient-to-br from-muted to-muted/50 -z-20"
            style={{ transform: 'translateY(16px)' }}
          />
          {/* Second card (middle) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.6, scale: 0.96 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="absolute inset-x-4 top-0 aspect-[3/4] max-h-[calc(100vh-180px)] min-h-[500px] rounded-3xl bg-gradient-to-br from-muted to-muted/70 -z-10"
            style={{ transform: 'translateY(8px)' }}
          />
        </>
      )}

      {/* Main skeleton card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.1 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative w-full aspect-[3/4] max-h-[calc(100vh-180px)] min-h-[500px] rounded-3xl overflow-hidden",
          "shadow-2xl shadow-foreground/20 bg-gradient-to-br from-card to-muted/50",
          "border border-foreground/5"
        )}
      >
        {/* Premium shimmer background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        {/* Animated shimmer overlay */}
        {!prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              repeatDelay: 0.5,
              ease: "easeInOut"
            }}
          />
        )}

        {/* Top badges - Compatibility */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          {/* Compatibility badge */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Skeleton className="h-8 w-16 rounded-full bg-foreground/10" />
          </motion.div>
          {/* Boost/Activity indicator */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Skeleton className="h-8 w-8 rounded-full bg-foreground/10" />
          </motion.div>
        </div>

        {/* Photo dots indicator (carousel) */}
        <motion.div 
          className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white/60" />
          <div className="w-2 h-2 rounded-full bg-white/30" />
          <div className="w-2 h-2 rounded-full bg-white/30" />
        </motion.div>

        {/* Content overlay at bottom - gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-background via-background/90 to-transparent" />

        {/* Profile info section */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 p-6 space-y-4 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Activity status */}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40 animate-pulse" />
            <Skeleton className="h-4 w-24 bg-foreground/10" />
          </div>

          {/* Name and age */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-40 bg-foreground/15" />
            <Skeleton className="h-6 w-14 rounded-full bg-foreground/10" />
          </div>

          {/* Location */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />
            <Skeleton className="h-4 w-28 bg-foreground/10" />
          </div>

          {/* Vibe chip */}
          <Skeleton className="h-8 w-36 rounded-full bg-primary/10" />

          {/* Tribes/Music tags */}
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-20 rounded-full bg-foreground/10" />
            <Skeleton className="h-7 w-24 rounded-full bg-primary/10" />
            <Skeleton className="h-7 w-18 rounded-full bg-foreground/10" />
            <Skeleton className="h-7 w-16 rounded-full bg-primary/10" />
          </div>

          {/* Looking for section */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-foreground/5">
            <Skeleton className="h-6 w-28 rounded-full bg-foreground/8" />
            <Skeleton className="h-6 w-22 rounded-full bg-foreground/8" />
          </div>
        </motion.div>

        {/* Swipe hint indicators (subtle) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left indicator */}
          <motion.div 
            className="absolute left-6 top-1/2 -translate-y-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            transition={{ delay: 0.5 }}
          >
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-foreground/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-foreground/10" />
            </div>
          </motion.div>
          {/* Right indicator */}
          <motion.div 
            className="absolute right-6 top-1/2 -translate-y-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            transition={{ delay: 0.5 }}
          >
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-primary/20" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Action buttons skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.1 : 0.3, delay: 0.25 }}
        className="flex items-center justify-center gap-4 py-5 mt-4"
      >
        <Skeleton className="w-14 h-14 rounded-full bg-foreground/10" />
        <Skeleton className="w-18 h-18 rounded-full bg-primary/15 scale-110" />
        <Skeleton className="w-14 h-14 rounded-full bg-foreground/10" />
      </motion.div>

      {/* Counter skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.35 }}
        className="flex justify-center mt-2"
      >
        <Skeleton className="h-5 w-28 rounded-md bg-foreground/8" />
      </motion.div>
    </div>
  );
};

const FullScreenPresenceSkeleton = memo(FullScreenPresenceSkeletonComponent);
export default FullScreenPresenceSkeleton;