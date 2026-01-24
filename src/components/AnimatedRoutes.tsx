import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import { PageTransition } from "@/components/PageTransition";
import { ChunkErrorBoundary } from "@/components/ChunkErrorBoundary";
import { lazyWithRetry } from "@/utils/lazyWithRetry";

// Eager load critical paths
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";

// Lazy load non-critical pages with retry mechanism for better mobile support
const Onboarding = lazyWithRetry(() => import("@/pages/Onboarding"));
const Profile = lazyWithRetry(() => import("@/pages/Profile"));
const Presence = lazyWithRetry(() => import("@/pages/Presence"));
const PublicProfile = lazyWithRetry(() => import("@/pages/PublicProfile"));
const Chat = lazyWithRetry(() => import("@/pages/Chat"));
const Sparks = lazyWithRetry(() => import("@/pages/Sparks"));
const SparkChat = lazyWithRetry(() => import("@/pages/SparkChat"));
const SparkEnergy = lazyWithRetry(() => import("@/pages/Spark"));
const SparkHistory = lazyWithRetry(() => import("@/pages/SparkHistory"));
const GhostMessages = lazyWithRetry(() => import("@/pages/GhostMessages"));
const Connections = lazyWithRetry(() => import("@/pages/Connections"));
const Quedadas = lazyWithRetry(() => import("@/pages/Quedadas"));
const QuedadaChat = lazyWithRetry(() => import("@/pages/QuedadaChat"));
const Notifications = lazyWithRetry(() => import("@/pages/Notifications"));
const Subscription = lazyWithRetry(() => import("@/pages/Subscription"));
const Privacy = lazyWithRetry(() => import("@/pages/Privacy"));
const Terms = lazyWithRetry(() => import("@/pages/Terms"));
const Cookies = lazyWithRetry(() => import("@/pages/Cookies"));
const Admin = lazyWithRetry(() => import("@/pages/Admin"));
const NotFound = lazyWithRetry(() => import("@/pages/NotFound"));
const Landing = lazyWithRetry(() => import("@/pages/Landing"));
const Achievements = lazyWithRetry(() => import("@/pages/Achievements"));
const Leaderboard = lazyWithRetry(() => import("@/pages/Leaderboard"));

// Enhanced loading fallback with branded spinner
const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
    {/* Branded pulsing circle */}
    <div className="relative">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
      <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
    {/* Loading text */}
    <p className="text-sm text-muted-foreground animate-pulse">Cargando...</p>
  </div>
);

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <div id="main-content" tabIndex={-1} className="outline-none">
      <ChunkErrorBoundary>
        <AnimatePresence mode="wait" initial={false}>
          <Suspense fallback={<LoadingFallback />}>
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <PageTransition>
                    <Index />
                  </PageTransition>
                }
              />
              <Route
                path="/auth"
                element={
                  <PageTransition>
                    <Auth />
                  </PageTransition>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Onboarding />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Profile />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/presence"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Presence />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/:profileId"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <PublicProfile />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:profileId"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Chat />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sparks"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Sparks />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spark/:chatId"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <SparkChat />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spark-energy"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <SparkEnergy />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spark-history"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <SparkHistory />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quedadas"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Quedadas />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quedada/:quedadaId"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <QuedadaChat />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Notifications />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ghost-messages"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <GhostMessages />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/connections"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Connections />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscription"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Subscription />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/privacidad"
                element={
                  <PageTransition>
                    <Privacy />
                  </PageTransition>
                }
              />
              <Route
                path="/terminos"
                element={
                  <PageTransition>
                    <Terms />
                  </PageTransition>
                }
              />
              <Route
                path="/cookies"
                element={
                  <PageTransition>
                    <Cookies />
                  </PageTransition>
                }
              />
              <Route
                path="/achievements"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Achievements />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Leaderboard />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <PageTransition>
                      <Admin />
                    </PageTransition>
                  </AdminRoute>
                }
              />
              <Route
                path="*"
                element={
                  <PageTransition>
                    <NotFound />
                  </PageTransition>
                }
              />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </ChunkErrorBoundary>
    </div>
  );
};
