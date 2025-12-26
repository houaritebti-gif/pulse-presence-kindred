import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, MessageCircle, Sparkles } from "lucide-react";
import { useSparkChats } from "@/hooks/useSparks";

const Sparks = () => {
  const navigate = useNavigate();
  const { data: chats, isLoading } = useSparkChats();

  return (
    <main className="min-h-screen bg-background flex flex-col px-6 py-8 pb-24 relative overflow-hidden">
      {/* Ambient glow backgrounds */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 right-0 w-[300px] h-[300px] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate("/presence")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 font-body group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Presencia</span>
        </button>
        <span className="font-display text-xl font-bold text-foreground">KIKI</span>
        <div className="w-20" />
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full relative z-10">
        {/* Hero section */}
        <div className="text-center mb-12 animate-fade-up">
          {/* Animated spark icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse-soft" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center ring-2 ring-primary/20 ring-offset-4 ring-offset-background">
              <Flame className="w-10 h-10 text-primary animate-spark-flame" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-primary/60 animate-pulse-soft" />
            <Sparkles className="absolute -bottom-2 -left-2 w-4 h-4 text-accent/50 animate-pulse-soft animate-delay-300" />
          </div>
          
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">
            Tus chispas
          </h1>
          <p className="font-body text-muted-foreground">
            Conexiones mutuas. Conversaciones reales.
          </p>
        </div>

        {/* Chats list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="relative">
              <Flame className="w-10 h-10 text-primary animate-spark-flame" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            </div>
          </div>
        ) : chats?.length === 0 ? (
          <div className="text-center py-16 animate-fade-up">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="w-full h-full rounded-full bg-card/50 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              Aún no hay chispas
            </h3>
            <p className="font-body text-sm text-muted-foreground/60 max-w-[240px] mx-auto leading-relaxed">
              Envía mensajes fantasma y espera que la magia ocurra.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chats?.map((chat, index) => (
              <button
                key={chat.id}
                onClick={() => navigate(`/spark/${chat.id}`)}
                className="w-full bg-card rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 animate-fade-up flex items-center gap-4 group border border-transparent hover:border-primary/20"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Avatar with spark indicator */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-card transition-all duration-300 group-hover:ring-primary/40">
                    {chat.other_profile?.avatar_url ? (
                      <img 
                        src={chat.other_profile.avatar_url} 
                        alt={chat.other_profile.name || "Avatar"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                        <span className="font-display text-lg text-card-foreground">
                          {(chat.other_profile?.name?.[0] || "?").toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Flame badge */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card flex items-center justify-center shadow-md">
                    <Flame className="w-3.5 h-3.5 text-primary animate-spark-flame" />
                  </div>
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-semibold text-card-foreground text-lg">
                      {chat.other_profile?.name || "Anónima"}
                    </h3>
                  </div>
                  <p className="font-body text-sm text-card-foreground/50">
                    Vibra {chat.other_profile?.vibe?.toLowerCase() || "misteriosa"}
                  </p>
                </div>

                {/* Unread indicator or active dot */}
                <div className="flex items-center gap-2">
                  {chat.unread_count && chat.unread_count > 0 ? (
                    <div className="min-w-6 h-6 px-2 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/50 animate-pulse-soft">
                      <span className="text-xs font-bold text-primary-foreground">
                        {chat.unread_count > 9 ? "9+" : chat.unread_count}
                      </span>
                    </div>
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center animate-fade-up animate-delay-500">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/30 border border-border/20">
            <Sparkles className="w-3.5 h-3.5 text-primary/60" />
            <p className="font-body text-xs text-muted-foreground">
              Sin typing · Sin leído · Sin presión
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Sparks;
