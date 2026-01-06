import { useState, useEffect, useCallback } from 'react';

interface ParallaxValues {
  y: number;
  opacity: number;
  scale: number;
}

interface UseParallaxOptions {
  speed?: number; // 0.1 = slow, 0.5 = medium, 1 = fast
  maxOffset?: number;
  fadeOut?: boolean;
  scaleEffect?: boolean;
}

export const useParallax = (options: UseParallaxOptions = {}): ParallaxValues => {
  const { 
    speed = 0.3, 
    maxOffset = 150,
    fadeOut = true,
    scaleEffect = false 
  } = options;
  
  const [values, setValues] = useState<ParallaxValues>({
    y: 0,
    opacity: 1,
    scale: 1,
  });

  const handleScroll = useCallback(() => {
    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    
    // Calculate parallax offset (clamped)
    const rawOffset = scrollY * speed;
    const y = Math.min(rawOffset, maxOffset);
    
    // Calculate opacity (fade out as scroll increases)
    const opacity = fadeOut 
      ? Math.max(0, 1 - (scrollY / (viewportHeight * 0.5)))
      : 1;
    
    // Calculate scale (subtle zoom out effect)
    const scale = scaleEffect 
      ? Math.max(0.9, 1 - (scrollY / (viewportHeight * 2)))
      : 1;

    setValues({ y, opacity, scale });
  }, [speed, maxOffset, fadeOut, scaleEffect]);

  useEffect(() => {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return values;
};

// Helper hook for multiple parallax layers
export const useMultiLayerParallax = () => {
  const foreground = useParallax({ speed: 0.1, fadeOut: false });
  const midground = useParallax({ speed: 0.3, fadeOut: true });
  const background = useParallax({ speed: 0.5, fadeOut: true, scaleEffect: true });
  
  return { foreground, midground, background };
};
