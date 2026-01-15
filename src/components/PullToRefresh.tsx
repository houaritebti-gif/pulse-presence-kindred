import { ReactNode, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowDown, Sparkles, RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  accentColor?: "primary" | "accent";
}

export const PullToRefresh = memo(({ 
  onRefresh, 
  children, 
  className,
  accentColor = "primary" 
}: PullToRefreshProps) => {
  const { pullDistance, isRefreshing, handlers, shouldTrigger, isPulling } = usePullToRefresh({
    onRefresh,
    threshold: 60,
    maxPull: 100,
  });

  const indicatorOpacity = Math.min(pullDistance / 30, 1);
  const indicatorScale = 0.5 + (Math.min(pullDistance / 60, 1) * 0.5);
  const rotation = shouldTrigger ? 180 : (pullDistance / 60) * 180;
  const glowIntensity = shouldTrigger ? 1 : Math.min(pullDistance / 60, 0.6);
  const progressPercent = Math.min((pullDistance / 60) * 100, 100);

  const colorClasses = accentColor === "accent" 
    ? "bg-accent/20 text-accent border-accent/30" 
    : "bg-primary/20 text-primary border-primary/30";

  return (
    <div 
      className={cn("relative overflow-hidden", className)}
      {...handlers}
    >
      {/* Premium Pull Indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div 
            initial={{ opacity: 0, y: -60 }}
            animate={{ 
              opacity: indicatorOpacity,
              y: Math.max(pullDistance - 56, isRefreshing ? 8 : -56),
            }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute left-1/2 z-50 pointer-events-none -translate-x-1/2"
          >
            <div className={cn(
              "relative w-14 h-14 rounded-full backdrop-blur-xl flex items-center justify-center border transition-all duration-300",
              colorClasses,
              shouldTrigger && "scale-110 border-2",
              isRefreshing && "pull-refresh-glow"
            )}
            style={{
              boxShadow: isRefreshing 
                ? `0 0 30px 8px hsl(var(--${accentColor}) / 0.4), 0 0 60px 16px hsl(var(--${accentColor}) / 0.2)`
                : `0 0 ${glowIntensity * 30}px ${glowIntensity * 6}px hsl(var(--${accentColor}) / ${glowIntensity * 0.4})`,
            }}
            >
              {/* Progress ring */}
              <svg 
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 56 56"
              >
                <circle
                  cx="28"
                  cy="28"
                  r="25"
                  fill="none"
                  stroke={`hsl(var(--${accentColor}) / 0.2)`}
                  strokeWidth="3"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="25"
                  fill="none"
                  stroke={`hsl(var(--${accentColor}))`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPercent * 1.57} 157`}
                  className="transition-all duration-100"
                />
              </svg>

              {/* Animated ring on trigger */}
              {(shouldTrigger || isRefreshing) && (
                <motion.div 
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className={cn(
                    "absolute inset-0 rounded-full border-2",
                    accentColor === "accent" ? "border-accent" : "border-primary"
                  )}
                />
              )}
              
              {/* Icon */}
              {isRefreshing ? (
                <motion.div 
                  className="relative z-10"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className={cn(
                    "w-6 h-6",
                    accentColor === "accent" ? "text-accent" : "text-primary"
                  )} />
                </motion.div>
              ) : (
                <motion.div
                  style={{ rotate: rotation }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative z-10"
                >
                  <ArrowDown className={cn(
                    "w-6 h-6",
                    accentColor === "accent" ? "text-accent" : "text-primary"
                  )} />
                </motion.div>
              )}

              {/* Sparkles on ready */}
              {shouldTrigger && !isRefreshing && (
                <>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className={cn(
                      "w-4 h-4",
                      accentColor === "accent" ? "text-accent" : "text-primary"
                    )} />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="absolute -bottom-1 -left-1"
                  >
                    <Sparkles className={cn(
                      "w-3 h-3",
                      accentColor === "accent" ? "text-accent/70" : "text-primary/70"
                    )} />
                  </motion.div>
                </>
              )}
            </div>
            
            {/* Text hint */}
            <AnimatePresence>
              {pullDistance > 15 && !isRefreshing && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap"
                >
                  <span className={cn(
                    "text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm",
                    accentColor === "accent" 
                      ? "text-accent bg-accent/10 border border-accent/20" 
                      : "text-primary bg-primary/10 border border-primary/20"
                  )}>
                    {shouldTrigger ? "✨ Suelta para actualizar" : "↓ Tira para actualizar"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Refreshing text */}
            <AnimatePresence>
              {isRefreshing && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap"
                >
                  <span className={cn(
                    "text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-2",
                    accentColor === "accent" 
                      ? "text-accent bg-accent/10 border border-accent/20" 
                      : "text-primary bg-primary/10 border border-primary/20"
                  )}>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Actualizando...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content with pull offset */}
      <motion.div 
        animate={{
          y: isRefreshing ? 60 : pullDistance,
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30,
          mass: 0.8
        }}
      >
        {children}
      </motion.div>
    </div>
  );
});
