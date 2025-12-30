import { Skeleton } from "@/components/ui/skeleton";

const SparkChatItemSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="w-full bg-card rounded-2xl p-5 flex items-center gap-4 animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Avatar */}
    <div className="relative">
      <Skeleton className="w-14 h-14 rounded-full" />
      <Skeleton className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full" />
    </div>
    
    {/* Info */}
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-4 w-40" />
    </div>

    {/* Indicator */}
    <Skeleton className="w-2.5 h-2.5 rounded-full" />
  </div>
);

interface SparksListSkeletonProps {
  count?: number;
}

export const SparksListSkeleton = ({ count = 4 }: SparksListSkeletonProps) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <SparkChatItemSkeleton key={index} delay={index * 100} />
      ))}
    </div>
  );
};

export default SparksListSkeleton;
