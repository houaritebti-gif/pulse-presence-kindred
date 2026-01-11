import { memo, useRef, useState, useCallback, useEffect } from "react";
import { Radio, Undo2 } from "lucide-react";
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
import { fireSparkConfetti, firePerfectMatchHearts } from "@/utils/sparkConfetti";
import { triggerHaptic } from "@/utils/haptics";
import { Button } from "@/components/ui/button";

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
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const boostedIds = activeBoostedData?.boostedIds || new Set<string>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [showLimitModal, setShowLimitModal] = useState(false);
  
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

    // Send a quick ghost message with a random preset
    const quickMessages = [
      "Me gustó tu vibra.",
      "Algo me dice que conectamos.",
      "Curiosidad.",
      "Ojalá coincidamos.",
    ];
    const randomMessage = quickMessages[Math.floor(Math.random() * quickMessages.length)];

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
          // Get compatibility for this match
          const matchCompatibility = getCompatibility(presence);
          
          // 🔥 MUTUAL SPARK! Fire celebration!
          // Use hearts animation for perfect compatibility (5/5)
          if (matchCompatibility >= 5) {
            firePerfectMatchHearts();
            triggerHaptic('success');
            
            toast.success("💖 ¡Match perfecto!", {
              description: "¡Compatibilidad perfecta! Esto es especial.",
              action: {
                label: "Ver perfil",
                onClick: () => navigate(`/user/${presence.profile!.id}`),
              },
            });
          } else {
            fireSparkConfetti();
            triggerHaptic('success');
            
            toast.success("🔥 ¡Chispa mutua!", {
              description: "¡Hay conexión! Ya pueden chatear.",
              action: {
                label: "Ver perfil",
                onClick: () => navigate(`/user/${presence.profile!.id}`),
              },
            });
          }
          
          // Award mutual spark energy
          try {
            await earnEnergy({ 
              action: "mutual_spark", 
              description: matchCompatibility >= 5 ? "¡Match perfecto!" : "¡Chispa mutua!" 
            });
          } catch (e) {
            console.log("[SparkEnergy] Could not award mutual spark energy:", e);
          }
        } else {
          toast.success("👻 Mensaje ghost enviado");
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
  }, [myProfile?.id, limitData?.canSend, refetchLimit, queryClient, checkForNewSpark, earnEnergy, canDoAction, navigate]);

  if (profiles.length === 0) return null;

  return (
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

      {/* Floating undo button */}
      <AnimatePresence>
        {showUndo && lastAction && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              className="gap-2 bg-background/95 backdrop-blur-md shadow-lg border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all"
            >
              <Undo2 className="w-4 h-4" />
              <span>Deshacer</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

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
