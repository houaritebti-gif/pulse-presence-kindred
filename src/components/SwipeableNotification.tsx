import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2 } from "lucide-react";

interface SwipeableNotificationProps {
  children: React.ReactNode;
  onDelete: () => void;
  className?: string;
}

const SWIPE_THRESHOLD = -100;

export const SwipeableNotification = ({ 
  children, 
  onDelete,
  className = ""
}: SwipeableNotificationProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [0, SWIPE_THRESHOLD],
    ["hsl(var(--destructive) / 0)", "hsl(var(--destructive) / 1)"]
  );
  const opacity = useTransform(
    x,
    [0, SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD],
    [0, 0.5, 1]
  );
  const scale = useTransform(
    x,
    [0, SWIPE_THRESHOLD],
    [0.5, 1]
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < SWIPE_THRESHOLD) {
      setIsDeleting(true);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setTimeout(() => {
        onDelete();
      }, 200);
    }
  };

  return (
    <div ref={constraintsRef} className="relative overflow-hidden rounded-2xl">
      {/* Delete background */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-end pr-6 rounded-2xl"
        style={{ background }}
      >
        <motion.div style={{ opacity, scale }}>
          <Trash2 className="w-6 h-6 text-destructive-foreground" />
        </motion.div>
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={isDeleting ? { x: -400, opacity: 0 } : {}}
        transition={{ duration: 0.2 }}
        className={`relative bg-card ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
};
