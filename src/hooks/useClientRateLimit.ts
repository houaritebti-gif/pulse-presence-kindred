import { useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface RateLimitConfig {
  /** Maximum number of actions allowed in the time window */
  maxActions: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Warning message to show when rate limited */
  warningMessage?: string;
}

interface RateLimitResult {
  /** Check if action is allowed, returns true if allowed */
  checkRateLimit: () => boolean;
  /** Get remaining actions in current window */
  getRemainingActions: () => number;
  /** Reset the rate limit counter */
  reset: () => void;
}

/**
 * Client-side rate limiting hook to prevent spam/abuse before hitting backend.
 * Does NOT replace server-side rate limiting, but improves UX by providing
 * immediate feedback and reducing unnecessary network requests.
 */
export function useClientRateLimit(config: RateLimitConfig): RateLimitResult {
  const { maxActions, windowMs, warningMessage = 'Demasiadas acciones. Espera un momento.' } = config;
  
  const actionsRef = useRef<number[]>([]);
  const lastWarningRef = useRef<number>(0);
  
  // Clean old timestamps outside the window
  const cleanOldActions = useCallback(() => {
    const now = Date.now();
    actionsRef.current = actionsRef.current.filter(
      timestamp => now - timestamp < windowMs
    );
  }, [windowMs]);
  
  const checkRateLimit = useCallback((): boolean => {
    cleanOldActions();
    
    const now = Date.now();
    
    if (actionsRef.current.length >= maxActions) {
      // Show warning max once per 3 seconds to avoid toast spam
      if (now - lastWarningRef.current > 3000) {
        toast.warning(warningMessage);
        lastWarningRef.current = now;
      }
      return false;
    }
    
    // Action allowed, record timestamp
    actionsRef.current.push(now);
    return true;
  }, [cleanOldActions, maxActions, warningMessage]);
  
  const getRemainingActions = useCallback((): number => {
    cleanOldActions();
    return Math.max(0, maxActions - actionsRef.current.length);
  }, [cleanOldActions, maxActions]);
  
  const reset = useCallback(() => {
    actionsRef.current = [];
  }, []);
  
  return { checkRateLimit, getRemainingActions, reset };
}

/**
 * Pre-configured rate limit for chat messages (10 messages per 10 seconds)
 */
export function useChatRateLimit() {
  return useClientRateLimit({
    maxActions: 10,
    windowMs: 10000,
    warningMessage: 'Estás enviando mensajes muy rápido. Espera un momento.',
  });
}

/**
 * Pre-configured rate limit for spark actions (5 per 5 seconds)
 */
export function useSparkRateLimit() {
  return useClientRateLimit({
    maxActions: 5,
    windowMs: 5000,
    warningMessage: 'Has enviado demasiadas chispas. Espera un momento.',
  });
}
