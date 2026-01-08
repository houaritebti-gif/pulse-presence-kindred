import { useState, useCallback, useRef, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Calendar, MapPin, Users, Plus, Sparkles, Clock, MessageCircle, Trash2, Pencil, EyeOff, Loader2 } from "lucide-react";
import { useRetrySuccessToast } from "@/hooks/useRetrySuccessToast";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useStaggerAnimation } from "@/hooks/useStaggerAnimation";
import { PullToRefresh } from "@/components/PullToRefresh";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import QuedadasListSkeleton from "@/components/QuedadasListSkeleton";
import StateTransition from "@/components/StateTransition";
import { useProfile } from "@/hooks/useProfile";
import { useQuedadas, useCreateQuedada, useJoinQuedada, useLeaveQuedada, useDeleteQuedada, useUpdateQuedada, Quedada } from "@/hooks/useQuedadas";
import { useSparkEnergy } from "@/hooks/useSparkEnergy";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import confetti from "canvas-confetti";
import { playCelebrationSound } from "@/utils/notificationSound";
import QuedadaCreatorHeader from "@/components/QuedadaCreatorHeader";
import ParallaxBackground from "@/components/ParallaxBackground";
import { motion, AnimatePresence } from "framer-motion";

const Quedadas = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: quedadas, isLoading, isError, refetch, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useQuedadas();
  const createQuedada = useCreateQuedada();
  const joinQuedada = useJoinQuedada();
  const leaveQuedada = useLeaveQuedada();
  const deleteQuedada = useDeleteQuedada();
  const updateQuedada = useUpdateQuedada();
  const { earnEnergy, canDoAction } = useSparkEnergy();

  useRetrySuccessToast({ isError, isLoading, isFetching, data: quedadas });

  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const { getAnimationStyle } = useStaggerAnimation({
    itemCount: quedadas?.length || 0,
    baseDelay: 50,
    staggerDelay: 70,
    duration: 450,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editingQuedada, setEditingQuedada] = useState<Quedada | null>(null);
  const [activeTab, setActiveTab] = useState<"explore" | "mine">("explore");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationHint, setLocationHint] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [privateAttendees, setPrivateAttendees] = useState(false);
  
  // Track quedadas being removed with exit animation
  const [exitingQuedadas, setExitingQuedadas] = useState<Set<string>>(new Set());
  const exitTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Filter quedadas based on active tab
  const filteredQuedadas = useMemo(() => {
    if (!quedadas || !profile?.id) return quedadas;
    if (activeTab === "mine") {
      return quedadas.filter(q => q.creator_profile_id === profile.id || q.is_attending);
    }
    return quedadas;
  }, [quedadas, activeTab, profile?.id]);

  // Count quedadas for each tab
  const exploreCount = quedadas?.length || 0;
  const mineCount = useMemo(() => {
    if (!quedadas || !profile?.id) return 0;
    return quedadas.filter(q => q.creator_profile_id === profile.id || q.is_attending).length;
  }, [quedadas, profile?.id]);

  // Check if user has created any quedadas (for first-time confetti)
  const userCreatedQuedadas = quedadas?.filter(q => q.creator_profile_id === profile?.id) || [];
  const isFirstQuedada = userCreatedQuedadas.length === 0;

  // Determine current state for transitions
  const currentState = useMemo(() => {
    if (isLoading) return "loading" as const;
    if (isError) return "error" as const;
    if (filteredQuedadas?.length === 0) return "empty" as const;
    return "content" as const;
  }, [isLoading, isError, filteredQuedadas?.length]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B9D', '#C084FC', '#818CF8', '#F472B6'],
    });
    // Second burst for more celebration
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FF6B9D', '#C084FC', '#818CF8'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FF6B9D', '#C084FC', '#818CF8'],
      });
    }, 150);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate || !eventTime) {
      toast.error("Título, fecha y hora son obligatorios");
      return;
    }

    // Store if this is first quedada before creation
    const wasFirstQuedada = isFirstQuedada;

    try {
      const dateTime = new Date(`${eventDate}T${eventTime}`);
      
      await createQuedada.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        location_hint: locationHint.trim() || undefined,
        event_date: dateTime.toISOString(),
        max_attendees: maxAttendees ? parseInt(maxAttendees) : undefined,
        private_attendees: privateAttendees,
      });

      // Trigger confetti and sound if it was the first quedada
      if (wasFirstQuedada) {
        triggerConfetti();
        playCelebrationSound();
        toast.success("🎉 ¡Tu primera quedada!");
      } else {
        toast.success("¡Quedada creada!");
      }
      
      setShowCreate(false);
      setTitle("");
      setDescription("");
      setLocationHint("");
      setEventDate("");
      setEventTime("");
      setMaxAttendees("");
      setPrivateAttendees(false);
    } catch (error: any) {
      toast.error("Error al crear: " + error.message);
    }
  };

  const handleJoin = async (quedada: Quedada) => {
    try {
      await joinQuedada.mutateAsync({
        quedadaId: quedada.id,
        creatorProfileId: quedada.creator_profile_id,
        quedadaTitle: quedada.title,
        onEarnEnergy: canDoAction("join_quedada") ? async () => {
          await earnEnergy({ 
            action: "join_quedada", 
            description: `Unido a: ${quedada.title}` 
          });
        } : undefined,
      });
      toast.success("¡Te has unido!");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const handleLeave = async (quedadaId: string) => {
    // Start exit animation
    setExitingQuedadas(prev => new Set(prev).add(quedadaId));
    
    // Wait for animation to complete before actual removal
    const timeout = setTimeout(async () => {
      try {
        await leaveQuedada.mutateAsync(quedadaId);
        toast.success("Has salido de la quedada");
      } catch (error: any) {
        toast.error("Error: " + error.message);
        // Remove from exiting set if error
        setExitingQuedadas(prev => {
          const next = new Set(prev);
          next.delete(quedadaId);
          return next;
        });
      } finally {
        exitTimeoutRefs.current.delete(quedadaId);
      }
    }, 400);
    
    exitTimeoutRefs.current.set(quedadaId, timeout);
  };

  const handleDelete = async (quedadaId: string) => {
    if (!confirm("¿Seguro que quieres cancelar esta quedada? Esta acción no se puede deshacer.")) {
      return;
    }
    
    // Start exit animation
    setExitingQuedadas(prev => new Set(prev).add(quedadaId));
    
    // Wait for animation to complete before actual deletion
    const timeout = setTimeout(async () => {
      try {
        await deleteQuedada.mutateAsync(quedadaId);
        toast.success("Quedada cancelada");
      } catch (error: any) {
        toast.error("Error: " + error.message);
        // Remove from exiting set if error
        setExitingQuedadas(prev => {
          const next = new Set(prev);
          next.delete(quedadaId);
          return next;
        });
      } finally {
        exitTimeoutRefs.current.delete(quedadaId);
      }
    }, 400);
    
    exitTimeoutRefs.current.set(quedadaId, timeout);
  };

  const openEditModal = (quedada: Quedada) => {
    const eventDateObj = new Date(quedada.event_date);
    setEditingQuedada(quedada);
    setTitle(quedada.title);
    setDescription(quedada.description || "");
    setLocationHint(quedada.location_hint || "");
    setEventDate(eventDateObj.toISOString().split("T")[0]);
    setEventTime(format(eventDateObj, "HH:mm"));
    setMaxAttendees(quedada.max_attendees?.toString() || "");
    setPrivateAttendees(quedada.private_attendees || false);
  };

  const closeEditModal = () => {
    setEditingQuedada(null);
    setTitle("");
    setDescription("");
    setLocationHint("");
    setEventDate("");
    setEventTime("");
    setMaxAttendees("");
    setPrivateAttendees(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuedada || !title.trim() || !eventDate || !eventTime) {
      toast.error("Título, fecha y hora son obligatorios");
      return;
    }

    try {
      const dateTime = new Date(`${eventDate}T${eventTime}`);
      
      await updateQuedada.mutateAsync({
        quedadaId: editingQuedada.id,
        updates: {
          title: title.trim(),
          description: description.trim() || null,
          location_hint: locationHint.trim() || null,
          event_date: dateTime.toISOString(),
          max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
          private_attendees: privateAttendees,
        },
      });

      toast.success("¡Quedada actualizada!");
      closeEditModal();
    } catch (error: any) {
      toast.error("Error al actualizar: " + error.message);
    }
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "EEEE d 'de' MMMM", { locale: es });
  };

  const formatEventTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "HH:mm");
  };

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <PullToRefresh onRefresh={handleRefresh} accentColor="accent">
    <main className="min-h-screen bg-background flex flex-col px-4 sm:px-6 py-6 sm:py-8 pb-24 relative overflow-hidden">
      {/* Parallax ambient glow */}
      <ParallaxBackground variant="list" />
      
      {/* Header */}
      <PageHeader 
        backLabel="Presencia" 
        backTo="/presence" 
        rightContent={
          <button
            onClick={() => setShowCreate(true)}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform shadow-lg shadow-primary/30"
            aria-label="Crear nueva quedada"
            title="Crear nueva quedada"
          >
            <Plus className="w-4 h-4" />
          </button>
        }
      />

      <div className="flex-1 max-w-lg mx-auto w-full relative z-10">
        {/* Hero */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full animate-pulse-soft" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center ring-2 ring-accent/20 ring-offset-4 ring-offset-background">
              <Calendar className="w-9 h-9 text-accent" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-accent/60 animate-pulse-soft" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Quedadas
          </h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
            Eventos efímeros en {profile?.city || "tu ciudad"}.
          </p>
        </div>

        {/* Tabs Filter */}
        <div className="flex bg-card rounded-xl p-1 border border-foreground/5 dark:border-border shadow-md shadow-foreground/10 dark:shadow-foreground/5 mb-6">
          <button
            onClick={() => setActiveTab("explore")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              activeTab === "explore"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-card-foreground hover:bg-muted/50"
            }`}
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            <Sparkles className="w-4 h-4" />
            Explorar
            {exploreCount > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === "explore" 
                  ? "bg-primary-foreground/20 text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {exploreCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              activeTab === "mine"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-card-foreground hover:bg-muted/50"
            }`}
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            <Users className="w-4 h-4" />
            Mis Quedadas
            {mineCount > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === "mine" 
                  ? "bg-primary-foreground/20 text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {mineCount}
              </span>
            )}
          </button>
        </div>

        {/* List with smooth state transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === "mine" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === "mine" ? -20 : 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <StateTransition
              state={currentState}
              loadingContent={<QuedadasListSkeleton count={3} />}
              errorContent={
                <ErrorState
                  icon={Calendar}
                  description="No pudimos cargar las quedadas. Revisa tu conexión e inténtalo de nuevo."
                  onRetry={() => refetch()}
                  isRetrying={isFetching}
                />
              }
              emptyContent={
                <EmptyState
                  icon={Calendar}
                  title={activeTab === "mine" ? "No tienes quedadas" : "No hay quedadas"}
                  description={activeTab === "mine" ? "Crea una o únete a alguna." : "Sé la primera persona en crear una."}
                  action={
                    <Button variant="kiki" onClick={() => setShowCreate(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear quedada
                    </Button>
                  }
                />
              }
            >
              <div className="space-y-5 sm:space-y-6 pb-6">
                {filteredQuedadas?.map((quedada, index) => {
              const isFull = quedada.max_attendees && quedada.attendee_count >= quedada.max_attendees;
              const isCreator = quedada.creator_profile_id === profile?.id;
              const isExiting = exitingQuedadas.has(quedada.id);
              
              return (
                <div
                  key={quedada.id}
                  className={`bg-card rounded-2xl p-5 sm:p-6 border border-foreground/5 dark:border-transparent hover:border-accent/30 shadow-md shadow-foreground/10 dark:shadow-foreground/5 hover:shadow-lg hover:shadow-accent/10 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-400 ${
                    isExiting 
                      ? 'opacity-0 scale-95 translate-x-8 pointer-events-none' 
                      : 'opacity-0 animate-stagger-fade-up'
                  }`}
                  style={{
                    ...getAnimationStyle(index),
                    ...(isExiting ? { 
                      opacity: 0, 
                      transform: 'scale(0.95) translateX(2rem)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    } : {})
                  }}
                >
                  {/* Header */}
                  <QuedadaCreatorHeader creator={quedada.creator} title={quedada.title} />

                  {/* Description */}
                  {quedada.description && (
                    <p className="text-sm text-card-foreground/80 mb-4 leading-relaxed" style={{ fontFamily: 'Arial, sans-serif' }}>
                      {quedada.description}
                    </p>
                  )}

                  {/* Details */}
                  <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-5">
                    <div className="flex items-center gap-1.5 text-card-foreground/70">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs capitalize" style={{ fontFamily: 'Arial, sans-serif' }}>{formatEventDate(quedada.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-card-foreground/70">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs" style={{ fontFamily: 'Arial, sans-serif' }}>{formatEventTime(quedada.event_date)}h</span>
                    </div>
                    {quedada.location_hint && (
                      <div className="flex items-center gap-1.5 text-card-foreground/70">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-xs" style={{ fontFamily: 'Arial, sans-serif' }}>{quedada.location_hint}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-card-foreground/70">
                      {quedada.private_attendees ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Users className="w-3.5 h-3.5" />
                      )}
                      <span className="text-xs" style={{ fontFamily: 'Arial, sans-serif' }}>
                        {quedada.attendee_count}{quedada.max_attendees ? `/${quedada.max_attendees}` : ""} {quedada.private_attendees ? "(privada)" : "asistentes"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {/* Chat button - visible if attending or creator */}
                    {(isCreator || quedada.is_attending) && (
                      <Button
                        variant="kiki-soft"
                        size="sm"
                        className="flex-1 relative"
                        onClick={() => navigate(`/quedada/${quedada.id}`)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                        {quedada.has_unread && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full ring-2 ring-card animate-pulse" />
                        )}
                      </Button>
                    )}
                    
                    {/* Join/Leave button */}
                    {!isCreator && (
                      quedada.is_attending ? (
                        <Button
                          variant="kiki-soft"
                          size="sm"
                          className={isCreator || quedada.is_attending ? "flex-1" : "w-full"}
                          onClick={() => handleLeave(quedada.id)}
                        >
                          Salir
                        </Button>
                      ) : (
                        <Button
                          variant="kiki"
                          size="sm"
                          className="w-full"
                          onClick={() => handleJoin(quedada)}
                          disabled={isFull}
                        >
                          {isFull ? "Completa" : "Unirse"}
                        </Button>
                      )
                    )}
                  </div>
                  
                  {isCreator && (
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        <span className="text-xs text-card-foreground/70" style={{ fontFamily: 'Arial, sans-serif' }}>Tu quedada</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(quedada)}
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs"
                          style={{ fontFamily: 'Arial, sans-serif' }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(quedada.id)}
                          className="flex items-center gap-1.5 text-destructive/70 hover:text-destructive transition-colors text-xs"
                          style={{ fontFamily: 'Arial, sans-serif' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
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
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-10 text-center animate-fade-up animate-delay-500">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/30 border border-border/20">
            <Calendar className="w-3.5 h-3.5 text-accent/60" />
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
              Planes reales · Gente real
            </p>
          </div>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-card rounded-3xl p-6 max-w-md w-full animate-fade-up shadow-2xl border border-border/20 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-card-foreground mb-6 text-center" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
              Nueva quedada
            </h3>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                placeholder="Título de la quedada"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 bg-background/50"
                style={{ fontFamily: 'Arial, sans-serif' }}
              />
              
              <Textarea
                placeholder="Descripción (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background/50 min-h-[80px]"
                style={{ fontFamily: 'Arial, sans-serif' }}
              />
              
              <Input
                placeholder="Pista del lugar (ej: cerca de Sol)"
                value={locationHint}
                onChange={(e) => setLocationHint(e.target.value)}
                className="h-12 bg-background/50"
                style={{ fontFamily: 'Arial, sans-serif' }}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-card-foreground/60 mb-1 block" style={{ fontFamily: 'Arial, sans-serif' }}>Fecha</label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="h-12 bg-background/50"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="text-xs text-card-foreground/60 mb-1 block" style={{ fontFamily: 'Arial, sans-serif' }}>Hora</label>
                  <Input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="h-12 bg-background/50"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-card-foreground/60 mb-1 block" style={{ fontFamily: 'Arial, sans-serif' }}>
                  Máximo asistentes (opcional)
                </label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  className="h-12 bg-background/50"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                  min="2"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-card-foreground/60" />
                  <div>
                    <span className="text-sm text-card-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>Lista privada</span>
                    <p className="text-xs text-card-foreground/50" style={{ fontFamily: 'Arial, sans-serif' }}>Solo asistentes ven quién va</p>
                  </div>
                </div>
                <Switch
                  checked={privateAttendees}
                  onCheckedChange={setPrivateAttendees}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="kiki-soft"
                  className="flex-1 h-12"
                  onClick={() => setShowCreate(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="kiki"
                  className="flex-1 h-12"
                  disabled={createQuedada.isPending}
                >
                  {createQuedada.isPending ? "Creando..." : "Crear"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingQuedada && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-card rounded-3xl p-6 max-w-md w-full animate-fade-up shadow-2xl border border-border/20 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-card-foreground mb-6 text-center" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
              Editar quedada
            </h3>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <Input
                placeholder="Título de la quedada"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 bg-background/50"
                style={{ fontFamily: 'Arial, sans-serif' }}
              />
              
              <Textarea
                placeholder="Descripción (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background/50 min-h-[80px]"
                style={{ fontFamily: 'Arial, sans-serif' }}
              />
              
              <Input
                placeholder="Pista del lugar (ej: cerca de Sol)"
                value={locationHint}
                onChange={(e) => setLocationHint(e.target.value)}
                className="h-12 bg-background/50"
                style={{ fontFamily: 'Arial, sans-serif' }}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-card-foreground/60 mb-1 block" style={{ fontFamily: 'Arial, sans-serif' }}>Fecha</label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="h-12 bg-background/50"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="text-xs text-card-foreground/60 mb-1 block" style={{ fontFamily: 'Arial, sans-serif' }}>Hora</label>
                  <Input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="h-12 bg-background/50"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-card-foreground/60 mb-1 block" style={{ fontFamily: 'Arial, sans-serif' }}>
                  Máximo asistentes (opcional)
                </label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  className="h-12 bg-background/50"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                  min="2"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-card-foreground/60" />
                  <div>
                    <span className="text-sm text-card-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>Lista privada</span>
                    <p className="text-xs text-card-foreground/50" style={{ fontFamily: 'Arial, sans-serif' }}>Solo asistentes ven quién va</p>
                  </div>
                </div>
                <Switch
                  checked={privateAttendees}
                  onCheckedChange={setPrivateAttendees}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="kiki-soft"
                  className="flex-1 h-12"
                  onClick={closeEditModal}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="kiki"
                  className="flex-1 h-12"
                  disabled={updateQuedada.isPending}
                >
                  {updateQuedada.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
    </PullToRefresh>
  );
};

export default Quedadas;
