import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Loader2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSparkEnergy, SHOP_ITEMS } from "@/hooks/useSparkEnergy";
import { useSuperSpark } from "@/hooks/usePurchasedItems";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { triggerHaptic } from "@/utils/haptics";
import { fireSuperSparkConfetti } from "@/utils/superSparkConfetti";

interface SuperSparkButtonProps {
  targetProfileId: string;
  targetProfileName?: string;
  onSuperSparkSent?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "icon" | "full";
}

export function SuperSparkButton({
  targetProfileId,
  targetProfileName,
  onSuperSparkSent,
  disabled = false,
  className,
  variant = "icon",
}: SuperSparkButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [sending, setSending] = useState(false);
  const [alreadySent, setAlreadySent] = useState(false);
  
  const { data: myProfile } = useProfile();
  const { 
    sparkEnergy, 
    spendEnergy, 
    getItemCost, 
    canAfford, 
    currentLevel,
    isSpending 
  } = useSparkEnergy();
  const { availableSuperSparks, useSuperSpark: consumeSuperSpark, recordPurchase } = useSuperSpark();

  const superSparkCost = getItemCost("super_spark");
  const canAffordSuperSpark = canAfford("super_spark");
  const hasPurchasedSuperSparks = availableSuperSparks > 0;
  const canSendSuperSpark = hasPurchasedSuperSparks || canAffordSuperSpark;

  const handleOpenDialog = async () => {
    if (!myProfile?.id || disabled) return;
    
    // Check if already sent super spark to this person
    const { data: existing } = await supabase
      .from("ghost_messages")
      .select("id")
      .eq("from_profile_id", myProfile.id)
      .eq("to_profile_id", targetProfileId)
      .eq("is_super_spark", true)
      .maybeSingle();
    
    if (existing) {
      setAlreadySent(true);
      toast.info("Ya enviaste una Super Chispa a esta persona");
      return;
    }
    
    triggerHaptic('selection');
    setShowDialog(true);
  };

  const handleSendSuperSpark = async () => {
    if (!myProfile?.id || sending) return;

    setSending(true);
    triggerHaptic('medium');

    try {
      // Use existing purchased super spark OR spend energy to buy one
      if (hasPurchasedSuperSparks) {
        await consumeSuperSpark();
      } else {
        // Spend energy to get a super spark
        await spendEnergy({ itemKey: "super_spark" });
        await recordPurchase("super_spark");
        // Use the newly purchased one
        await consumeSuperSpark();
      }

      // Send the super spark message
      const { error } = await supabase.from("ghost_messages").insert({
        from_profile_id: myProfile.id,
        to_profile_id: targetProfileId,
        content: "⚡ Super Chispa",
        is_super_spark: true,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya enviaste un mensaje a esta persona");
        } else {
          throw error;
        }
      } else {
        // Success!
        triggerHaptic('success');
        fireSuperSparkConfetti();
        
        toast.success("⚡ ¡Super Chispa enviada!", {
          description: `${targetProfileName || "Esta persona"} verá que invertiste energía extra`,
        });
        
        setShowDialog(false);
        onSuperSparkSent?.();
      }
    } catch (error: any) {
      toast.error(error.message || "Error al enviar Super Chispa");
    } finally {
      setSending(false);
    }
  };

  if (alreadySent) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled
            className={cn("relative opacity-50", className)}
          >
            <Flame className="w-5 h-5 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ya enviaste Super Chispa</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          {variant === "icon" ? (
            <motion.button
              onClick={handleOpenDialog}
              disabled={disabled || !canSendSuperSpark}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "relative flex items-center justify-center w-12 h-12 rounded-full transition-all",
                "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500",
                "shadow-lg shadow-purple-500/40",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                className
              )}
            >
              <Flame className="w-6 h-6 text-white" />
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 blur-md opacity-50 -z-10" />
              
              {/* Badge counter */}
              {hasPurchasedSuperSparks && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground border-0"
                >
                  {availableSuperSparks}
                </Badge>
              )}
            </motion.button>
          ) : (
            <Button
              onClick={handleOpenDialog}
              disabled={disabled || !canSendSuperSpark}
              className={cn(
                "relative gap-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 border-0 text-white",
                "shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40",
                className
              )}
            >
              <Flame className="w-4 h-4" />
              Super Chispa
              {hasPurchasedSuperSparks && (
                <Badge variant="secondary" className="ml-1 h-5 text-[10px] bg-white/20 text-white border-0">
                  {availableSuperSparks}
                </Badge>
              )}
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="font-medium">⚡ Super Chispa</p>
          <p className="text-xs text-muted-foreground">
            {hasPurchasedSuperSparks 
              ? `${availableSuperSparks} disponibles` 
              : `${superSparkCost} 🔥 energía`}
          </p>
        </TooltipContent>
      </Tooltip>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md border-border/50 overflow-hidden">
          {/* Gradient background effect */}
          <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
          
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Zap className="w-5 h-5 text-purple-500" />
              Super Chispa
            </DialogTitle>
            <DialogDescription>
              Destaca tu interés de forma especial
            </DialogDescription>
          </DialogHeader>

          <div className="relative space-y-4 py-4">
            {/* Preview card */}
            <motion.div 
              className="relative p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg"
                  animate={{ 
                    boxShadow: [
                      "0 0 20px rgba(139, 92, 246, 0.4)",
                      "0 0 40px rgba(139, 92, 246, 0.6)",
                      "0 0 20px rgba(139, 92, 246, 0.4)",
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Flame className="w-7 h-7 text-white" />
                </motion.div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg">⚡ Super Chispa</h4>
                  <p className="text-sm text-muted-foreground">
                    {targetProfileName || "Esta persona"} verá que invertiste energía extra en contactarle
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Llega con una animación especial</span>
              </div>
            </motion.div>

            {/* Cost breakdown */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {hasPurchasedSuperSparks ? "Super Chispas disponibles" : "Coste"}
                </span>
                <span className="font-bold text-lg">
                  {hasPurchasedSuperSparks ? (
                    <span className="text-purple-500">{availableSuperSparks}x ⚡</span>
                  ) : (
                    <>
                      {currentLevel.discount > 0 && (
                        <span className="text-sm text-muted-foreground/70 line-through mr-2">
                          {SHOP_ITEMS.super_spark.cost}
                        </span>
                      )}
                      <span className="text-primary">{superSparkCost} 🔥</span>
                    </>
                  )}
                </span>
              </div>
              
              {!hasPurchasedSuperSparks && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tu energía actual</span>
                  <span className={cn(
                    "font-medium",
                    canAffordSuperSpark ? "text-foreground" : "text-destructive"
                  )}>
                    {sparkEnergy?.current_energy || 0} 🔥
                  </span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="relative gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={sending}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendSuperSpark}
              disabled={sending || (!hasPurchasedSuperSparks && !canAffordSuperSpark)}
              className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 border-0 text-white"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Flame className="w-4 h-4 mr-2" />
              )}
              {hasPurchasedSuperSparks ? "Usar Super Chispa" : `Enviar (${superSparkCost} 🔥)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
