import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Flame, 
  Ghost, 
  MessageCircle, 
  Heart, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  X,
  Zap,
  Eye,
  Users,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

interface TutorialStep {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  illustration: React.ReactNode;
  tip?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    icon: <Sparkles className="h-8 w-8" />,
    iconBg: "from-primary to-accent",
    title: "¡Bienvenido a KIKI!",
    description: "Aquí no hay match, hay chispa ✨. Descubre cómo conectar de forma auténtica con personas afines.",
    illustration: (
      <div className="relative w-32 h-32 mx-auto">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0] 
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-xl">
            <Flame className="h-12 w-12 text-white" />
          </div>
        </motion.div>
        {/* Floating particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [-10, -30, -10],
              x: [0, (i % 2 === 0 ? 10 : -10), 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className="absolute w-2 h-2 rounded-full bg-primary/60"
            style={{
              left: `${20 + i * 15}%`,
              top: `${60 + (i % 3) * 10}%`,
            }}
          />
        ))}
      </div>
    ),
  },
  {
    id: "presence",
    icon: <Eye className="h-8 w-8" />,
    iconBg: "from-green-500 to-emerald-500",
    title: "Modo Presencia",
    description: "Activa tu presencia para que otros te vean online. Explora perfiles de personas que están conectadas ahora mismo.",
    illustration: (
      <div className="relative flex justify-center gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            className={cn(
              "w-16 h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1",
              i === 1 ? "bg-primary/20 border-primary scale-110" : "bg-muted/50 border-border/50"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20" />
            <div className="w-8 h-1.5 rounded-full bg-muted-foreground/30" />
            {i === 1 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background"
              />
            )}
          </motion.div>
        ))}
      </div>
    ),
    tip: "💡 Puedes activar el modo invisible con Premium",
  },
  {
    id: "chispa",
    icon: <Flame className="h-8 w-8" />,
    iconBg: "from-orange-500 to-red-500",
    title: "Envía una Chispa 🔥",
    description: "¿Te gusta alguien? Envíale una Chispa. Es como un 'me gustas', pero nadie sabrá que la enviaste... a menos que sea mutuo.",
    illustration: (
      <div className="relative flex items-center justify-center gap-8">
        <motion.div className="w-14 h-14 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 border-2 border-muted-foreground/30" />
        <motion.div
          animate={{ 
            x: [0, 15, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Flame className="h-8 w-8 text-orange-500" />
        </motion.div>
        <motion.div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-primary/50" />
      </div>
    ),
    tip: "🤫 Tu chispa es secreta hasta que haya interés mutuo",
  },
  {
    id: "ghost",
    icon: <Ghost className="h-8 w-8" />,
    iconBg: "from-purple-500 to-pink-500",
    title: "Mensajes Fantasma 👻",
    description: "Envía un mensaje anónimo a alguien que te interesa. Tu identidad solo se revela si te responden.",
    illustration: (
      <div className="relative">
        <motion.div
          animate={{ 
            y: [0, -5, 0],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative mx-auto w-20 h-20"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 blur-xl" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Ghost className="h-10 w-10 text-white" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 mx-auto max-w-[180px] px-3 py-2 rounded-lg bg-muted/80 border border-border/50"
        >
          <p className="text-[10px] text-muted-foreground text-center">
            "Me encanta tu vibra..."
          </p>
        </motion.div>
      </div>
    ),
    tip: "📬 Tienes 5 mensajes fantasma gratis al día",
  },
  {
    id: "mutual",
    icon: <Heart className="h-8 w-8" />,
    iconBg: "from-pink-500 to-rose-500",
    title: "¡Hay Vibra! 💕",
    description: "Cuando ambos muestran interés, se crea una conexión y se abre un chat privado. ¡La magia sucede!",
    illustration: (
      <div className="relative flex items-center justify-center">
        <motion.div 
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 border-2 border-white shadow-lg z-10"
        />
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute"
        >
          <Heart className="h-8 w-8 text-rose-500 fill-rose-500" />
        </motion.div>
        <motion.div 
          animate={{ x: [0, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 border-2 border-white shadow-lg z-10"
        />
        {/* Confetti particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [-20, -60],
              x: [(i % 2 === 0 ? -1 : 1) * (10 + i * 5), (i % 2 === 0 ? 1 : -1) * (15 + i * 3)],
              opacity: [1, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.15,
            }}
            className={cn(
              "absolute w-2 h-2 rounded-full",
              i % 3 === 0 ? "bg-pink-400" : i % 3 === 1 ? "bg-yellow-400" : "bg-purple-400"
            )}
          />
        ))}
      </div>
    ),
  },
  {
    id: "chat",
    icon: <MessageCircle className="h-8 w-8" />,
    iconBg: "from-blue-500 to-cyan-500",
    title: "Chat Privado 💬",
    description: "Una vez conectados, podéis chatear sin límites. Mensajes de texto, notas de voz... ¡lo que surja!",
    illustration: (
      <div className="space-y-2 max-w-[200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2"
        >
          <div className="w-6 h-6 rounded-full bg-primary/30 shrink-0" />
          <div className="px-3 py-1.5 rounded-2xl rounded-tl-md bg-muted text-[10px]">
            ¡Hola! Me alegra que conectemos 😊
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-2 justify-end"
        >
          <div className="px-3 py-1.5 rounded-2xl rounded-tr-md bg-primary text-primary-foreground text-[10px]">
            ¡Igualmente! ¿Quedamos? ☕
          </div>
          <div className="w-6 h-6 rounded-full bg-accent/30 shrink-0" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          className="flex gap-2"
        >
          <div className="w-6 h-6 rounded-full bg-primary/30 shrink-0" />
          <div className="px-3 py-1.5 rounded-2xl rounded-tl-md bg-muted text-[10px]">
            ¡Claro! 🔥
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    id: "ready",
    icon: <CheckCircle2 className="h-8 w-8" />,
    iconBg: "from-green-500 to-emerald-500",
    title: "¡Listo para conectar!",
    description: "Ya conoces lo básico. Recuerda: aquí valoramos la autenticidad y el respeto. ¡A por esa chispa!",
    illustration: (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative w-24 h-24 mx-auto"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 animate-ping" />
        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-xl">
          <CheckCircle2 className="h-12 w-12 text-white" />
        </div>
      </motion.div>
    ),
    tip: "🚀 ¡Explora la sección de Presencia para empezar!",
  },
];

interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const InteractiveTutorial = React.forwardRef<HTMLDivElement, InteractiveTutorialProps>(
  ({ isOpen, onClose, onComplete }, ref) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const step = TUTORIAL_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
      triggerHaptic("light");
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
      triggerHaptic("light");
    }
  };

  const handleComplete = () => {
    triggerHaptic("success");
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    triggerHaptic("light");
    onClose();
  };

  // Reset step when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setDirection(1);
    }
  }, [isOpen]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-md bg-card rounded-3xl shadow-2xl border overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Progress dots */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {TUTORIAL_STEPS.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => {
                    setDirection(i > currentStep ? 1 : -1);
                    setCurrentStep(i);
                    triggerHaptic("light");
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === currentStep 
                      ? "w-6 bg-primary" 
                      : i < currentStep 
                        ? "w-1.5 bg-primary/50" 
                        : "w-1.5 bg-muted-foreground/30"
                  )}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="pt-12 pb-6 px-6">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="text-center"
                >
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="mx-auto mb-6"
                  >
                    <div className={cn(
                      "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg bg-gradient-to-br",
                      step.iconBg
                    )}>
                      {step.icon}
                    </div>
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-xl font-bold mb-3"
                  >
                    {step.title}
                  </motion.h2>

                  {/* Description */}
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-muted-foreground mb-6 leading-relaxed"
                  >
                    {step.description}
                  </motion.p>

                  {/* Illustration */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="h-32 flex items-center justify-center mb-6"
                  >
                    {step.illustration}
                  </motion.div>

                  {/* Tip */}
                  {step.tip && (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-xs text-muted-foreground"
                    >
                      {step.tip}
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="px-6 pb-6 flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={isFirstStep}
                className={cn(
                  "gap-1 text-muted-foreground",
                  isFirstStep && "invisible"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {!isLastStep && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground text-sm"
                >
                  Saltar
                </Button>
              )}

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleNext}
                  className={cn(
                    "gap-1 shadow-md",
                    isLastStep && "bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  )}
                >
                  {isLastStep ? (
                    <>
                      ¡Empezar!
                      <Zap className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  }
);

InteractiveTutorial.displayName = "InteractiveTutorial";

export default InteractiveTutorial;
