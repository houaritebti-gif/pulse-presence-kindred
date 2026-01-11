import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FullScreenPresenceSkeletonProps {
  /** Show stacked cards behind for visual depth */
  showStackedCards?: boolean;
}

const FullScreenPresenceSkeleton = ({ showStackedCards = true }: FullScreenPresenceSkeletonProps) => {
  return (
    <div className="relative w-full max-w-md mx-auto px-4">
      {/* Stacked cards behind for depth effect */}
      {showStackedCards && (
        <>
          {/* Third card (back) */}
          <div 
            className="absolute inset-x-4 top-0 aspect-[3/4] max-h-[calc(100vh-180px)] min-h-[500px] rounded-3xl bg-muted/30 -z-20"
            style={{ transform: 'scale(0.92) translateY(16px)' }}
          />
          {/* Second card (middle) */}
          <div 
            className="absolute inset-x-4 top-0 aspect-[3/4] max-h-[calc(100vh-180px)] min-h-[500px] rounded-3xl bg-muted/50 -z-10"
            style={{ transform: 'scale(0.96) translateY(8px)' }}
          />
        </>
      )}

      {/* Main skeleton card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "relative w-full aspect-[3/4] max-h-[calc(100vh-180px)] min-h-[500px] rounded-3xl overflow-hidden",
          "shadow-2xl shadow-foreground/20 bg-muted"
        )}
      >
        {/* Background shimmer - full card */}
        <Skeleton className="absolute inset-0 rounded-none" />

        {/* Top badges - Boosted & Activity */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          {/* Boost badge placeholder */}
          <Skeleton className="h-7 w-24 rounded-full" />
          {/* Activity indicator */}
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>

        {/* More menu button placeholder */}
        <div className="absolute top-4 right-4 z-10">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        {/* Photo dots indicator (carousel) */}
        <div className="absolute top-14 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="w-2 h-2 rounded-full opacity-50" />
          <Skeleton className="w-2 h-2 rounded-full opacity-50" />
        </div>

        {/* Content overlay at bottom - gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent" />

        {/* Profile info section */}
        <div className="absolute bottom-0 left-0 right-0 p-5 space-y-4 z-10">
          {/* Compatibility badge */}
          <div className="flex justify-end mb-2">
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>

          {/* Name and age */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-36 rounded-lg" />
            <Skeleton className="h-6 w-12 rounded-md" />
          </div>

          {/* Location */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>

          {/* Vibe chip */}
          <Skeleton className="h-7 w-32 rounded-full" />

          {/* Tribes/Music tags */}
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-22 rounded-full" />
          </div>

          {/* Looking for section */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>

        {/* Ghost message button placeholder */}
        <div className="absolute bottom-5 right-5 z-20">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>

        {/* Swipe indicators skeleton (4 corners) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left indicator */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">
            <Skeleton className="w-16 h-16 rounded-full" />
          </div>
          {/* Right indicator */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">
            <Skeleton className="w-16 h-16 rounded-full" />
          </div>
        </div>
      </motion.div>

      {/* Action buttons skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="flex items-center justify-center gap-3 py-4 mt-4"
      >
        <Skeleton className="w-14 h-14 rounded-full" />
        <Skeleton className="w-16 h-16 rounded-full" />
        <Skeleton className="w-14 h-14 rounded-full" />
      </motion.div>

      {/* Counter skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex justify-center mt-2"
      >
        <Skeleton className="h-5 w-32 rounded-md" />
      </motion.div>
    </div>
  );
};

export default FullScreenPresenceSkeleton;
