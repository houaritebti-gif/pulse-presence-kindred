import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotificationProvider from "@/components/NotificationProvider";
import { initializeAdvancedSettings } from "@/hooks/useAdvancedSettings";
import { BottomNavigation } from "@/components/BottomNavigation";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Presence from "./pages/Presence";
import PublicProfile from "./pages/PublicProfile";
import Chat from "./pages/Chat";
import Sparks from "./pages/Sparks";
import SparkChat from "./pages/SparkChat";
import GhostMessages from "./pages/GhostMessages";
import Quedadas from "./pages/Quedadas";
import QuedadaChat from "./pages/QuedadaChat";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

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
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  useEffect(() => {
    initializeAdvancedSettings();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NotificationProvider>
            <BottomNavigation />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
