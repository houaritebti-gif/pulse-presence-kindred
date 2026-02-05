import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

interface OnboardingNavigationProps {
  step: number;
  totalSteps: number;
  canProceed: boolean;
  isLoading?: boolean;
  isOptionalStep?: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
  onSkip?: () => void;
  onExit?: () => void;
}

const OnboardingNavigation = ({
  step,
  totalSteps,
  canProceed,
  isLoading = false,
  isOptionalStep = false,
  onBack,
  onNext,
  onComplete,
  onSkip,
  onExit,
}: OnboardingNavigationProps) => {
  const isLastStep = step === totalSteps;
  const isFirstStep = step === 1;

  const handleExit = () => {
    triggerHaptic("light");
    onExit?.();
  };

  const handleBack = () => {
    triggerHaptic("light");
    onBack();
  };

  const handleNext = () => {
    triggerHaptic("selection");
    onNext();
  };

  const handleComplete = () => {
    triggerHaptic("success");
    onComplete();
  };

  const handleSkip = () => {
    triggerHaptic("light");
    onSkip?.();
  };

  return (
    <motion.div 
      className="flex-shrink-0 pt-4 pb-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)',
      }}
    >
      {/* Main navigation buttons */}
      <div className="flex gap-3 max-w-md mx-auto w-full">
        {/* Back button - shows exit on first step, back on others */}
        <AnimatePresence mode="wait">
          {isFirstStep && onExit ? (
            <motion.div
              key="exit"
              initial={{ opacity: 0, x: -20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: -20, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <Button
                variant="outline"
                onClick={handleExit}
                className={cn(
                  "w-full h-14 rounded-2xl text-base font-bold",
                  "active:scale-[0.97] transition-all duration-200 touch-manipulation",
                  "border-2 border-border/60 hover:border-primary/40 hover:bg-primary/5",
                  "shadow-sm"
                )}
                aria-label="Volver al inicio"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Salir
              </Button>
            </motion.div>
          ) : !isFirstStep ? (
            <motion.div
              key="back"
              initial={{ opacity: 0, x: -20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: -20, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <Button
                variant="outline"
                onClick={handleBack}
                className={cn(
                  "w-full h-14 rounded-2xl text-base font-bold",
                  "active:scale-[0.97] transition-all duration-200 touch-manipulation",
                  "border-2 border-border/60 hover:border-primary/40 hover:bg-primary/5",
                  "shadow-sm"
                )}
                aria-label="Volver al paso anterior"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Atrás
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Next/Complete button */}
        {!isLastStep ? (
          <motion.div 
            className={cn("flex-1", isFirstStep && "flex-[2]")}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className={cn(
                "w-full h-14 rounded-2xl text-base font-bold",
                "transition-all duration-200 touch-manipulation",
                "shadow-lg shadow-primary/20",
                canProceed 
                  ? "bg-gradient-to-r from-primary to-primary/85 hover:from-primary/90 hover:to-primary/75" 
                  : "opacity-50 cursor-not-allowed"
              )}
              aria-label={canProceed ? "Continuar al siguiente paso" : "Completa este paso para continuar"}
            >
              <span className="flex items-center gap-2">
                Siguiente
                <motion.div
                  animate={canProceed ? { x: [0, 4, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </span>
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            className="flex-1"
            whileTap={{ scale: 0.97 }}
          >
            <Button
              onClick={handleComplete}
              disabled={isLoading || !canProceed}
              className={cn(
                "w-full h-14 rounded-2xl text-base font-bold",
                "transition-all duration-200 touch-manipulation",
                "shadow-lg",
                canProceed && !isLoading
                  ? "bg-gradient-to-r from-primary to-primary/70 hover:from-primary/90 hover:to-primary/60 shadow-primary/30" 
                  : "opacity-50 cursor-not-allowed"
              )}
              aria-label="Completar perfil y empezar"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-label="Guardando..." />
              ) : (
                <span className="flex items-center gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                  ¡Empezar!
                </span>
              )}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Skip option for optional steps */}
      <AnimatePresence>
        {isOptionalStep && !isLastStep && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <button
              onClick={handleSkip}
              className={cn(
                "w-full mt-3 py-3 text-center text-sm text-muted-foreground",
                "hover:text-foreground active:text-foreground",
                "transition-colors touch-manipulation",
                "flex items-center justify-center gap-2"
              )}
              aria-label="Saltar este paso opcional"
            >
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                opcional
              </span>
              Saltar este paso
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingNavigation;
