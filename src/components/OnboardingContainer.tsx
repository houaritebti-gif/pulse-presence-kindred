import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OnboardingContainerProps {
  children: ReactNode;
  progress: number;
  step: number;
  totalSteps: number;
}

const OnboardingContainer = ({
  children,
  progress,
  step,
  totalSteps,
}: OnboardingContainerProps) => {
  return (
    <main 
      className={cn(
        "min-h-[100dvh] max-h-[100dvh] bg-background",
        "flex flex-col px-4 sm:px-6 overflow-hidden relative"
      )}
      style={{ 
        paddingTop: 'max(env(safe-area-inset-top, 16px), 16px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Animated ambient glow - follows progress */}
      <motion.div 
        className="absolute top-16 left-1/2 w-[350px] h-[200px] bg-primary/5 blur-[80px] rounded-full pointer-events-none" 
        aria-hidden="true"
        animate={{
          x: "-50%",
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Secondary glow accent */}
      <motion.div 
        className="absolute bottom-32 right-0 w-[200px] h-[200px] bg-primary/3 blur-[60px] rounded-full pointer-events-none" 
        aria-hidden="true"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Top progress bar - enhanced design */}
      <div className="relative mb-6 flex-shrink-0">
        {/* Background track */}
        <div 
          className="w-full h-2 bg-muted/40 rounded-full overflow-hidden backdrop-blur-sm"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Paso ${step} de ${totalSteps}`}
        >
          {/* Progress fill with gradient */}
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-primary/70"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>

        {/* Step counter badge */}
        <motion.div 
          className="absolute -right-1 -top-1 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
        >
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            {step}/{totalSteps}
          </span>
        </motion.div>
      </div>

      {/* Main content area */}
      {children}
    </main>
  );
};

export default OnboardingContainer;
