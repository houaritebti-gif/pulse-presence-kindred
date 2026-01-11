import { memo, useRef, useState, useCallback } from "react";
import { Radio } from "lucide-react";
import FullScreenPresenceCard from "./FullScreenPresenceCard";
import { PresenceWithProfile } from "@/hooks/usePresence";
import { useActiveBoostedProfiles } from "@/hooks/useKikiNow";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfile } from "@/hooks/useProfile";
import { useGhostMessageLimit } from "@/hooks/useSparks";
import { useSparkDetection } from "@/hooks/useSparkDetection";
import { useSparkEnergy } from "@/hooks/useSparkEnergy";
import GhostMessageLimitModal from "@/components/GhostMessageLimitModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { fireSparkConfetti } from "@/utils/sparkConfetti";
import { triggerHaptic } from "@/utils/haptics";

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
  const { data: myProfile } = useProfile();
  const { data: limitData, refetch: refetchLimit } = useGhostMessageLimit();
  const { checkForNewSpark } = useSparkDetection();
  const { earnEnergy, canDoAction } = useSparkEnergy();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const boostedIds = activeBoostedData?.boostedIds || new Set<string>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Separate active and inactive profiles
  const activeProfiles = canSeeRealtimePresence 
    ? profiles.filter(p => isProfileActive(p))
    : [];
  const inactiveProfiles = canSeeRealtimePresence 
    ? profiles.filter(p => !isProfileActive(p))
    : profiles;

  // Filter out dismissed profiles
  const allProfiles = [...activeProfiles, ...inactiveProfiles].filter(
    p => !dismissedIds.has(p.id)
  );

  const handleSwipeLeft = useCallback((presenceId: string) => {
    // Pass - just dismiss the card
    setDismissedIds(prev => new Set(prev).add(presenceId));
    if (currentIndex < allProfiles.length - 1) {
      setCurrentIndex(prev => prev);
    }
  }, [allProfiles.length, currentIndex]);

  const handleSwipeRight = useCallback(async (presence: PresenceWithProfile) => {
    if (!myProfile?.id || !presence.profile?.id) return;

    // Check limit first
    if (!limitData?.canSend) {
      setShowLimitModal(true);
      return;
    }

    // Send a quick ghost message with a random preset
    const quickMessages = [
      "Me gustó tu vibra.",
      "Algo me dice que conectamos.",
      "Curiosidad.",
      "Ojalá coincidamos.",
    ];
    const randomMessage = quickMessages[Math.floor(Math.random() * quickMessages.length)];

    try {
      const { error } = await supabase.from("ghost_messages").insert({
        from_profile_id: myProfile.id,
        to_profile_id: presence.profile.id,
        content: randomMessage,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya enviaste un mensaje a esta persona");
        } else {
          throw error;
        }
      } else {
        refetchLimit();
        queryClient.invalidateQueries({ queryKey: ["ghost_message_count"] });
        
        // Award energy for sending ghost message
        if (canDoAction("send_ghost")) {
          try {
            await earnEnergy({ 
              action: "send_ghost", 
              description: "Ghost message enviado" 
            });
          } catch (e) {
            console.log("[SparkEnergy] Could not award energy:", e);
          }
        }
        
        // Check for mutual spark
        const hasNewSpark = await checkForNewSpark(presence.profile!.id);
        
        if (hasNewSpark) {
          // 🔥 MUTUAL SPARK! Fire celebration!
          fireSparkConfetti();
          triggerHaptic('success');
          
          // Award mutual spark energy
          try {
            await earnEnergy({ 
              action: "mutual_spark", 
              description: "¡Chispa mutua!" 
            });
          } catch (e) {
            console.log("[SparkEnergy] Could not award mutual spark energy:", e);
          }
          
          toast.success("🔥 ¡Chispa mutua!", {
            description: "¡Hay conexión! Ya pueden chatear.",
            action: {
              label: "Ver perfil",
              onClick: () => navigate(`/user/${presence.profile!.id}`),
            },
          });
        } else {
          toast.success("👻 Mensaje ghost enviado");
        }
      }
    } catch (error: any) {
      toast.error("Error al enviar: " + error.message);
    }

    // Dismiss the card
    setDismissedIds(prev => new Set(prev).add(presence.id));
  }, [myProfile?.id, limitData?.canSend, refetchLimit, queryClient, checkForNewSpark, earnEnergy, canDoAction, navigate]);

  if (profiles.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="h-[calc(100vh-200px)] flex flex-col"
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

      {/* Profile cards - Stack with current on top */}
      <div className="relative flex-1 flex items-center justify-center px-4">
        <AnimatePresence mode="popLayout">
          {allProfiles.slice(currentIndex, currentIndex + 2).map((presence, idx) => {
            const profileId = presence.profile?.id;
            const isBoosted = profileId && boostedIds.has(profileId);
            const photos = profileId ? photosMap?.[profileId]?.map(p => p.photo_url) || [] : [];
            const isTop = idx === 0;

            return (
              <motion.div
                key={presence.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ 
                  scale: isTop ? 1 : 0.95, 
                  opacity: isTop ? 1 : 0.7,
                  zIndex: isTop ? 10 : 5
                }}
                exit={{ 
                  x: 0, 
                  opacity: 0, 
                  scale: 0.9,
                  transition: { duration: 0.2 }
                }}
                className={cn(
                  "absolute w-full max-w-md",
                  !isTop && "pointer-events-none"
                )}
                style={{
                  transform: !isTop ? 'translateY(10px)' : undefined
                }}
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
                  onSwipeLeft={() => handleSwipeLeft(presence.id)}
                  onSwipeRight={() => handleSwipeRight(presence)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty state */}
        {allProfiles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">
              Has visto todos los perfiles
            </p>
            <p className="text-xs text-muted-foreground/60">
              Vuelve más tarde para ver más
            </p>
          </div>
        )}
      </div>

      {/* Limit modal */}
      <GhostMessageLimitModal
        open={showLimitModal}
        onOpenChange={setShowLimitModal}
      />
    </div>
  );
});

FullScreenPresenceList.displayName = "FullScreenPresenceList";

export default FullScreenPresenceList;
