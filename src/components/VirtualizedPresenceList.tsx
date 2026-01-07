import { memo, useRef, useEffect, useState, useCallback, CSSProperties, ReactElement } from "react";
import { List } from "react-window";
import { Radio, Crown } from "lucide-react";
import PresenceCard from "./PresenceCard";
import AnonymousPresenceCard from "./AnonymousPresenceCard";
import { PresenceWithProfile } from "@/hooks/usePresence";
import { useActiveBoostedProfiles } from "@/hooks/useKikiNow";
import { useSubscription } from "@/hooks/useSubscription";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
interface CompatibilityBreakdown {
  tribes: number;
  music: number;
  lookingFor: number;
}

interface VirtualizedPresenceListProps {
  profiles: PresenceWithProfile[];
  connectedProfileIds: Set<string>;
  photosMap: Record<string, { photo_url: string }[]> | undefined;
  getCompatibility: (presence: PresenceWithProfile) => number;
  getCompatibilityBreakdown: (presence: PresenceWithProfile) => CompatibilityBreakdown;
}

interface RowData {
  profiles: PresenceWithProfile[];
  connectedProfileIds: Set<string>;
  photosMap: Record<string, { photo_url: string }[]> | undefined;
  getCompatibility: (presence: PresenceWithProfile) => number;
  getCompatibilityBreakdown: (presence: PresenceWithProfile) => CompatibilityBreakdown;
  boostedIds: Set<string>;
  canSeeRealtimePresence: boolean;
}

// Helper to check if profile is active (last 5 min)
const isProfileActive = (presence: PresenceWithProfile) => {
  if (!presence.last_pulse || !presence.is_present) return false;
  const pulseTime = new Date(presence.last_pulse).getTime();
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return pulseTime >= fiveMinutesAgo;
};

// Row component for virtualized list - receives index and style from List, plus our custom data
const Row = ({ 
  index, 
  style, 
  data 
}: { 
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  index: number; 
  style: CSSProperties; 
  data: RowData;
}): ReactElement => {
  const { profiles, connectedProfileIds, photosMap, getCompatibility, getCompatibilityBreakdown, boostedIds, canSeeRealtimePresence } = data;
  const presence = profiles[index];
  const profileId = presence.profile?.id;
  const isConnected = profileId && connectedProfileIds.has(profileId);
  const isBoosted = profileId && boostedIds.has(profileId);

  return (
    <div style={{ ...style, paddingBottom: 32, paddingTop: 8 }}>
      {isConnected ? (
        <PresenceCard
          key={presence.id}
          presence={{
            ...presence,
            last_pulse: presence.last_pulse,
            is_present: presence.is_present,
          }}
          compatibility={getCompatibility(presence)}
          compatibilityBreakdown={getCompatibilityBreakdown(presence)}
          animationDelay={0}
          photos={profileId 
            ? photosMap?.[profileId]?.map(p => p.photo_url) || []
            : []
          }
          isBoosted={!!isBoosted}
          canSeeRealtimePresence={canSeeRealtimePresence}
        />
      ) : (
        <AnonymousPresenceCard
          key={presence.id}
          presence={{
            id: presence.id,
            profile: presence.profile ? {
              id: presence.profile.id,
              name: presence.profile.name,
              avatar_url: presence.profile.avatar_url,
              city: presence.profile.city,
              looking_for: presence.profile.looking_for,
            } : null,
            tribes: presence.tribes,
            musicStyles: presence.musicStyles,
            last_pulse: presence.last_pulse,
            is_present: presence.is_present,
          }}
          animationDelay={0}
          isBoosted={!!isBoosted}
          canSeeRealtimePresence={canSeeRealtimePresence}
          compatibility={getCompatibility(presence)}
          compatibilityBreakdown={getCompatibilityBreakdown(presence)}
        />
      )}
    </div>
  );
};

const ITEM_HEIGHT = 340; // Fixed card height + gap for consistent spacing (compact mobile)

export const VirtualizedPresenceList = memo(({
  profiles,
  connectedProfileIds,
  photosMap,
  getCompatibility,
  getCompatibilityBreakdown,
}: VirtualizedPresenceListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(600);
  const { data: activeBoostedData } = useActiveBoostedProfiles();
  const { canSeeRealtimePresence } = useSubscription();
  const boostedIds = activeBoostedData?.boostedIds || new Set<string>();

  // Calculate available height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Leave some space for footer
        const availableHeight = window.innerHeight - rect.top - 100;
        setListHeight(Math.max(400, availableHeight));
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Separate active and inactive profiles for visual separator (only for paying users)
  const activeProfiles = canSeeRealtimePresence 
    ? profiles.filter(p => isProfileActive(p))
    : [];
  const inactiveProfiles = canSeeRealtimePresence 
    ? profiles.filter(p => !isProfileActive(p))
    : profiles;

  const rowData: RowData = {
    profiles,
    connectedProfileIds,
    photosMap,
    getCompatibility,
    getCompatibilityBreakdown,
    boostedIds,
    canSeeRealtimePresence,
  };

  // Keyboard navigation for non-virtualized list
  const allProfilesForNav = canSeeRealtimePresence 
    ? [...activeProfiles, ...inactiveProfiles]
    : profiles;

  const { getContainerProps, getItemProps } = useListKeyboardNavigation({
    itemCount: allProfilesForNav.length,
  });

  // For small lists or when showing separator, don't virtualize
  if (profiles.length <= 5 || canSeeRealtimePresence) {
    return (
      <div 
        {...getContainerProps()}
        aria-label="Lista de perfiles presentes"
        className="space-y-5 sm:space-y-8 pb-8"
      >
        {/* Active profiles section (only for paying users) */}
        {canSeeRealtimePresence && activeProfiles.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
            <div className="flex items-center gap-2 sm:gap-3 py-2 sm:py-3 transition-all duration-300">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50" />
              <span className="font-display text-sm sm:text-base font-bold text-foreground">
                Activos ahora
              </span>
              <span className="text-xs sm:text-sm font-body text-green-500 font-semibold">
                ({activeProfiles.length})
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-green-500/40 to-transparent animate-[fade-in_0.5s_ease-out]" />
            </div>
            <div className="space-y-5 sm:space-y-8 mt-3">
              {activeProfiles.map((presence, index) => {
                const profileId = presence.profile?.id;
                const isConnected = profileId && connectedProfileIds.has(profileId);
                const isBoosted = profileId && boostedIds.has(profileId);
                
                return (
                  <div 
                    key={presence.id}
                    {...getItemProps(index)}
                    className="opacity-0 animate-stagger-fade-up transition-all duration-300"
                    style={{ animationDelay: `${(index + 1) * 60}ms` }}
                  >
                    {isConnected ? (
                      <PresenceCard
                        presence={{
                          ...presence,
                          last_pulse: presence.last_pulse,
                          is_present: presence.is_present,
                        }}
                        compatibility={getCompatibility(presence)}
                        compatibilityBreakdown={getCompatibilityBreakdown(presence)}
                        animationDelay={0}
                        photos={profileId 
                          ? photosMap?.[profileId]?.map(p => p.photo_url) || []
                          : []
                        }
                        isBoosted={!!isBoosted}
                        canSeeRealtimePresence={canSeeRealtimePresence}
                      />
                    ) : (
                      <AnonymousPresenceCard
                        presence={{
                          id: presence.id,
                          profile: presence.profile ? {
                            id: presence.profile.id,
                            name: presence.profile.name,
                            avatar_url: presence.profile.avatar_url,
                            city: presence.profile.city,
                            looking_for: presence.profile.looking_for,
                          } : null,
                          tribes: presence.tribes,
                          musicStyles: presence.musicStyles,
                          last_pulse: presence.last_pulse,
                          is_present: presence.is_present,
                        }}
                        animationDelay={0}
                        isBoosted={!!isBoosted}
                        canSeeRealtimePresence={canSeeRealtimePresence}
                        compatibility={getCompatibility(presence)}
                        compatibilityBreakdown={getCompatibilityBreakdown(presence)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Separator between active and inactive (only for paying users with both) */}
        {canSeeRealtimePresence && activeProfiles.length > 0 && inactiveProfiles.length > 0 && (
          <div 
            className="flex items-center gap-2 sm:gap-3 py-3 sm:py-4 animate-fade-up transition-all duration-500"
            style={{ animationDelay: `${(activeProfiles.length + 1) * 80}ms` }}
          >
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/70 transition-transform duration-300 hover:scale-110" />
            <span className="font-display text-sm sm:text-base font-semibold text-muted-foreground">
              Vistos recientemente
            </span>
            <span className="text-xs sm:text-sm font-body text-muted-foreground/80">
              ({inactiveProfiles.length})
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-muted-foreground/30 to-transparent animate-[fade-in_0.6s_ease-out]" />
          </div>
        )}

        {/* Inactive profiles section */}
        <div className="space-y-5 sm:space-y-8">
          {inactiveProfiles.map((presence, index) => {
            const profileId = presence.profile?.id;
            const isConnected = profileId && connectedProfileIds.has(profileId);
            const isBoosted = profileId && boostedIds.has(profileId);
            const baseDelay = canSeeRealtimePresence && activeProfiles.length > 0 
              ? (activeProfiles.length + 2) * 80 
              : 0;
            
            return (
              <div 
                key={presence.id}
                {...getItemProps(activeProfiles.length + index)}
                className="opacity-0 animate-stagger-fade-up transition-all duration-300"
                style={{ animationDelay: `${baseDelay + (index * 60)}ms` }}
              >
                {isConnected ? (
                  <PresenceCard
                    presence={{
                      ...presence,
                      last_pulse: presence.last_pulse,
                      is_present: presence.is_present,
                    }}
                    compatibility={getCompatibility(presence)}
                    compatibilityBreakdown={getCompatibilityBreakdown(presence)}
                    animationDelay={0}
                    photos={profileId 
                      ? photosMap?.[profileId]?.map(p => p.photo_url) || []
                      : []
                    }
                    isBoosted={!!isBoosted}
                    canSeeRealtimePresence={canSeeRealtimePresence}
                  />
                ) : (
                  <AnonymousPresenceCard
                    presence={{
                      id: presence.id,
                      profile: presence.profile ? {
                        id: presence.profile.id,
                        name: presence.profile.name,
                        avatar_url: presence.profile.avatar_url,
                        city: presence.profile.city,
                        looking_for: presence.profile.looking_for,
                      } : null,
                      tribes: presence.tribes,
                      musicStyles: presence.musicStyles,
                      last_pulse: presence.last_pulse,
                      is_present: presence.is_present,
                    }}
                    animationDelay={0}
                    isBoosted={!!isBoosted}
                    canSeeRealtimePresence={canSeeRealtimePresence}
                    compatibility={getCompatibility(presence)}
                    compatibilityBreakdown={getCompatibilityBreakdown(presence)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <List<{ data: RowData }>
        style={{ height: listHeight, width: "100%" }}
        rowCount={profiles.length}
        rowHeight={ITEM_HEIGHT}
        rowProps={{ data: rowData }}
        rowComponent={Row as any}
        overscanCount={2}
        className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      />
    </div>
  );
});

VirtualizedPresenceList.displayName = "VirtualizedPresenceList";

export default VirtualizedPresenceList;
