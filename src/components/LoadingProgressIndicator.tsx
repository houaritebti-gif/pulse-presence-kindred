import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Sparkles, Users, Heart, Zap } from "lucide-react";

interface LoadingProgressIndicatorProps {
  /** Whether loading is in progress */
  isLoading: boolean;
  /** Optional progress percentage (0-100) */
  progress?: number;
  /** Custom loading messages */
  messages?: string[];
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show icon animation */
  showIcon?: boolean;
}

const defaultMessages = [
  "Buscando perfiles...",
  "Cargando vibraciones...",
  "Preparando conexiones...",
  "Casi listo..."
];

const icons = [Users, Heart, Sparkles, Zap];

/**
 * Premium loading indicator with progress feedback
 * Optimized for mobile with smooth animations and haptic-ready design
 */
export const LoadingProgressIndicator = memo(({
  isLoading,
  progress,
  messages = defaultMessages,
  size = "md",
  showIcon = true
}: LoadingProgressIndicatorProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [messageIndex, setMessageIndex] = useState(0);
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  // Rotate through messages
  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0);
      setSimulatedProgress(0);
      return;
    }

    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(messageInterval);
  }, [isLoading, messages.length]);

  // Simulate progress if not provided
  useEffect(() => {
    if (!isLoading || progress !== undefined) return;

    const progressInterval = setInterval(() => {
      setSimulatedProgress(prev => {
        if (prev >= 90) return prev;
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 90);
      });
    }, 400);

    return () => clearInterval(progressInterval);
  }, [isLoading, progress]);

  const displayProgress = progress ?? simulatedProgress;
  const CurrentIcon = icons[messageIndex % icons.length];

  const sizeClasses = {
    sm: { container: "py-3 px-4", text: "text-xs", icon: "w-4 h-4", bar: "h-1" },
    md: { container: "py-4 px-5", text: "text-sm", icon: "w-5 h-5", bar: "h-1.5" },
    lg: { container: "py-5 px-6", text: "text-base", icon: "w-6 h-6", bar: "h-2" }
  };

  const classes = sizeClasses[size];

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ 
            duration: prefersReducedMotion ? 0.1 : 0.3,
            ease: [0.22, 1, 0.36, 1]
          }}
          className={cn(
            "w-full max-w-sm mx-auto rounded-2xl",
            "bg-gradient-to-br from-card via-card to-primary/5",
            "border border-primary/10 shadow-lg shadow-primary/10",
            classes.container
          )}
        >
          {/* Header with icon and message */}
          <div className="flex items-center gap-3 mb-3">
            {showIcon && (
              <motion.div
                animate={prefersReducedMotion ? {} : { 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={cn(
                  "flex items-center justify-center rounded-xl",
                  "bg-gradient-to-br from-primary/20 to-accent/20 p-2"
                )}
              >
                <CurrentIcon className={cn(classes.icon, "text-primary")} />
              </motion.div>
            )}
            
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.p
                  key={messageIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
                  className={cn(
                    classes.text,
                    "font-medium text-foreground truncate"
                  )}
                >
                  {messages[messageIndex]}
                </motion.p>
              </AnimatePresence>
              <p className={cn(classes.text, "text-muted-foreground/70 text-xs mt-0.5")}>
                {Math.round(displayProgress)}% completado
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className={cn(
            "relative w-full rounded-full overflow-hidden",
            "bg-muted/50",
            classes.bar
          )}>
            {/* Background shimmer */}
            {!prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            )}
            
            {/* Progress fill */}
            <motion.div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full",
                "bg-gradient-to-r from-primary via-primary to-accent"
              )}
              initial={{ width: "0%" }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ 
                duration: 0.4,
                ease: "easeOut"
              }}
            />

            {/* Glow effect on progress edge */}
            {!prefersReducedMotion && displayProgress > 5 && (
              <motion.div
                className="absolute inset-y-0 w-4 rounded-full bg-white/40 blur-sm"
                animate={{ left: `calc(${displayProgress}% - 8px)` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            )}
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-1.5 mt-3">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={cn(
                  "rounded-full transition-colors duration-300",
                  i === messageIndex 
                    ? "w-2 h-2 bg-primary" 
                    : "w-1.5 h-1.5 bg-muted-foreground/30"
                )}
                animate={!prefersReducedMotion && i === messageIndex ? {
                  scale: [1, 1.2, 1]
                } : {}}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

LoadingProgressIndicator.displayName = "LoadingProgressIndicator";

export default LoadingProgressIndicator;
