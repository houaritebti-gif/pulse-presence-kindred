import { motion } from "framer-motion";
import { useMemo } from "react";

interface FloatingParticlesProps {
  count?: number;
  colors?: string[];
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  moveX: number;
  moveY: number;
}

export const FloatingParticles = ({ 
  count = 12, 
  colors = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(348, 83%, 47%)"],
  className = ""
}: FloatingParticlesProps) => {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 2,
      moveX: (Math.random() - 0.5) * 40,
      moveY: (Math.random() - 0.5) * 40,
    }));
  }, [count, colors]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            filter: "blur(0.5px)",
          }}
          initial={{ 
            opacity: 0, 
            scale: 0,
            x: 0,
            y: 0,
          }}
          animate={{ 
            opacity: [0, 0.6, 0.4, 0.6, 0],
            scale: [0, 1, 1.2, 1, 0],
            x: [0, particle.moveX * 0.5, particle.moveX, particle.moveX * 0.5, 0],
            y: [0, particle.moveY * 0.5, particle.moveY, particle.moveY * 0.5, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;
