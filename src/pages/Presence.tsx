import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Flame, Calendar, Bell, Sparkles, Ghost } from "lucide-react";
import { usePresenceList, useMyPresence, useSetPresence, usePresenceHeartbeat } from "@/hooks/usePresence";
import { useProfile, useProfileTribes, useProfileMusicStyles } from "@/hooks/useProfile";
import { useNewSparks } from "@/hooks/useNewSparks";
import { useQuedadas } from "@/hooks/useQuedadas";
import { useUnreadNotificationCount } from "@/hooks/useNotificationCenter";
import { useUnreadGhostMessageCount } from "@/hooks/useReceivedGhostMessages";
import { useBlockedUsers } from "@/hooks/useUserModeration";
import PresenceFiltersComponent, { PresenceFilters } from "@/components/PresenceFilters";
import PresenceCard from "@/components/PresenceCard";
const Presence = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: myTribes } = useProfileTribes(profile?.id);
  const { data: myMusicStyles } = useProfileMusicStyles(profile?.id);
  const { data: presenceList, isLoading, isError } = usePresenceList();
  const { data: myPresence } = useMyPresence();
  const setPresence = useSetPresence();
  const { newSparkCount, hasNewSparks, totalSparkCount, markAllAsSeen, newSparks } = useNewSparks();
  const { data: quedadas } = useQuedadas();
  const quedadaCount = quedadas?.length || 0;
  const unreadCount = useUnreadNotificationCount();
  const unreadGhostCount = useUnreadGhostMessageCount();
  const { data: blockedIds } = useBlockedUsers();

  // My tribes and music for compatibility calculation
  const myTribeNames = useMemo(() => myTribes?.map(t => t.tribe) || [], [myTribes]);
  const myStyleNames = useMemo(() => myMusicStyles?.map(m => m.style) || [], [myMusicStyles]);

  // Filters state
  const [filters, setFilters] = useState<PresenceFilters>({
    tribes: [],
    musicStyles: [],
    details: [],
  });

  // Enable heartbeat
  usePresenceHeartbeat();

  // Auto-set presence when entering
  useEffect(() => {
    if (profile && !myPresence) {
      setPresence.mutate({ isPresent: true, visibleToOthers: true });
    }
  }, [profile, myPresence]);

  const toggleVisibility = () => {
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

  // Calculate compatibility for each presence
  const getCompatibility = (presence: typeof otherProfiles[0]) => {
    const sharedTribes = presence.tribes.filter(t => myTribeNames.includes(t));
    const sharedMusic = presence.musicStyles.filter(m => myStyleNames.includes(m));
    return sharedTribes.length + sharedMusic.length;
  };

  // Apply filters and sort by compatibility
  const filteredProfiles = useMemo(() => {
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

    // Sort by compatibility (highest first)
    return filtered.sort((a, b) => getCompatibility(b) - getCompatibility(a));
  }, [otherProfiles, filters, myTribeNames, myStyleNames]);

  return (
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
        <div className="flex items-center gap-3">
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
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">
            Hay personas con vibra
            <br />
            <span className="text-primary">ahora en {profile?.city || "Madrid"}.</span>
          </h1>
          <p className="font-body text-muted-foreground">
            Entra. Observa. Conecta si lo sientes.
          </p>
        </div>

        {/* Filters */}
        <PresenceFiltersComponent filters={filters} onChange={setFilters} />

        {/* Presence indicator */}
        <div className="flex items-center justify-center gap-2 mb-10 animate-fade-up animate-delay-100">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
          <span className="font-body text-sm text-muted-foreground">
            {filteredProfiles.length} {filteredProfiles.length === 1 ? "persona" : "personas"}
            {filters.tribes.length > 0 || filters.musicStyles.length > 0 || filters.details.length > 0 
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
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-12 animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-destructive/50" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              Error de conexión
            </h3>
            <p className="font-body text-sm text-muted-foreground/60 max-w-[240px] mx-auto">
              No pudimos cargar la presencia. Revisa tu conexión.
            </p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12 animate-fade-up">
            <p className="font-body text-muted-foreground mb-4">
              {otherProfiles.length === 0 
                ? "Nadie más está presente ahora."
                : "No hay personas que coincidan con tus filtros."}
            </p>
            <p className="font-body text-sm text-muted-foreground/60">
              {otherProfiles.length === 0 
                ? "Quédate un rato. Alguien aparecerá."
                : "Prueba con otros criterios."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProfiles.map((presence, index) => (
              <PresenceCard
                key={presence.id}
                presence={presence}
                compatibility={getCompatibility(presence)}
                animationDelay={(index + 1) * 100}
              />
            ))}
          </div>
        )}

        {/* Footer note */}
        <p className="text-center font-body text-xs text-muted-foreground/60 mt-10 animate-fade-up animate-delay-500">
          La presencia no revela ubicación exacta.
          <br />
          Solo cercanía emocional.
        </p>
      </div>
    </main>
  );
};

export default Presence;
