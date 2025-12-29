import { useState } from "react";
import { UserPlus, Check, Clock, MoreVertical, Flag, Ban } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserModerationModal from "@/components/UserModerationModal";
import { useSendConnectionRequest, useConnectionStatus, useCancelConnectionRequest } from "@/hooks/useConnectionRequests";

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

const AnonymousPresenceCard = ({ presence, animationDelay }: AnonymousPresenceCardProps) => {
  const sendRequest = useSendConnectionRequest();
  const cancelRequest = useCancelConnectionRequest();
  const { data: connectionStatus } = useConnectionStatus(presence.profile?.id);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationMode, setModerationMode] = useState<"report" | "block">("report");

  const handleSendRequest = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (presence.profile?.id) {
      sendRequest.mutate(presence.profile.id);
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
              <img 
                src={presence.profile.avatar_url} 
                alt=""
                className="w-full h-full object-cover"
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
                onClick={handleSendRequest}
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
