import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Flame, User, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerHaptic } from "@/utils/haptics";

const TUTORIAL_STORAGE_KEY = "kiki_swipe_tutorial_seen";

interface SwipeTutorialProps {
  onComplete: () => void;
}

const swipeDirections = [
  {
    direction: "left",
    icon: X,
    arrow: ChevronLeft,
    title: "← Pasar",
    description: "Desliza a la izquierda para pasar al siguiente perfil",
    color: "from-muted to-muted-foreground/20",
    iconColor: "text-muted-foreground",
    emoji: "👋",
  },
  {
    direction: "right",
    icon: Sparkles,
    arrow: ChevronRight,
    title: "→ Chispa",
    description: "Desliza a la derecha para enviar una Chispa ✨ Si hay interés mutuo, ¡habrá vibra!",
    color: "from-primary/80 to-primary",
    iconColor: "text-primary-foreground",
    emoji: "✨",
  },
  {
    direction: "up",
    icon: Flame,
    arrow: ChevronUp,
    title: "↑ Super Chispa",
    description: "Desliza hacia arriba para enviar una Super Chispa 🔥 que destacará tu interés especial",
    color: "from-purple-500 to-blue-500",
    iconColor: "text-white",
    emoji: "🔥",
  },
  {
    direction: "down",
    icon: User,
    arrow: ChevronDown,
    title: "↓ Ver perfil",
    description: "Desliza hacia abajo para ver el perfil completo antes de decidir",
    color: "from-accent/80 to-accent",
    iconColor: "text-accent-foreground",
    emoji: "👤",
  },
];

export const SwipeTutorial = ({ onComplete }: SwipeTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

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

        {/* Step indicators */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
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
            className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${current.color} flex items-center justify-center mb-8 shadow-2xl`}
            animate={{
              x: current.direction === "left" ? [-20, 0] : current.direction === "right" ? [20, 0] : 0,
              y: current.direction === "up" ? [-20, 0] : current.direction === "down" ? [20, 0] : 0,
            }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
          >
            <Icon className={`w-16 h-16 ${current.iconColor}`} />
            
            {/* Directional arrow */}
            <motion.div
              className="absolute"
              style={{
                left: current.direction === "left" ? -40 : current.direction === "right" ? "auto" : "50%",
                right: current.direction === "right" ? -40 : "auto",
                top: current.direction === "up" ? -40 : current.direction === "down" ? "auto" : "50%",
                bottom: current.direction === "down" ? -40 : "auto",
                transform: current.direction === "left" || current.direction === "right" 
                  ? "translateY(-50%)" 
                  : "translateX(-50%)",
              }}
              animate={{
                x: current.direction === "left" ? [-10, 0] : current.direction === "right" ? [10, 0] : 0,
                y: current.direction === "up" ? [-10, 0] : current.direction === "down" ? [10, 0] : 0,
                opacity: [0.5, 1],
              }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.6 }}
            >
              <Arrow className="w-8 h-8 text-white" />
            </motion.div>
          </motion.div>

          {/* Title with emoji */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{current.emoji}</span>
            <h2 className="text-2xl font-display font-bold text-white">
              {current.title}
            </h2>
          </div>

          {/* Description */}
          <p className="text-white/70 font-body mb-8 leading-relaxed">
            {current.description}
          </p>

          {/* Phone mockup showing gesture */}
          <div className="w-48 h-72 rounded-3xl border-2 border-white/20 bg-white/5 backdrop-blur-sm relative overflow-hidden mb-8">
            {/* Card representation */}
            <motion.div
              className="absolute inset-4 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/10"
              animate={{
                x: current.direction === "left" ? [0, -30] : current.direction === "right" ? [0, 30] : 0,
                y: current.direction === "up" ? [0, -30] : current.direction === "down" ? [0, 30] : 0,
                rotate: current.direction === "left" ? [0, -5] : current.direction === "right" ? [0, 5] : 0,
              }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.2, ease: "easeInOut" }}
            >
              {/* Finger indicator */}
              <motion.div
                className="absolute bottom-6 left-1/2 w-8 h-8 rounded-full bg-white/80 shadow-lg"
                animate={{
                  x: current.direction === "left" ? ["-50%", "calc(-50% - 20px)"] : current.direction === "right" ? ["-50%", "calc(-50% + 20px)"] : "-50%",
                  y: current.direction === "up" ? [0, -20] : current.direction === "down" ? [0, 20] : 0,
                }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.2, ease: "easeInOut" }}
              />
            </motion.div>
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
