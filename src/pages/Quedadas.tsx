import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Calendar, MapPin, Users, Plus, Sparkles, Clock, MessageCircle, Trash2, Pencil, EyeOff } from "lucide-react";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import { useProfile } from "@/hooks/useProfile";
import { useQuedadas, useCreateQuedada, useJoinQuedada, useLeaveQuedada, useDeleteQuedada, useUpdateQuedada, Quedada } from "@/hooks/useQuedadas";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import confetti from "canvas-confetti";
import { playCelebrationSound } from "@/utils/notificationSound";

const Quedadas = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: quedadas, isLoading, isError, refetch } = useQuedadas();
  const createQuedada = useCreateQuedada();
  const joinQuedada = useJoinQuedada();
  const leaveQuedada = useLeaveQuedada();
  const deleteQuedada = useDeleteQuedada();
  const updateQuedada = useUpdateQuedada();

  const [showCreate, setShowCreate] = useState(false);
  const [editingQuedada, setEditingQuedada] = useState<Quedada | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationHint, setLocationHint] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [privateAttendees, setPrivateAttendees] = useState(false);

  // Check if user has created any quedadas (for first-time confetti)
  const userCreatedQuedadas = quedadas?.filter(q => q.creator_profile_id === profile?.id) || [];
  const isFirstQuedada = userCreatedQuedadas.length === 0;

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
      });
      toast.success("¡Te has unido!");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const handleLeave = async (quedadaId: string) => {
    try {
      await leaveQuedada.mutateAsync(quedadaId);
      toast.success("Has salido de la quedada");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const handleDelete = async (quedadaId: string) => {
    if (!confirm("¿Seguro que quieres cancelar esta quedada? Esta acción no se puede deshacer.")) {
      return;
    }
    try {
      await deleteQuedada.mutateAsync(quedadaId);
      toast.success("Quedada cancelada");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
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

  return (
    <main className="min-h-screen bg-background flex flex-col px-6 py-8 pb-24 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      
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
        <button
          onClick={() => setShowCreate(true)}
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform shadow-lg shadow-primary/30"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

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
          
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">
            Quedadas
          </h1>
          <p className="font-body text-muted-foreground">
            Eventos efímeros en {profile?.city || "tu ciudad"}.
          </p>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Calendar className="w-10 h-10 text-accent animate-pulse-soft" />
          </div>
        ) : isError ? (
          <ErrorState
            icon={Calendar}
            description="No pudimos cargar las quedadas. Revisa tu conexión e inténtalo de nuevo."
            onRetry={() => refetch()}
          />
        ) : quedadas?.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No hay quedadas"
            description="Sé la primera persona en crear una."
            action={
              <Button variant="kiki" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear quedada
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {quedadas?.map((quedada, index) => {
              const isFull = quedada.max_attendees && quedada.attendee_count >= quedada.max_attendees;
              const isCreator = quedada.creator_profile_id === profile?.id;
              
              return (
                <div
                  key={quedada.id}
                  className="bg-card rounded-2xl p-5 animate-fade-up border border-transparent hover:border-accent/20 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-accent/20">
                      {quedada.creator?.avatar_url ? (
                        <img src={quedada.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center">
                          <span className="font-display text-sm text-card-foreground">
                            {(quedada.creator?.name?.[0] || "?").toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-card-foreground text-lg leading-tight">
                        {quedada.title}
                      </h3>
                      <p className="font-body text-xs text-card-foreground/50">
                        por {quedada.creator?.name || "Anónima"}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {quedada.description && (
                    <p className="font-body text-sm text-card-foreground/70 mb-4 leading-relaxed">
                      {quedada.description}
                    </p>
                  )}

                  {/* Details */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-1.5 text-card-foreground/60">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-body text-xs capitalize">{formatEventDate(quedada.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-card-foreground/60">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-body text-xs">{formatEventTime(quedada.event_date)}h</span>
                    </div>
                    {quedada.location_hint && (
                      <div className="flex items-center gap-1.5 text-card-foreground/60">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="font-body text-xs">{quedada.location_hint}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-card-foreground/60">
                      {quedada.private_attendees ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Users className="w-3.5 h-3.5" />
                      )}
                      <span className="font-body text-xs">
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
                        <span className="font-body text-xs text-card-foreground/50">Tu quedada</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(quedada)}
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-body text-xs"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(quedada.id)}
                          className="flex items-center gap-1.5 text-destructive/70 hover:text-destructive transition-colors font-body text-xs"
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
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-card rounded-3xl p-6 max-w-md w-full animate-fade-up shadow-2xl border border-border/20 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl font-semibold text-card-foreground mb-6 text-center">
              Nueva quedada
            </h3>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                placeholder="Título de la quedada"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 bg-background/50"
              />
              
              <Textarea
                placeholder="Descripción (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background/50 min-h-[80px]"
              />
              
              <Input
                placeholder="Pista del lugar (ej: cerca de Sol)"
                value={locationHint}
                onChange={(e) => setLocationHint(e.target.value)}
                className="h-12 bg-background/50"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs text-card-foreground/60 mb-1 block">Fecha</label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="h-12 bg-background/50"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="font-body text-xs text-card-foreground/60 mb-1 block">Hora</label>
                  <Input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="h-12 bg-background/50"
                  />
                </div>
              </div>
              
              <div>
                <label className="font-body text-xs text-card-foreground/60 mb-1 block">
                  Máximo asistentes (opcional)
                </label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  className="h-12 bg-background/50"
                  min="2"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-card-foreground/60" />
                  <div>
                    <span className="font-body text-sm text-card-foreground">Lista privada</span>
                    <p className="font-body text-xs text-card-foreground/50">Solo asistentes ven quién va</p>
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
            <h3 className="font-display text-xl font-semibold text-card-foreground mb-6 text-center">
              Editar quedada
            </h3>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <Input
                placeholder="Título de la quedada"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 bg-background/50"
              />
              
              <Textarea
                placeholder="Descripción (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background/50 min-h-[80px]"
              />
              
              <Input
                placeholder="Pista del lugar (ej: cerca de Sol)"
                value={locationHint}
                onChange={(e) => setLocationHint(e.target.value)}
                className="h-12 bg-background/50"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs text-card-foreground/60 mb-1 block">Fecha</label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="h-12 bg-background/50"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="font-body text-xs text-card-foreground/60 mb-1 block">Hora</label>
                  <Input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="h-12 bg-background/50"
                  />
                </div>
              </div>
              
              <div>
                <label className="font-body text-xs text-card-foreground/60 mb-1 block">
                  Máximo asistentes (opcional)
                </label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  className="h-12 bg-background/50"
                  min="2"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-card-foreground/60" />
                  <div>
                    <span className="font-body text-sm text-card-foreground">Lista privada</span>
                    <p className="font-body text-xs text-card-foreground/50">Solo asistentes ven quién va</p>
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
  );
};

export default Quedadas;
