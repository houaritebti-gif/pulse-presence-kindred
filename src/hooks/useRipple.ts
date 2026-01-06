import { useState, useCallback, MouseEvent, TouchEvent } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const useRipple = () => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const createRipple = useCallback((event: MouseEvent | TouchEvent) => {
    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    let x: number, y: number;
    
    if ('touches' in event) {
      // Touch event
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }

    // Calculate ripple size (should cover the entire button)
    const size = Math.max(rect.width, rect.height) * 2;

    const newRipple: Ripple = {
      id: Date.now(),
      x: x - size / 2,
      y: y - size / 2,
      size,
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  }, []);

  return { ripples, createRipple };
};
