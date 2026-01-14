import { useState, useCallback, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { useOnlineStatus } from './useOnlineStatus';

interface NetworkErrorState {
  hasError: boolean;
  isRetrying: boolean;
  lastError: Error | null;
  errorCount: number;
}

interface UseNetworkErrorOptions {
  /** Auto-dismiss after this many ms (0 = never) */
  autoDismissMs?: number;
  /** Max retries before giving up */
  maxRetries?: number;
  /** Callback when retry succeeds */
  onRetrySuccess?: () => void;
}

export const useNetworkError = (options: UseNetworkErrorOptions = {}) => {
  const { autoDismissMs = 0, maxRetries = 3, onRetrySuccess } = options;
  const { isOnline } = useOnlineStatus();
  
  const [state, setState] = useState<NetworkErrorState>({
    hasError: false,
    isRetrying: false,
    lastError: null,
    errorCount: 0,
  });
  
  const retryCallbackRef = useRef<(() => Promise<void>) | null>(null);
  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear auto-dismiss timer
  const clearAutoDismiss = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
  }, []);

  // Set up auto-dismiss
  const setupAutoDismiss = useCallback(() => {
    clearAutoDismiss();
    if (autoDismissMs > 0) {
      autoDismissTimerRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, hasError: false }));
      }, autoDismissMs);
    }
  }, [autoDismissMs, clearAutoDismiss]);

  // Report a network error
  const reportError = useCallback((error: Error, retryCallback?: () => Promise<void>) => {
    // Check if it's actually a network error
    const isNetworkError = 
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch') ||
      error.message.toLowerCase().includes('failed to fetch') ||
      error.message.toLowerCase().includes('connection') ||
      error.message.toLowerCase().includes('timeout') ||
      error.message.toLowerCase().includes('offline') ||
      error.name === 'TypeError'; // fetch throws TypeError on network failure

    if (!isNetworkError) return false;

    retryCallbackRef.current = retryCallback || null;
    
    setState(prev => ({
      hasError: true,
      isRetrying: false,
      lastError: error,
      errorCount: prev.errorCount + 1,
    }));

    setupAutoDismiss();
    return true;
  }, [setupAutoDismiss]);

  // Dismiss the error
  const dismissError = useCallback(() => {
    clearAutoDismiss();
    setState(prev => ({ ...prev, hasError: false }));
  }, [clearAutoDismiss]);

  // Retry the failed operation
  const retry = useCallback(async () => {
    if (!retryCallbackRef.current || state.errorCount >= maxRetries) {
      return;
    }

    setState(prev => ({ ...prev, isRetrying: true }));

    try {
      await retryCallbackRef.current();
      // Success - clear error
      setState({
        hasError: false,
        isRetrying: false,
        lastError: null,
        errorCount: 0,
      });
      retryCallbackRef.current = null;
      onRetrySuccess?.();
    } catch (error) {
      // Still failing
      setState(prev => ({
        ...prev,
        isRetrying: false,
        lastError: error as Error,
        errorCount: prev.errorCount + 1,
      }));
      setupAutoDismiss();
    }
  }, [state.errorCount, maxRetries, onRetrySuccess, setupAutoDismiss]);

  // Reset error count
  const resetErrorCount = useCallback(() => {
    setState(prev => ({ ...prev, errorCount: 0 }));
  }, []);

  // Auto-dismiss when back online
  useEffect(() => {
    if (isOnline && state.hasError) {
      // Give a brief moment then retry automatically
      const timer = setTimeout(() => {
        if (retryCallbackRef.current) {
          retry();
        } else {
          dismissError();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, state.hasError, retry, dismissError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAutoDismiss();
  }, [clearAutoDismiss]);

  return {
    // State
    hasError: state.hasError,
    isRetrying: state.isRetrying,
    lastError: state.lastError,
    errorCount: state.errorCount,
    canRetry: state.errorCount < maxRetries,
    
    // Actions
    reportError,
    dismissError,
    retry,
    resetErrorCount,
  };
};

// Global network error context for app-wide error handling
interface NetworkErrorContextValue {
  hasError: boolean;
  isRetrying: boolean;
  reportError: (error: Error, retryCallback?: () => Promise<void>) => boolean;
  dismissError: () => void;
  retry: () => Promise<void>;
}

const NetworkErrorContext = createContext<NetworkErrorContextValue | null>(null);

export const NetworkErrorProvider = ({ children }: { children: ReactNode }) => {
  const networkError = useNetworkError({
    autoDismissMs: 10000, // Auto-dismiss after 10s
    maxRetries: 3,
  });

  return (
    <NetworkErrorContext.Provider value={networkError}>
      {children}
    </NetworkErrorContext.Provider>
  );
};

export const useGlobalNetworkError = () => {
  const context = useContext(NetworkErrorContext);
  if (!context) {
    throw new Error('useGlobalNetworkError must be used within NetworkErrorProvider');
  }
  return context;
};
