import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Flame, Calendar, Bell, Music, Sparkles, Heart } from "lucide-react";
import { usePresenceList, useMyPresence, useSetPresence, usePresenceHeartbeat } from "@/hooks/usePresence";
import { useProfile, useProfileTribes, useProfileMusicStyles } from "@/hooks/useProfile";
import { useSparkCount } from "@/hooks/useSparks";
import { useQuedadas } from "@/hooks/useQuedadas";
import { useUnreadNotificationCount } from "@/hooks/useNotificationCenter";
import PresenceFiltersComponent, { PresenceFilters } from "@/components/PresenceFilters";

const Presence = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: myTribes } = useProfileTribes(profile?.id);
  const { data: myMusicStyles } = useProfileMusicStyles(profile?.id);
  const { data: presenceList, isLoading } = usePresenceList();
  const { data: myPresence } = useMyPresence();
  const setPresence = useSetPresence();
  const sparkCount = useSparkCount();
  const { data: quedadas } = useQuedadas();
  const quedadaCount = quedadas?.length || 0;
  const unreadCount = useUnreadNotificationCount();

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

  // Filter out own profile from list
  const otherProfiles = presenceList?.filter(p => p.profile?.id !== profile?.id) || [];

  // Calculate compatibility for each presence
  const getCompatibility = (presence: typeof otherProfiles[0]) => {
    const sharedTribes = presence.tribes.filter(t => myTribeNames.includes(t));
    const sharedMusic = presence.musicStyles.filter(m => myStyleNames.includes(m));
    return sharedTribes.length + sharedMusic.length;
  };

  // Apply filters
  const filteredProfiles = useMemo(() => {
    return otherProfiles.filter(presence => {
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
  }, [otherProfiles, filters]);

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
            onClick={() => navigate("/sparks")}
            className="relative text-muted-foreground hover:text-foreground transition-colors"
            title="Tus chispas"
          >
            <Flame className={`w-5 h-5 ${sparkCount > 0 ? "text-primary" : ""}`} />
            {sparkCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
                {sparkCount}
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

      {/* Spark notification banner */}
      {sparkCount > 0 && (
        <button
          onClick={() => navigate("/sparks")}
          className="mb-6 bg-card rounded-2xl p-4 flex items-center gap-3 animate-fade-up hover:scale-[1.02] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-primary animate-pulse-soft" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-display font-semibold text-card-foreground text-sm">
              {sparkCount === 1 ? "Tienes una chispa" : `Tienes ${sparkCount} chispas`}
            </p>
            <p className="font-body text-xs text-card-foreground/60">
              Algo pasó. Toca para descubrir.
            </p>
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
            {filteredProfiles.map((presence, index) => {
              const compatibility = getCompatibility(presence);
              return (
              <button
                key={presence.id}
                onClick={() => navigate(`/user/${presence.profile?.id}`)}
                className={`w-full bg-card rounded-2xl p-6 text-left transition-all hover:scale-[1.02] animate-fade-up`}
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar with compatibility badge */}
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-card-foreground/10 flex-shrink-0 overflow-hidden">
                      {presence.profile?.avatar_url ? (
                        <img 
                          src={presence.profile.avatar_url} 
                          alt={presence.profile.name || "Avatar"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-card-foreground/40 font-display text-lg">
                          {(presence.profile?.name?.[0] || "?").toUpperCase()}
                        </div>
                      )}
                    </div>
                    {compatibility > 0 && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <Heart className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-lg font-semibold text-card-foreground">
                        {presence.profile?.name || "Anónima"}
                      </h3>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
                      {compatibility > 0 && (
                        <span className="text-xs font-body text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {compatibility} en común
                        </span>
                      )}
                    </div>
                    <p className="font-body text-sm text-card-foreground/70 mb-3">
                      Vibra {presence.profile?.vibe?.toLowerCase() || "misteriosa"}
                    </p>
                    {/* Tribes */}
                    {presence.tribes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {presence.tribes.map(tribe => (
                          <span 
                            key={tribe}
                            className="px-2.5 py-1 rounded-full bg-card-foreground/10 font-body text-xs text-card-foreground/80"
                          >
                            {tribe}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Music styles */}
                    {presence.musicStyles.length > 0 && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Music className="w-3 h-3 text-primary/70 flex-shrink-0" />
                        <p className="font-body text-xs text-card-foreground/60 truncate">
                          {presence.musicStyles.slice(0, 3).join(" · ")}
                          {presence.musicStyles.length > 3 && ` +${presence.musicStyles.length - 3}`}
                        </p>
                      </div>
                    )}

                    {/* Optional details */}
                    {(presence.profile?.has_tattoos || presence.profile?.has_piercings || presence.profile?.alternative_aesthetic) && (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-accent/70 flex-shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {presence.profile?.has_tattoos && (
                            <span className="px-2 py-0.5 rounded-full bg-accent/10 font-body text-[10px] text-accent">
                              Tatuajes
                            </span>
                          )}
                          {presence.profile?.has_piercings && (
                            <span className="px-2 py-0.5 rounded-full bg-accent/10 font-body text-[10px] text-accent">
                              Piercings
                            </span>
                          )}
                          {presence.profile?.alternative_aesthetic && (
                            <span className="px-2 py-0.5 rounded-full bg-accent/10 font-body text-[10px] text-accent">
                              Estética alt
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
              );
            })}
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
