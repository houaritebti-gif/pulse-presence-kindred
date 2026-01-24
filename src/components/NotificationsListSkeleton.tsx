import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const NotificationItemSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border/30 opacity-0 animate-fade-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Icon placeholder */}
    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
    
    {/* Content */}
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-3/4" />
    </div>
    
    {/* Unread indicator */}
    <Skeleton className="w-2 h-2 rounded-full flex-shrink-0 mt-2" />
  </div>
);

interface NotificationsListSkeletonProps {
  count?: number;
}

export const NotificationsListSkeleton = memo(({ count = 5 }: NotificationsListSkeletonProps) => {
  return (
    <div className="space-y-3">
      {/* Header actions skeleton */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      
      {/* Notification items */}
      {Array.from({ length: count }).map((_, index) => (
        <NotificationItemSkeleton key={index} delay={index * 80} />
      ))}
    </div>
  );
});

NotificationsListSkeleton.displayName = "NotificationsListSkeleton";

export default NotificationsListSkeleton;
