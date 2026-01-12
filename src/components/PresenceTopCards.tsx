import { Radio, EyeOff, Crown, Lock, Zap, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useStaggerAnimation } from "@/hooks/useStaggerAnimation";
import { cn } from "@/lib/utils";

interface PresenceTopCardsProps {
  myPresence: { visible_to_others?: boolean } | null | undefined;
  invisibleAnimating: boolean;
  canUseInvisibleMode: boolean;
  toggleVisibility: () => void;
  setPresence: { isPending: boolean };
  boostTimeRemaining: { minutes: number; seconds: number } | null;
  createCheckout: { mutate: () => void; isPending: boolean };
}

export const PresenceTopCards = ({
  myPresence,
  invisibleAnimating,
  canUseInvisibleMode,
  toggleVisibility,
  setPresence,
  boostTimeRemaining,
  createCheckout,
}: PresenceTopCardsProps) => {
  const { getItemProps } = useStaggerAnimation({
    itemCount: 2,
    baseDelay: 100,
    staggerDelay: 120,
    duration: 500,
    useSpring: true,
  });

  return (
    <div className="space-y-4 mb-8">
      {/* Presence toggle card */}
      <div 
        className={cn(
          "rounded-2xl p-3 sm:p-4 border shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-default",
          myPresence?.visible_to_others 
            ? "bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 border-primary/30" 
            : "bg-card border-border",
          invisibleAnimating && "animate-invisible-glow",
        )}
        style={getItemProps(0).style}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={cn(
              "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300",
              myPresence?.visible_to_others
                ? "bg-primary/30 shadow-lg shadow-primary/20" 
                : "bg-muted"
            )}>
              {myPresence?.visible_to_others ? (
                <Radio className="w-5 h-5 text-primary animate-pulse" />
              ) : (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className={cn(
                  "font-display font-semibold text-sm",
                  myPresence?.visible_to_others ? "text-primary" : "text-card-foreground"
                )}>
                  {myPresence?.visible_to_others ? "Estoy por aquí" : "Modo invisible"}
                </p>
                {!canUseInvisibleMode && !myPresence?.visible_to_others && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold">
                    <Crown className="w-3 h-3" />
                    Premium
                  </span>
                )}
                {canUseInvisibleMode && !myPresence?.visible_to_others && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold">
                    ✨ Activo
                  </span>
                )}
              </div>
              <p className="font-body text-xs text-muted-foreground">
                {myPresence?.visible_to_others 
                  ? "Otros pueden verte" 
                  : canUseInvisibleMode 
                    ? "Nadie te ve" 
                    : "Premium para ser invisible"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!canUseInvisibleMode && (
              <Lock className="w-4 h-4 text-amber-500" />
            )}
            <Switch
              checked={myPresence?.visible_to_others ?? true}
              onCheckedChange={toggleVisibility}
              disabled={setPresence.isPending}
              className={myPresence?.visible_to_others ? "data-[state=checked]:bg-primary" : ""}
            />
          </div>
        </div>
      </div>

      {/* KIKI Now Boost Card */}
      <div 
        className={cn(
          "rounded-2xl p-3 sm:p-4 border shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-default",
          boostTimeRemaining 
            ? "bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20 border-primary/40" 
            : "bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-primary/20",
          getItemProps(1).className
        )}
        style={getItemProps(1).style}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className={cn(
              "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0",
              boostTimeRemaining 
                ? "bg-gradient-to-br from-primary to-accent animate-pulse" 
                : "bg-primary/20"
            )}>
              <Zap className={cn("w-5 h-5", boostTimeRemaining ? "text-white" : "text-primary")} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-display font-semibold text-card-foreground text-sm">
                  KIKI Now
                </p>
                {boostTimeRemaining && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold animate-pulse">
                    🔥 {boostTimeRemaining.minutes}:{boostTimeRemaining.seconds.toString().padStart(2, '0')}
                  </span>
                )}
              </div>
              <p className="font-body text-xs text-muted-foreground">
                {boostTimeRemaining 
                  ? "¡Destacado! Primero en la lista" 
                  : "Destaca 1 hora — 1,99€"}
              </p>
            </div>
          </div>
          {!boostTimeRemaining && (
            <Button
              variant="kiki"
              size="sm"
              onClick={() => createCheckout.mutate()}
              disabled={createCheckout.isPending}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {createCheckout.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-1" />
                  Activar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresenceTopCards;
