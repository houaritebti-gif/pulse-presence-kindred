import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
}

interface SparkleTrailProps {
  isActive: boolean;
  intensity?: number; // 0-1, how far the swipe is
  containerRef?: React.RefObject<HTMLDivElement>;
}

const SPARKLE_COLORS = [
  "hsl(var(--primary))",
  "hsl(350, 100%, 70%)",
  "hsl(340, 100%, 80%)",
  "hsl(45, 100%, 70%)",
  "hsl(30, 100%, 65%)",
  "hsl(0, 100%, 75%)",
];

const SparkleTrail = ({ isActive, intensity = 0.5, containerRef }: SparkleTrailProps) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [sparkleId, setSparkleId] = useState(0);

  const createSparkle = useCallback((mouseX?: number, mouseY?: number) => {
    const container = containerRef?.current;
    let x: number, y: number;

    if (container && mouseX !== undefined && mouseY !== undefined) {
      const rect = container.getBoundingClientRect();
      x = mouseX - rect.left;
      y = mouseY - rect.top;
    } else {
      // Random position if no mouse coords
      x = Math.random() * 300;
      y = Math.random() * 400;
    }

    const newSparkle: Sparkle = {
      id: sparkleId,
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      size: 8 + Math.random() * 16 * intensity,
      color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
      rotation: Math.random() * 360,
    };

    setSparkleId(prev => prev + 1);
    setSparkles(prev => [...prev.slice(-15), newSparkle]); // Keep max 16 sparkles
  }, [sparkleId, intensity, containerRef]);

  useEffect(() => {
    if (!isActive) {
      // Fade out existing sparkles
      const timeout = setTimeout(() => setSparkles([]), 300);
      return () => clearTimeout(timeout);
    }

    // Create sparkles periodically when active
    const interval = setInterval(() => {
      if (isActive) {
        createSparkle();
      }
    }, 50 + (1 - intensity) * 100); // Faster sparkles with higher intensity

    return () => clearInterval(interval);
  }, [isActive, intensity, createSparkle]);

  // Track mouse/touch movement when active
  useEffect(() => {
    if (!isActive || !containerRef?.current) return;

    const container = containerRef.current;

    const handleMove = (clientX: number, clientY: number) => {
      if (Math.random() > 0.3) { // Don't create on every move
        createSparkle(clientX, clientY);
      }
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("touchmove", onTouchMove);

    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("touchmove", onTouchMove);
    };
  }, [isActive, containerRef, createSparkle]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            initial={{
              opacity: 1,
              scale: 0,
              x: sparkle.x,
              y: sparkle.y,
              rotate: sparkle.rotation,
            }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0, 1.2, 0.8],
              y: sparkle.y - 30 - Math.random() * 50,
              x: sparkle.x + (Math.random() - 0.3) * 60,
              rotate: sparkle.rotation + 180,
            }}
            exit={{
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: 0.6 + Math.random() * 0.3,
              ease: "easeOut",
            }}
            className="absolute"
            style={{
              width: sparkle.size,
              height: sparkle.size,
            }}
          >
            {/* Star/sparkle shape */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-full h-full drop-shadow-lg"
              style={{
                filter: `drop-shadow(0 0 4px ${sparkle.color})`,
              }}
            >
              <path
                d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                fill={sparkle.color}
              />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Glow effect when active */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: intensity * 0.4 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gradient-to-l from-primary/20 via-primary/10 to-transparent"
        />
      )}

      {/* Floating hearts for extra effect */}
      <AnimatePresence>
        {isActive && intensity > 0.5 && sparkles.filter((_, i) => i % 4 === 0).map((sparkle) => (
          <motion.div
            key={`heart-${sparkle.id}`}
            initial={{
              opacity: 0.8,
              scale: 0,
              x: sparkle.x + 20,
              y: sparkle.y,
            }}
            animate={{
              opacity: [0.8, 0.6, 0],
              scale: [0, 1, 0.5],
              y: sparkle.y - 80,
              x: sparkle.x + 20 + (Math.random() - 0.5) * 40,
            }}
            transition={{
              duration: 1,
              ease: "easeOut",
            }}
            className="absolute text-primary"
            style={{ fontSize: sparkle.size * 0.8 }}
          >
            ❤️
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SparkleTrail;
