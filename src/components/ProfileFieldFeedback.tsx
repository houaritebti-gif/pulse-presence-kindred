import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackType = "success" | "error" | "info" | "warning";

interface ProfileFieldFeedbackProps {
  type: FeedbackType;
  message: string;
  show: boolean;
  className?: string;
}

export const ProfileFieldFeedback = ({
  type,
  message,
  show,
  className,
}: ProfileFieldFeedbackProps) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <Check className="w-3.5 h-3.5" />;
      case "error":
        return <AlertCircle className="w-3.5 h-3.5" />;
      case "warning":
        return <AlertCircle className="w-3.5 h-3.5" />;
      case "info":
      default:
        return <Info className="w-3.5 h-3.5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "success":
        return "text-primary";
      case "error":
        return "text-destructive";
      case "warning":
        return "text-accent";
      case "info":
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -5, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -5, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn("overflow-hidden", className)}
        >
          <div className={cn("flex items-center gap-1.5 mt-1.5", getStyles())}>
            {getIcon()}
            <span className="text-xs font-body">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Input wrapper with validation feedback
interface ValidatedInputWrapperProps {
  children: React.ReactNode;
  error?: string;
  success?: string;
  info?: string;
  showSuccess?: boolean;
  className?: string;
}

export const ValidatedInputWrapper = ({
  children,
  error,
  success,
  info,
  showSuccess = false,
  className,
}: ValidatedInputWrapperProps) => {
  return (
    <div className={cn("space-y-0", className)}>
      {children}
      <ProfileFieldFeedback type="error" message={error || ""} show={!!error} />
      <ProfileFieldFeedback
        type="success"
        message={success || ""}
        show={showSuccess && !!success && !error}
      />
      <ProfileFieldFeedback
        type="info"
        message={info || ""}
        show={!!info && !error && !success}
      />
    </div>
  );
};

export default ProfileFieldFeedback;
