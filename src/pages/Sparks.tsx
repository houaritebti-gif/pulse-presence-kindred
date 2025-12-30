import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, MessageCircle, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSparkChats } from "@/hooks/useSparks";
import { useRetrySuccessToast } from "@/hooks/useRetrySuccessToast";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import SparkChatItem from "@/components/SparkChatItem";
import SparksListSkeleton from "@/components/SparksListSkeleton";

const Sparks = () => {
  const navigate = useNavigate();
  const { data: chats, isLoading, isError, refetch, isFetching } = useSparkChats();

  useRetrySuccessToast({ isError, isLoading, isFetching, data: chats });

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
        <ThemeToggle />
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
          <SparksListSkeleton count={4} />
        ) : isError ? (
          <ErrorState
            icon={Flame}
            description="No pudimos cargar tus chispas. Revisa tu conexión e inténtalo de nuevo."
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        ) : chats?.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Aún no hay chispas"
            description="Envía mensajes fantasma y espera que la magia ocurra."
          />
        ) : (
          <div className="space-y-4">
            {chats?.map((chat, index) => (
              <SparkChatItem 
                key={chat.id} 
                chat={chat} 
                animationDelay={index * 100} 
              />
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
