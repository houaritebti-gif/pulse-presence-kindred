import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { usePresenceList, useMyPresence, useSetPresence, usePresenceHeartbeat } from "@/hooks/usePresence";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";

const Presence = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: presenceList, isLoading } = usePresenceList();
  const { data: myPresence } = useMyPresence();
  const setPresence = useSetPresence();

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

  return (
    <main className="min-h-screen bg-background flex flex-col px-6 py-8">
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
        <button
          onClick={toggleVisibility}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          title={myPresence?.visible_to_others ? "Modo visible" : "Modo invisible"}
        >
          {myPresence?.visible_to_others ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
      </div>

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

        {/* Presence indicator */}
        <div className="flex items-center justify-center gap-2 mb-10 animate-fade-up animate-delay-100">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
          <span className="font-body text-sm text-muted-foreground">
            {otherProfiles.length} {otherProfiles.length === 1 ? "persona presente" : "personas presentes"}
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
        ) : otherProfiles.length === 0 ? (
          <div className="text-center py-12 animate-fade-up">
            <p className="font-body text-muted-foreground mb-4">
              Nadie más está presente ahora.
            </p>
            <p className="font-body text-sm text-muted-foreground/60">
              Quédate un rato. Alguien aparecerá.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {otherProfiles.map((presence, index) => (
              <button
                key={presence.id}
                onClick={() => navigate(`/chat/${presence.profile?.id}`)}
                className={`w-full bg-card rounded-2xl p-6 text-left transition-all hover:scale-[1.02] animate-fade-up`}
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar placeholder */}
                  <div className="w-14 h-14 rounded-full bg-card-foreground/10 flex-shrink-0" />
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-lg font-semibold text-card-foreground">
                        {presence.profile?.name || "Anónima"}
                      </h3>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
                    </div>
                    <p className="font-body text-sm text-card-foreground/70 mb-3">
                      Vibra {presence.profile?.vibe?.toLowerCase() || "misteriosa"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {presence.tribes.map(tribe => (
                        <span 
                          key={tribe}
                          className="px-2.5 py-1 rounded-full bg-card-foreground/10 font-body text-xs text-card-foreground/80"
                        >
                          {tribe}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
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
