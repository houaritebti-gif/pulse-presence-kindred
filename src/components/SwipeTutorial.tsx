import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Flame, RotateCcw, ChevronLeft, ChevronRight, ChevronUp, Smartphone, Monitor, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerHaptic } from "@/utils/haptics";
import { useIsMobile } from "@/hooks/use-mobile";

const TUTORIAL_STORAGE_KEY = "kiki_swipe_tutorial_seen_v2";

interface SwipeTutorialProps {
  onComplete: () => void;
}

const swipeDirections = [
  {
    direction: "left",
    icon: X,
    arrow: ChevronLeft,
    title: "← Pasar",
    titleMobile: "← Desliza izquierda",
    titleDesktop: "← Tecla izquierda",
    description: "Pasa al siguiente perfil sin enviar interés",
    color: "from-muted to-muted-foreground/20",
    iconColor: "text-muted-foreground",
    emoji: "👋",
    keyHint: "←",
  },
  {
    direction: "right",
    icon: Sparkles,
    arrow: ChevronRight,
    title: "→ Chispa",
    titleMobile: "→ Desliza derecha",
    titleDesktop: "→ Tecla derecha",
    description: "Envía una Chispa ✨ Si hay interés mutuo, ¡habrá vibra!",
    color: "from-primary/80 to-primary",
    iconColor: "text-primary-foreground",
    emoji: "✨",
    keyHint: "→",
  },
  {
    direction: "up",
    icon: Flame,
    arrow: ChevronUp,
    title: "↑ Super Chispa",
    titleMobile: "↑ Desliza arriba",
    titleDesktop: "↑ Tecla arriba",
    description: "Destaca tu interés especial con una Super Chispa 🔥",
    color: "from-purple-500 to-blue-500",
    iconColor: "text-white",
    emoji: "🔥",
    keyHint: "↑",
  },
  {
    direction: "tap",
    icon: MousePointer,
    arrow: MousePointer,
    title: "👆 Toca la foto",
    titleMobile: "👆 Toca la foto",
    titleDesktop: "👆 Click en la foto",
    description: "Entra al perfil completo tocando la foto",
    color: "from-accent/80 to-accent",
    iconColor: "text-accent-foreground",
    emoji: "👤",
    keyHint: "↓",
  },
  {
    direction: "rewind",
    icon: RotateCcw,
    arrow: RotateCcw,
    title: "⏪ Rebobinar",
    titleMobile: "⏪ Botón rebobinar",
    titleDesktop: "R Tecla R",
    description: "¿Pasaste sin querer? Vuelve al perfil anterior (limitado por tier)",
    color: "from-amber-400 to-orange-500",
    iconColor: "text-white",
    emoji: "⏪",
    keyHint: "R",
  },
];

export const SwipeTutorial = ({ onComplete }: SwipeTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const hasSeen = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!hasSeen) {
      setIsVisible(true);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const handleNext = () => {
    triggerHaptic('selection');
    if (currentStep < swipeDirections.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    triggerHaptic('light');
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const current = swipeDirections[currentStep];
  const Icon = current.icon;
  const Arrow = current.arrow;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6"
      >
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 text-white/60 hover:text-white text-sm font-medium transition-colors"
        >
          Saltar
        </button>

        {/* Device indicator */}
        <div className="absolute top-6 left-6 flex items-center gap-2 text-white/40 text-xs">
          {isMobile ? (
            <>
              <Smartphone className="w-4 h-4" />
              <span>Móvil</span>
            </>
          ) : (
            <>
              <Monitor className="w-4 h-4" />
              <span>Escritorio</span>
            </>
          )}
        </div>

        {/* Step indicators */}
        <div className="absolute top-14 left-1/2 -translate-x-1/2 flex gap-2">
          {swipeDirections.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStep 
                  ? "bg-primary w-6" 
                  : idx < currentStep 
                    ? "bg-primary/50" 
                    : "bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* Main content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          {/* Animated icon container */}
          <motion.div
            className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br ${current.color} flex items-center justify-center mb-6 shadow-2xl`}
            animate={{
              x: current.direction === "left" ? [-20, 0] : current.direction === "right" ? [20, 0] : 0,
              y: current.direction === "up" ? [-20, 0] : 0,
              scale: current.direction === "tap" || current.direction === "rewind" ? [1, 1.1, 1] : 1,
            }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
          >
            <Icon className={`w-12 h-12 md:w-16 md:h-16 ${current.iconColor}`} />
            
            {/* Directional arrow - only for swipe directions */}
            {(current.direction === "left" || current.direction === "right" || current.direction === "up") && (
              <motion.div
                className="absolute"
                style={{
                  left: current.direction === "left" ? -40 : current.direction === "right" ? "auto" : "50%",
                  right: current.direction === "right" ? -40 : "auto",
                  top: current.direction === "up" ? -40 : "50%",
                  transform: current.direction === "left" || current.direction === "right" 
                    ? "translateY(-50%)" 
                    : "translateX(-50%)",
                }}
                animate={{
                  x: current.direction === "left" ? [-10, 0] : current.direction === "right" ? [10, 0] : 0,
                  y: current.direction === "up" ? [-10, 0] : 0,
                  opacity: [0.5, 1],
                }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.6 }}
              >
                <Arrow className="w-8 h-8 text-white" />
              </motion.div>
            )}
          </motion.div>

          {/* Title with emoji */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl md:text-4xl">{current.emoji}</span>
            <h2 className="text-xl md:text-2xl font-display font-bold text-white">
              {current.title}
            </h2>
          </div>

          {/* Device-specific instruction */}
          <p className="text-white/50 text-sm mb-3">
            {isMobile ? current.titleMobile : current.titleDesktop}
          </p>

          {/* Description */}
          <p className="text-white/70 font-body mb-6 leading-relaxed text-sm md:text-base">
            {current.description}
          </p>

          {/* Visual demonstration - different for mobile vs desktop */}
          {isMobile && current.direction !== "tap" && current.direction !== "rewind" ? (
            // Phone mockup showing gesture
            <div className="w-40 h-56 md:w-48 md:h-64 rounded-3xl border-2 border-white/20 bg-white/5 backdrop-blur-sm relative overflow-hidden mb-6">
              {/* Card representation */}
              <motion.div
                className="absolute inset-4 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/10"
                animate={{
                  x: current.direction === "left" ? [0, -30] : current.direction === "right" ? [0, 30] : 0,
                  y: current.direction === "up" ? [0, -30] : 0,
                  rotate: current.direction === "left" ? [0, -5] : current.direction === "right" ? [0, 5] : 0,
                }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.2, ease: "easeInOut" }}
              >
                {/* Finger indicator */}
                <motion.div
                  className="absolute bottom-6 left-1/2 w-8 h-8 rounded-full bg-white/80 shadow-lg"
                  animate={{
                    x: current.direction === "left" ? ["-50%", "calc(-50% - 20px)"] : current.direction === "right" ? ["-50%", "calc(-50% + 20px)"] : "-50%",
                    y: current.direction === "up" ? [0, -20] : 0,
                  }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.2, ease: "easeInOut" }}
                />
              </motion.div>
            </div>
          ) : current.direction === "tap" ? (
            // Tap on photo demonstration
            <div className="w-40 h-56 md:w-48 md:h-64 rounded-3xl border-2 border-white/20 bg-white/5 backdrop-blur-sm relative overflow-hidden mb-6">
              <motion.div
                className="absolute inset-4 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center"
              >
                <motion.div
                  className="w-12 h-12 rounded-full bg-white/80 shadow-lg flex items-center justify-center"
                  animate={{ scale: [1, 0.8, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <MousePointer className="w-6 h-6 text-foreground" />
                </motion.div>
              </motion.div>
            </div>
          ) : current.direction === "rewind" ? (
            // Rewind button demonstration
            <div className="flex flex-col items-center gap-3 mb-6">
              <motion.div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
                animate={{ rotate: [-15, 0, -15] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <RotateCcw className="w-8 h-8 text-white" />
              </motion.div>
              <p className="text-white/50 text-xs">
                Límites: Free 2/semana · Plus 10/semana · Premium ∞
              </p>
            </div>
          ) : (
            // Keyboard mockup for desktop - only for swipe directions
            <div className="flex flex-col items-center gap-2 mb-6">
              {(current.direction === "left" || current.direction === "right" || current.direction === "up") && (
                <div className="grid grid-cols-3 gap-1">
                  <div className="col-start-2">
                    <motion.div
                      className={`w-12 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-mono font-bold
                        ${current.direction === "up" ? "bg-primary border-primary text-primary-foreground" : "bg-white/10 border-white/20 text-white/40"}`}
                      animate={current.direction === "up" ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      ↑
                    </motion.div>
                  </div>
                  <motion.div
                    className={`w-12 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-mono font-bold
                      ${current.direction === "left" ? "bg-primary border-primary text-primary-foreground" : "bg-white/10 border-white/20 text-white/40"}`}
                    animate={current.direction === "left" ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    ←
                  </motion.div>
                  <div className="w-12 h-10" /> {/* Empty space where down key was */}
                  <motion.div
                    className={`w-12 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-mono font-bold
                      ${current.direction === "right" ? "bg-primary border-primary text-primary-foreground" : "bg-white/10 border-white/20 text-white/40"}`}
                    animate={current.direction === "right" ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    →
                  </motion.div>
                </div>
              )}
              {current.direction === "rewind" && (
                <motion.div
                  className="w-12 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-mono font-bold bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 text-white"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  R
                </motion.div>
              )}
              <p className="text-white/30 text-xs">
                {current.direction === "tap" ? "Click en la foto del perfil" : "También puedes usar los botones"}
              </p>
            </div>
          )}

          {/* Buttons hint */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-4">
            <span className="text-xs text-white/60">
              {isMobile ? "O toca la pantalla para ver los botones" : "Los botones siempre están visibles en escritorio"}
            </span>
          </div>
        </motion.div>

        {/* Next button */}
        <Button
          onClick={handleNext}
          size="lg"
          className="min-w-[200px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full shadow-lg shadow-primary/30"
        >
          {currentStep < swipeDirections.length - 1 ? "Siguiente" : "¡Empezar! 🚀"}
        </Button>

        {/* Step counter */}
        <p className="mt-4 text-white/40 text-sm">
          {currentStep + 1} de {swipeDirections.length}
        </p>
      </motion.div>
    </AnimatePresence>
  );
};

export const useSwipeTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem(TUTORIAL_STORAGE_KEY);
  });

  const completeTutorial = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    setShowTutorial(false);
  };

  const resetTutorial = () => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    setShowTutorial(true);
  };

  return { showTutorial, completeTutorial, resetTutorial };
};

export default SwipeTutorial;
