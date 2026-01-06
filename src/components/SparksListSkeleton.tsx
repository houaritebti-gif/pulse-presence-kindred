import { Skeleton } from "@/components/ui/skeleton";

const SparkChatItemSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="w-full bg-card rounded-2xl p-5 sm:p-6 flex items-center gap-4 sm:gap-5 opacity-0 animate-fade-up border border-border/30"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Avatar with badge */}
    <div className="relative flex-shrink-0">
      <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-full ring-2 ring-muted/50 ring-offset-2 ring-offset-card" />
      <Skeleton className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full shadow-md" />
    </div>
    
    {/* Info */}
    <div className="flex-1 min-w-0 space-y-2.5">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-24 sm:w-32 rounded-md" />
        <Skeleton className="h-3 w-10 sm:w-14 rounded-sm" />
      </div>
      <Skeleton className="h-4 w-36 sm:w-48 rounded-md" />
    </div>

    {/* Indicator */}
    <Skeleton className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
  </div>
);

interface SparksListSkeletonProps {
  count?: number;
}

export const SparksListSkeleton = ({ count = 4 }: SparksListSkeletonProps) => {
  return (
    <div className="space-y-5 sm:space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <SparkChatItemSkeleton key={index} delay={index * 100} />
      ))}
    </div>
  );
};

export default SparksListSkeleton;
