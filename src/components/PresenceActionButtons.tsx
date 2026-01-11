import { useState, useEffect, useCallback, useRef } from "react";
import { X, Flame, Sparkles, Undo2, RotateCcw, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Long press threshold in ms
const LONG_PRESS_DURATION = 600;

interface PresenceActionButtonsProps {
  onPass: () => void;
  onChispa: () => void;
  onSuperChispa: () => void;
  onRewind?: () => void;
  onUndo?: () => void;
  showUndo?: boolean;
  canRewind?: boolean;
  rewindRemaining?: number;
  isRewindUnlimited?: boolean;
  availableSuperChispas?: number;
  disabled?: boolean;
  showKeyboardHints?: boolean;
}

const ActionButton = ({
  onClick,
  icon,
  label,
  variant = "default",
  size = "md",
  badge,
  badgeVariant = "default",
  disabled,
  keyboardHint,
  showKeyboardHint = false,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: "default" | "primary" | "super" | "secondary" | "muted" | "rewind";
  size?: "sm" | "md" | "lg";
  badge?: number;
  badgeVariant?: "default" | "premium";
  disabled?: boolean;
  keyboardHint?: string;
  showKeyboardHint?: boolean;
}) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-14 h-14",
    lg: "w-16 h-16",
  };

  const iconSizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
  };

  const variantClasses = {
    default: "bg-background border-2 border-border hover:border-foreground/30 text-foreground shadow-lg",
    primary: "bg-primary border-2 border-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30",
    super: "bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 border-2 border-purple-400 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/40",
    secondary: "bg-accent border-2 border-accent hover:bg-accent/80 text-accent-foreground shadow-lg",
    muted: "bg-muted/80 border-2 border-muted-foreground/20 hover:border-muted-foreground/40 text-muted-foreground shadow-md",
    rewind: "bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-amber-300 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg shadow-amber-500/40",
  };

  const badgeClasses = {
    default: "bg-gradient-to-r from-purple-500 to-blue-500",
    premium: "bg-gradient-to-r from-amber-400 to-orange-500",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              if (disabled) return;
              triggerHaptic("medium");
              onClick();
            }}
            disabled={disabled}
            className={cn(
              "relative rounded-full flex items-center justify-center transition-all duration-200",
              sizeClasses[size],
              variantClasses[variant],
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={iconSizeClasses[size]}>{icon}</div>
            {badge !== undefined && badge > 0 && (
              <span className={cn(
                "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white",
                badgeClasses[badgeVariant]
              )}>
                {badge > 9 ? "9+" : badge}
              </span>
            )}
            {/* Keyboard hint badge */}
            {showKeyboardHint && keyboardHint && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-background/90 border border-border text-[9px] font-mono font-bold text-muted-foreground shadow-sm">
                {keyboardHint}
              </span>
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}{showKeyboardHint && keyboardHint && <span className="ml-2 opacity-60">({keyboardHint})</span>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ChispaButton with long-press for Super Chispa
const ChispaButton = ({
  onChispa,
  onSuperChispa,
  availableSuperChispas = 0,
  disabled,
  showKeyboardHint = false,
}: {
  onChispa: () => void;
  onSuperChispa: () => void;
  availableSuperChispas?: number;
  disabled?: boolean;
  showKeyboardHint?: boolean;
}) => {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasLongPressRef = useRef(false);

  const lastHapticThreshold = useRef(0);

  const startLongPress = useCallback(() => {
    wasLongPressRef.current = false;
    lastHapticThreshold.current = 0;
    setIsLongPressing(true);
    setLongPressProgress(0);
    triggerHaptic("light");

    // Progress animation with progressive haptic feedback
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / LONG_PRESS_DURATION, 1);
      setLongPressProgress(progress);
      
      // Progressive haptic feedback at 25%, 50%, 75% thresholds
      if (progress >= 0.25 && lastHapticThreshold.current < 0.25) {
        lastHapticThreshold.current = 0.25;
        triggerHaptic("light");
      } else if (progress >= 0.50 && lastHapticThreshold.current < 0.50) {
        lastHapticThreshold.current = 0.50;
        triggerHaptic("medium");
      } else if (progress >= 0.75 && lastHapticThreshold.current < 0.75) {
        lastHapticThreshold.current = 0.75;
        triggerHaptic("heavy");
      }
      
      if (progress >= 1) {
        clearInterval(progressIntervalRef.current!);
      }
    }, 16);

    // Long press detection
    longPressTimeoutRef.current = setTimeout(() => {
      wasLongPressRef.current = true;
      setIsLongPressing(false);
      setLongPressProgress(0);
      lastHapticThreshold.current = 0;
      triggerHaptic("success");
      onSuperChispa();
    }, LONG_PRESS_DURATION);
  }, [onSuperChispa]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsLongPressing(false);
    setLongPressProgress(0);
  }, []);

  const handleRelease = useCallback(() => {
    const wasLongPress = wasLongPressRef.current;
    cancelLongPress();
    
    // If it was a short tap (not a long press), trigger Chispa
    if (!wasLongPress && !disabled) {
      triggerHaptic("medium");
      onChispa();
    }
  }, [cancelLongPress, onChispa, disabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onMouseDown={!disabled ? startLongPress : undefined}
            onMouseUp={handleRelease}
            onMouseLeave={cancelLongPress}
            onTouchStart={!disabled ? startLongPress : undefined}
            onTouchEnd={handleRelease}
            onTouchCancel={cancelLongPress}
            disabled={disabled}
            className={cn(
              "relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200",
              "shadow-lg select-none",
              isLongPressing 
                ? "bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 border-2 border-purple-400 shadow-purple-500/40"
                : "bg-primary border-2 border-primary hover:bg-primary/90 shadow-primary/30",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Progress ring for long press */}
            {isLongPressing && (
              <svg 
                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                viewBox="0 0 64 64"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="30"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="3"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="30"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${longPressProgress * 188.5} 188.5`}
                />
              </svg>
            )}
            
            {/* Icon transitions from Sparkles to Flame during long press */}
            <motion.div 
              className="w-7 h-7 text-primary-foreground"
              animate={{ 
                scale: isLongPressing ? [1, 1.2, 1] : 1,
                rotate: isLongPressing ? [0, 5, -5, 0] : 0
              }}
              transition={{ duration: 0.3, repeat: isLongPressing ? Infinity : 0 }}
            >
              {isLongPressing ? (
                <Flame className="w-full h-full text-white" />
              ) : (
                <Sparkles className="w-full h-full" />
              )}
            </motion.div>
            
            {/* Super Chispa badge when available */}
            {availableSuperChispas > 0 && !isLongPressing && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-purple-500 to-blue-500">
                {availableSuperChispas > 9 ? "9+" : availableSuperChispas}
              </span>
            )}
            
            {/* Keyboard hint badge */}
            {showKeyboardHint && !isLongPressing && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-background/90 border border-border text-[9px] font-mono font-bold text-muted-foreground shadow-sm">
                → / ↑
              </span>
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="text-center">
            <p>Toca = Chispa ✨</p>
            <p className="text-muted-foreground">Mantén = Super Chispa 🔥</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const INACTIVITY_TIMEOUT = 3000; // 3 seconds

export const PresenceActionButtons = ({
  onPass,
  onChispa,
  onSuperChispa,
  onRewind,
  onUndo,
  showUndo = false,
  canRewind = false,
  rewindRemaining,
  isRewindUnlimited = false,
  availableSuperChispas = 0,
  disabled = false,
  showKeyboardHints = false,
}: PresenceActionButtonsProps) => {
  const isMobile = useIsMobile();
  const shouldShowHints = showKeyboardHints && !isMobile;
  
  // Hybrid intelligent: on mobile, buttons appear on touch and fade after inactivity
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showButtons = useCallback(() => {
    setIsVisible(true);
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Set new timeout to hide after inactivity (mobile only)
    if (isMobile) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, INACTIVITY_TIMEOUT);
    }
  }, [isMobile]);

  // On desktop, always visible; cleanup timeout on unmount
  useEffect(() => {
    if (!isMobile) {
      setIsVisible(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isMobile]);

  // Touch handler for mobile - show buttons on any touch
  useEffect(() => {
    if (!isMobile) return;

    const handleTouch = () => {
      showButtons();
    };

    // Listen for touch events on the whole screen
    document.addEventListener("touchstart", handleTouch, { passive: true });
    document.addEventListener("touchmove", handleTouch, { passive: true });
    
    // Also show initially
    showButtons();

    return () => {
      document.removeEventListener("touchstart", handleTouch);
      document.removeEventListener("touchmove", handleTouch);
    };
  }, [isMobile, showButtons]);

  // Keep buttons visible when showUndo changes (undo action)
  useEffect(() => {
    if (showUndo) {
      showButtons();
    }
  }, [showUndo, showButtons]);

  // Determine rewind badge display
  const rewindBadge = isRewindUnlimited ? undefined : rewindRemaining;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: isVisible ? 1 : 0, 
          y: isVisible ? 0 : 20,
          pointerEvents: isVisible ? "auto" : "none"
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "flex items-center justify-center gap-3 py-4",
          // Semi-transparent background on mobile for better visibility
          isMobile && "bg-background/70 backdrop-blur-sm rounded-full px-4 mx-auto max-w-fit"
        )}
      >
        {/* Undo button (smaller, appears when available) */}
        {showUndo && onUndo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
          >
            <ActionButton
              onClick={onUndo}
              icon={<Undo2 className="w-full h-full" />}
              label="Deshacer"
              variant="muted"
              size="sm"
              disabled={disabled}
              keyboardHint="Z"
              showKeyboardHint={shouldShowHints}
            />
          </motion.div>
        )}

        {/* Pass button - X */}
        <ActionButton
          onClick={onPass}
          icon={<X className="w-full h-full" strokeWidth={2.5} />}
          label="Pasar 👋"
          variant="muted"
          size="md"
          disabled={disabled}
          keyboardHint="←"
          showKeyboardHint={shouldShowHints}
        />

        {/* Chispa button with long-press for Super Chispa */}
        <ChispaButton
          onChispa={onChispa}
          onSuperChispa={onSuperChispa}
          availableSuperChispas={availableSuperChispas}
          disabled={disabled}
          showKeyboardHint={shouldShowHints}
        />

        {/* Rewind button - RotateCcw (replaces View Profile) */}
        {onRewind && (
          <ActionButton
            onClick={onRewind}
            icon={
              <div className="relative w-full h-full">
                <RotateCcw className="w-full h-full" />
                {isRewindUnlimited && (
                  <Crown className="absolute -top-1 -right-1 w-3 h-3 text-amber-300" />
                )}
              </div>
            }
            label={isRewindUnlimited ? "Rebobinar ∞" : `Rebobinar (${rewindRemaining ?? 0}/semana)`}
            variant="rewind"
            size="md"
            badge={rewindBadge}
            badgeVariant="premium"
            disabled={disabled || !canRewind}
            keyboardHint="R"
            showKeyboardHint={shouldShowHints}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default PresenceActionButtons;
