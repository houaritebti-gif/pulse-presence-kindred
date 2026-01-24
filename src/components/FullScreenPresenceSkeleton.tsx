import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { memo, useEffect, useState, useMemo } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { triggerHaptic } from "@/utils/haptics";
import { DataLoadingProgress } from "./DataLoadingProgress";
import { User, Users, Heart, Bell } from "lucide-react";

interface FullScreenPresenceSkeletonProps {
  /** Show stacked cards behind for visual depth */
  showStackedCards?: boolean;
  /** Show progress indicator */
  showProgress?: boolean;
  /** Loading message override */
  loadingMessage?: string;
  /** Loading states for multi-step progress */
  loadingStates?: {
    profile?: boolean;
    presence?: boolean;
    sparks?: boolean;
    notifications?: boolean;
  };
}

const FullScreenPresenceSkeletonComponent = ({ 
  showStackedCards = true,
  showProgress = true,
  loadingMessage,
  loadingStates
}: FullScreenPresenceSkeletonProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [simulatedStates, setSimulatedStates] = useState({
    profile: false,
    presence: false,
    sparks: false,
    notifications: false
  });

  // Simulate loading progression if no explicit states provided
  useEffect(() => {
    if (loadingStates) return;
    
    const timers: NodeJS.Timeout[] = [];
    
    timers.push(setTimeout(() => {
      setSimulatedStates(prev => ({ ...prev, profile: true }));
      triggerHaptic('light');
    }, 600));
    
    timers.push(setTimeout(() => {
      setSimulatedStates(prev => ({ ...prev, presence: true }));
      triggerHaptic('light');
    }, 1400));
    
    timers.push(setTimeout(() => {
      setSimulatedStates(prev => ({ ...prev, sparks: true }));
      triggerHaptic('light');
    }, 2000));
    
    timers.push(setTimeout(() => {
      setSimulatedStates(prev => ({ ...prev, notifications: true }));
      triggerHaptic('medium');
    }, 2500));

    return () => timers.forEach(clearTimeout);
  }, [loadingStates]);

  const states = loadingStates || simulatedStates;

  // Generate steps based on states
  const steps = useMemo(() => {
    const allComplete = states.profile && states.presence && states.sparks && states.notifications;
    
    return [
      { 
        id: "profile", 
        label: "Tu perfil", 
        icon: User, 
        status: states.profile ? "complete" as const : "loading" as const 
      },
      { 
        id: "presence", 
        label: "Perfiles activos", 
        icon: Users, 
        status: states.presence ? "complete" as const : states.profile ? "loading" as const : "pending" as const 
      },
      { 
        id: "sparks", 
        label: "Tus sparks", 
        icon: Heart, 
        status: states.sparks ? "complete" as const : states.presence ? "loading" as const : "pending" as const 
      },
      { 
        id: "notifications", 
        label: "Notificaciones", 
        icon: Bell, 
        status: states.notifications ? "complete" as const : states.sparks ? "loading" as const : "pending" as const 
      },
    ];
  }, [states]);

  return (
    <div className="relative w-full max-w-md mx-auto px-4">
      {/* Multi-step progress indicator at top */}
      {showProgress && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <DataLoadingProgress 
            steps={steps}
            variant="default"
            showPercentage={true}
            completionMessage="¡Listo para explorar!"
          />
        </motion.div>
      )}

      {/* Stacked cards behind for depth effect */}
      {showStackedCards && !prefersReducedMotion && (
        <>
          {/* Third card (back) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 0.4, scale: 0.92 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="absolute inset-x-4 top-0 aspect-[3/4] max-h-[calc(100vh-260px)] min-h-[450px] rounded-3xl bg-gradient-to-br from-muted to-muted/50 -z-20"
            style={{ transform: 'translateY(16px)', marginTop: showProgress ? '100px' : '0' }}
          />
          {/* Second card (middle) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.6, scale: 0.96 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="absolute inset-x-4 top-0 aspect-[3/4] max-h-[calc(100vh-260px)] min-h-[450px] rounded-3xl bg-gradient-to-br from-muted to-muted/70 -z-10"
            style={{ transform: 'translateY(8px)', marginTop: showProgress ? '100px' : '0' }}
          />
        </>
      )}

      {/* Main skeleton card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.1 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative w-full aspect-[3/4] max-h-[calc(100vh-260px)] min-h-[450px] rounded-3xl overflow-hidden",
          "shadow-2xl shadow-foreground/20 bg-gradient-to-br from-card to-muted/50",
          "border border-foreground/5"
        )}
      >
        {/* Premium shimmer background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        {/* Animated shimmer overlay - optimized for mobile */}
        {!prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatDelay: 0.8,
              ease: "easeInOut"
            }}
          />
        )}

        {/* Pulsing glow effect */}
        {!prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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

        {/* Photo dots indicator (carousel) - animated */}
        <motion.div 
          className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                "rounded-full",
                i === 0 ? "w-2.5 h-2.5 bg-white/60" : "w-2 h-2 bg-white/30"
              )}
              animate={!prefersReducedMotion && i === 0 ? {
                scale: [1, 1.2, 1],
                opacity: [0.6, 0.9, 0.6]
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          ))}
        </motion.div>

        {/* Content overlay at bottom - gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-background via-background/90 to-transparent" />

        {/* Profile info section */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 p-5 space-y-3 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Activity status with pulse */}
          <div className="flex items-center gap-2">
            <motion.div 
              className="w-2.5 h-2.5 rounded-full bg-green-400/60"
              animate={!prefersReducedMotion ? { 
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6]
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <Skeleton className="h-4 w-24 bg-foreground/10" />
          </div>

          {/* Name and age */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-36 bg-foreground/15" />
            <Skeleton className="h-6 w-12 rounded-full bg-foreground/10" />
          </div>

          {/* Location */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />
            <Skeleton className="h-4 w-24 bg-foreground/10" />
          </div>

          {/* Vibe chip */}
          <Skeleton className="h-7 w-32 rounded-full bg-primary/10" />

          {/* Tribes/Music tags */}
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-18 rounded-full bg-foreground/10" />
            <Skeleton className="h-6 w-22 rounded-full bg-primary/10" />
            <Skeleton className="h-6 w-16 rounded-full bg-foreground/10" />
          </div>
        </motion.div>

        {/* Swipe hint indicators (subtle, animated) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left indicator */}
          <motion.div 
            className="absolute left-4 top-1/2 -translate-y-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div 
              className="w-12 h-12 rounded-full border-2 border-dashed border-foreground/20 flex items-center justify-center"
              animate={!prefersReducedMotion ? { x: [-2, 2, -2] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-3 h-3 rounded-full bg-foreground/10" />
            </motion.div>
          </motion.div>
          {/* Right indicator */}
          <motion.div 
            className="absolute right-4 top-1/2 -translate-y-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div 
              className="w-12 h-12 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center"
              animate={!prefersReducedMotion ? { x: [2, -2, 2] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-3 h-3 rounded-full bg-primary/20" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Action buttons skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.1 : 0.3, delay: 0.25 }}
        className="flex items-center justify-center gap-4 py-4 mt-3"
      >
        <Skeleton className="w-12 h-12 rounded-full bg-foreground/10" />
        <motion.div
          animate={!prefersReducedMotion ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Skeleton className="w-16 h-16 rounded-full bg-primary/15" />
        </motion.div>
        <Skeleton className="w-12 h-12 rounded-full bg-foreground/10" />
      </motion.div>

      {/* Counter skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.35 }}
        className="flex justify-center mt-1"
      >
        <Skeleton className="h-4 w-24 rounded-md bg-foreground/8" />
      </motion.div>
    </div>
  );
};

const FullScreenPresenceSkeleton = memo(FullScreenPresenceSkeletonComponent);
export default FullScreenPresenceSkeleton;