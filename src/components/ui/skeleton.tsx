import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use circular skeleton for avatars */
  variant?: "default" | "circular";
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden bg-muted",
          // Shimmer effect with gradient sweep
          "before:absolute before:inset-0 before:-translate-x-full",
          "before:animate-shimmer before:bg-gradient-to-r",
          "before:from-transparent before:via-foreground/5 before:to-transparent",
          // Dark mode adjustments
          "dark:before:via-foreground/10",
          // Variant styles
          variant === "circular" ? "rounded-full" : "rounded-md",
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

export { Skeleton };
