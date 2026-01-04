import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Flame, Calendar, Bell, Sparkles, Ghost, UserPlus, Loader2, Radio, Crown, Lock, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePresenceList, useMyPresence, useSetPresence, usePresenceHeartbeat } from "@/hooks/usePresence";
import { useRetrySuccessToast } from "@/hooks/useRetrySuccessToast";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useLocalStorage, STORAGE_KEYS } from "@/hooks/useLocalStorage";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import { useProfile, useProfileTribes, useProfileMusicStyles } from "@/hooks/useProfile";
import { useNewSparks } from "@/hooks/useNewSparks";
import { useQuedadas } from "@/hooks/useQuedadas";
import { useUnreadNotificationCount } from "@/hooks/useNotificationCenter";
import { useUnreadGhostMessageCount } from "@/hooks/useReceivedGhostMessages";
import { useBlockedUsers } from "@/hooks/useUserModeration";
import { useMultipleProfilePhotos } from "@/hooks/useProfilePhotos";
import { useSentConnectionRequests, usePendingConnectionRequestCount } from "@/hooks/useConnectionRequests";
import PresenceFiltersComponent, { PresenceFilters } from "@/components/PresenceFilters";
import { PullToRefresh } from "@/components/PullToRefresh";
import VirtualizedPresenceList from "@/components/VirtualizedPresenceList";
import PresenceListSkeleton from "@/components/PresenceListSkeleton";
import { useSubscription } from "@/hooks/useSubscription";
import { useMyKikiNowBoost, useCreateKikiNowCheckout, useVerifyKikiNowBoost, useActiveBoostedProfiles, getBoostTimeRemaining } from "@/hooks/useKikiNow";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Presence = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: profile } = useProfile();
  const { data: myTribes } = useProfileTribes(profile?.id);
  const { data: myMusicStyles } = useProfileMusicStyles(profile?.id);
  // Filters state persisted to localStorage - moved up to use in hook
  const [filters, setFilters] = useLocalStorage<PresenceFilters>(
    STORAGE_KEYS.PRESENCE_FILTERS,
    { tribes: [], musicStyles: [], details: [], lookingFor: [], showAllProfiles: false }
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
  const { canUseInvisibleMode, isPremium } = useSubscription();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [invisibleAnimating, setInvisibleAnimating] = useState(false);

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

  // My tribes, music and looking_for for compatibility calculation
  const myTribeNames = useMemo(() => myTribes?.map(t => t.tribe) || [], [myTribes]);
  const myStyleNames = useMemo(() => myMusicStyles?.map(m => m.style) || [], [myMusicStyles]);
  const myLookingFor = useMemo(() => profile?.looking_for || [], [profile?.looking_for]);

  // Filters now defined earlier to use in usePresenceList

  // Enable heartbeat
  usePresenceHeartbeat();

  // Auto-set presence when entering
  useEffect(() => {
    if (profile && !myPresence) {
      setPresence.mutate({ isPresent: true, visibleToOthers: true });
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

  // Get all profile IDs for batch photo fetch
  const profileIds = useMemo(() => 
    otherProfiles.map(p => p.profile?.id).filter(Boolean) as string[],
    [otherProfiles]
  );

  // Fetch all photos in one query
  const { data: photosMap } = useMultipleProfilePhotos(profileIds);

  // Calculate compatibility for each presence (tribes + music + looking_for)
  const getCompatibility = (presence: typeof otherProfiles[0]) => {
    const sharedTribes = presence.tribes.filter(t => myTribeNames.includes(t));
    const sharedMusic = presence.musicStyles.filter(m => myStyleNames.includes(m));
    const theirLookingFor = presence.profile?.looking_for || [];
    const sharedLookingFor = theirLookingFor.filter(l => myLookingFor.includes(l));
    return sharedTribes.length + sharedMusic.length + sharedLookingFor.length;
  };

  // Get compatibility breakdown for tooltip
  const getCompatibilityBreakdown = (presence: typeof otherProfiles[0]) => {
    const sharedTribes = presence.tribes.filter(t => myTribeNames.includes(t));
    const sharedMusic = presence.musicStyles.filter(m => myStyleNames.includes(m));
    const theirLookingFor = presence.profile?.looking_for || [];
    const sharedLookingFor = theirLookingFor.filter(l => myLookingFor.includes(l));
    return {
      tribes: sharedTribes.length,
      music: sharedMusic.length,
      lookingFor: sharedLookingFor.length,
    };
  };

  // Apply filters and sort by boosted first, then compatibility
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
  }, [otherProfiles, filters, myTribeNames, myStyleNames, activeBoostedData?.boostedIds]);

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
    <main className="min-h-screen bg-background flex flex-col px-6 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Perfil</span>
        </button>
        <span className="font-display text-xl font-bold text-foreground">KIKI</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Connection requests button */}
          <button
            onClick={() => navigate("/connections")}
            className="relative text-muted-foreground hover:text-foreground transition-colors"
            title="Solicitudes de conexión"
          >
            <UserPlus className={`w-5 h-5 ${pendingConnectionCount > 0 ? "text-primary" : ""}`} />
            {pendingConnectionCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
                {pendingConnectionCount > 9 ? "9+" : pendingConnectionCount}
              </span>
            )}
          </button>
          {/* Ghost messages button */}
          <button
            onClick={() => navigate("/ghost-messages")}
            className="relative text-muted-foreground hover:text-foreground transition-colors"
            title="Mensajes fantasma"
          >
            <Ghost className={`w-5 h-5 ${unreadGhostCount > 0 ? "text-primary" : ""}`} />
            {unreadGhostCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
                {unreadGhostCount > 9 ? "9+" : unreadGhostCount}
              </span>
            )}
          </button>
          {/* Notifications button */}
          <button
            onClick={() => navigate("/notifications")}
            className="relative text-muted-foreground hover:text-foreground transition-colors"
            title="Notificaciones"
          >
            <Bell className={`w-5 h-5 ${unreadCount > 0 ? "text-primary" : ""}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {/* Quedadas button */}
          <button
            onClick={() => navigate("/quedadas")}
            className="relative text-muted-foreground hover:text-foreground transition-colors"
            title="Quedadas"
          >
            <Calendar className={`w-5 h-5 ${quedadaCount > 0 ? "text-accent" : ""}`} />
            {quedadaCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                {quedadaCount}
              </span>
            )}
          </button>
          {/* Sparks button with badge */}
          <button
            onClick={() => {
              markAllAsSeen();
              navigate("/sparks");
            }}
            className="relative text-muted-foreground hover:text-foreground transition-colors"
            title="Tus chispas"
          >
            <Flame className={`w-5 h-5 ${totalSparkCount > 0 ? "text-primary" : ""}`} />
            {hasNewSparks && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
                {newSparkCount}
              </span>
            )}
          </button>
          <button
            onClick={toggleVisibility}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={myPresence?.visible_to_others ? "Modo visible" : "Modo invisible"}
          >
            {myPresence?.visible_to_others ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* NEW Spark notification banner - only show when there are new unseen sparks */}
      {hasNewSparks && (
        <button
          onClick={() => {
            markAllAsSeen();
            navigate("/sparks");
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
        {/* Hero text */}
        <div className="text-center mb-8 animate-fade-up">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">
            Hay personas con vibra
            <br />
            <span className="text-primary">ahora en {profile?.city || "Madrid"}.</span>
          </h1>
          <p className="font-body text-muted-foreground">
            Entra. Observa. Conecta si lo sientes.
          </p>
        </div>

        {/* Presence toggle - prominent */}
        <div className={`rounded-2xl p-4 mb-8 animate-fade-up border shadow-sm transition-all duration-300 ${
          myPresence?.visible_to_others 
            ? "bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 border-primary/30" 
            : "bg-card border-border"
        } ${invisibleAnimating ? "animate-invisible-glow" : ""}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                myPresence?.visible_to_others 
                  ? "bg-primary/30 shadow-lg shadow-primary/20" 
                  : "bg-muted"
              }`}>
                {myPresence?.visible_to_others ? (
                  <Radio className="w-6 h-6 text-primary animate-pulse" />
                ) : (
                  <EyeOff className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className={`font-display font-semibold ${
                    myPresence?.visible_to_others ? "text-primary" : "text-card-foreground"
                  }`}>
                    {myPresence?.visible_to_others ? "Estoy por aquí" : "Modo invisible"}
                  </p>
                  {!canUseInvisibleMode && !myPresence?.visible_to_others && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold">
                      <Crown className="w-3 h-3" />
                      Premium
                    </span>
                  )}
                  {canUseInvisibleMode && !myPresence?.visible_to_others && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold">
                      ✨ Activado
                    </span>
                  )}
                </div>
                <p className="font-body text-xs text-muted-foreground">
                  {myPresence?.visible_to_others 
                    ? "Otros pueden verte en la lista" 
                    : canUseInvisibleMode 
                      ? "Nadie puede verte, pero tú sí" 
                      : "Activa Premium para ser invisible"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!canUseInvisibleMode && (
                <Lock className="w-4 h-4 text-amber-500" />
              )}
              <Switch
                checked={myPresence?.visible_to_others ?? true}
                onCheckedChange={toggleVisibility}
                disabled={setPresence.isPending}
                className={myPresence?.visible_to_others ? "data-[state=checked]:bg-primary" : ""}
              />
            </div>
          </div>
        </div>

        {/* KIKI Now Boost Card */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 rounded-2xl p-4 mb-8 animate-fade-up border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                boostTimeRemaining 
                  ? "bg-gradient-to-br from-primary to-accent animate-pulse" 
                  : "bg-primary/20"
              }`}>
                <Zap className={`w-5 h-5 ${boostTimeRemaining ? "text-white" : "text-primary"}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display font-semibold text-card-foreground">
                    KIKI Now
                  </p>
                  {boostTimeRemaining && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold animate-pulse">
                      🔥 {boostTimeRemaining.minutes}:{boostTimeRemaining.seconds.toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
                <p className="font-body text-xs text-muted-foreground">
                  {boostTimeRemaining 
                    ? "¡Estás destacado! Apareces primero en la lista" 
                    : "Destaca durante 1 hora — 1,99€"}
                </p>
              </div>
            </div>
            {!boostTimeRemaining && (
              <Button
                variant="kiki"
                size="sm"
                onClick={() => createCheckout.mutate()}
                disabled={createCheckout.isPending}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {createCheckout.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-1" />
                    Activar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

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
        <PresenceFiltersComponent filters={filters} onChange={setFilters} />

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

        {/* Profile cards */}
        {isLoading ? (
          <PresenceListSkeleton count={3} />
        ) : isError ? (
          <ErrorState
            icon={Sparkles}
            description="No pudimos cargar la presencia. Revisa tu conexión."
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        ) : filteredProfiles.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={otherProfiles.length === 0 ? "Nadie más está presente" : "Sin coincidencias"}
            description={otherProfiles.length === 0 
              ? "Quédate un rato. Alguien aparecerá."
              : "No hay personas que coincidan con tus filtros. Prueba con otros criterios."}
          />
        ) : (
          <>
            <VirtualizedPresenceList
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

        {/* Footer note */}
        <p className="text-center font-body text-xs text-muted-foreground/60 mt-10 animate-fade-up animate-delay-500">
          La presencia no revela ubicación exacta.
          <br />
          Solo cercanía emocional.
        </p>
      </div>
    </main>
    </PullToRefresh>
  );
};

export default Presence;
