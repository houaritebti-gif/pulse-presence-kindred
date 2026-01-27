import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OnboardingStepHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  step: number;
  totalSteps: number;
  direction: "forward" | "back";
}

const OnboardingStepHeader = ({
  icon,
  title,
  subtitle,
  step,
  totalSteps,
  direction,
}: OnboardingStepHeaderProps) => {
  const slideVariants = {
    enter: (dir: "forward" | "back") => ({
      x: dir === "forward" ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        type: "tween" as const,
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
    exit: (dir: "forward" | "back") => ({
      x: dir === "forward" ? -50 : 50,
      opacity: 0,
      transition: { duration: 0.15 },
    }),
  };

  return (
    <div className="text-center mb-8">
      {/* Logo with heartbeat animation */}
      <motion.div 
        className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground mb-4 shadow-lg shadow-primary/20"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {icon}
      </motion.div>

      {/* Animated title and subtitle */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div 
          key={`header-${step}`}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <h1 
            className="text-2xl sm:text-3xl font-bold text-foreground mb-2"
            style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
          >
            {title}
          </h1>
          <p 
            className="text-muted-foreground text-base"
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            {subtitle}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Step indicators */}
      <div className="flex justify-center gap-1.5 mt-6">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <motion.div 
            key={s}
            className={cn(
              "h-1.5 rounded-full transition-colors",
              s <= step ? "bg-primary" : "bg-muted/50"
            )}
            animate={{
              width: s === step ? 24 : 6,
              opacity: s < step ? 0.6 : 1,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        ))}
      </div>
    </div>
  );
};

export default OnboardingStepHeader;
