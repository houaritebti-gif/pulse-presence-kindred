import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ConnectionCardSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/30 opacity-0 animate-fade-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Avatar */}
    <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
    
    {/* Info */}
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-24" />
    </div>
    
    {/* Action button */}
    <Skeleton className="h-9 w-20 rounded-xl flex-shrink-0" />
  </div>
);

const PendingRequestSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="p-4 bg-card rounded-2xl border border-primary/20 opacity-0 animate-fade-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-start gap-4">
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-full" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

interface ConnectionsListSkeletonProps {
  showPending?: boolean;
  pendingCount?: number;
  connectionsCount?: number;
}

export const ConnectionsListSkeleton = memo(({ 
  showPending = true,
  pendingCount = 2,
  connectionsCount = 4
}: ConnectionsListSkeletonProps) => {
  return (
    <div className="space-y-6">
      {/* Tab switcher skeleton */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-9 flex-1 rounded-full" />
        <Skeleton className="h-9 flex-1 rounded-full" />
      </div>
      
      {/* Pending requests section */}
      {showPending && pendingCount > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          {Array.from({ length: pendingCount }).map((_, index) => (
            <PendingRequestSkeleton key={`pending-${index}`} delay={index * 100} />
          ))}
        </div>
      )}
      
      {/* Connections list */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28 mb-2" />
        {Array.from({ length: connectionsCount }).map((_, index) => (
          <ConnectionCardSkeleton 
            key={`connection-${index}`} 
            delay={(showPending ? pendingCount : 0) * 100 + index * 80} 
          />
        ))}
      </div>
    </div>
  );
});

ConnectionsListSkeleton.displayName = "ConnectionsListSkeleton";

export default ConnectionsListSkeleton;
