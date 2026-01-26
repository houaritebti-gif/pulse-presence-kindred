import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ProfileSectionCardProps {
  title: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  animationDelay?: string;
  className?: string;
  headerAction?: React.ReactNode;
}

export const ProfileSectionCard = ({
  title,
  icon,
  badge,
  children,
  collapsible = false,
  defaultExpanded = true,
  animationDelay = "0ms",
  className,
  headerAction,
}: ProfileSectionCardProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: parseInt(animationDelay) / 1000, duration: 0.3 }}
      className={cn("mb-10", className)}
    >
      {collapsible ? (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between mb-4 group"
        >
          <div className="flex items-center gap-2">
            {icon && (
              <span className="text-primary transition-transform group-hover:scale-110">
                {icon}
              </span>
            )}
            <h2
              className="text-lg font-semibold text-foreground"
              style={{ fontFamily: "Arial Black, Arial, sans-serif" }}
            >
              {title}
            </h2>
            {badge !== undefined && (
              <span className="text-xs text-muted-foreground">({badge})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </motion.div>
          </div>
        </button>
      ) : (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon && <span className="text-primary">{icon}</span>}
            <h2
              className="text-lg font-semibold text-foreground"
              style={{ fontFamily: "Arial Black, Arial, sans-serif" }}
            >
              {title}
            </h2>
            {badge !== undefined && (
              <span className="text-xs text-muted-foreground">({badge})</span>
            )}
          </div>
          {headerAction}
        </div>
      )}

      <motion.div
        initial={false}
        animate={{
          height: collapsible && !expanded ? 0 : "auto",
          opacity: collapsible && !expanded ? 0 : 1,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default ProfileSectionCard;
