import { motion, AnimatePresence } from "framer-motion";
import { ImageOff, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ChatImageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  limit: number;
  tier: "free" | "plus" | "premium";
}

const TIER_INFO = {
  free: {
    name: "Gratis",
    nextTier: "Plus",
    nextLimit: 15,
    upgradeMessage: "Sube a Plus para enviar hasta 15 fotos por chat",
  },
  plus: {
    name: "Plus",
    nextTier: "Premium",
    nextLimit: 30,
    upgradeMessage: "Sube a Premium para enviar hasta 30 fotos por chat",
  },
  premium: {
    name: "Premium",
    nextTier: null,
    nextLimit: null,
    upgradeMessage: "Ya tienes el límite máximo de fotos",
  },
};

const ChatImageLimitModal = ({ 
  isOpen, 
  onClose, 
  currentCount, 
  limit, 
  tier 
}: ChatImageLimitModalProps) => {
  const navigate = useNavigate();
  const tierInfo = TIER_INFO[tier];

  const handleUpgrade = () => {
    onClose();
    navigate("/subscription");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center p-6 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-border/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <ImageOff className="w-10 h-10 text-primary" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-display font-bold text-center mb-2">
              Límite de fotos alcanzado
            </h3>

            {/* Counter */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl font-bold text-primary">{currentCount}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-xl text-muted-foreground">{limit}</span>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground text-center mb-6">
              Has enviado el máximo de {limit} fotos permitidas en esta conversación con tu plan {tierInfo.name}.
            </p>

            {/* Upgrade section */}
            {tierInfo.nextTier && (
              <>
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">{tierInfo.upgradeMessage}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Con {tierInfo.nextTier} puedes enviar hasta {tierInfo.nextLimit} fotos por conversación
                  </p>
                </div>

                <Button
                  onClick={handleUpgrade}
                  variant="kiki"
                  className="w-full h-12 rounded-xl font-medium"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Mejorar a {tierInfo.nextTier}
                </Button>
              </>
            )}

            {tier === "premium" && (
              <p className="text-sm text-center text-muted-foreground">
                Ya tienes el plan Premium con el límite máximo de fotos.
              </p>
            )}

            <button
              onClick={onClose}
              className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Entendido
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatImageLimitModal;
