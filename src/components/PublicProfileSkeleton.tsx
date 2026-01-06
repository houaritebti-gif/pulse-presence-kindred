import { Skeleton } from "@/components/ui/skeleton";

const PublicProfileSkeleton = () => {
  return (
    <main className="min-h-screen bg-background flex flex-col pb-24 animate-fade-in">
      {/* Header skeleton */}
      <div className="px-6 py-4 flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      <div className="flex-1 px-6 max-w-lg mx-auto w-full">
        {/* Photo gallery skeleton */}
        <div className="mb-6">
          <Skeleton className="w-full aspect-[4/5] rounded-3xl" />
          {/* Photo indicators */}
          <div className="flex justify-center gap-1.5 mt-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-1.5 w-6 rounded-full" 
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Name and badges skeleton */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          {/* Vibe */}
          <Skeleton className="h-6 w-32 mx-auto mb-2" />
          {/* Location */}
          <div className="flex items-center justify-center gap-1.5">
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Bio skeleton */}
        <div className="mb-8">
          <div className="p-4 rounded-2xl bg-card border border-border">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Looking for skeleton */}
        <div className="mb-8">
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-8 w-24 rounded-full"
                style={{ animationDelay: `${i * 75}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Compatibility skeleton */}
        <div className="mb-8 p-4 rounded-2xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>

        {/* Tribes skeleton */}
        <div className="mb-6">
          <Skeleton className="h-4 w-16 mb-3" />
          <div className="flex flex-wrap gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-8 w-20 rounded-full"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Music styles skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-8 w-24 rounded-full"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Details skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-8 w-24 rounded-full"
                style={{ animationDelay: `${i * 90}ms` }}
              />
            ))}
          </div>
        </div>

        {/* CTA button skeleton */}
        <div className="mt-auto pt-8">
          <Skeleton className="w-full h-14 rounded-2xl" />
          <Skeleton className="h-3 w-56 mx-auto mt-3" />
        </div>
      </div>
    </main>
  );
};

export default PublicProfileSkeleton;
