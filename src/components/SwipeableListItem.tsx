import { ReactNode, useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion";
import { Trash2, Check, X, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

type SwipeAction = "delete" | "archive" | "complete" | "dismiss";

interface SwipeActionConfig {
  type: SwipeAction;
  icon?: ReactNode;
  color?: string;
  threshold?: number;
}

interface SwipeableListItemProps {
  children: ReactNode;
  /** Action when swiping left (negative x) */
  leftAction?: SwipeActionConfig;
  /** Action when swiping right (positive x) */
  rightAction?: SwipeActionConfig;
  /** Called when left action is triggered */
  onLeftAction?: () => void;
  /** Called when right action is triggered */
  onRightAction?: () => void;
  /** Whether swipe is disabled */
  disabled?: boolean;
  className?: string;
  /** Unique key for AnimatePresence exit animation */
  itemKey?: string;
}

const DEFAULT_THRESHOLD = 100;

const getActionIcon = (type: SwipeAction) => {
  switch (type) {
    case "delete":
      return <Trash2 className="w-5 h-5" />;
    case "archive":
      return <Archive className="w-5 h-5" />;
    case "complete":
      return <Check className="w-5 h-5" />;
    case "dismiss":
      return <X className="w-5 h-5" />;
    default:
      return null;
  }
};

const getActionColor = (type: SwipeAction) => {
  switch (type) {
    case "delete":
      return "hsl(var(--destructive))";
    case "archive":
      return "hsl(var(--muted))";
    case "complete":
      return "hsl(var(--primary))";
    case "dismiss":
      return "hsl(var(--muted))";
    default:
      return "hsl(var(--muted))";
  }
};

export const SwipeableListItem = ({
  children,
  leftAction = { type: "delete" },
  rightAction,
  onLeftAction,
  onRightAction,
  disabled = false,
  className,
  itemKey,
}: SwipeableListItemProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  
  const x = useMotionValue(0);
  
  const leftThreshold = -(leftAction?.threshold || DEFAULT_THRESHOLD);
  const rightThreshold = rightAction?.threshold || DEFAULT_THRESHOLD;
  
  const leftColor = leftAction?.color || getActionColor(leftAction?.type || "delete");
  const rightColor = rightAction?.color || getActionColor(rightAction?.type || "complete");

  // Left action background (swipe left - negative x)
  const leftBackground = useTransform(
    x,
    [0, leftThreshold],
    [`${leftColor}00`, leftColor]
  );
  const leftIconOpacity = useTransform(
    x,
    [0, leftThreshold / 2, leftThreshold],
    [0, 0.6, 1]
  );
  const leftIconScale = useTransform(
    x,
    [0, leftThreshold],
    [0.5, 1.1]
  );

  // Right action background (swipe right - positive x)
  const rightBackground = useTransform(
    x,
    [0, rightThreshold],
    [`${rightColor}00`, rightColor]
  );
  const rightIconOpacity = useTransform(
    x,
    [0, rightThreshold / 2, rightThreshold],
    [0, 0.6, 1]
  );
  const rightIconScale = useTransform(
    x,
    [0, rightThreshold],
    [0.5, 1.1]
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;

    // Swipe left action
    if (info.offset.x < leftThreshold && onLeftAction) {
      setExitDirection("left");
      setIsExiting(true);
      triggerHaptic("medium");
      
      setTimeout(() => {
        onLeftAction();
      }, 250);
    }
    // Swipe right action
    else if (info.offset.x > rightThreshold && onRightAction && rightAction) {
      setExitDirection("right");
      setIsExiting(true);
      triggerHaptic("light");
      
      setTimeout(() => {
        onRightAction();
      }, 250);
    }
  };

  const getExitAnimation = () => {
    if (!isExiting) return {};
    
    if (exitDirection === "left") {
      return { 
        x: -400, 
        opacity: 0,
        height: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
      };
    }
    if (exitDirection === "right") {
      return { 
        x: 400, 
        opacity: 0,
        height: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
      };
    }
    return {};
  };

  const dragConstraints = {
    left: onLeftAction ? -150 : 0,
    right: onRightAction && rightAction ? 150 : 0,
  };

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={itemKey}
        layout
        initial={{ opacity: 1, height: "auto" }}
        exit={{ 
          opacity: 0, 
          height: 0,
          marginBottom: 0,
          transition: { duration: 0.2 }
        }}
        className="relative overflow-hidden rounded-2xl"
      >
        {/* Left action background (appears on right side when swiping left) */}
        {leftAction && onLeftAction && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-end pr-6 rounded-2xl"
            style={{ background: leftBackground }}
          >
            <motion.div 
              className="text-destructive-foreground"
              style={{ opacity: leftIconOpacity, scale: leftIconScale }}
            >
              {leftAction.icon || getActionIcon(leftAction.type)}
            </motion.div>
          </motion.div>
        )}

        {/* Right action background (appears on left side when swiping right) */}
        {rightAction && onRightAction && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-start pl-6 rounded-2xl"
            style={{ background: rightBackground }}
          >
            <motion.div 
              className="text-primary-foreground"
              style={{ opacity: rightIconOpacity, scale: rightIconScale }}
            >
              {rightAction.icon || getActionIcon(rightAction.type)}
            </motion.div>
          </motion.div>
        )}

        {/* Swipeable content */}
        <motion.div
          drag={disabled ? false : "x"}
          dragConstraints={dragConstraints}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          style={{ x }}
          animate={getExitAnimation()}
          transition={{ 
            type: "spring",
            stiffness: 500,
            damping: 35,
          }}
          className={cn(
            "relative bg-card cursor-grab active:cursor-grabbing",
            className
          )}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SwipeableListItem;
