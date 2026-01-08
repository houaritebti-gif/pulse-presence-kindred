import { Skeleton } from "@/components/ui/skeleton";

const QuedadaCardSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="bg-card rounded-2xl p-5 sm:p-6 opacity-0 animate-fade-up border border-foreground/5 dark:border-transparent shadow-md shadow-foreground/10 dark:shadow-foreground/5"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Header - Creator avatar and title */}
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-5 w-36 sm:w-44 rounded-md" />
        <Skeleton className="h-3.5 w-20 sm:w-28 rounded-sm" />
      </div>
    </div>

    {/* Description lines */}
    <div className="space-y-2 mb-5">
      <Skeleton className="h-4 w-full rounded-md" />
      <Skeleton className="h-4 w-4/5 rounded-md" />
    </div>

    {/* Details row - mimics date, time, location, attendees */}
    <div className="flex flex-wrap gap-2.5 sm:gap-3 mb-5">
      <Skeleton className="h-5 w-24 sm:w-28 rounded-full" />
      <Skeleton className="h-5 w-14 sm:w-16 rounded-full" />
      <Skeleton className="h-5 w-20 sm:w-24 rounded-full" />
      <Skeleton className="h-5 w-16 sm:w-20 rounded-full" />
    </div>

    {/* Action buttons */}
    <div className="flex gap-2">
      <Skeleton className="h-9 flex-1 rounded-xl" />
      <Skeleton className="h-9 w-20 rounded-xl" />
    </div>
  </div>
);

interface QuedadasListSkeletonProps {
  count?: number;
}

export const QuedadasListSkeleton = ({ count = 3 }: QuedadasListSkeletonProps) => {
  return (
    <div className="space-y-5 sm:space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <QuedadaCardSkeleton key={index} delay={index * 120} />
      ))}
    </div>
  );
};

export default QuedadasListSkeleton;
