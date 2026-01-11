import { useEffect, Suspense, lazy } from "react";
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
import { BottomNavigation } from "@/components/BottomNavigation";
import { SkipLink } from "@/components/SkipLink";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import OfflineIndicator from "@/components/OfflineIndicator";
import { CookieConsent } from "@/components/CookieConsent";
import { ScreenReaderAnnouncerProvider } from "@/components/ScreenReaderAnnouncer";
import { AnimatedRoutes } from "@/components/AnimatedRoutes";
import { useDailyLoginReward } from "@/hooks/useDailyLoginReward";
import { EnergyGainProvider } from "@/components/EnergyGainAnimation";
import { useAchievementChecker } from "@/hooks/useAchievementChecker";
import { useSuperSparkWelcome } from "@/hooks/useSuperSparkWelcome";

// Lazy load heavy components
const AIChatBot = lazy(() => import("@/components/AIChatBot").then(m => ({ default: m.AIChatBot })));

// Exponential backoff retry function
const exponentialBackoff = (attemptIndex: number): number => {
  // Base delay: 1s, max delay: 30s
  const baseDelay = 1000;
  const maxDelay = 30000;
  const delay = Math.min(baseDelay * Math.pow(2, attemptIndex), maxDelay);
  // Add jitter (±20%) to prevent thundering herd
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return delay + jitter;
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
      message.includes("networkerror")
    );
  }
  return false;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Only retry network errors, up to 3 times
        if (failureCount >= 3) return false;
        return isNetworkError(error);
      },
      retryDelay: exponentialBackoff,
      staleTime: 1000 * 60 * 3, // 3 minutes - reduce backend calls
      refetchOnWindowFocus: false,
    },
  },
});

// Keyboard navigation wrapper component
const KeyboardNavigationWrapper = ({ children }: { children: React.ReactNode }) => {
  useKeyboardShortcuts();
  useScrollToTop();
  useDailyLoginReward(); // Award energy on daily login
  useAchievementChecker(); // Check and unlock achievements
  useSuperSparkWelcome(); // Show confetti for new Super Chispas
  const location = useLocation();
  
  // Show shortcuts help only on main pages (not landing/auth)
  const showShortcutsHelp = !["/", "/auth"].includes(location.pathname);
  
  return (
    <>
      {children}
      {showShortcutsHelp && <KeyboardShortcutsHelp />}
    </>
  );
};

const App = () => {
  useEffect(() => {
    initializeAdvancedSettings();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ScreenReaderAnnouncerProvider>
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
                        <Suspense fallback={null}>
                          <AIChatBot />
                        </Suspense>
                        <CookieConsent />
                        <BottomNavigation />
                        <AnimatedRoutes />
                      </KeyboardNavigationWrapper>
                    </NotificationProvider>
                  </BrowserRouter>
                </ChatInputProvider>
              </EnergyGainProvider>
            </ScreenReaderAnnouncerProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
