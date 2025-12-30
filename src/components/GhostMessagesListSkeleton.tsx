import { Skeleton } from "@/components/ui/skeleton";

const GhostMessageCardSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="bg-card rounded-2xl p-5 animate-fade-in border border-border/30"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-start gap-4">
      {/* Avatar placeholder */}
      <div className="relative flex-shrink-0">
        <Skeleton className="w-14 h-14 rounded-full" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name and indicator */}
        <div className="flex items-center gap-2 mb-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="w-2 h-2 rounded-full" />
        </div>
        
        {/* Vibe text */}
        <Skeleton className="h-3 w-24 mb-3" />

        {/* Message content box */}
        <div className="bg-background/50 rounded-xl p-3 mb-3">
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Time and action */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>
    </div>

    {/* Reveal hint */}
    <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-center gap-2">
      <Skeleton className="h-3 w-40" />
    </div>
  </div>
);

interface GhostMessagesListSkeletonProps {
  count?: number;
}

export const GhostMessagesListSkeleton = ({ count = 3 }: GhostMessagesListSkeletonProps) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <GhostMessageCardSkeleton key={index} delay={index * 100} />
      ))}
    </div>
  );
};

export default GhostMessagesListSkeleton;
