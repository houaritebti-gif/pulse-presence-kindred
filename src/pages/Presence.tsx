import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Mock profiles
const MOCK_PROFILES = [
  { id: 1, name: "Luna", vibe: "Misteriosa", tribes: ["Queer", "Artista"], delay: "animate-delay-100" },
  { id: 2, name: "Mar", vibe: "Libre", tribes: ["Nómada", "Indie"], delay: "animate-delay-200" },
  { id: 3, name: "Sol", vibe: "Intensa", tribes: ["Noctámbula"], delay: "animate-delay-300" },
  { id: 4, name: "Nube", vibe: "Tranqui", tribes: ["Foodie", "Artista"], delay: "animate-delay-400" },
  { id: 5, name: "Rio", vibe: "Curiosa", tribes: ["Queer", "Nómada"], delay: "animate-delay-500" },
];

const Presence = () => {
  const navigate = useNavigate();

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
        <div className="w-16" /> {/* Spacer */}
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-lg mx-auto w-full">
        {/* Hero text */}
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">
            Hay personas con vibra
            <br />
            <span className="text-primary">ahora en Madrid.</span>
          </h1>
          <p className="font-body text-muted-foreground">
            Entra. Observa. Conecta si lo sientes.
          </p>
        </div>

        {/* Presence indicator */}
        <div className="flex items-center justify-center gap-2 mb-10 animate-fade-up animate-delay-100">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
          <span className="font-body text-sm text-muted-foreground">
            {MOCK_PROFILES.length} personas presentes
          </span>
        </div>

        {/* Profile cards */}
        <div className="space-y-4">
          {MOCK_PROFILES.map((profile) => (
            <button
              key={profile.id}
              onClick={() => navigate("/chat")}
              className={`w-full bg-card rounded-2xl p-6 text-left transition-all hover:scale-[1.02] animate-fade-up ${profile.delay}`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar placeholder */}
                <div className="w-14 h-14 rounded-full bg-card-foreground/10 flex-shrink-0" />
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-lg font-semibold text-card-foreground">
                      {profile.name}
                    </h3>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
                  </div>
                  <p className="font-body text-sm text-card-foreground/70 mb-3">
                    Vibra {profile.vibe.toLowerCase()}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.tribes.map(tribe => (
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
