import { motion } from "framer-motion";
import { Check, CircleDashed } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OnboardingProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedFields: string[];
  currentStepName: string;
}

const OnboardingProgressIndicator = ({
  currentStep,
  totalSteps,
  completedFields,
  currentStepName,
}: OnboardingProgressIndicatorProps) => {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto mb-6"
    >
      {/* Progress bar with percentage */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          Paso {currentStep} de {totalSteps}
        </span>
        <motion.span
          key={percentage}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-sm font-bold text-primary"
        >
          {percentage}% completado
        </motion.span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-full"
        />
      </div>

      {/* Completed fields indicator */}
      {completedFields.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground">Completado:</span>
          {completedFields.slice(-4).map((field, index) => (
            <motion.span
              key={field}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium"
            >
              <Check className="w-2.5 h-2.5" />
              {field}
            </motion.span>
          ))}
          {completedFields.length > 4 && (
            <span className="text-[10px] text-muted-foreground">
              +{completedFields.length - 4} más
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default OnboardingProgressIndicator;
