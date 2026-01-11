import { memo, useRef, useState, useEffect } from "react";
import { Radio, ChevronDown } from "lucide-react";
import FullScreenPresenceCard from "./FullScreenPresenceCard";
import { PresenceWithProfile } from "@/hooks/usePresence";
import { useActiveBoostedProfiles } from "@/hooks/useKikiNow";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CompatibilityBreakdown {
  tribes: number;
  music: number;
  lookingFor: number;
  interests: number;
}

interface FullScreenPresenceListProps {
  profiles: PresenceWithProfile[];
  connectedProfileIds: Set<string>;
  photosMap: Record<string, { photo_url: string }[]> | undefined;
  getCompatibility: (presence: PresenceWithProfile) => number;
  getCompatibilityBreakdown: (presence: PresenceWithProfile) => CompatibilityBreakdown;
}

const isProfileActive = (presence: PresenceWithProfile) => {
  if (!presence.last_pulse || !presence.is_present) return false;
  const pulseTime = new Date(presence.last_pulse).getTime();
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return pulseTime >= fiveMinutesAgo;
};

export const FullScreenPresenceList = memo(({
  profiles,
  connectedProfileIds,
  photosMap,
  getCompatibility,
  getCompatibilityBreakdown,
}: FullScreenPresenceListProps) => {
  const { data: activeBoostedData } = useActiveBoostedProfiles();
  const { canSeeRealtimePresence } = useSubscription();
  const boostedIds = activeBoostedData?.boostedIds || new Set<string>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Separate active and inactive profiles
  const activeProfiles = canSeeRealtimePresence 
    ? profiles.filter(p => isProfileActive(p))
    : [];
  const inactiveProfiles = canSeeRealtimePresence 
    ? profiles.filter(p => !isProfileActive(p))
    : profiles;

  const allProfiles = [...activeProfiles, ...inactiveProfiles];

  // Track scroll position to update current index
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const cardHeight = container.clientHeight * 0.85; // Approximate card height
      const newIndex = Math.round(scrollTop / cardHeight);
      setCurrentIndex(Math.min(newIndex, allProfiles.length - 1));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [allProfiles.length]);

  if (profiles.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="h-[calc(100vh-200px)] overflow-y-auto snap-y snap-mandatory scrollbar-hide scroll-smooth"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {/* Profile counter */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md shadow-lg border border-border">
          <span className="text-sm font-medium text-foreground">
            {currentIndex + 1} / {allProfiles.length}
          </span>
        </div>
      </div>

      {/* Active profiles section header */}
      {canSeeRealtimePresence && activeProfiles.length > 0 && (
        <div className="snap-start flex items-center justify-center py-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 backdrop-blur-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold text-green-500">
              {activeProfiles.length} activos ahora
            </span>
          </div>
        </div>
      )}

      {/* Profile cards */}
      {allProfiles.map((presence, index) => {
        const profileId = presence.profile?.id;
        const isBoosted = profileId && boostedIds.has(profileId);
        const photos = profileId ? photosMap?.[profileId]?.map(p => p.photo_url) || [] : [];
        const isInActiveSection = index < activeProfiles.length;

        // Show section divider before inactive profiles
        const showInactiveDivider = canSeeRealtimePresence && 
          activeProfiles.length > 0 && 
          index === activeProfiles.length;

        return (
          <div key={presence.id}>
            {showInactiveDivider && (
              <div className="snap-start flex items-center justify-center py-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 backdrop-blur-sm">
                  <Radio className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Vistos recientemente ({inactiveProfiles.length})
                  </span>
                </div>
              </div>
            )}
            
            <div 
              className="snap-start flex items-center justify-center px-4 py-3"
              style={{ minHeight: 'calc(100vh - 220px)' }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="w-full max-w-md"
              >
                <FullScreenPresenceCard
                  presence={{
                    id: presence.id,
                    profile: presence.profile ? {
                      id: presence.profile.id,
                      name: presence.profile.name,
                      avatar_url: presence.profile.avatar_url,
                      city: presence.profile.city,
                      looking_for: presence.profile.looking_for,
                      gender: presence.profile.gender,
                      birthdate: presence.profile.birthdate,
                    } : null,
                    tribes: presence.tribes,
                    musicStyles: presence.musicStyles,
                    last_pulse: presence.last_pulse,
                    is_present: presence.is_present,
                  }}
                  isBoosted={!!isBoosted}
                  canSeeRealtimePresence={canSeeRealtimePresence}
                  compatibility={getCompatibility(presence)}
                  compatibilityBreakdown={getCompatibilityBreakdown(presence)}
                  hasVisibilityBoost={presence.hasVisibilityBoost}
                  photos={photos}
                />
              </motion.div>
            </div>
          </div>
        );
      })}

      {/* End indicator */}
      <div className="snap-start flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Has visto todos los perfiles
          </p>
          <p className="text-xs text-muted-foreground/60">
            Vuelve más tarde para ver más
          </p>
        </div>
      </div>
    </div>
  );
});

FullScreenPresenceList.displayName = "FullScreenPresenceList";

export default FullScreenPresenceList;
