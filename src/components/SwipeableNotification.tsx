import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion";
import { Trash2, Check } from "lucide-react";
import { triggerHaptic } from "@/utils/haptics";

interface SwipeableNotificationProps {
  children: React.ReactNode;
  onDelete: () => void;
  onMarkRead?: () => void;
  isRead?: boolean;
  className?: string;
}

const DELETE_THRESHOLD = -100;
const READ_THRESHOLD = 100;

export const SwipeableNotification = ({ 
  children, 
  onDelete,
  onMarkRead,
  isRead = false,
  className = ""
}: SwipeableNotificationProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  
  const x = useMotionValue(0);
  
  // Delete background (swipe left)
  const deleteBackground = useTransform(
    x,
    [0, DELETE_THRESHOLD],
    ["hsl(var(--destructive) / 0)", "hsl(var(--destructive) / 1)"]
  );
  const deleteOpacity = useTransform(
    x,
    [0, DELETE_THRESHOLD / 2, DELETE_THRESHOLD],
    [0, 0.6, 1]
  );
  const deleteScale = useTransform(
    x,
    [0, DELETE_THRESHOLD],
    [0.5, 1.1]
  );

  // Read background (swipe right)
  const readBackground = useTransform(
    x,
    [0, READ_THRESHOLD],
    ["hsl(var(--primary) / 0)", "hsl(var(--primary) / 1)"]
  );
  const readOpacity = useTransform(
    x,
    [0, READ_THRESHOLD / 2, READ_THRESHOLD],
    [0, 0.6, 1]
  );
  const readScale = useTransform(
    x,
    [0, READ_THRESHOLD],
    [0.5, 1.1]
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Swipe left to delete
    if (info.offset.x < DELETE_THRESHOLD) {
      setExitDirection("left");
      setIsExiting(true);
      triggerHaptic("medium");
      
      setTimeout(() => {
        onDelete();
      }, 250);
    }
    // Swipe right to mark as read
    else if (info.offset.x > READ_THRESHOLD && onMarkRead && !isRead) {
      setExitDirection("right");
      triggerHaptic("light");
      onMarkRead();
      // Reset position smoothly
      x.set(0);
    }
  };

  const getExitAnimation = () => {
    if (!isExiting) return {};
    
    return { 
      x: exitDirection === "left" ? -400 : 400, 
      opacity: 0,
      height: 0,
      marginBottom: 0,
    };
  };

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
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
        {/* Delete background (left side) */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-end pr-6 rounded-2xl"
          style={{ background: deleteBackground }}
        >
          <motion.div 
            className="text-destructive-foreground"
            style={{ opacity: deleteOpacity, scale: deleteScale }}
          >
            <Trash2 className="w-5 h-5" />
          </motion.div>
        </motion.div>

        {/* Read background (right side) */}
        {!isRead && onMarkRead && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-start pl-6 rounded-2xl"
            style={{ background: readBackground }}
          >
            <motion.div 
              className="text-primary-foreground"
              style={{ opacity: readOpacity, scale: readScale }}
            >
              <Check className="w-5 h-5" />
            </motion.div>
          </motion.div>
        )}

        {/* Swipeable content */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -150, right: isRead || !onMarkRead ? 0 : 150 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          style={{ x }}
          animate={getExitAnimation()}
          transition={{ 
            type: "spring",
            stiffness: 500,
            damping: 35,
          }}
          className={`relative bg-card cursor-grab active:cursor-grabbing ${className}`}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
