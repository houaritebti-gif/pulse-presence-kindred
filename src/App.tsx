import { useEffect, Suspense, lazy, memo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatInputProvider } from "@/contexts/ChatInputContext";
import NotificationProvider from "@/components/NotificationProvider";
import { initializeAdvancedSettings } from "@/hooks/useAdvancedSettings";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
import { BottomNavigation } from "@/components/BottomNavigation";
import { SkipLink } from "@/components/SkipLink";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import OfflineIndicator from "@/components/OfflineIndicator";
import { CookieConsent } from "@/components/CookieConsent";
import { ScreenReaderAnnouncerProvider } from "@/components/ScreenReaderAnnouncer";
import { AnimatedRoutes } from "@/components/AnimatedRoutes";
import { EnergyGainProvider } from "@/components/EnergyGainAnimation";
import { NetworkErrorProvider } from "@/hooks/useNetworkError";
import GlobalNetworkErrorToast from "@/components/GlobalNetworkErrorToast";
import { deferWork } from "@/utils/deferredExecution";
import { markInteractive } from "@/utils/performanceMetrics";

// Lazy load heavy components that aren't needed immediately
const AIChatBot = lazy(() => import("@/components/AIChatBot").then(m => ({ default: m.AIChatBot })));
const PresenceCacheWarning = lazy(() => import("@/components/PresenceCacheWarning"));
const KeyboardShortcutsHelp = lazy(() => import("@/components/KeyboardShortcutsHelp").then(m => ({ default: m.KeyboardShortcutsHelp })));


// Exponential backoff retry function with jitter
const exponentialBackoff = (attemptIndex: number): number => {
  // Base delay: 500ms, max delay: 15s (reduced for faster recovery)
  const baseDelay = 500;
  const maxDelay = 15000;
  const delay = Math.min(baseDelay * Math.pow(1.8, attemptIndex), maxDelay);
  // Add jitter (±30%) to prevent thundering herd
  const jitter = delay * 0.3 * (Math.random() - 0.5);
  return Math.max(200, delay + jitter);
};

// Check if error is a network/connection error worth retrying
const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("load failed") ||
      message.includes("aborted") ||
      error.name === 'TypeError' // fetch throws TypeError on network failure
    );
  }
  return false;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Retry network errors up to 4 times
        if (failureCount >= 4) return false;
        return isNetworkError(error);
      },
      retryDelay: exponentialBackoff,
      staleTime: 1000 * 60 * 3, // 3 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always', // Always refetch when back online
      networkMode: 'offlineFirst', // Return cached data when offline
    },
    mutations: {
      retry: (failureCount, error) => {
        // Retry network errors on mutations too
        if (failureCount >= 2) return false;
        return isNetworkError(error);
      },
      retryDelay: exponentialBackoff,
      networkMode: 'offlineFirst',
    },
  },
});

// Keyboard navigation wrapper component - memoized
const KeyboardNavigationWrapper = memo(({ children }: { children: React.ReactNode }) => {
  // Navigation and input hooks
  useKeyboardShortcuts();
  useScrollToTop();
  
  // App lifecycle (gamification, rewards, tracking)
  useAppLifecycle();
  
  const location = useLocation();
  
  // Show shortcuts help only on main pages (not landing/auth)
  const showShortcutsHelp = !["/", "/auth"].includes(location.pathname);
  
  return (
    <>
      {children}
      {showShortcutsHelp && (
        <Suspense fallback={null}>
          <KeyboardShortcutsHelp />
        </Suspense>
      )}
    </>
  );
});
KeyboardNavigationWrapper.displayName = "KeyboardNavigationWrapper";

const App = () => {
  useEffect(() => {
    // Critical initialization - run immediately
    initializeAdvancedSettings();
    
    // Mark app as interactive after initial render
    deferWork(() => {
      markInteractive();
    }, 100);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ScreenReaderAnnouncerProvider>
            <NetworkErrorProvider>
              <EnergyGainProvider>
                <ChatInputProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <SkipLink />
                    <NotificationProvider>
                      <KeyboardNavigationWrapper>
                        <OfflineIndicator />
                        <PWAInstallPrompt />
                        <GlobalNetworkErrorToast />
                        <Suspense fallback={null}>
                          <AIChatBot />
                          <PresenceCacheWarning />
                        </Suspense>
                        <CookieConsent />
                        <BottomNavigation />
                        <AnimatedRoutes />
                      </KeyboardNavigationWrapper>
                    </NotificationProvider>
                  </BrowserRouter>
                </ChatInputProvider>
              </EnergyGainProvider>
            </NetworkErrorProvider>
          </ScreenReaderAnnouncerProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
