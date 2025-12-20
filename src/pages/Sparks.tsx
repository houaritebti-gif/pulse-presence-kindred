import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, MessageCircle } from "lucide-react";
import { useSparkChats } from "@/hooks/useSparks";

const Sparks = () => {
  const navigate = useNavigate();
  const { data: chats, isLoading } = useSparkChats();

  return (
    <main className="min-h-screen bg-background flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate("/presence")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Presencia</span>
        </button>
        <span className="font-display text-xl font-bold text-foreground">KIKI</span>
        <div className="w-20" />
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Flame className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Tus chispas
          </h1>
          <p className="font-body text-muted-foreground text-sm">
            Conexiones mutuas. Conversaciones reales.
          </p>
        </div>

        {/* Chats list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chats?.length === 0 ? (
          <div className="text-center py-12 animate-fade-up">
            <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-body text-muted-foreground mb-2">
              Aún no hay chispas.
            </p>
            <p className="font-body text-sm text-muted-foreground/60">
              Envía mensajes fantasma y espera la magia.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats?.map((chat, index) => (
              <button
                key={chat.id}
                onClick={() => navigate(`/spark/${chat.id}`)}
                className="w-full bg-card rounded-2xl p-5 text-left transition-all hover:scale-[1.02] animate-fade-up flex items-center gap-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-card-foreground/10 flex-shrink-0 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-primary" />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-card-foreground">
                    {chat.other_profile?.name || "Anónima"}
                  </h3>
                  <p className="font-body text-sm text-card-foreground/60">
                    Vibra {chat.other_profile?.vibe?.toLowerCase() || "misteriosa"}
                  </p>
                </div>

                {/* Indicator */}
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-center font-body text-xs text-muted-foreground/60 mt-10">
          Las chispas son privadas.
          <br />
          Sin typing. Sin leído. Sin presión.
        </p>
      </div>
    </main>
  );
};

export default Sparks;
