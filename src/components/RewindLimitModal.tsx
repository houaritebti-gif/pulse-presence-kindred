import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Crown, Sparkles, Infinity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { triggerHaptic } from "@/utils/haptics";

interface RewindLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: "free" | "plus" | "premium";
}

export const RewindLimitModal = ({ open, onOpenChange, tier }: RewindLimitModalProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    triggerHaptic('medium');
    onOpenChange(false);
    navigate('/subscription');
  };

  const tierBenefits = {
    free: {
      current: "2 rebobinados/semana",
      upgrade: "Plus",
      benefit: "10 rebobinados/semana",
      icon: Sparkles,
    },
    plus: {
      current: "10 rebobinados/semana",
      upgrade: "Premium",
      benefit: "Rebobinados ilimitados",
      icon: Infinity,
    },
    premium: {
      current: "Ilimitados",
      upgrade: "",
      benefit: "",
      icon: Infinity,
    },
  };

  const info = tierBenefits[tier];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4">
            <RotateCcw className="w-8 h-8 text-amber-500" />
          </div>
          <DialogTitle className="text-xl">
            Sin rebobinados disponibles
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Has usado todos tus rebobinados esta semana. ¡No dejes escapar a nadie importante!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Tu plan actual</p>
              <p className="text-xs text-muted-foreground">{info.current}</p>
            </div>
          </div>

          {tier !== "premium" && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <info.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Con {info.upgrade}
                </p>
                <p className="text-xs text-muted-foreground">{info.benefit}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          {tier !== "premium" && (
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Mejorar a {info.upgrade}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Seguir explorando
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
