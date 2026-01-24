import { Skeleton } from "@/components/ui/skeleton";
import { DataLoadingProgress } from "./DataLoadingProgress";
import { User, Images, Users, Music, Shield } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

const ProfileSkeleton = () => {
  const [loadingStates, setLoadingStates] = useState({
    basic: false,
    photos: false,
    tribes: false,
    music: false,
    achievements: false
  });

  // Simulate loading progression
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    timers.push(setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, basic: true }));
    }, 400));
    
    timers.push(setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, photos: true }));
    }, 800));
    
    timers.push(setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, tribes: true }));
    }, 1100));
    
    timers.push(setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, music: true }));
    }, 1400));
    
    timers.push(setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, achievements: true }));
    }, 1700));

    return () => timers.forEach(clearTimeout);
  }, []);

  const steps = useMemo(() => [
    { 
      id: "basic", 
      label: "Datos básicos", 
      icon: User, 
      status: loadingStates.basic ? "complete" as const : "loading" as const 
    },
    { 
      id: "photos", 
      label: "Fotos", 
      icon: Images, 
      status: loadingStates.photos ? "complete" as const : loadingStates.basic ? "loading" as const : "pending" as const 
    },
    { 
      id: "tribes", 
      label: "Tribus", 
      icon: Users, 
      status: loadingStates.tribes ? "complete" as const : loadingStates.photos ? "loading" as const : "pending" as const 
    },
    { 
      id: "music", 
      label: "Estilos musicales", 
      icon: Music, 
      status: loadingStates.music ? "complete" as const : loadingStates.tribes ? "loading" as const : "pending" as const 
    },
    { 
      id: "achievements", 
      label: "Logros", 
      icon: Shield, 
      status: loadingStates.achievements ? "complete" as const : loadingStates.music ? "loading" as const : "pending" as const 
    },
  ], [loadingStates]);

  return (
    <main className="min-h-screen bg-background flex flex-col px-4 sm:px-6 py-6 sm:py-8 pb-24 relative overflow-hidden animate-fade-in">
      {/* Ambient glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-40 right-0 w-[300px] h-[300px] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Header skeleton */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-6 w-12" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-4" />
        </div>
      </div>

      {/* Multi-step progress indicator */}
      <div className="relative z-10 mb-6">
        <DataLoadingProgress 
          steps={steps}
          variant="compact"
          showPercentage={true}
        />
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full">
        {/* Title skeleton */}
        <div className="text-center mb-10">
          <Skeleton className="h-8 w-48 mx-auto mb-2" style={{ animationDelay: '50ms' }} />
          <Skeleton className="h-4 w-64 mx-auto" style={{ animationDelay: '75ms' }} />
        </div>

        {/* Avatar skeleton */}
        <div className="flex flex-col items-center mb-8">
          <Skeleton 
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full" 
            style={{ animationDelay: '100ms' }}
          />
          <Skeleton className="h-4 w-24 mt-3" style={{ animationDelay: '125ms' }} />
        </div>

        {/* Photo Gallery skeleton */}
        <div className="mb-8 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-4" style={{ animationDelay: '150ms' }} />
            <Skeleton className="h-5 w-32" style={{ animationDelay: '150ms' }} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="aspect-square rounded-xl"
                style={{ animationDelay: `${175 + i * 25}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Identity Verification skeleton */}
        <div className="mb-8 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" style={{ animationDelay: '200ms' }} />
            <div className="flex-1">
              <Skeleton className="h-5 w-40 mb-1" style={{ animationDelay: '225ms' }} />
              <Skeleton className="h-4 w-56" style={{ animationDelay: '250ms' }} />
            </div>
          </div>
        </div>

        {/* Name & City skeleton */}
        <div className="mb-8 space-y-4">
          <div>
            <Skeleton className="h-4 w-16 mb-2" style={{ animationDelay: '275ms' }} />
            <Skeleton className="h-12 w-full rounded-xl" style={{ animationDelay: '300ms' }} />
          </div>
          <div>
            <Skeleton className="h-4 w-16 mb-2" style={{ animationDelay: '325ms' }} />
            <Skeleton className="h-12 w-full rounded-xl" style={{ animationDelay: '350ms' }} />
          </div>
        </div>

        {/* Gender skeleton */}
        <div className="mb-8 p-4 rounded-2xl bg-card border border-border">
          <Skeleton className="h-5 w-24 mb-3" style={{ animationDelay: '375ms' }} />
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-9 w-24 rounded-full"
                style={{ animationDelay: `${400 + i * 25}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Birthdate skeleton */}
        <div className="mb-8 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" style={{ animationDelay: '425ms' }} />
            <Skeleton className="h-5 w-36" style={{ animationDelay: '425ms' }} />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" style={{ animationDelay: '450ms' }} />
        </div>

        {/* Gender Preferences skeleton */}
        <div className="mb-8 p-4 rounded-2xl bg-card border border-border">
          <Skeleton className="h-5 w-32 mb-3" style={{ animationDelay: '475ms' }} />
          <div className="flex flex-wrap gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-9 w-20 rounded-full"
                style={{ animationDelay: `${500 + i * 20}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Bio skeleton */}
        <div className="mb-8 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" style={{ animationDelay: '525ms' }} />
            <Skeleton className="h-5 w-20" style={{ animationDelay: '525ms' }} />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" style={{ animationDelay: '550ms' }} />
        </div>

        {/* Looking For skeleton */}
        <div className="mb-8 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" style={{ animationDelay: '575ms' }} />
            <Skeleton className="h-5 w-28" style={{ animationDelay: '575ms' }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-9 w-24 rounded-full"
                style={{ animationDelay: `${600 + i * 15}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Vibe skeleton */}
        <div className="mb-8 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" style={{ animationDelay: '625ms' }} />
            <Skeleton className="h-5 w-16" style={{ animationDelay: '625ms' }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-9 w-20 rounded-full"
                style={{ animationDelay: `${650 + i * 15}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Tribes skeleton */}
        <div className="mb-8 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" style={{ animationDelay: '675ms' }} />
            <Skeleton className="h-5 w-20" style={{ animationDelay: '675ms' }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-9 w-20 rounded-full"
                style={{ animationDelay: `${700 + i * 12}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Music skeleton */}
        <div className="mb-8 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" style={{ animationDelay: '725ms' }} />
              <Skeleton className="h-5 w-32" style={{ animationDelay: '725ms' }} />
            </div>
            <Skeleton className="h-4 w-4" style={{ animationDelay: '725ms' }} />
          </div>
        </div>

        {/* Optional Details skeleton */}
        <div className="mb-8 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" style={{ animationDelay: '750ms' }} />
            <Skeleton className="h-5 w-28" style={{ animationDelay: '750ms' }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-9 w-24 rounded-full"
                style={{ animationDelay: `${775 + i * 25}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Subscription skeleton */}
        <div className="mb-8 p-4 rounded-2xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" style={{ animationDelay: '800ms' }} />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-1" style={{ animationDelay: '825ms' }} />
              <Skeleton className="h-4 w-48" style={{ animationDelay: '850ms' }} />
            </div>
            <Skeleton className="h-8 w-16 rounded-full" style={{ animationDelay: '875ms' }} />
          </div>
        </div>

        {/* Sound & Notifications skeleton */}
        <div className="mb-8 p-4 rounded-2xl bg-card border border-border space-y-4">
          <Skeleton className="h-5 w-40 mb-2" style={{ animationDelay: '900ms' }} />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" style={{ animationDelay: `${925 + i * 25}ms` }} />
                <Skeleton className="h-4 w-32" style={{ animationDelay: `${925 + i * 25}ms` }} />
              </div>
              <Skeleton className="h-6 w-10 rounded-full" style={{ animationDelay: `${950 + i * 25}ms` }} />
            </div>
          ))}
        </div>

        {/* Privacy skeleton */}
        <div className="mb-8 p-4 rounded-2xl bg-card border border-border">
          <Skeleton className="h-5 w-24 mb-3" style={{ animationDelay: '975ms' }} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" style={{ animationDelay: '1000ms' }} />
              <Skeleton className="h-4 w-40" style={{ animationDelay: '1000ms' }} />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" style={{ animationDelay: '1025ms' }} />
          </div>
        </div>

        {/* CTA button skeleton */}
        <div className="mt-8">
          <Skeleton className="w-full h-14 rounded-2xl" style={{ animationDelay: '1050ms' }} />
        </div>
      </div>
    </main>
  );
};

export default ProfileSkeleton;
