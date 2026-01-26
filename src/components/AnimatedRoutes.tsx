import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Suspense, useEffect, memo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import { PageTransition } from "@/components/PageTransition";
import { ChunkErrorBoundary } from "@/components/ChunkErrorBoundary";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { deferWork } from "@/utils/performanceOptimizations";

// Eager load only the landing/auth - critical for first paint
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";

// Priority 1: Core app pages (load first after auth)
const Presence = lazyWithRetry(() => import("@/pages/Presence"));
const Profile = lazyWithRetry(() => import("@/pages/Profile"));
const Onboarding = lazyWithRetry(() => import("@/pages/Onboarding"));

// Priority 2: Frequently accessed pages
const Sparks = lazyWithRetry(() => import("@/pages/Sparks"));
const SparkChat = lazyWithRetry(() => import("@/pages/SparkChat"));
const Notifications = lazyWithRetry(() => import("@/pages/Notifications"));

// Priority 3: Secondary pages (lazy load on demand)
const PublicProfile = lazyWithRetry(() => import("@/pages/PublicProfile"));
const Chat = lazyWithRetry(() => import("@/pages/Chat"));
const SparkEnergy = lazyWithRetry(() => import("@/pages/Spark"));
const SparkHistory = lazyWithRetry(() => import("@/pages/SparkHistory"));
const GhostMessages = lazyWithRetry(() => import("@/pages/GhostMessages"));
const Connections = lazyWithRetry(() => import("@/pages/Connections"));
const Quedadas = lazyWithRetry(() => import("@/pages/Quedadas"));
const QuedadaChat = lazyWithRetry(() => import("@/pages/QuedadaChat"));
const Subscription = lazyWithRetry(() => import("@/pages/Subscription"));

// Priority 4: Rarely accessed pages
const Privacy = lazyWithRetry(() => import("@/pages/Privacy"));
const Terms = lazyWithRetry(() => import("@/pages/Terms"));
const Cookies = lazyWithRetry(() => import("@/pages/Cookies"));
const Admin = lazyWithRetry(() => import("@/pages/Admin"));
const NotFound = lazyWithRetry(() => import("@/pages/NotFound"));
const Landing = lazyWithRetry(() => import("@/pages/Landing"));
const Achievements = lazyWithRetry(() => import("@/pages/Achievements"));
const Leaderboard = lazyWithRetry(() => import("@/pages/Leaderboard"));

// Memoized loading fallback with minimal repaints
const LoadingFallback = memo(() => (
  <div 
    className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background"
    role="status"
    aria-label="Cargando página"
  >
    {/* Branded pulsing circle - using CSS from index.html */}
    <div className="relative">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
      <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
    {/* Loading text */}
    <p className="text-sm text-muted-foreground animate-pulse">Cargando...</p>
  </div>
));
LoadingFallback.displayName = "LoadingFallback";

// Preload priority routes after initial render
function usePriorityPreload() {
  useEffect(() => {
    // Defer preloading to not block initial render
    deferWork(() => {
      // Priority 1 routes - preload immediately after defer
      import("@/pages/Presence").catch(() => {});
      import("@/pages/Profile").catch(() => {});
    }, 1000);
    
    deferWork(() => {
      // Priority 2 routes - preload after priority 1
      import("@/pages/Sparks").catch(() => {});
      import("@/pages/Notifications").catch(() => {});
    }, 3000);
  }, []);
}


export const AnimatedRoutes = () => {
  const location = useLocation();
  
  // Preload priority routes after mount
  usePriorityPreload();

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
