import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KikiLogo } from "@/components/KikiLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ReactNode } from "react";

interface PageHeaderProps {
  /** Text for back button, or null to hide back button */
  backLabel?: string | null;
  /** Navigation target for back button (defaults to -1 for history back) */
  backTo?: string | number;
  /** Content to render on the right side (buttons, toggles, etc.) */
  rightContent?: ReactNode;
  /** Whether to show theme toggle (default: true) */
  showThemeToggle?: boolean;
  /** Additional className for the header container */
  className?: string;
}

/**
 * Consistent page header with centered KikiLogo.
 * Uses CSS Grid to ensure perfect centering regardless of left/right content width.
 */
export const PageHeader = ({
  backLabel = "Volver",
  backTo = -1,
  rightContent,
  showThemeToggle = true,
  className = "",
}: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof backTo === "number") {
      navigate(backTo);
    } else {
      navigate(backTo);
    }
  };

  return (
    <header 
      className={`relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-6 sm:mb-8 ${className}`}
    >
      {/* Left section - back button */}
      <motion.div 
        className="flex items-center justify-start"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {backLabel !== null && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 group rounded-lg p-1 -ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ fontFamily: 'Arial, sans-serif' }}
            aria-label={`Volver a ${backLabel}`}
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm sm:text-base">{backLabel}</span>
          </button>
        )}
      </motion.div>

      {/* Center section - Logo (always centered) with entrance animation */}
      <motion.div 
        className="flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.9, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          duration: 0.4, 
          ease: [0.175, 0.885, 0.32, 1.1], // Bouncy easing
          delay: 0.05
        }}
      >
        <KikiLogo size="lg" compact />
      </motion.div>

      {/* Right section - actions */}
      <motion.div 
        className="flex items-center justify-end gap-1.5 sm:gap-2"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {showThemeToggle && <ThemeToggle />}
        {rightContent}
      </motion.div>
    </header>
  );
};

export default PageHeader;
