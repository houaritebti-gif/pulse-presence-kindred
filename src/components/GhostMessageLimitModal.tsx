import { useNavigate } from "react-router-dom";
import { Crown, Ghost, Sparkles, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

interface GhostMessageLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GhostMessageLimitModal = ({ open, onOpenChange }: GhostMessageLimitModalProps) => {
  const navigate = useNavigate();
  const { tier, isFree, isPlus } = useSubscription();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/subscription");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4 p-0 overflow-hidden border-2 border-primary/30">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-4">
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 animate-pulse-soft">
              <Ghost className="w-8 h-8 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-foreground">
                Has alcanzado tu límite
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-2">
              Hoy ya has enviado {isFree ? "5" : "15"} mensajes fantasma
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-2 space-y-4">
          {/* Current tier info */}
          <div className="text-center text-sm text-muted-foreground">
            Tu plan actual: <span className="font-medium text-foreground capitalize">{tier}</span>
          </div>

          {/* Upgrade options */}
          <div className="space-y-3">
            {isFree && (
              <div 
                onClick={handleUpgrade}
                className={cn(
                  "relative overflow-hidden rounded-xl p-4 cursor-pointer",
                  "border-2 border-primary/30 hover:border-primary/50 transition-all",
                  "bg-gradient-to-br from-primary/10 to-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">Plan Plus</h4>
                      <span className="text-sm font-bold text-primary">€4.99/mes</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">15 mensajes</span> al día + Chatbot IA
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div 
              onClick={handleUpgrade}
              className={cn(
                "relative overflow-hidden rounded-xl p-4 cursor-pointer",
                "border-2 border-amber-500/30 hover:border-amber-500/50 transition-all",
                "bg-gradient-to-br from-amber-500/15 to-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Plan Premium</h4>
                    <span className="text-sm font-bold text-amber-500">€9.99/mes</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Mensajes ilimitados</span> + ✨ especiales
                  </p>
                </div>
              </div>
              
              {/* Recommended badge for free users */}
              {isFree && (
                <div className="absolute top-0 right-0">
                  <span className="bg-amber-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-bl-lg">
                    Mejor opción
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Benefits highlight */}
          <div className="bg-muted/50 rounded-xl p-4">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Con Premium también obtienes
            </h5>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                Mensajes premium que destacan con ✨
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Ghost className="w-4 h-4 text-amber-500 shrink-0" />
                Segunda oportunidad si no te responden
              </li>
            </ul>
          </div>

          {/* CTA */}
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 font-semibold"
            size="lg"
          >
            Ver todos los planes
          </Button>

          {/* Dismiss option */}
          <p className="text-center text-xs text-muted-foreground">
            Vuelve mañana para enviar más mensajes gratis
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GhostMessageLimitModal;
