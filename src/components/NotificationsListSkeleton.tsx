import { Skeleton } from "@/components/ui/skeleton";
import { DataLoadingProgress } from "./DataLoadingProgress";
import { Bell, Users, Heart } from "lucide-react";
import { useMemo, useState, useEffect, memo } from "react";

const NotificationItemSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border/50 opacity-0 animate-fade-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Icon */}
    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
    
    {/* Content */}
    <div className="flex-1 min-w-0 space-y-2">
      <Skeleton className="h-4 w-3/4 rounded-md" />
      <Skeleton className="h-3.5 w-1/2 rounded-md" />
      <Skeleton className="h-3 w-20 rounded-sm" />
    </div>
    
    {/* Unread indicator */}
    <Skeleton className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
  </div>
);

interface NotificationsListSkeletonProps {
  count?: number;
  showProgress?: boolean;
}

export const NotificationsListSkeleton = memo(({ count = 5, showProgress = true }: NotificationsListSkeletonProps) => {
  const [loadingStates, setLoadingStates] = useState({
    notifications: false,
    social: false,
    activity: false
  });

  // Simulate loading progression
  useEffect(() => {
    if (!showProgress) return;
    
    const timers: NodeJS.Timeout[] = [];
    
    timers.push(setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, notifications: true }));
    }, 500));
    
    timers.push(setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, social: true }));
    }, 900));
    
    timers.push(setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, activity: true }));
    }, 1200));

    return () => timers.forEach(clearTimeout);
  }, [showProgress]);

  const steps = useMemo(() => [
    { 
      id: "notifications", 
      label: "Notificaciones", 
      icon: Bell, 
      status: loadingStates.notifications ? "complete" as const : "loading" as const 
    },
    { 
      id: "social", 
      label: "Social", 
      icon: Users, 
      status: loadingStates.social ? "complete" as const : loadingStates.notifications ? "loading" as const : "pending" as const 
    },
    { 
      id: "activity", 
      label: "Actividad", 
      icon: Heart, 
      status: loadingStates.activity ? "complete" as const : loadingStates.social ? "loading" as const : "pending" as const 
    },
  ], [loadingStates]);

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      {showProgress && (
        <DataLoadingProgress 
          steps={steps}
          variant="compact"
          showPercentage={true}
        />
      )}
      
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      
      {/* Notification items */}
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <NotificationItemSkeleton key={index} delay={index * 80} />
        ))}
      </div>
    </div>
  );
});

NotificationsListSkeleton.displayName = "NotificationsListSkeleton";

export default NotificationsListSkeleton;
