import { Skeleton } from "@/components/ui/skeleton";

const PresenceCardSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="bg-card rounded-3xl p-6 border border-border/50 animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Header with avatar and name */}
    <div className="flex items-start gap-4 mb-4">
      <Skeleton className="w-16 h-16 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>

    {/* Photo carousel placeholder */}
    <Skeleton className="w-full h-48 rounded-2xl mb-4" />

    {/* Tribes/Music tags */}
    <div className="flex flex-wrap gap-2 mb-4">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>

    {/* Action buttons */}
    <div className="flex gap-3">
      <Skeleton className="h-10 flex-1 rounded-xl" />
      <Skeleton className="h-10 w-10 rounded-xl" />
    </div>
  </div>
);

interface PresenceListSkeletonProps {
  count?: number;
}

export const PresenceListSkeleton = ({ count = 3 }: PresenceListSkeletonProps) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <PresenceCardSkeleton key={index} delay={index * 100} />
      ))}
    </div>
  );
};

export default PresenceListSkeleton;
