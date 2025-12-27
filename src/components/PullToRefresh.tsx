import { ReactNode } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export const PullToRefresh = ({ onRefresh, children, className }: PullToRefreshProps) => {
  const { pullDistance, isRefreshing, handlers, shouldTrigger } = usePullToRefresh({
    onRefresh,
    threshold: 60,
    maxPull: 100,
  });

  const indicatorOpacity = Math.min(pullDistance / 60, 1);
  const indicatorScale = 0.5 + (indicatorOpacity * 0.5);
  const rotation = shouldTrigger ? 180 : 0;

  return (
    <div 
      className={cn("relative", className)}
      {...handlers}
    >
      {/* Pull indicator */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-150"
        style={{
          top: pullDistance - 40,
          opacity: indicatorOpacity,
          transform: `translateX(-50%) scale(${indicatorScale})`,
        }}
      >
        <div className={cn(
          "w-10 h-10 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center",
          shouldTrigger && "bg-primary/30"
        )}>
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <ArrowDown 
              className={cn(
                "w-5 h-5 text-primary transition-transform duration-200",
              )}
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          )}
        </div>
      </div>

      {/* Content with pull offset */}
      <div 
        className="transition-transform duration-150"
        style={{
          transform: `translateY(${isRefreshing ? 40 : pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
