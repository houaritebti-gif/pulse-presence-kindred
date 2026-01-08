import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SparkLevelInfo } from "@/hooks/useSparkEnergy";
import confetti from "canvas-confetti";
import { triggerHaptic } from "@/utils/haptics";

interface LevelUpCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: SparkLevelInfo | null;
  previousLevel: SparkLevelInfo | null;
}

const fireLevelUpConfetti = () => {
  // Fire colors with golden accents for level up
  const levelUpColors = ['#FF6B6B', '#FF8C42', '#FFD93D', '#FFA500', '#FFD700', '#FF1493'];
  
  // Epic center burst
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { x: 0.5, y: 0.5 },
    colors: levelUpColors,
    startVelocity: 45,
    gravity: 0.7,
    scalar: 1.4,
    shapes: ['circle', 'square'],
    ticks: 150,
  });
  
  // Delayed side bursts
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 50,
      origin: { x: 0, y: 0.6 },
      colors: levelUpColors,
      startVelocity: 40,
    });
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 50,
      origin: { x: 1, y: 0.6 },
      colors: levelUpColors,
      startVelocity: 40,
    });
  }, 200);
  
  // Golden rain finale
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 160,
      origin: { x: 0.5, y: 0 },
      colors: ['#FFD700', '#FFA500', '#FFD93D'],
      startVelocity: 30,
      gravity: 1.5,
      scalar: 1.2,
      ticks: 120,
    });
  }, 400);
};

const LevelUpCelebration = ({ isOpen, onClose, newLevel, previousLevel }: LevelUpCelebrationProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen && newLevel) {
      // Trigger confetti and haptic immediately
      fireLevelUpConfetti();
      triggerHaptic('success');
      
      // Delay content reveal for dramatic effect
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen, newLevel]);

  if (!newLevel) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-primary/30 bg-gradient-to-b from-card via-card to-primary/5 overflow-hidden">
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="flex flex-col items-center text-center py-4"
            >
              {/* Animated emoji */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  damping: 10, 
                  stiffness: 200,
                  delay: 0.1 
                }}
                className="text-7xl mb-4"
              >
                {newLevel.emoji}
              </motion.div>
              
              {/* Level up text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                  ¡Subiste de nivel!
                </h2>
                
                {previousLevel && (
                  <p className="text-muted-foreground text-sm mb-3">
                    {previousLevel.emoji} {previousLevel.name} → {newLevel.emoji} {newLevel.name}
                  </p>
                )}
              </motion.div>
              
              {/* New level name with glow */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative mb-5"
              >
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                <span className="relative font-display text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Nivel {newLevel.level}: {newLevel.name}
                </span>
              </motion.div>
              
              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full bg-secondary/30 rounded-xl p-4 mb-5"
              >
                <h3 className="font-display text-sm font-semibold text-foreground mb-2">
                  Nuevos beneficios desbloqueados:
                </h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {newLevel.discount > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      {newLevel.discount}% descuento en la tienda
                    </li>
                  )}
                  {newLevel.bonusGhostMessages > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      +{newLevel.bonusGhostMessages} ghost message{newLevel.bonusGhostMessages > 1 ? 's' : ''} extra
                    </li>
                  )}
                  {newLevel.level >= 3 && (
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Badge {newLevel.emoji} en tu perfil
                    </li>
                  )}
                </ul>
              </motion.div>
              
              {/* CTA button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full"
              >
                <Button 
                  onClick={onClose} 
                  variant="kiki" 
                  className="w-full"
                >
                  ¡Genial! 🔥
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default LevelUpCelebration;
