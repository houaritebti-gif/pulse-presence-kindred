import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LeaderboardRowSkeleton = ({ 
  rank, 
  delay = 0 
}: { 
  rank: number; 
  delay?: number;
}) => {
  const isTop3 = rank <= 3;
  
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-xl opacity-0 animate-fade-up ${
        isTop3 ? 'bg-primary/5 border border-primary/10' : 'bg-card border border-border/30'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center">
        {isTop3 ? (
          <Skeleton className="w-8 h-8 rounded-full" />
        ) : (
          <Skeleton className="w-6 h-5" />
        )}
      </div>
      
      {/* Avatar */}
      <Skeleton className={`rounded-full flex-shrink-0 ${isTop3 ? 'w-12 h-12' : 'w-10 h-10'}`} />
      
      {/* Name and stats */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className={isTop3 ? "h-5 w-28" : "h-4 w-24"} />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <Skeleton className="h-3 w-20" />
      </div>
      
      {/* Score */}
      <div className="text-right">
        <Skeleton className={isTop3 ? "h-6 w-16" : "h-5 w-12"} />
      </div>
    </div>
  );
};

interface LeaderboardSkeletonProps {
  count?: number;
}

export const LeaderboardSkeleton = memo(({ count = 10 }: LeaderboardSkeletonProps) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <Skeleton className="h-7 w-40 mx-auto mb-2" />
        <Skeleton className="h-4 w-56 mx-auto" />
      </div>
      
      {/* Tab filter */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-9 flex-1 rounded-full" />
        <Skeleton className="h-9 flex-1 rounded-full" />
        <Skeleton className="h-9 flex-1 rounded-full" />
      </div>
      
      {/* Podium for top 3 */}
      <div className="flex justify-center items-end gap-2 mb-6 py-4">
        <div className="flex flex-col items-center">
          <Skeleton className="w-16 h-16 rounded-full mb-2" />
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-8 w-12 rounded-lg" />
        </div>
        <div className="flex flex-col items-center -mt-4">
          <Skeleton className="w-20 h-20 rounded-full mb-2" />
          <Skeleton className="h-5 w-20 mb-1" />
          <Skeleton className="h-10 w-14 rounded-lg" />
        </div>
        <div className="flex flex-col items-center">
          <Skeleton className="w-14 h-14 rounded-full mb-2" />
          <Skeleton className="h-4 w-14 mb-1" />
          <Skeleton className="h-7 w-10 rounded-lg" />
        </div>
      </div>
      
      {/* Leaderboard rows */}
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <LeaderboardRowSkeleton 
            key={index} 
            rank={index + 1} 
            delay={index * 50} 
          />
        ))}
      </div>
    </div>
  );
});

LeaderboardSkeleton.displayName = "LeaderboardSkeleton";

export default LeaderboardSkeleton;
