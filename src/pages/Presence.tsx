import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { PresenceTopCards } from "@/components/PresenceTopCards";
import { PresenceHeaderActions } from "@/components/PresenceHeaderActions";
import { PageHeader } from "@/components/PageHeader";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Loader2, Eye, EyeOff, Flame, Bell, Radio, Crown, Lock } from "lucide-react";
import { usePresenceList, useMyPresence, useSetPresence, usePresenceHeartbeat } from "@/hooks/usePresence";
import { useRetrySuccessToast } from "@/hooks/useRetrySuccessToast";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useLocalStorage, STORAGE_KEYS } from "@/hooks/useLocalStorage";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import { useProfile, useProfileTribes, useProfileMusicStyles } from "@/hooks/useProfile";
import { useProfileInterests } from "@/hooks/useInterests";
import { useNewSparks } from "@/hooks/useNewSparks";
import { useQuedadas } from "@/hooks/useQuedadas";
import { useUnreadNotificationCount } from "@/hooks/useNotificationCenter";
import { useUnreadGhostMessageCount } from "@/hooks/useReceivedGhostMessages";
import { useBlockedUsers } from "@/hooks/useUserModeration";
import { useMultipleProfilePhotos } from "@/hooks/useProfilePhotos";
import { useSentConnectionRequests, usePendingConnectionRequestCount } from "@/hooks/useConnectionRequests";
import PresenceFiltersComponent, { PresenceFilters } from "@/components/PresenceFilters";
import { useVisitedProfilesLoader } from "@/hooks/useVisitedProfiles";
import { PullToRefresh } from "@/components/PullToRefresh";
import FullScreenPresenceList from "@/components/FullScreenPresenceList";
import FullScreenPresenceSkeleton from "@/components/FullScreenPresenceSkeleton";
import { useSubscription } from "@/hooks/useSubscription";
import { useMyKikiNowBoost, useCreateKikiNowCheckout, useVerifyKikiNowBoost, useActiveBoostedProfiles, getBoostTimeRemaining } from "@/hooks/useKikiNow";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { InteractiveTutorial } from "@/components/InteractiveTutorial";
import { useTutorial } from "@/hooks/useTutorial";

const Presence = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: profile } = useProfile();
  const { data: myTribes } = useProfileTribes(profile?.id);
  const { data: myMusicStyles } = useProfileMusicStyles(profile?.id);
  // Filters state persisted to localStorage - moved up to use in hook
  const [filters, setFilters] = useLocalStorage<PresenceFilters>(
    STORAGE_KEYS.PRESENCE_FILTERS,
    { tribes: [], musicStyles: [], details: [], lookingFor: [], genders: [], cities: [], interests: [], showAllProfiles: false, hideVisited: false }
  );
  
  const { data: presenceList, isLoading, isError, refetch, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } = usePresenceList(filters.showAllProfiles || false);
  const { data: myPresence } = useMyPresence();
  const setPresence = useSetPresence();
  const { newSparkCount, hasNewSparks, totalSparkCount, markAllAsSeen, newSparks } = useNewSparks();
  const { data: quedadas } = useQuedadas();
  const quedadaCount = quedadas?.length || 0;
  const unreadCount = useUnreadNotificationCount();
  const unreadGhostCount = useUnreadGhostMessageCount();
  const { data: blockedIds } = useBlockedUsers();
  const { data: sentRequests } = useSentConnectionRequests();
  const pendingConnectionCount = usePendingConnectionRequestCount();
  const { canUseInvisibleMode, isPremium, tier } = useSubscription();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [invisibleAnimating, setInvisibleAnimating] = useState(false);
  const realtimeUpsellShownRef = useRef(false);
  const profileCardsRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolledRef = useRef(false);
  
  // Tutorial hook
  const { isOpen: isTutorialOpen, openTutorial, closeTutorial, completeTutorial, checkAndOpenForNewUser } = useTutorial();
  
  // Auto-open tutorial for new users
  useEffect(() => {
    // Small delay to let the page load first
    const timer = setTimeout(() => {
      checkAndOpenForNewUser();
    }, 500);
    return () => clearTimeout(timer);
  }, [checkAndOpenForNewUser]);

  // Callback for realtime upsell toast (only for free users)
  const handleRealtimeUpsell = useCallback(() => {
    if (tier === 'free' && !realtimeUpsellShownRef.current) {
      realtimeUpsellShownRef.current = true;
      toast("Ve quién está conectado en tiempo real", {
        description: "Con Plus puedes ver la actividad en vivo de otros usuarios.",
        action: {
          label: "Ver Plus",
          onClick: () => navigate("/subscription"),
        },
        duration: 5000,
      });
    }
  }, [tier, navigate]);

  // KIKI Now boost hooks
  const { data: myBoost } = useMyKikiNowBoost();
  const { data: activeBoostedData } = useActiveBoostedProfiles();
  const createCheckout = useCreateKikiNowCheckout();
  const verifyBoost = useVerifyKikiNowBoost();
  const [boostTimeRemaining, setBoostTimeRemaining] = useState<{ minutes: number; seconds: number } | null>(null);

  // Handle boost verification on return from Stripe
  useEffect(() => {
    const boostStatus = searchParams.get("boost");
    const sessionId = searchParams.get("session_id");
    
    if (boostStatus === "success" && sessionId) {
      verifyBoost.mutate(sessionId);
      // Clean up URL params
      setSearchParams({});
    } else if (boostStatus === "cancelled") {
      setSearchParams({});
    }
  }, [searchParams]);

  // Update boost countdown
  useEffect(() => {
    if (!myBoost?.expires_at) {
      setBoostTimeRemaining(null);
      return;
    }

    const updateTime = () => {
      const remaining = getBoostTimeRemaining(myBoost.expires_at);
      if (remaining.expired) {
        setBoostTimeRemaining(null);
      } else {
        setBoostTimeRemaining({ minutes: remaining.minutes, seconds: remaining.seconds });
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [myBoost?.expires_at]);

  useRetrySuccessToast({ isError, isLoading, isFetching, data: presenceList });

  // Get profile IDs of accepted connections (can see full profile)
  const connectedProfileIds = useMemo(() => {
    const connected = new Set<string>();
    sentRequests?.forEach(req => {
      if (req.status === "accepted") {
        connected.add(req.to_profile_id);
      }
    });
    return connected;
  }, [sentRequests]);

  // My tribes, music, looking_for and interests for compatibility calculation
  const myTribeNames = useMemo(() => myTribes?.map(t => t.tribe) || [], [myTribes]);
  const myStyleNames = useMemo(() => myMusicStyles?.map(m => m.style) || [], [myMusicStyles]);
  const myLookingFor = useMemo(() => profile?.looking_for || [], [profile?.looking_for]);
  const { data: myInterests } = useProfileInterests(profile?.id);
  const myInterestNames = useMemo(() => myInterests?.map(i => i.interest) || [], [myInterests]);

  // Filters now defined earlier to use in usePresenceList

  // Enable heartbeat
  usePresenceHeartbeat();

  // Auto-set presence when entering
  useEffect(() => {
    if (profile && !myPresence) {
      // Notify high compatibility users on initial connection
      setPresence.mutate({ isPresent: true, visibleToOthers: true, notifyHighCompatibility: true });
    }
  }, [profile, myPresence]);

  const toggleVisibility = () => {
    // If trying to go invisible and not premium, show modal
    if (myPresence?.visible_to_others && !canUseInvisibleMode) {
      setShowPremiumModal(true);
      return;
    }
    
    // Trigger animation and haptic when going invisible (Premium user)
    if (myPresence?.visible_to_others && canUseInvisibleMode) {
      setInvisibleAnimating(true);
      setTimeout(() => setInvisibleAnimating(false), 1500);
      
      // Subtle haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate([15, 50, 15]); // Short-pause-short pattern
      }
    }
    
    setPresence.mutate({ 
      isPresent: true, 
      visibleToOthers: !myPresence?.visible_to_others 
    });
  };

  // Filter out own profile and blocked users from list
  const otherProfiles = useMemo(() => {
    const blockedSet = new Set(blockedIds || []);
    return presenceList?.filter(p => 
      p.profile?.id !== profile?.id && 
      !blockedSet.has(p.profile?.id || "")
    ) || [];
  }, [presenceList, profile?.id, blockedIds]);

  // Get unique cities from all profiles for filter
  const availableCities = useMemo(() => {
    const citiesSet = new Set<string>();
    otherProfiles.forEach(p => {
      const city = (p.profile as any)?.city;
      if (city && typeof city === 'string' && city.trim()) {
        citiesSet.add(city.trim());
      }
    });
    return Array.from(citiesSet);
  }, [otherProfiles]);

  // Get all profile IDs for batch photo fetch
  const profileIds = useMemo(() => 
    otherProfiles.map(p => p.profile?.id).filter(Boolean) as string[],
    [otherProfiles]
  );

  // Fetch all photos in one query
  const { data: photosMap } = useMultipleProfilePhotos(profileIds);

  // Load visited status for all profiles (for hideVisited filter)
  const { visitedMap } = useVisitedProfilesLoader(filters.hideVisited ? profileIds : []);

  // Calculate compatibility for each presence (tribes + music + looking_for + interests)
  const getCompatibility = (presence: typeof otherProfiles[0]) => {
    const sharedTribes = presence.tribes.filter(t => myTribeNames.includes(t));
    const sharedMusic = presence.musicStyles.filter(m => myStyleNames.includes(m));
    const theirLookingFor = presence.profile?.looking_for || [];
    const sharedLookingFor = theirLookingFor.filter(l => myLookingFor.includes(l));
    const sharedInterests = presence.interests.filter(i => myInterestNames.includes(i));
    return sharedTribes.length + sharedMusic.length + sharedLookingFor.length + sharedInterests.length;
  };

  // Get compatibility breakdown for tooltip
  const getCompatibilityBreakdown = (presence: typeof otherProfiles[0]) => {
    const sharedTribes = presence.tribes.filter(t => myTribeNames.includes(t));
    const sharedMusic = presence.musicStyles.filter(m => myStyleNames.includes(m));
    const theirLookingFor = presence.profile?.looking_for || [];
    const sharedLookingFor = theirLookingFor.filter(l => myLookingFor.includes(l));
    const sharedInterests = presence.interests.filter(i => myInterestNames.includes(i));
    return {
      tribes: sharedTribes.length,
      music: sharedMusic.length,
      lookingFor: sharedLookingFor.length,
      interests: sharedInterests.length,
      sharedTribes,
      sharedMusic,
      sharedLookingFor,
      sharedInterests,
    };
  };

  // Apply filters and sort by boosted first, then compatibility
  // Helper to calculate age from birthdate
  const calculateAge = (birthdate: string): number => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const filteredProfiles = useMemo(() => {
    const boostedIds = activeBoostedData?.boostedIds || new Set<string>();
    
    const filtered = otherProfiles.filter(presence => {
      // Tribe filter - must have at least one matching tribe
      if (filters.tribes.length > 0) {
        const hasMatchingTribe = presence.tribes.some(t => filters.tribes.includes(t));
        if (!hasMatchingTribe) return false;
      }

      // Music filter - must have at least one matching style
      if (filters.musicStyles.length > 0) {
        const hasMatchingMusic = presence.musicStyles.some(m => filters.musicStyles.includes(m));
        if (!hasMatchingMusic) return false;
      }

      // Looking for filter - must have at least one matching option
      if (filters.lookingFor.length > 0) {
        const userLookingFor = presence.profile?.looking_for || [];
        const hasMatchingLookingFor = userLookingFor.some(l => filters.lookingFor.includes(l));
        if (!hasMatchingLookingFor) return false;
      }

      // Details filter - must have all selected details
      if (filters.details.length > 0) {
        for (const detail of filters.details) {
          if (detail === "has_tattoos" && !presence.profile?.has_tattoos) return false;
          if (detail === "has_piercings" && !presence.profile?.has_piercings) return false;
          if (detail === "alternative_aesthetic" && !presence.profile?.alternative_aesthetic) return false;
        }
      }

      // Age range filter
      if (filters.ageRange && (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 99)) {
        const birthdate = (presence.profile as any)?.birthdate;
        if (!birthdate) return false; // Hide profiles without birthdate when age filter is active
        const age = calculateAge(birthdate);
        if (age < filters.ageRange[0] || age > filters.ageRange[1]) return false;
      }

      // Gender filter - must match at least one selected gender
      if (filters.genders && filters.genders.length > 0) {
        const profileGender = presence.profile?.gender as typeof filters.genders[number] | null;
        if (!profileGender) return false; // Hide profiles without gender when filter is active
        if (!filters.genders.includes(profileGender)) return false;
      }

      // City filter - must match at least one selected city
      if (filters.cities && filters.cities.length > 0) {
        const profileCity = (presence.profile as any)?.city;
        if (!profileCity) return false; // Hide profiles without city when filter is active
        if (!filters.cities.includes(profileCity)) return false;
      }

      // Minimum compatibility filter
      if (filters.minCompatibility && filters.minCompatibility > 0) {
        const compat = getCompatibility(presence);
        if (compat < filters.minCompatibility) return false;
      }

      // Interests filter - must have at least one matching interest
      if (filters.interests && filters.interests.length > 0) {
        const hasMatchingInterest = presence.interests.some(i => filters.interests.includes(i));
        if (!hasMatchingInterest) return false;
      }

      // Hide visited filter - hide profiles already visited
      if (filters.hideVisited) {
        const profileId = presence.profile?.id;
        if (profileId && visitedMap[profileId]) return false;
      }

      return true;
    });

    // Sort: boosted first, then active users by compatibility, then inactive by last connection
    return filtered.sort((a, b) => {
      const aIsBoosted = boostedIds.has(a.profile?.id || "");
      const bIsBoosted = boostedIds.has(b.profile?.id || "");
      
      // Boosted profiles come first
      if (aIsBoosted && !bIsBoosted) return -1;
      if (!aIsBoosted && bIsBoosted) return 1;
      
      // Check if users are currently active (last 5 min)
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      const aLastPulse = a.last_pulse ? new Date(a.last_pulse).getTime() : 0;
      const bLastPulse = b.last_pulse ? new Date(b.last_pulse).getTime() : 0;
      const aIsActive = a.is_present && aLastPulse >= fiveMinutesAgo;
      const bIsActive = b.is_present && bLastPulse >= fiveMinutesAgo;
      
      // Active users come before inactive
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      
      // Among active users, sort by compatibility
      if (aIsActive && bIsActive) {
        return getCompatibility(b) - getCompatibility(a);
      }
      
      // Among inactive users, sort by last connection (most recent first)
      return bLastPulse - aLastPulse;
    });
    
    return filtered;
  }, [otherProfiles, filters, myTribeNames, myStyleNames, activeBoostedData?.boostedIds, visitedMap]);

  // Auto-scroll to center profile cards when loaded
  useEffect(() => {
    if (!isLoading && filteredProfiles.length > 0 && profileCardsRef.current && !hasAutoScrolledRef.current) {
      hasAutoScrolledRef.current = true;
      // Small delay to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        const element = profileCardsRef.current;
        if (element) {
          const rect = element.getBoundingClientRect();
          const scrollTop = window.scrollY + rect.top - 80; // 80px offset from top for header
          window.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });
        }
      });
    }
  }, [isLoading, filteredProfiles.length]);

  const handleRefresh = async () => {
    await refetch();
  };

  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <main className="min-h-screen bg-background flex flex-col px-4 sm:px-6 py-6 sm:py-8 pb-24">
      {/* Header - optimized for mobile */}
      <PageHeader 
        backLabel="Perfil" 
        backTo="/profile" 
        rightContent={
          <PresenceHeaderActions
            pendingConnectionCount={pendingConnectionCount}
            unreadGhostCount={unreadGhostCount}
            unreadCount={unreadCount}
            quedadaCount={quedadaCount}
            totalSparkCount={totalSparkCount}
            hasNewSparks={hasNewSparks}
            newSparkCount={newSparkCount}
            markAllAsSeen={markAllAsSeen}
            myPresenceVisible={myPresence?.visible_to_others ?? true}
            toggleVisibility={toggleVisibility}
            openTutorial={openTutorial}
          />
        }
      />

      {/* NEW Spark notification banner - only show when there are new unseen sparks */}
      {hasNewSparks && (
        <button
          onClick={() => {
            markAllAsSeen();
            // Navigate to first spark's profile (profile-first flow)
            const firstSparkProfileId = newSparks[0]?.other_profile?.id;
            navigate(firstSparkProfileId ? `/user/${firstSparkProfileId}` : "/sparks");
          }}
          className="mb-6 bg-gradient-to-r from-primary/20 to-accent/10 rounded-2xl p-4 flex items-center gap-3 animate-fade-up hover:scale-[1.02] transition-all border border-primary/30 shadow-lg shadow-primary/10"
        >
          <div className="relative w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse-soft" />
            <Flame className="w-6 h-6 text-primary animate-spark-flame relative z-10" />
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-primary animate-bounce" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-display font-semibold text-card-foreground">
              {newSparkCount === 1 ? "🔥 ¡Nueva chispa!" : `🔥 ${newSparkCount} nuevas chispas`}
            </p>
            <p className="font-body text-xs text-card-foreground/60">
              {newSparks[0]?.other_profile?.name 
                ? `${newSparks[0].other_profile.name}${newSparkCount > 1 ? " y más" : ""} quiere conectar`
                : "Alguien quiere conectar contigo"}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">{newSparkCount}</span>
          </div>
        </button>
      )}

      {/* Main content */}
      <div className="flex-1 max-w-lg mx-auto w-full">
        {/* Hero text - optimized for mobile */}
        <div className="text-center mb-10 animate-fade-up">
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4 leading-tight">
            Hay personas con vibra
            <br />
            <span className="text-primary">ahora en {profile?.city || "Madrid"}.</span>
          </h1>
          <p className="font-body text-sm sm:text-base text-muted-foreground">
            Entra. Observa. Conecta si lo sientes.
          </p>
        </div>

        {/* Cards container - symmetric spacing with staggered animation */}
        <PresenceTopCards
          myPresence={myPresence}
          invisibleAnimating={invisibleAnimating}
          canUseInvisibleMode={canUseInvisibleMode}
          toggleVisibility={toggleVisibility}
          setPresence={setPresence}
          boostTimeRemaining={boostTimeRemaining}
          createCheckout={createCheckout}
        />


        <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
          <DialogContent className="max-w-sm bg-card border-border">
            <DialogHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
                <EyeOff className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="font-display text-xl text-card-foreground">
                Modo Invisible es Premium
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-left space-y-3 pt-4">
                  <p className="font-body text-sm text-card-foreground/80">
                    <strong className="text-card-foreground">La privacidad se paga.</strong> El modo invisible te permite:
                  </p>
                  <ul className="space-y-2 text-sm text-card-foreground">
                    <li className="flex items-start gap-2">
                      <Eye className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <span><strong>Ver sin ser visto</strong> — Observa quién está presente sin aparecer en la lista</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <span><strong>Control total</strong> — Decides cuándo revelarte y cuándo no</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <span><strong>Ventaja social</strong> — Quien observa tiene el poder de elegir</span>
                    </li>
                  </ul>
                  <p className="text-xs text-card-foreground/60 pt-2 border-t border-border mt-4">
                    En un mundo de sobreexposición, la invisibilidad es un lujo.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 pt-2">
              <Button 
                onClick={() => {
                  setShowPremiumModal(false);
                  navigate("/subscription");
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25"
              >
                <Crown className="w-4 h-4 mr-2" />
                Desbloquear con Premium
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowPremiumModal(false)}
                className="text-card-foreground/70 hover:text-card-foreground"
              >
                Quizás luego
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Filters */}
        <PresenceFiltersComponent 
          filters={filters} 
          onChange={setFilters} 
          availableCities={availableCities}
          onRealtimeUpsell={handleRealtimeUpsell}
        />

        {/* Presence indicator */}
        <div className="flex items-center justify-center gap-2 mb-10 animate-fade-up animate-delay-100">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
          <span className="font-body text-sm text-muted-foreground">
            {filteredProfiles.length} {filteredProfiles.length === 1 ? "persona" : "personas"}
            {filters.tribes.length > 0 || filters.musicStyles.length > 0 || filters.details.length > 0 || filters.lookingFor.length > 0
              ? " (filtrado)" 
              : " presentes"}
          </span>
          {!myPresence?.visible_to_others && (
            <span className="font-body text-xs text-muted-foreground/60 ml-2">
              (tú invisible)
            </span>
          )}
        </div>

        {/* Profile cards with auto-scroll ref */}
        <div ref={profileCardsRef}>
          {isLoading ? (
            <FullScreenPresenceSkeleton showStackedCards />
          ) : isError ? (
            <ErrorState
              icon={Sparkles}
              description="No pudimos cargar la presencia. Revisa tu conexión."
              onRetry={() => refetch()}
              isRetrying={isFetching}
            />
          ) : filteredProfiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 animate-fade-up">
              {/* Animated icon */}
              <div className="relative mb-6">
                {/* Pulsing rings */}
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-2 w-20 h-20 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                
                {/* Main icon container */}
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Sparkles className="w-10 h-10 text-primary" />
                  </motion.div>
                </div>
                
                {/* Floating sparkles */}
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-primary/60"
                    style={{
                      left: `${20 + i * 20}%`,
                      top: `${10 + (i % 2) * 60}%`,
                    }}
                    animate={{
                      y: [-5, 5, -5],
                      opacity: [0.4, 1, 0.4],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 2 + i * 0.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </div>
              
              {/* Text content with stagger animation */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display text-xl font-semibold text-foreground mb-2 text-center"
              >
                {otherProfiles.length === 0 
                  ? "¡Has visto a todos!" 
                  : "Sin coincidencias"}
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-body text-sm text-muted-foreground max-w-[280px] mx-auto text-center leading-relaxed mb-6"
              >
                {otherProfiles.length === 0 
                  ? "No hay más personas conectadas ahora. Activa notificaciones para saber cuando alguien nuevo aparezca."
                  : "No hay personas que coincidan con tus filtros. Prueba con otros criterios."}
              </motion.p>
              
              {/* Actions */}
              {otherProfiles.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col gap-3 w-full max-w-[240px]"
                >
                  <Button
                    onClick={() => navigate('/profile')}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Configurar notificaciones
                  </Button>
                  <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isFetching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Radio className="w-3.5 h-3.5" />
                    )}
                    Refrescar presencia
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <>
              <FullScreenPresenceList
                profiles={filteredProfiles}
                connectedProfileIds={connectedProfileIds}
                photosMap={photosMap}
                getCompatibility={getCompatibility}
                getCompatibilityBreakdown={getCompatibilityBreakdown}
              />
              {/* Infinite scroll trigger */}
              <div ref={loadMoreRef} className="h-4" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center font-body text-xs text-muted-foreground/60 mt-10 animate-fade-up animate-delay-500">
          La presencia no revela ubicación exacta.
          <br />
          Solo cercanía emocional.
        </p>
      </div>
      
      {/* Interactive Tutorial */}
      <InteractiveTutorial 
        isOpen={isTutorialOpen} 
        onClose={closeTutorial} 
        onComplete={completeTutorial}
      />
    </main>
    </PullToRefresh>
  );
};

export default Presence;
