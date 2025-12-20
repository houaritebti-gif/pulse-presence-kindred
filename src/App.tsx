import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotificationProvider from "@/components/NotificationProvider";
import { BottomNavigation } from "@/components/BottomNavigation";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Presence from "./pages/Presence";
import Chat from "./pages/Chat";
import Sparks from "./pages/Sparks";
import SparkChat from "./pages/SparkChat";
import Quedadas from "./pages/Quedadas";
import QuedadaChat from "./pages/QuedadaChat";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
