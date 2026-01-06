import { useCallback, useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Flame, MessageCircle, Sparkles, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSparkChats } from "@/hooks/useSparks";
import { useRetrySuccessToast } from "@/hooks/useRetrySuccessToast";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { useStaggerAnimation } from "@/hooks/useStaggerAnimation";
import { PullToRefresh } from "@/components/PullToRefresh";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import SparkChatItem from "@/components/SparkChatItem";
import SparksListSkeleton from "@/components/SparksListSkeleton";
import StateTransition from "@/components/StateTransition";
import ParallaxBackground from "@/components/ParallaxBackground";

const Sparks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: chats, isLoading, isError, refetch, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useSparkChats();
  
  // Track sparks being extinguished with exit animation
  const [exitingSparks, setExitingSparks] = useState<Set<string>>(new Set());
  
  // Check if we're returning from an extinguished spark
  useEffect(() => {
    const extinguishedId = (location.state as { extinguishedSparkId?: string })?.extinguishedSparkId;
    if (extinguishedId) {
      setExitingSparks(new Set([extinguishedId]));
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useRetrySuccessToast({ isError, isLoading, isFetching, data: chats });

  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const { getContainerProps, getItemProps } = useListKeyboardNavigation({
    itemCount: chats?.length || 0,
    onSelect: (index) => {
      if (chats?.[index]) {
        navigate(`/spark/${chats[index].id}`);
      }
    },
  });

  const { getAnimationStyle } = useStaggerAnimation({
    itemCount: chats?.length || 0,
    baseDelay: 50,
    staggerDelay: 60,
    duration: 400,
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Determine current state for transitions
  const currentState = useMemo(() => {
    if (isLoading) return "loading" as const;
    if (isError) return "error" as const;
    if (chats?.length === 0) return "empty" as const;
    return "content" as const;
  }, [isLoading, isError, chats?.length]);

  return (
    <PullToRefresh onRefresh={handleRefresh} accentColor="primary">
    <main className="min-h-screen bg-background flex flex-col px-4 sm:px-6 py-6 sm:py-8 pb-24 relative overflow-hidden">
      {/* Parallax ambient glow backgrounds */}
      <ParallaxBackground variant="list" />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate("/presence")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 font-body group"
          aria-label="Volver a Presencia"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span style={{ fontFamily: 'Arial, sans-serif' }}>Presencia</span>
        </button>
        <span className="text-xl font-bold text-foreground" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>KIKI</span>
        <ThemeToggle />
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full relative z-10">
        {/* Hero section */}
        <div className="text-center mb-10 animate-fade-up">
          {/* Animated spark icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse-soft" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center ring-2 ring-primary/20 ring-offset-4 ring-offset-background">
              <Flame className="w-10 h-10 text-primary animate-spark-flame" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-primary/60 animate-pulse-soft" />
            <Sparkles className="absolute -bottom-2 -left-2 w-4 h-4 text-accent/50 animate-pulse-soft animate-delay-300" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Tus chispas
          </h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
            Conexiones mutuas. Conversaciones reales.
          </p>
        </div>

        {/* Chats list with smooth state transitions */}
        <StateTransition
          state={currentState}
          loadingContent={<SparksListSkeleton count={4} />}
          errorContent={
            <ErrorState
              icon={Flame}
              description="No pudimos cargar tus chispas. Revisa tu conexión e inténtalo de nuevo."
              onRetry={() => refetch()}
              isRetrying={isFetching}
            />
          }
          emptyContent={
            <EmptyState
              icon={MessageCircle}
              title="Aún no hay chispas"
              description="Envía mensajes fantasma y espera que la magia ocurra."
            />
          }
        >
          <div 
            {...getContainerProps()}
            aria-label="Lista de chispas"
            className="space-y-5 sm:space-y-6 pb-6"
          >
            {chats?.map((chat, index) => {
              const isExiting = exitingSparks.has(chat.id);
              return (
                <div 
                  key={chat.id} 
                  {...getItemProps(index)}
                  className={`transition-all duration-400 ${
                    isExiting 
                      ? 'opacity-0 scale-95 translate-x-8 pointer-events-none' 
                      : ''
                  }`}
                  style={isExiting ? { 
                    opacity: 0, 
                    transform: 'scale(0.95) translateX(2rem)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  } : undefined}
                >
                  <SparkChatItem 
                    chat={chat} 
                    animationStyle={isExiting ? undefined : getAnimationStyle(index)}
                  />
                </div>
              );
            })}
          </div>
          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="h-4" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </StateTransition>

        {/* Footer */}
        <div className="mt-12 text-center animate-fade-up animate-delay-500">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/30 border border-border/20">
            <Sparkles className="w-3.5 h-3.5 text-primary/60" />
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
              Sin typing · Sin leído · Sin presión
            </p>
          </div>
        </div>
      </div>
    </main>
    </PullToRefresh>
  );
};

export default Sparks;
