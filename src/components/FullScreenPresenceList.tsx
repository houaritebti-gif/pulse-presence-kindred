import { memo, useRef, useState, useCallback, useEffect } from "react";
import { Radio } from "lucide-react";
import FullScreenPresenceCard from "./FullScreenPresenceCard";
import SwipeTutorial from "./SwipeTutorial";
import PresenceActionButtons from "./PresenceActionButtons";
import HayVibraScreen from "./HayVibraScreen";
import { PresenceWithProfile } from "@/hooks/usePresence";
import { useActiveBoostedProfiles } from "@/hooks/useKikiNow";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfile } from "@/hooks/useProfile";
import { useGhostMessageLimit } from "@/hooks/useSparks";
import { useSparkDetection } from "@/hooks/useSparkDetection";
import { useSparkEnergy } from "@/hooks/useSparkEnergy";
import { usePurchasedItems } from "@/hooks/usePurchasedItems";
import GhostMessageLimitModal from "@/components/GhostMessageLimitModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/utils/haptics";
import { fireSparkConfetti, firePerfectMatchHearts } from "@/utils/sparkConfetti";
import { fireSuperSparkConfetti } from "@/utils/superSparkConfetti";
// Hay Vibra screen state
interface MatchData {
  theirPhoto: string | null;
  theirName: string | null;
  theirProfileId: string;
  compatibility: number;
  isPerfectMatch: boolean;
}

interface CompatibilityBreakdown {
  tribes: number;
  music: number;
  lookingFor: number;
  interests: number;
  sharedTribes?: string[];
  sharedMusic?: string[];
  sharedLookingFor?: string[];
  sharedInterests?: string[];
}

interface FullScreenPresenceListProps {
  profiles: PresenceWithProfile[];
  connectedProfileIds: Set<string>;
  photosMap: Record<string, { photo_url: string }[]> | undefined;
  getCompatibility: (presence: PresenceWithProfile) => number;
  getCompatibilityBreakdown: (presence: PresenceWithProfile) => CompatibilityBreakdown;
}

interface UndoAction {
  type: 'swipe_left' | 'swipe_right';
  presenceId: string;
  ghostMessageId?: string;
}

const isProfileActive = (presence: PresenceWithProfile) => {
  if (!presence.last_pulse || !presence.is_present) return false;
  const pulseTime = new Date(presence.last_pulse).getTime();
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return pulseTime >= fiveMinutesAgo;
};

const UNDO_BUTTON_TIMEOUT = 4000; // 4 seconds

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
  const { getAvailableQuantity, useItem } = usePurchasedItems();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const boostedIds = activeBoostedData?.boostedIds || new Set<string>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [tutorialComplete, setTutorialComplete] = useState(false);
  
  // Hay Vibra screen state
  const [showHayVibra, setShowHayVibra] = useState(false);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  
  // Undo state
  const [lastAction, setLastAction] = useState<UndoAction | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hide undo button after timeout
  useEffect(() => {
    if (lastAction) {
      setShowUndo(true);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      undoTimeoutRef.current = setTimeout(() => {
        setShowUndo(false);
        setLastAction(null);
      }, UNDO_BUTTON_TIMEOUT);
    }
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, [lastAction]);

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

  // Total profiles for counter (including dismissed)
  const totalProfiles = [...activeProfiles, ...inactiveProfiles].length;
  const viewedCount = dismissedIds.size;
  const remainingCount = totalProfiles - viewedCount;

  const handleUndo = useCallback(async () => {
    if (!lastAction) return;

    triggerHaptic('light');

    // If it was a swipe right with a ghost message, delete the message
    if (lastAction.type === 'swipe_right' && lastAction.ghostMessageId) {
      try {
        await supabase
          .from("ghost_messages")
          .delete()
          .eq("id", lastAction.ghostMessageId);
        refetchLimit();
        queryClient.invalidateQueries({ queryKey: ["ghost_message_count"] });
      } catch (e) {
        console.log("[Undo] Could not delete ghost message:", e);
      }
    }

    // Restore the dismissed profile
    setDismissedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(lastAction.presenceId);
      return newSet;
    });

    setLastAction(null);
    setShowUndo(false);
    toast.success("Acción deshecha", { duration: 2000 });
  }, [lastAction, refetchLimit, queryClient]);

  const handleSwipeLeft = useCallback((presenceId: string) => {
    // Pass - just dismiss the card
    setDismissedIds(prev => new Set(prev).add(presenceId));
    setLastAction({ type: 'swipe_left', presenceId });
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

    // Send a Chispa (like) - represented as a ghost message in the DB
    // This is how the mutual matching system works
    const chispaMessages = [
      "✨ Te envío mi Chispa",
      "✨ Me gusta tu vibra",
      "✨ Algo me dice que conectamos",
      "✨ Hay química",
    ];
    const randomMessage = chispaMessages[Math.floor(Math.random() * chispaMessages.length)];

    try {
      const { data: insertedMessage, error } = await supabase.from("ghost_messages").insert({
        from_profile_id: myProfile.id,
        to_profile_id: presence.profile.id,
        content: randomMessage,
      }).select('id').single();

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya enviaste un mensaje a esta persona");
        } else {
          throw error;
        }
      } else {
        refetchLimit();
        queryClient.invalidateQueries({ queryKey: ["ghost_message_count"] });
        
        // Award energy for sending chispa
        if (canDoAction("send_ghost")) {
          try {
            await earnEnergy({ 
              action: "send_ghost", 
              description: "Chispa enviada ✨" 
            });
          } catch (e) {
            console.log("[SparkEnergy] Could not award energy:", e);
          }
        }
        
        // Check for mutual spark
        const hasNewSpark = await checkForNewSpark(presence.profile!.id);
        
        if (hasNewSpark) {
          // Get compatibility for this match
          const matchCompatibility = getCompatibility(presence);
          const isPerfect = matchCompatibility >= 5;
          
          // Get photos for the match screen
          const theirPhotos = photosMap?.[presence.profile!.id];
          const theirPhoto = theirPhotos?.[0]?.photo_url || presence.profile?.avatar_url || null;
          
          // Set match data and show Hay Vibra screen
          setMatchData({
            theirPhoto,
            theirName: presence.profile?.name || null,
            theirProfileId: presence.profile!.id,
            compatibility: matchCompatibility,
            isPerfectMatch: isPerfect,
          });
          setShowHayVibra(true);
          
          // Award mutual spark energy
          try {
            await earnEnergy({ 
              action: "mutual_spark", 
              description: isPerfect ? "¡Match perfecto!" : "¡Hay vibra!" 
            });
          } catch (e) {
            console.log("[SparkEnergy] Could not award mutual spark energy:", e);
          }
        } else {
          toast.success("✨ Chispa enviada", {
            description: "Si hay interés mutuo, ¡habrá vibra!",
          });
        }

        // Store action for undo
        setLastAction({
          type: 'swipe_right',
          presenceId: presence.id,
          ghostMessageId: insertedMessage?.id,
        });
      }
    } catch (error: any) {
      toast.error("Error al enviar: " + error.message);
      return; // Don't dismiss on error
    }

    // Dismiss the card
    setDismissedIds(prev => new Set(prev).add(presence.id));
  }, [myProfile?.id, myProfile?.avatar_url, limitData?.canSend, refetchLimit, queryClient, checkForNewSpark, earnEnergy, canDoAction, getCompatibility, photosMap]);

  // Handle swipe up - Super Chispa
  const handleSwipeUp = useCallback(async (presence: PresenceWithProfile) => {
    if (!myProfile?.id || !presence.profile?.id) return;

    // Check if user has Super Spark items
    const availableSuperSparks = getAvailableQuantity("super_spark");
    if (availableSuperSparks <= 0) {
      toast.error("No tienes Super Chispas disponibles", {
        description: "Consigue más en la tienda de Spark Energy ⚡",
      });
      return;
    }

    try {
      // Use the item first
      const used = await useItem("super_spark");
      if (!used) {
        toast.error("No se pudo usar la Super Chispa");
        return;
      }

      // Send Super Spark ghost message
      const { error } = await supabase.from("ghost_messages").insert({
        from_profile_id: myProfile.id,
        to_profile_id: presence.profile.id,
        content: "⚡ Super Chispa",
        is_super_spark: true,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya enviaste un mensaje a esta persona");
        } else {
          throw error;
        }
      } else {
        fireSuperSparkConfetti();
        triggerHaptic('success');
        toast.success("🔥 ¡Super Chispa enviada!", {
          description: `${presence.profile.name || "Este perfil"} verá tu interés especial`,
        });
        queryClient.invalidateQueries({ queryKey: ["ghost_message_count"] });
      }
    } catch (error: any) {
      toast.error("Error: " + error.message);
      return;
    }

    setDismissedIds(prev => new Set(prev).add(presence.id));
  }, [myProfile?.id, getAvailableQuantity, useItem, queryClient]);

  // Handle swipe down - View profile
  const handleSwipeDown = useCallback((presence: PresenceWithProfile) => {
    if (presence.profile?.id) {
      navigate(`/user/${presence.profile.id}`);
    }
  }, [navigate]);

  if (profiles.length === 0) return null;

  return (
    <>
      {/* Swipe Tutorial for first-time users */}
      <SwipeTutorial onComplete={() => setTutorialComplete(true)} />
      
      <div
      ref={containerRef}
      className="h-[calc(100vh-200px)] flex flex-col"
    >
      {/* Profile counter - now shows remaining */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md shadow-lg border border-border">
          <span className="text-sm font-medium text-foreground">
            {remainingCount} {remainingCount === 1 ? 'perfil restante' : 'perfiles restantes'}
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
                      vibe: presence.profile.vibe,
                      looking_for: presence.profile.looking_for,
                      gender: presence.profile.gender,
                      birthdate: presence.profile.birthdate,
                    } : null,
                    tribes: presence.tribes,
                    musicStyles: presence.musicStyles,
                    interests: presence.interests,
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
                  onSwipeUp={() => handleSwipeUp(presence)}
                  onSwipeDown={() => handleSwipeDown(presence)}
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

      {/* Fixed action buttons at bottom */}
      {allProfiles.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4">
          <PresenceActionButtons
            onPass={() => {
              const currentPresence = allProfiles[0];
              if (currentPresence) handleSwipeLeft(currentPresence.id);
            }}
            onChispa={() => {
              const currentPresence = allProfiles[0];
              if (currentPresence) handleSwipeRight(currentPresence);
            }}
            onSuperChispa={() => {
              const currentPresence = allProfiles[0];
              if (currentPresence) handleSwipeUp(currentPresence);
            }}
            onViewProfile={() => {
              const currentPresence = allProfiles[0];
              if (currentPresence) handleSwipeDown(currentPresence);
            }}
            onUndo={handleUndo}
            showUndo={showUndo && !!lastAction}
            availableSuperChispas={getAvailableQuantity("super_spark")}
            disabled={allProfiles.length === 0}
          />
        </div>
      )}

      {/* Limit modal */}
      <GhostMessageLimitModal
        open={showLimitModal}
        onOpenChange={setShowLimitModal}
      />

      {/* Hay Vibra match screen */}
      <HayVibraScreen
        isOpen={showHayVibra}
        onClose={() => {
          setShowHayVibra(false);
          setMatchData(null);
        }}
        onSendMessage={() => {
          if (matchData?.theirProfileId) {
            navigate(`/user/${matchData.theirProfileId}`);
          }
        }}
        onViewProfile={() => {
          if (matchData?.theirProfileId) {
            navigate(`/user/${matchData.theirProfileId}`);
          }
        }}
        myPhoto={myProfile?.avatar_url || null}
        theirPhoto={matchData?.theirPhoto || null}
        theirName={matchData?.theirName || null}
        compatibility={matchData?.compatibility || 0}
        isPerfectMatch={matchData?.isPerfectMatch || false}
      />
    </div>
    </>
  );
});

FullScreenPresenceList.displayName = "FullScreenPresenceList";

export default FullScreenPresenceList;
