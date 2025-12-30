import { useState } from "react";
import { UserPlus, Check, Clock, MoreVertical, Flag, Ban, Send, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserModerationModal from "@/components/UserModerationModal";
import { useSendConnectionRequest, useConnectionStatus } from "@/hooks/useConnectionRequests";
import LazyImage from "@/components/LazyImage";

interface AnonymousPresenceCardProps {
  presence: {
    id: string;
    profile: {
      id: string;
      name: string | null;
      avatar_url: string | null;
      city?: string | null;
      vibe?: string | null;
    } | null;
    tribes: string[];
    musicStyles: string[];
  };
  animationDelay: number;
}

const MAX_MESSAGE_LENGTH = 200;

const AnonymousPresenceCard = ({ presence, animationDelay }: AnonymousPresenceCardProps) => {
  const sendRequest = useSendConnectionRequest();
  const { data: connectionStatus } = useConnectionStatus(presence.profile?.id);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationMode, setModerationMode] = useState<"report" | "block">("report");
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [message, setMessage] = useState("");

  const handleOpenDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMessageDialog(true);
  };

  const handleSendRequest = () => {
    if (presence.profile?.id) {
      sendRequest.mutate(
        { toProfileId: presence.profile.id, message: message.trim() || undefined },
        {
          onSuccess: () => {
            setShowMessageDialog(false);
            setMessage("");
          },
        }
      );
    }
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModerationMode("report");
    setShowModerationModal(true);
  };

  const handleBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModerationMode("block");
    setShowModerationModal(true);
  };

  // Create blurred avatar style
  const blurredAvatarStyle = {
    filter: "blur(8px)",
    transform: "scale(1.1)",
  };

  return (
    <>
      <div
        className="w-full bg-card rounded-2xl overflow-hidden text-left transition-all animate-fade-up"
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        {/* Blurred photo section */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center overflow-hidden">
          {presence.profile?.avatar_url ? (
            <div 
              className="absolute inset-0"
              style={blurredAvatarStyle}
            >
              <LazyImage 
                src={presence.profile.avatar_url} 
                alt=""
                className="w-full h-full object-cover"
                placeholderClassName="w-full h-full"
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted" />
          )}
          
          {/* Overlay for better contrast */}
          <div className="absolute inset-0 bg-background/30 backdrop-blur-sm" />
          
          {/* Anonymous avatar */}
          <div className="relative z-10">
            <Avatar className="w-20 h-20 border-4 border-background/50 shadow-lg">
              <AvatarImage 
                src={presence.profile?.avatar_url || undefined} 
                style={blurredAvatarStyle}
              />
              <AvatarFallback className="text-2xl bg-secondary text-secondary-foreground">
                ?
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Options menu overlay */}
          <div className="absolute top-3 right-3 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-background transition-colors">
                  <MoreVertical className="w-4 h-4 text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleReport} className="gap-2 cursor-pointer">
                  <Flag className="w-4 h-4" />
                  Reportar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBlock} className="gap-2 text-destructive cursor-pointer">
                  <Ban className="w-4 h-4" />
                  Bloquear
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* City badge */}
          {presence.profile?.city && (
            <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm">
              <span className="text-xs font-body text-foreground">{presence.profile.city}</span>
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-lg font-semibold text-card-foreground/60">
              Perfil privado
            </h3>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
          </div>
          
          <p className="font-body text-sm text-card-foreground/50 mb-3">
            Conecta para ver su perfil completo
          </p>
          
          {/* Tribes - visible */}
          {presence.tribes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
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

          {/* Connection button */}
          <div className="mt-2">
            {connectionStatus === "none" && (
              <Button
                onClick={handleOpenDialog}
                disabled={sendRequest.isPending}
                className="w-full gap-2"
                variant="default"
              >
                <UserPlus className="w-4 h-4" />
                Solicitar conexión
              </Button>
            )}
            
            {connectionStatus === "pending_sent" && (
              <Button
                variant="secondary"
                disabled
                className="w-full gap-2"
              >
                <Clock className="w-4 h-4" />
                Solicitud pendiente
              </Button>
            )}
            
            {connectionStatus === "connected" && (
              <Button
                variant="outline"
                disabled
                className="w-full gap-2 text-green-600"
              >
                <Check className="w-4 h-4" />
                Conectados
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Connection Request Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="font-display">Solicitar conexión</DialogTitle>
            <DialogDescription className="font-body">
              Añade un mensaje opcional para presentarte. El destinatario verá tu ciudad y tribes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <Textarea
              placeholder="Hola, me gustaría conectar contigo..."
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              className="min-h-[100px] resize-none font-body"
              maxLength={MAX_MESSAGE_LENGTH}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-body">
                Opcional
              </span>
              <span className={`text-xs font-body ${message.length >= MAX_MESSAGE_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setShowMessageDialog(false)}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button
              onClick={handleSendRequest}
              disabled={sendRequest.isPending}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {sendRequest.isPending ? "Enviando..." : "Enviar solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Moderation Modal */}
      {showModerationModal && presence.profile?.id && (
        <UserModerationModal
          profileId={presence.profile.id}
          profileName="Usuario"
          onClose={() => setShowModerationModal(false)}
          initialMode={moderationMode}
        />
      )}
    </>
  );
};

export default AnonymousPresenceCard;
