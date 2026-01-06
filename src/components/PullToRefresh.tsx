import { ReactNode } from "react";
import { Loader2, ArrowDown, Sparkles } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  accentColor?: "primary" | "accent";
}

export const PullToRefresh = ({ 
  onRefresh, 
  children, 
  className,
  accentColor = "primary" 
}: PullToRefreshProps) => {
  const { pullDistance, isRefreshing, handlers, shouldTrigger } = usePullToRefresh({
    onRefresh,
    threshold: 60,
    maxPull: 100,
  });

  const indicatorOpacity = Math.min(pullDistance / 40, 1);
  const indicatorScale = 0.6 + (Math.min(pullDistance / 60, 1) * 0.4);
  const rotation = shouldTrigger ? 180 : (pullDistance / 60) * 180;
  const glowIntensity = shouldTrigger ? 1 : Math.min(pullDistance / 60, 0.5);

  const colorClasses = accentColor === "accent" 
    ? "bg-accent/20 text-accent" 
    : "bg-primary/20 text-primary";
  
  const glowColor = accentColor === "accent" 
    ? "shadow-accent/40" 
    : "shadow-primary/40";

  return (
    <div 
      className={cn("relative overflow-hidden", className)}
      {...handlers}
    >
      {/* Pull indicator */}
      <div 
        className="absolute left-1/2 z-50 pointer-events-none"
        style={{
          top: Math.max(pullDistance - 48, -48),
          opacity: indicatorOpacity,
          transform: `translateX(-50%) scale(${indicatorScale})`,
          transition: isRefreshing ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        <div className={cn(
          "relative w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200",
          colorClasses,
          shouldTrigger && "scale-110",
          isRefreshing && `shadow-lg ${glowColor}`
        )}
        style={{
          boxShadow: isRefreshing 
            ? `0 0 20px 4px hsl(var(--${accentColor}) / ${glowIntensity})`
            : `0 0 ${glowIntensity * 20}px ${glowIntensity * 4}px hsl(var(--${accentColor}) / ${glowIntensity * 0.5})`,
        }}
        >
          {/* Animated ring */}
          {(shouldTrigger || isRefreshing) && (
            <div 
              className={cn(
                "absolute inset-0 rounded-full border-2 animate-ping",
                accentColor === "accent" ? "border-accent/40" : "border-primary/40"
              )}
              style={{ animationDuration: '1s' }}
            />
          )}
          
          {isRefreshing ? (
            <div className="relative">
              <Loader2 className={cn(
                "w-5 h-5 animate-spin",
                accentColor === "accent" ? "text-accent" : "text-primary"
              )} />
              <Sparkles className={cn(
                "absolute -top-1 -right-1 w-3 h-3 animate-pulse-soft",
                accentColor === "accent" ? "text-accent/60" : "text-primary/60"
              )} />
            </div>
          ) : (
            <ArrowDown 
              className={cn(
                "w-5 h-5 transition-transform duration-200",
                accentColor === "accent" ? "text-accent" : "text-primary"
              )}
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          )}
        </div>
        
        {/* Text hint */}
        {pullDistance > 20 && !isRefreshing && (
          <div 
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap"
            style={{ opacity: indicatorOpacity }}
          >
            <span className={cn(
              "text-xs font-medium",
              accentColor === "accent" ? "text-accent/80" : "text-primary/80"
            )}
            style={{ fontFamily: 'Arial, sans-serif' }}
            >
              {shouldTrigger ? "Suelta para actualizar" : "Tira para actualizar"}
            </span>
          </div>
        )}
      </div>

      {/* Content with pull offset */}
      <div 
        style={{
          transform: `translateY(${isRefreshing ? 50 : pullDistance}px)`,
          transition: isRefreshing ? 'transform 0.3s ease-out' : 'transform 0.1s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};
