import { useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
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

// Eager load critical paths
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load non-critical pages for better initial load
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Profile = lazy(() => import("./pages/Profile"));
const Presence = lazy(() => import("./pages/Presence"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Chat = lazy(() => import("./pages/Chat"));
const Sparks = lazy(() => import("./pages/Sparks"));
const SparkChat = lazy(() => import("./pages/SparkChat"));
const GhostMessages = lazy(() => import("./pages/GhostMessages"));
const Connections = lazy(() => import("./pages/Connections"));
const Quedadas = lazy(() => import("./pages/Quedadas"));
const QuedadaChat = lazy(() => import("./pages/QuedadaChat"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse w-8 h-8 rounded-full bg-primary/20" /></div>}>
              <div id="main-content" tabIndex={-1} className="outline-none">
                <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/presence"
                element={
                  <ProtectedRoute>
                    <Presence />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/:profileId"
                element={
                  <ProtectedRoute>
                    <PublicProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:profileId"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sparks"
                element={
                  <ProtectedRoute>
                    <Sparks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spark/:chatId"
                element={
                  <ProtectedRoute>
                    <SparkChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quedadas"
                element={
                  <ProtectedRoute>
                    <Quedadas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quedada/:quedadaId"
                element={
                  <ProtectedRoute>
                    <QuedadaChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ghost-messages"
                element={
                  <ProtectedRoute>
                    <GhostMessages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/connections"
                element={
                  <ProtectedRoute>
                    <Connections />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscription"
                element={
                  <ProtectedRoute>
                    <Subscription />
                  </ProtectedRoute>
                }
              />
              <Route path="/privacidad" element={<Privacy />} />
              <Route path="/terminos" element={<Terms />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
              </div>
              </Suspense>
            </KeyboardNavigationWrapper>
          </NotificationProvider>
        </BrowserRouter>
        </ScreenReaderAnnouncerProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
