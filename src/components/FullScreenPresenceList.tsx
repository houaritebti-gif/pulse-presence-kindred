import { memo, useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Radio, RotateCcw, Crown, Info, RefreshCw, Bell, CloudOff, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import FullScreenPresenceCard from "./FullScreenPresenceCard";
import SwipeTutorial from "./SwipeTutorial";
import PresenceActionButtons from "./PresenceActionButtons";
import HayVibraScreen from "./HayVibraScreen";
import { PresenceWithProfile } from "@/hooks/usePresence";
import { useActiveBoostedProfiles } from "@/hooks/useKikiNow";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfile } from "@/hooks/useProfile";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { useGhostMessageLimit } from "@/hooks/useSparks";
import { useSparkDetection } from "@/hooks/useSparkDetection";
import { useSparkEnergy } from "@/hooks/useSparkEnergy";
import { usePurchasedItems } from "@/hooks/usePurchasedItems";
import { useRewindLimit } from "@/hooks/useRewindLimit";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePrefetchAdjacent } from "@/hooks/useProfilePrefetch";
import GhostMessageLimitModal from "@/components/GhostMessageLimitModal";
import { RewindLimitModal } from "@/components/RewindLimitModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/utils/haptics";
import { fireSparkConfetti, firePerfectMatchHearts, fireChispaHearts } from "@/utils/sparkConfetti";
import { fireSuperSparkConfetti, fireSuperSparkGoldenStars } from "@/utils/superSparkConfetti";
import { playPassSound, playChispaSound, playSuperChispaSound, playHayVibraSound } from "@/utils/notificationSound";
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
  showingCached?: boolean;
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
  showingCached = false,
}: FullScreenPresenceListProps) => {
  const { data: activeBoostedData } = useActiveBoostedProfiles();
  const { canSeeRealtimePresence } = useSubscription();
  const { data: myProfile } = useProfile();
  const { data: myPhotos } = useProfilePhotos(myProfile?.id);
  const { data: limitData, refetch: refetchLimit } = useGhostMessageLimit();
  const { checkForNewSpark } = useSparkDetection();
  const { earnEnergy, canDoAction } = useSparkEnergy();
  const { getAvailableQuantity, useItem } = usePurchasedItems();
  const { canRewind, remaining: rewindRemaining, isUnlimited: isRewindUnlimited, useRewind, getLimitMessage, tier: rewindTier } = useRewindLimit();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const boostedIds = activeBoostedData?.boostedIds || new Set<string>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rewindHistory, setRewindHistory] = useState<PresenceWithProfile[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showRewindLimitModal, setShowRewindLimitModal] = useState(false);
  const [tutorialComplete, setTutorialComplete] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const prevShowingCachedRef = useRef(showingCached);
  
  // Hay Vibra screen state
  const [showHayVibra, setShowHayVibra] = useState(false);
  const [matchData, setMatchData] = useState<MatchData | null>(null);

  // Detect transition from cached to live data
  useEffect(() => {
    if (prevShowingCachedRef.current && !showingCached) {
      // Just transitioned from cached to live data
      setJustRefreshed(true);
      triggerHaptic('light');
      const timer = setTimeout(() => setJustRefreshed(false), 2000);
      return () => clearTimeout(timer);
    }
    prevShowingCachedRef.current = showingCached;
  }, [showingCached]);

  // Memoize separated profile lists to avoid recalculation on every render
  const { activeProfiles, inactiveProfiles } = useMemo(() => {
    const active = canSeeRealtimePresence 
      ? profiles.filter(p => isProfileActive(p))
      : [];
    const inactive = canSeeRealtimePresence 
      ? profiles.filter(p => !isProfileActive(p))
      : profiles;
    return { activeProfiles: active, inactiveProfiles: inactive };
  }, [profiles, canSeeRealtimePresence]);

  // Filter out dismissed profiles - memoized
  const allProfiles = useMemo(() => 
    [...activeProfiles, ...inactiveProfiles].filter(p => !dismissedIds.has(p.id)),
    [activeProfiles, inactiveProfiles, dismissedIds]
  );

  // Total profiles for counter (including dismissed)
  const totalProfiles = activeProfiles.length + inactiveProfiles.length;
  const viewedCount = dismissedIds.size;
  const remainingCount = totalProfiles - viewedCount;

  // Prefetch next profiles into IndexedDB cache for instant loading - memoized
  const prefetchableProfiles = useMemo(() => 
    allProfiles.filter(p => p.profile?.id).map(p => ({ id: p.profile!.id })),
    [allProfiles]
  );
  usePrefetchAdjacent(prefetchableProfiles, currentIndex, 3);


  const handleSwipeLeft = useCallback((presence: PresenceWithProfile) => {
    // Pass - dismiss the card and save to rewind history
    triggerHaptic('light'); // Soft haptic for pass
    playPassSound(); // Action sound
    
    // Save to rewind history (max 10 items)
    setRewindHistory(prev => [presence, ...prev].slice(0, 10));
    
    setDismissedIds(prev => new Set(prev).add(presence.id));
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
          playHayVibraSound(); // Celebration sound for mutual match
          
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
          triggerHaptic('medium'); // Medium haptic for chispa
          playChispaSound(); // Chispa sound
          fireChispaHearts(); // Floating hearts micro-animation
          toast.success("✨ Chispa enviada", {
            description: "Si hay interés mutuo, ¡habrá vibra!",
          });
        }

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
        playSuperChispaSound(); // Super Chispa sound
        fireSuperSparkGoldenStars(); // Golden stars for Super Chispa
        fireSuperSparkConfetti(); // Additional electric confetti
        triggerHaptic('heavy'); // Strong haptic for super chispa
        toast.success("⚡ ¡Super Chispa enviada!", {
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

  // Handle swipe down - View profile (confirmation via photo tap)
  const handleSwipeDown = useCallback((presence: PresenceWithProfile) => {
    if (presence.profile?.id) {
      triggerHaptic('light');
      navigate(`/user/${presence.profile.id}`);
    }
  }, [navigate]);

  // Handle rewind - go back to last passed profile
  const handleRewind = useCallback(() => {
    if (rewindHistory.length === 0) {
      toast.error("No hay perfiles anteriores");
      return;
    }

    if (!canRewind) {
      // Show premium modal instead of toast
      setShowRewindLimitModal(true);
      return;
    }

    // Use a rewind
    const used = useRewind();
    if (!used) {
      toast.error("No se pudo rebobinar");
      return;
    }

    triggerHaptic('medium');

    // Get the last passed profile and restore it
    const lastProfile = rewindHistory[0];
    setRewindHistory(prev => prev.slice(1));
    
    // Remove from dismissed
    setDismissedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(lastProfile.id);
      return newSet;
    });

    toast.success("⏪ Perfil recuperado", { duration: 2000 });
  }, [rewindHistory, canRewind, useRewind]);

  // Keyboard shortcuts for desktop
  useEffect(() => {
    if (isMobile || allProfiles.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const currentPresence = allProfiles[0];
      if (!currentPresence) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          handleSwipeLeft(currentPresence);
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSwipeRight(currentPresence);
          break;
        case "ArrowUp":
          e.preventDefault();
          handleSwipeUp(currentPresence);
          break;
        case "ArrowDown":
          e.preventDefault();
          handleSwipeDown(currentPresence);
          break;
        case "r":
        case "R":
          e.preventDefault();
          handleRewind();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, allProfiles, handleSwipeLeft, handleSwipeRight, handleSwipeUp, handleSwipeDown, handleRewind]);

  // Track exhaustion state for push notifications
  useEffect(() => {
    if (allProfiles.length === 0 && totalProfiles > 0 && myProfile?.id) {
      // Register that user has exhausted their list
      const trackExhaustion = async () => {
        try {
          await supabase
            .from("presence_exhaustion")
            .upsert({
              profile_id: myProfile.id,
              exhausted_at: new Date().toISOString(),
              notified_at: null, // Reset to receive new notifications
            }, { onConflict: 'profile_id' });
        } catch (e) {
          console.log("[PresenceExhaustion] Could not track:", e);
        }
      };
      trackExhaustion();
    }
  }, [allProfiles.length, totalProfiles, myProfile?.id]);

  // Clear exhaustion when user resets
  const handleReset = useCallback(async () => {
    triggerHaptic('medium');
    setDismissedIds(new Set());
    setRewindHistory([]);
    
    // Remove exhaustion record since user is starting fresh
    if (myProfile?.id) {
      try {
        await supabase
          .from("presence_exhaustion")
          .delete()
          .eq("profile_id", myProfile.id);
      } catch (e) {
        console.log("[PresenceExhaustion] Could not clear:", e);
      }
    }
    
    toast.success("Perfiles restablecidos", { description: "Puedes volver a explorar desde el inicio" });
  }, [myProfile?.id]);

  // Show initial empty state when no profiles at all
  if (profiles.length === 0) {
    return (
      <div className="h-[calc(100vh-280px)] flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-24 h-24 mb-6"
        >
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Radio className="w-10 h-10 text-primary" />
          </div>
        </motion.div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Nadie conectado ahora
        </h3>
        <p className="font-body text-sm text-muted-foreground max-w-[280px]">
          No hay personas visibles en este momento. Vuelve más tarde o activa notificaciones.
        </p>
      </div>
    );
  }

  // Show empty state when all profiles have been viewed
  if (allProfiles.length === 0 && totalProfiles > 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-[calc(100vh-200px)] flex flex-col items-center justify-center px-6 text-center"
      >
        {/* Animated icon with multiple rings */}
        <div className="relative w-28 h-28 mb-8">
          {/* Outer pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-primary/20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Middle pulsing ring */}
          <motion.div
            className="absolute inset-2 rounded-full border border-primary/30"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          {/* Inner gradient circle */}
          <motion.div 
            className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
          {/* Icon container */}
          <motion.div
            className="absolute inset-4 rounded-full flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
          >
            <Radio className="w-10 h-10 text-primary" />
          </motion.div>
          {/* Floating sparkles */}
          <motion.div
            className="absolute top-0 right-2 w-2 h-2 rounded-full bg-primary/60"
            animate={{ y: [-2, -8, -2], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-2 left-0 w-1.5 h-1.5 rounded-full bg-accent/60"
            animate={{ y: [2, 8, 2], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
          />
        </div>

        {/* Text content with staggered animation */}
        <motion.h3 
          className="font-display text-xl font-semibold text-foreground mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          ¡Has visto todos los perfiles!
        </motion.h3>
        <motion.p 
          className="font-body text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          Te notificaremos cuando haya gente nueva. También puedes ajustar tus filtros para ampliar tu búsqueda.
        </motion.p>
        <motion.div 
          className="flex items-center gap-2 text-xs text-primary/70 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Bell className="w-3.5 h-3.5" />
          </motion.div>
          <span>Recibirás una notificación push</span>
        </motion.div>

        {/* Button with entrance animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.7, type: "spring" }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={handleReset}
            className="gap-2 mb-4 hover:scale-105 transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            Restablecer perfiles
          </Button>
        </motion.div>

        <motion.p 
          className="text-xs text-muted-foreground/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          {viewedCount} {viewedCount === 1 ? 'perfil visto' : 'perfiles vistos'}
        </motion.p>
      </motion.div>
    );
  }

  if (profiles.length === 0) return null;

  return (
    <>
      {/* Swipe Tutorial for first-time users */}
      <SwipeTutorial onComplete={() => setTutorialComplete(true)} />
      
      <div
      ref={containerRef}
      className="h-[calc(100vh-200px)] flex flex-col"
    >

      {/* Cached data indicator - subtle badge */}
      <AnimatePresence mode="wait">
        {showingCached ? (
          <motion.div 
            key="cached"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            className="flex items-center justify-center pb-2"
          >
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/80 backdrop-blur-sm">
              <CloudOff className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Datos guardados</span>
            </div>
          </motion.div>
        ) : justRefreshed ? (
          <motion.div 
            key="refreshed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
            className="flex items-center justify-center pb-2"
          >
            <motion.div 
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 backdrop-blur-sm"
              animate={{ 
                boxShadow: [
                  "0 0 0 0 rgba(34, 197, 94, 0)",
                  "0 0 12px 4px rgba(34, 197, 94, 0.3)",
                  "0 0 0 0 rgba(34, 197, 94, 0)"
                ]
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              <Wifi className="w-3 h-3 text-green-500" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">Datos actualizados</span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Active profiles section header */}
      {canSeeRealtimePresence && activeProfiles.length > 0 && (
        <div className="snap-start flex items-center justify-center py-4">
          <motion.div 
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 backdrop-blur-sm"
            initial={{ scale: 1 }}
            animate={boostedIds.size > 0 ? {
              scale: [1, 1.05, 1, 1.03, 1],
              boxShadow: [
                "0 0 0 0 rgba(34, 197, 94, 0)",
                "0 0 12px 4px rgba(34, 197, 94, 0.4)",
                "0 0 0 0 rgba(34, 197, 94, 0)",
                "0 0 8px 2px rgba(34, 197, 94, 0.3)",
                "0 0 0 0 rgba(34, 197, 94, 0)"
              ]
            } : {}}
            transition={{
              duration: 2,
              ease: "easeInOut",
              times: [0, 0.25, 0.5, 0.75, 1]
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold text-green-500">
              {activeProfiles.length} activos ahora
            </span>
            {boostedIds.size > 0 && (
              <motion.span 
                className="text-xs text-orange-400 font-medium ml-1"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                ⚡ {boostedIds.size} NOW
              </motion.span>
            )}
          </motion.div>
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
                initial={{ 
                  scale: 0.85, 
                  opacity: 0, 
                  y: 40,
                  rotateX: 15
                }}
                animate={{ 
                  scale: isTop ? 1 : 0.95, 
                  opacity: isTop ? 1 : 0.6,
                  y: isTop ? 0 : 8,
                  rotateX: 0,
                  zIndex: isTop ? 10 : 5
                }}
                exit={{ 
                  x: 0, 
                  opacity: 0, 
                  scale: 0.85,
                  y: -20,
                  transition: { duration: 0.25, ease: "easeIn" }
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 25,
                  mass: 0.8
                }}
                className={cn(
                  "absolute w-full max-w-md",
                  !isTop && "pointer-events-none"
                )}
                style={{
                  perspective: "1000px",
                  transformStyle: "preserve-3d"
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
                  onSwipeLeft={() => handleSwipeLeft(presence)}
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
              if (currentPresence) handleSwipeLeft(currentPresence);
            }}
            onChispa={() => {
              const currentPresence = allProfiles[0];
              if (currentPresence) handleSwipeRight(currentPresence);
            }}
            onSuperChispa={() => {
              const currentPresence = allProfiles[0];
              if (currentPresence) handleSwipeUp(currentPresence);
            }}
            onRewind={handleRewind}
            canRewind={canRewind && rewindHistory.length > 0}
            rewindRemaining={rewindRemaining}
            isRewindUnlimited={isRewindUnlimited}
            availableSuperChispas={getAvailableQuantity("super_spark")}
            disabled={allProfiles.length === 0}
            showKeyboardHints={false}
          />
        </div>
      )}

      {/* Limit modal */}
      <GhostMessageLimitModal
        open={showLimitModal}
        onOpenChange={setShowLimitModal}
      />

      {/* Rewind limit modal */}
      <RewindLimitModal
        open={showRewindLimitModal}
        onOpenChange={setShowRewindLimitModal}
        tier={rewindTier}
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
        myPhoto={myPhotos?.[0]?.photo_url || myProfile?.avatar_url || null}
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
