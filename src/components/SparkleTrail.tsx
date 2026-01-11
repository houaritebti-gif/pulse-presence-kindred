import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSparkleStyle, SparkleStyle } from "@/hooks/useAdvancedSettings";
import { playSparkleTrailSound } from "@/utils/notificationSound";

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

// Colors for each style
const STYLE_COLORS: Record<SparkleStyle, string[]> = {
  stars: [
    "hsl(var(--primary))",
    "hsl(350, 100%, 70%)",
    "hsl(340, 100%, 80%)",
    "hsl(45, 100%, 70%)",
    "hsl(30, 100%, 65%)",
    "hsl(0, 100%, 75%)",
  ],
  fire: [
    "hsl(25, 100%, 50%)",
    "hsl(35, 100%, 55%)",
    "hsl(45, 100%, 60%)",
    "hsl(15, 100%, 50%)",
    "hsl(0, 100%, 60%)",
    "hsl(55, 100%, 50%)",
  ],
  hearts: [
    "hsl(350, 100%, 65%)",
    "hsl(340, 100%, 70%)",
    "hsl(355, 100%, 60%)",
    "hsl(330, 100%, 65%)",
    "hsl(var(--primary))",
    "hsl(345, 90%, 55%)",
  ],
};

const SparkleTrail = ({ isActive, intensity = 0.5, containerRef }: SparkleTrailProps) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [sparkleId, setSparkleId] = useState(0);
  const [style, setStyle] = useState<SparkleStyle>(getSparkleStyle);
  const lastSoundTime = useRef(0);
  const wasActive = useRef(false);

  // Update style when becoming active and play initial sound
  useEffect(() => {
    if (isActive && !wasActive.current) {
      const currentStyle = getSparkleStyle();
      setStyle(currentStyle);
      // Play sound when trail starts
      playSparkleTrailSound(currentStyle);
      lastSoundTime.current = Date.now();
    }
    wasActive.current = isActive;
  }, [isActive]);

  // Play periodic sounds during high intensity
  useEffect(() => {
    if (!isActive || intensity < 0.6) return;

    const interval = setInterval(() => {
      const now = Date.now();
      // Play sound every 400ms during high intensity drag
      if (now - lastSoundTime.current > 400) {
        playSparkleTrailSound(style);
        lastSoundTime.current = now;
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isActive, intensity, style]);

  const colors = STYLE_COLORS[style];

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
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
    };

    setSparkleId(prev => prev + 1);
    setSparkles(prev => [...prev.slice(-15), newSparkle]); // Keep max 16 sparkles
  }, [sparkleId, intensity, containerRef, colors]);

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
              rotate: sparkle.rotation + (style === "fire" ? 0 : 180),
            }}
            exit={{
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: style === "fire" ? 0.4 + Math.random() * 0.2 : 0.6 + Math.random() * 0.3,
              ease: "easeOut",
            }}
            className="absolute"
            style={{
              width: sparkle.size,
              height: sparkle.size,
            }}
          >
            {/* Render different shapes based on style */}
            {style === "stars" && (
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
            )}
            {style === "fire" && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-full h-full"
                style={{
                  filter: `drop-shadow(0 0 6px ${sparkle.color})`,
                }}
              >
                <path
                  d="M12 2C12 2 8 6 8 10C8 12 9.5 14 12 14C14.5 14 16 12 16 10C16 6 12 2 12 2ZM10 15C8 15 6 17 6 19C6 21 8 23 12 23C16 23 18 21 18 19C18 17 16 15 14 15C14 17 13 18 12 18C11 18 10 17 10 15Z"
                  fill={sparkle.color}
                />
              </svg>
            )}
            {style === "hearts" && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-full h-full"
                style={{
                  filter: `drop-shadow(0 0 4px ${sparkle.color})`,
                }}
              >
                <path
                  d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
                  fill={sparkle.color}
                />
              </svg>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Glow effect when active - color based on style */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: intensity * 0.4 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 ${
            style === "fire" 
              ? "bg-gradient-to-l from-orange-500/25 via-orange-400/15 to-transparent"
              : style === "hearts"
              ? "bg-gradient-to-l from-rose-500/25 via-pink-400/15 to-transparent"
              : "bg-gradient-to-l from-primary/20 via-primary/10 to-transparent"
          }`}
        />
      )}

      {/* Floating emojis for extra effect (only on high intensity) */}
      <AnimatePresence>
        {isActive && intensity > 0.6 && sparkles.filter((_, i) => i % 5 === 0).map((sparkle) => (
          <motion.div
            key={`emoji-${sparkle.id}`}
            initial={{
              opacity: 0.9,
              scale: 0,
              x: sparkle.x + 20,
              y: sparkle.y,
            }}
            animate={{
              opacity: [0.9, 0.7, 0],
              scale: [0, 1, 0.5],
              y: sparkle.y - 80,
              x: sparkle.x + 20 + (Math.random() - 0.5) * 40,
            }}
            transition={{
              duration: 1,
              ease: "easeOut",
            }}
            className="absolute"
            style={{ fontSize: sparkle.size * 0.8 }}
          >
            {style === "fire" ? "🔥" : style === "hearts" ? "❤️" : "✨"}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SparkleTrail;
