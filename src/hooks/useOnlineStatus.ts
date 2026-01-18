import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Enhanced online status hook with actual connectivity verification
 * Addresses mobile false-positive "offline" states during slow connections
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastVerificationRef = useRef<number>(0);
  
  // Debounce interval for connectivity checks (5 seconds)
  const VERIFICATION_DEBOUNCE_MS = 5000;

  // Verify actual connectivity with a lightweight request
  const verifyConnectivity = useCallback(async (): Promise<boolean> => {
    const now = Date.now();
    // Skip if we verified recently
    if (now - lastVerificationRef.current < VERIFICATION_DEBOUNCE_MS) {
      return isOnline;
    }
    
    lastVerificationRef.current = now;
    setIsVerifying(true);
    
    try {
      // Use a HEAD request to minimize data transfer
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for slow mobile
      
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      // Try one more time with longer timeout before declaring offline
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second retry for very slow connections
        
        const response = await fetch('/robots.txt', {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return response.ok;
      } catch {
        return false;
      }
    } finally {
      setIsVerifying(false);
    }
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = async () => {
      // Verify connectivity before confirming online
      const actuallyOnline = await verifyConnectivity();
      if (actuallyOnline) {
        setIsOnline(true);
        if (wasOffline) {
          // Show reconnected state briefly
          setTimeout(() => setWasOffline(false), 3000);
        }
      }
    };

    const handleOffline = async () => {
      // On mobile, navigator.onLine can give false negatives
      // Verify before showing offline state
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }
      
      // Small delay before verifying - mobile connections can be flaky
      verificationTimeoutRef.current = setTimeout(async () => {
        const stillOffline = !(await verifyConnectivity());
        if (stillOffline) {
          setIsOnline(false);
          setWasOffline(true);
        }
      }, 1000); // 1 second grace period
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }
    };
  }, [wasOffline, verifyConnectivity]);

  return { isOnline, wasOffline, isVerifying, verifyConnectivity };
};
