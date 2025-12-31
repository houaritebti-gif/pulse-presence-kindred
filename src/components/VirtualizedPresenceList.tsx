import { memo, useRef, useEffect, useState, CSSProperties, ReactElement } from "react";
import { List } from "react-window";
import PresenceCard from "./PresenceCard";
import AnonymousPresenceCard from "./AnonymousPresenceCard";
import { PresenceWithProfile } from "@/hooks/usePresence";

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
}

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
  const { profiles, connectedProfileIds, photosMap, getCompatibility, getCompatibilityBreakdown } = data;
  const presence = profiles[index];
  const profileId = presence.profile?.id;
  const isConnected = profileId && connectedProfileIds.has(profileId);

  return (
    <div style={{ ...style, paddingBottom: 24 }}>
      {isConnected ? (
        <PresenceCard
          key={presence.id}
          presence={presence}
          compatibility={getCompatibility(presence)}
          compatibilityBreakdown={getCompatibilityBreakdown(presence)}
          animationDelay={0}
          photos={profileId 
            ? photosMap?.[profileId]?.map(p => p.photo_url) || []
            : []
          }
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
          }}
          animationDelay={0}
        />
      )}
    </div>
  );
};

const ITEM_HEIGHT = 320; // Approximate card height + gap

export const VirtualizedPresenceList = memo(({
  profiles,
  connectedProfileIds,
  photosMap,
  getCompatibility,
  getCompatibilityBreakdown,
}: VirtualizedPresenceListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(600);

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

  const rowData: RowData = {
    profiles,
    connectedProfileIds,
    photosMap,
    getCompatibility,
    getCompatibilityBreakdown,
  };

  // For small lists, don't virtualize
  if (profiles.length <= 5) {
    return (
      <div className="space-y-6">
        {profiles.map((presence, index) => {
          const profileId = presence.profile?.id;
          const isConnected = profileId && connectedProfileIds.has(profileId);
          
          return isConnected ? (
            <PresenceCard
              key={presence.id}
              presence={presence}
              compatibility={getCompatibility(presence)}
              compatibilityBreakdown={getCompatibilityBreakdown(presence)}
              animationDelay={(index + 1) * 100}
              photos={profileId 
                ? photosMap?.[profileId]?.map(p => p.photo_url) || []
                : []
              }
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
              }}
              animationDelay={(index + 1) * 100}
            />
          );
        })}
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
