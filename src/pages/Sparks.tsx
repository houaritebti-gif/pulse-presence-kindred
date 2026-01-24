import { useCallback, useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Flame, MessageCircle, Sparkles, Loader2, X, BellOff } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useSparkChats, useExtinguishSpark, useSparkChatsRealtime } from "@/hooks/useSparks";
import { useMutedSparkChats } from "@/hooks/useMutedSparkChats";
import { useRetrySuccessToast } from "@/hooks/useRetrySuccessToast";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useUndoableAction } from "@/hooks/useUndoableAction";
import { PullToRefresh } from "@/components/PullToRefresh";
import NetworkErrorInline from "@/components/NetworkErrorInline";
import EmptyState from "@/components/EmptyState";
import SparksListSkeleton from "@/components/SparksListSkeleton";
import StateTransition from "@/components/StateTransition";
import ParallaxBackground from "@/components/ParallaxBackground";
import VirtualizedSparksList from "@/components/VirtualizedSparksList";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

const Sparks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: chats, isLoading, isError, refetch, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useSparkChats();
  const { mutedChats } = useMutedSparkChats();
  const extinguishSpark = useExtinguishSpark();
  const { execute: executeUndoable, isPending: isUndoPending, pendingIds } = useUndoableAction();
  
  // Subscribe to realtime updates for unread counts
  useSparkChatsRealtime();
  
  // Count muted chats that are in the current chat list
  const mutedCount = useMemo(() => {
    if (!chats || !mutedChats) return 0;
    return chats.filter(chat => mutedChats.includes(chat.id)).length;
  }, [chats, mutedChats]);
  
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

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleExtinguishSwipe = useCallback((chatId: string, chatName?: string) => {
    // Add to exiting set for visual feedback
    setExitingSparks(prev => new Set(prev).add(chatId));
    
    // Execute with undo capability
    executeUndoable(chatId, {
      timeout: 5000,
      message: `Apagando chispa${chatName ? ` con ${chatName}` : ""}...`,
      onConfirm: async () => {
        await extinguishSpark.mutateAsync(chatId);
      },
      onUndo: () => {
        // Remove from exiting set to restore visibility
        setExitingSparks(prev => {
          const next = new Set(prev);
          next.delete(chatId);
          return next;
        });
      },
      onError: () => {
        // On error, also restore visibility
        setExitingSparks(prev => {
          const next = new Set(prev);
          next.delete(chatId);
          return next;
        });
      },
    });
  }, [extinguishSpark, executeUndoable]);

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
      <PageHeader backLabel="Presencia" backTo="/presence" />

      <div className="flex-1 max-w-lg mx-auto w-full relative z-10">
        {/* Hero section - enlarged for mobile */}
        <div className="text-center mb-12 animate-fade-up">
          {/* Animated spark icon - larger */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse-soft" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center ring-2 ring-primary/20 ring-offset-4 ring-offset-background">
              <Flame className="w-12 h-12 sm:w-14 sm:h-14 text-primary animate-spark-flame" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-primary/60 animate-pulse-soft" />
            <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-accent/50 animate-pulse-soft animate-delay-300" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Tus chispas
          </h1>
          <p className="text-base sm:text-lg text-foreground/70" style={{ fontFamily: 'Arial, sans-serif' }}>
            Conexiones mutuas. Conversaciones reales.
          </p>
          {/* Muted indicator */}
          {mutedCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground">
                    <BellOff className="w-3.5 h-3.5" />
                    <span className="text-xs font-body">
                      {mutedCount} silenciada{mutedCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Gestiona tus chats silenciados en tu perfil</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {/* Swipe hint */}
          <p className="text-xs sm:text-sm text-muted-foreground/60 mt-3" style={{ fontFamily: 'Arial, sans-serif' }}>
            Desliza hacia la izquierda para apagar
          </p>
        </div>

        {/* Chats list with smooth state transitions */}
        <StateTransition
          state={currentState}
          loadingContent={<SparksListSkeleton count={4} />}
          errorContent={
            <NetworkErrorInline
              message="No pudimos cargar tus chispas"
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
          <VirtualizedSparksList
            chats={chats || []}
            exitingSparks={exitingSparks}
            pendingIds={pendingIds}
            onExtinguish={handleExtinguishSwipe}
          />
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
