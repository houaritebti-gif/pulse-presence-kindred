import { Skeleton } from "@/components/ui/skeleton";

const QuedadaCardSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="bg-card rounded-2xl p-5 animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Header - Creator info and title */}
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>

    {/* Description */}
    <div className="space-y-2 mb-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>

    {/* Details - Date, time, location, attendees */}
    <div className="flex flex-wrap gap-3 mb-4">
      <Skeleton className="h-5 w-20 rounded" />
      <Skeleton className="h-5 w-14 rounded" />
      <Skeleton className="h-5 w-24 rounded" />
      <Skeleton className="h-5 w-16 rounded" />
    </div>

    {/* Actions */}
    <Skeleton className="h-9 w-full rounded-xl" />
  </div>
);

interface QuedadasListSkeletonProps {
  count?: number;
}

export const QuedadasListSkeleton = ({ count = 3 }: QuedadasListSkeletonProps) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <QuedadaCardSkeleton key={index} delay={index * 100} />
      ))}
    </div>
  );
};

export default QuedadasListSkeleton;
