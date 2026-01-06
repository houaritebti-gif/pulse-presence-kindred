import { motion } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import LazyImage from "@/components/LazyImage";

interface SharedAvatarProps {
  profileId: string;
  avatarUrl?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  ringClassName?: string;
  showFallback?: boolean;
  onClick?: () => void;
  enableTransition?: boolean;
  useLazyLoading?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14 sm:w-16 sm:h-16",
  xl: "w-24 h-24 sm:w-28 sm:h-28",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
  xl: "text-3xl",
};

const SharedAvatar = forwardRef<HTMLDivElement, SharedAvatarProps>(
  (
    {
      profileId,
      avatarUrl,
      name,
      size = "md",
      className,
      ringClassName,
      showFallback = true,
      onClick,
      enableTransition = true,
      useLazyLoading = false,
    },
    ref
  ) => {
    const layoutId = enableTransition ? `avatar-${profileId}` : undefined;
    const initial = name?.[0]?.toUpperCase() || "?";

    const content = avatarUrl ? (
      useLazyLoading ? (
        <LazyImage
          src={avatarUrl}
          alt={name || "Avatar"}
          className="w-full h-full object-cover"
          placeholderClassName="w-full h-full"
        />
      ) : (
        <img
          src={avatarUrl}
          alt={name || "Avatar"}
          className="w-full h-full object-cover"
        />
      )
    ) : showFallback ? (
      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
        <span
          className={cn("font-display text-card-foreground", textSizeClasses[size])}
        >
          {initial}
        </span>
      </div>
    ) : null;

    const containerClasses = cn(
      "rounded-full overflow-hidden flex-shrink-0",
      sizeClasses[size],
      ringClassName,
      className
    );

    if (enableTransition) {
      return (
        <motion.div
          ref={ref}
          layoutId={layoutId}
          className={containerClasses}
          onClick={onClick}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 30,
          }}
        >
          {content}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={containerClasses} onClick={onClick}>
        {content}
      </div>
    );
  }
);

SharedAvatar.displayName = "SharedAvatar";

export default SharedAvatar;
