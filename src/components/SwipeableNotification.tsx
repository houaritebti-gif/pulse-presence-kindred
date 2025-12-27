import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2, Check } from "lucide-react";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  
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
    [0, 0.5, 1]
  );
  const deleteScale = useTransform(
    x,
    [0, DELETE_THRESHOLD],
    [0.5, 1]
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
    [0, 0.5, 1]
  );
  const readScale = useTransform(
    x,
    [0, READ_THRESHOLD],
    [0.5, 1]
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Swipe left to delete
    if (info.offset.x < DELETE_THRESHOLD) {
      setIsDeleting(true);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setTimeout(() => {
        onDelete();
      }, 200);
    }
    // Swipe right to mark as read
    else if (info.offset.x > READ_THRESHOLD && onMarkRead && !isRead) {
      setIsMarkingRead(true);
      if (navigator.vibrate) {
        navigator.vibrate([30, 20, 30]);
      }
      setTimeout(() => {
        onMarkRead();
        setIsMarkingRead(false);
      }, 200);
    }
  };

  return (
    <div ref={constraintsRef} className="relative overflow-hidden rounded-2xl">
      {/* Delete background (left side) */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-end pr-6 rounded-2xl"
        style={{ background: deleteBackground }}
      >
        <motion.div style={{ opacity: deleteOpacity, scale: deleteScale }}>
          <Trash2 className="w-6 h-6 text-destructive-foreground" />
        </motion.div>
      </motion.div>

      {/* Read background (right side) */}
      {!isRead && onMarkRead && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-start pl-6 rounded-2xl"
          style={{ background: readBackground }}
        >
          <motion.div style={{ opacity: readOpacity, scale: readScale }}>
            <Check className="w-6 h-6 text-primary-foreground" />
          </motion.div>
        </motion.div>
      )}

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: isRead || !onMarkRead ? 0 : 150 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={
          isDeleting 
            ? { x: -400, opacity: 0 } 
            : isMarkingRead 
              ? { x: 0 } 
              : {}
        }
        transition={{ duration: 0.2 }}
        className={`relative bg-card ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
};
