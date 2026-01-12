import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Eye, EyeOff, Flame, Calendar, Bell, Ghost, UserPlus, HelpCircle, 
  MoreVertical, Sparkles 
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface PresenceHeaderActionsProps {
  pendingConnectionCount: number;
  unreadGhostCount: number;
  unreadCount: number;
  quedadaCount: number;
  totalSparkCount: number;
  hasNewSparks: boolean;
  newSparkCount: number;
  markAllAsSeen: () => void;
  myPresenceVisible: boolean;
  toggleVisibility: () => void;
  openTutorial: () => void;
}

export const PresenceHeaderActions = ({
  pendingConnectionCount,
  unreadGhostCount,
  unreadCount,
  quedadaCount,
  totalSparkCount,
  hasNewSparks,
  newSparkCount,
  markAllAsSeen,
  myPresenceVisible,
  toggleVisibility,
  openTutorial,
}: PresenceHeaderActionsProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Calculate total badges for the "more" button indicator
  const totalBadges = pendingConnectionCount + unreadGhostCount + unreadCount;

  // Primary actions always visible (most important)
  const primaryActions = (
    <>
      {/* Sparks - always visible */}
      <button
        onClick={() => {
          markAllAsSeen();
          navigate("/sparks");
        }}
        className="relative text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        title="Tus chispas"
        aria-label="Tus chispas"
      >
        <Flame className={`w-5 h-5 ${totalSparkCount > 0 ? "text-primary" : ""}`} />
        {hasNewSparks && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
            {newSparkCount}
          </span>
        )}
      </button>

      {/* Notifications - always visible on desktop, in menu on mobile */}
      {!isMobile && (
        <button
          onClick={() => navigate("/notifications")}
          className="relative text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          title="Notificaciones"
          aria-label="Notificaciones"
        >
          <Bell className={`w-5 h-5 ${unreadCount > 0 ? "text-primary" : ""}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Visibility toggle - always visible */}
      <button
        onClick={toggleVisibility}
        className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        title={myPresenceVisible ? "Modo visible" : "Modo invisible"}
        aria-label={myPresenceVisible ? "Cambiar a modo invisible" : "Cambiar a modo visible"}
      >
        {myPresenceVisible ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
      </button>
    </>
  );

  // Secondary actions - visible on desktop, in dropdown on mobile
  const desktopSecondaryActions = (
    <>
      {/* Help/Tutorial */}
      <button
        onClick={openTutorial}
        className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        title="Cómo funciona KIKI"
        aria-label="Ver tutorial"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Connection requests */}
      <button
        onClick={() => navigate("/connections")}
        className="relative text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        title="Solicitudes de conexión"
        aria-label="Solicitudes de conexión"
      >
        <UserPlus className={`w-5 h-5 ${pendingConnectionCount > 0 ? "text-primary" : ""}`} />
        {pendingConnectionCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
            {pendingConnectionCount > 9 ? "9+" : pendingConnectionCount}
          </span>
        )}
      </button>

      {/* Ghost messages */}
      <button
        onClick={() => navigate("/ghost-messages")}
        className="relative text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        title="Mensajes fantasma"
        aria-label="Mensajes fantasma"
      >
        <Ghost className={`w-5 h-5 ${unreadGhostCount > 0 ? "text-primary" : ""}`} />
        {unreadGhostCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
            {unreadGhostCount > 9 ? "9+" : unreadGhostCount}
          </span>
        )}
      </button>

      {/* Quedadas */}
      <button
        onClick={() => navigate("/quedadas")}
        className="relative text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        title="Quedadas"
        aria-label="Quedadas"
      >
        <Calendar className={`w-5 h-5 ${quedadaCount > 0 ? "text-accent" : ""}`} />
        {quedadaCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
            {quedadaCount}
          </span>
        )}
      </button>
    </>
  );

  // Mobile dropdown menu
  const mobileDropdownMenu = (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          title="Más opciones"
          aria-label="Más opciones"
        >
          <MoreVertical className="w-5 h-5" />
          {totalBadges > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
              {totalBadges > 9 ? "9+" : totalBadges}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-card border-border z-50"
        sideOffset={8}
      >
        <DropdownMenuItem 
          onClick={() => navigate("/notifications")}
          className="flex items-center gap-3 cursor-pointer"
        >
          <Bell className={cn("w-4 h-4", unreadCount > 0 && "text-primary")} />
          <span className="flex-1">Notificaciones</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => navigate("/ghost-messages")}
          className="flex items-center gap-3 cursor-pointer"
        >
          <Ghost className={cn("w-4 h-4", unreadGhostCount > 0 && "text-primary")} />
          <span className="flex-1">Mensajes fantasma</span>
          {unreadGhostCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {unreadGhostCount}
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => navigate("/connections")}
          className="flex items-center gap-3 cursor-pointer"
        >
          <UserPlus className={cn("w-4 h-4", pendingConnectionCount > 0 && "text-primary")} />
          <span className="flex-1">Conexiones</span>
          {pendingConnectionCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {pendingConnectionCount}
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={() => navigate("/quedadas")}
          className="flex items-center gap-3 cursor-pointer"
        >
          <Calendar className={cn("w-4 h-4", quedadaCount > 0 && "text-accent")} />
          <span className="flex-1">Quedadas</span>
          {quedadaCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
              {quedadaCount}
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={openTutorial}
          className="flex items-center gap-3 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Cómo funciona KIKI</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {isMobile ? (
        <>
          {primaryActions}
          {mobileDropdownMenu}
        </>
      ) : (
        <>
          {desktopSecondaryActions}
          {primaryActions}
        </>
      )}
    </>
  );
};

export default PresenceHeaderActions;