import { motion, Variants } from "framer-motion";
import { ReactNode, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

// Define route hierarchy for determining slide direction
const routeOrder: Record<string, number> = {
  "/": 0,
  "/auth": 1,
  "/presence": 2,
  "/sparks": 3,
  "/quedadas": 4,
  "/notifications": 5,
  "/profile": 6,
};

const getRouteIndex = (path: string): number => {
  // Exact match first
  if (routeOrder[path] !== undefined) return routeOrder[path];
  
  // Check for nested routes
  if (path.startsWith("/spark/")) return 3.5;
  if (path.startsWith("/quedada/")) return 4.5;
  if (path.startsWith("/user/")) return 2.5;
  if (path.startsWith("/chat/")) return 2.5;
  
  return 10; // Default for unknown routes
};

// Store previous route globally to determine direction
let previousRoute: string | null = null;

export const PageTransition = ({ children, className = "" }: PageTransitionProps) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const location = useLocation();
  const currentRoute = location.pathname;
  
  // Determine slide direction based on route hierarchy
  const getDirection = (): number => {
    if (!previousRoute) return 0;
    const prevIndex = getRouteIndex(previousRoute);
    const currIndex = getRouteIndex(currentRoute);
    return currIndex > prevIndex ? 1 : currIndex < prevIndex ? -1 : 0;
  };
  
  const direction = useRef(getDirection());
  
  useEffect(() => {
    // Update direction before setting previous route
    direction.current = getDirection();
    
    return () => {
      previousRoute = currentRoute;
    };
  }, [currentRoute]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const slideVariants: Variants = {
    initial: (dir: number) => ({
      opacity: 0,
      x: dir === 0 ? 0 : dir > 0 ? 40 : -40,
      y: dir === 0 ? 12 : 0,
    }),
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir === 0 ? 0 : dir > 0 ? -40 : 40,
      y: dir === 0 ? -8 : 0,
    }),
  };

  return (
    <motion.div
      custom={direction.current}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ 
        duration: 0.28,
        ease: [0.25, 0.46, 0.45, 0.94],
        opacity: { duration: 0.22 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
