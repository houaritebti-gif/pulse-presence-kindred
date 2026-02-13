import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Sparkles, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";
import { fireSparkConfetti, firePerfectMatchHearts } from "@/utils/sparkConfetti";
import LazyImage from "@/components/LazyImage";

interface HayVibraScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: () => void;
  onViewProfile: () => void;
  myPhoto: string | null;
  theirPhoto: string | null;
  theirName: string | null;
  compatibility?: number;
  isPerfectMatch?: boolean;
}

export const HayVibraScreen = ({
  isOpen,
  onClose,
  onSendMessage,
  onViewProfile,
  myPhoto,
  theirPhoto,
  theirName,
  compatibility = 0,
  isPerfectMatch = false,
}: HayVibraScreenProps) => {
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isOpen && !hasAnimated) {
      setHasAnimated(true);
      // Trigger celebration effects
      setTimeout(() => {
        if (isPerfectMatch) {
          firePerfectMatchHearts();
        } else {
          fireSparkConfetti();
        }
        triggerHaptic('success');
      }, 400);
    }
    
    if (!isOpen) {
      setHasAnimated(false);
    }
  }, [isOpen, hasAnimated, isPerfectMatch]);

  const handleSendMessage = () => {
    triggerHaptic('medium');
    onSendMessage();
    onClose();
  };

  const handleViewProfile = () => {
    triggerHaptic('light');
    onViewProfile();
    onClose();
  };

  const handleKeepSwiping = () => {
    triggerHaptic('light');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background with gradient */}
          <motion.div
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={cn(
              "absolute inset-0",
              isPerfectMatch
                ? "bg-gradient-to-br from-primary via-pink-500 to-red-500"
                : "bg-gradient-to-br from-primary/90 via-accent to-primary"
            )}
          />

          {/* Animated particles/orbs in background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "absolute rounded-full blur-xl",
                  isPerfectMatch ? "bg-white/30" : "bg-white/20"
                )}
                style={{
                  width: Math.random() * 150 + 50,
                  height: Math.random() * 150 + 50,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  x: [0, Math.random() * 40 - 20],
                  y: [0, Math.random() * 40 - 20],
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-md">
            {/* Photos section */}
            <div className="relative flex items-center justify-center mb-8">
              {/* My photo (left) */}
              <motion.div
                initial={{ x: -100, opacity: 0, rotate: -15 }}
                animate={{ x: 0, opacity: 1, rotate: -8 }}
                transition={{ 
                  type: "spring", 
                  damping: 15, 
                  stiffness: 200,
                  delay: 0.2 
                }}
                className="relative z-10"
              >
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-black/30">
                  {myPhoto ? (
                    <LazyImage
                      src={myPhoto}
                      alt="Tu foto"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center">
                      <span className="text-4xl">👤</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Heart connection in the middle */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: "spring", 
                  damping: 10, 
                  stiffness: 200,
                  delay: 0.5 
                }}
                className="absolute z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-xl",
                    isPerfectMatch
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                      : "bg-white"
                  )}
                >
                  {isPerfectMatch ? (
                    <span className="text-2xl">🔥</span>
                  ) : (
                    <Heart className="w-7 h-7 text-primary fill-primary" />
                  )}
                </motion.div>
              </motion.div>

              {/* Their photo (right) */}
              <motion.div
                initial={{ x: 100, opacity: 0, rotate: 15 }}
                animate={{ x: 0, opacity: 1, rotate: 8 }}
                transition={{ 
                  type: "spring", 
                  damping: 15, 
                  stiffness: 200,
                  delay: 0.3 
                }}
                className="relative z-10 -ml-8"
              >
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-black/30">
                  {theirPhoto ? (
                    <LazyImage
                      src={theirPhoto}
                      alt={theirName || "Su foto"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-accent/50 to-primary/50 flex items-center justify-center">
                      <span className="text-4xl">👤</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Title section */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="text-center mb-6"
            >
              {isPerfectMatch ? (
                <>
                  <motion.h1 
                    className="text-4xl sm:text-5xl font-display font-black text-white mb-2 drop-shadow-lg"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ¡Vibra máxima!
                  </motion.h1>
                  <p className="text-white/90 text-lg font-medium flex items-center justify-center gap-2">
                    <span>🔥</span>
                    Compatibilidad {compatibility}/5
                    <span>🔥</span>
                  </p>
                </>
              ) : (
                <>
                  <motion.h1 
                    className="text-4xl sm:text-5xl font-display font-black text-white mb-2 drop-shadow-lg"
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ¡Hay vibra!
                  </motion.h1>
                  <p className="text-white/90 text-lg font-medium">
                    Tú y <span className="font-bold">{theirName || "este perfil"}</span> conectaron
                  </p>
                </>
              )}
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="text-white/70 text-center text-sm mb-8 max-w-xs"
            >
              {isPerfectMatch
                ? "Esto es especial. ¡Tenéis mucho en común!"
                : "Interés mutuo. ¡Ahora pueden chatear!"}
            </motion.p>

            {/* Action buttons */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="w-full space-y-3"
            >
              {/* Primary action - Send message */}
              <Button
                onClick={handleSendMessage}
                size="lg"
                className={cn(
                  "w-full rounded-full font-bold text-base py-6 shadow-xl transition-all",
                  isPerfectMatch
                    ? "bg-white text-primary hover:bg-white/90 shadow-white/30"
                    : "bg-white text-primary hover:bg-white/90 shadow-white/20"
                )}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Enviar mensaje
              </Button>

              {/* Secondary action - View profile */}
              <Button
                onClick={handleViewProfile}
                variant="outline"
                size="lg"
                className="w-full rounded-full font-semibold text-base py-6 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Ver perfil
              </Button>

              {/* Tertiary action - Keep swiping */}
              <button
                onClick={handleKeepSwiping}
                className="w-full text-white/60 hover:text-white text-sm font-medium py-3 transition-colors flex items-center justify-center gap-1"
              >
                Seguir explorando
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>

          {/* Decorative sparkles */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute inset-0 pointer-events-none"
          >
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute text-2xl"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  rotate: [0, 180],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  repeatDelay: Math.random() * 3,
                }}
              >
                {isPerfectMatch ? "⭐" : "✨"}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HayVibraScreen;
