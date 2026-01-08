import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Suspense, lazy } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import { PageTransition } from "@/components/PageTransition";

// Eager load critical paths
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";

// Lazy load non-critical pages
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Profile = lazy(() => import("@/pages/Profile"));
const Presence = lazy(() => import("@/pages/Presence"));
const PublicProfile = lazy(() => import("@/pages/PublicProfile"));
const Chat = lazy(() => import("@/pages/Chat"));
const Sparks = lazy(() => import("@/pages/Sparks"));
const SparkChat = lazy(() => import("@/pages/SparkChat"));
const SparkEnergy = lazy(() => import("@/pages/Spark"));
const SparkHistory = lazy(() => import("@/pages/SparkHistory"));
const GhostMessages = lazy(() => import("@/pages/GhostMessages"));
const Connections = lazy(() => import("@/pages/Connections"));
const Quedadas = lazy(() => import("@/pages/Quedadas"));
const QuedadaChat = lazy(() => import("@/pages/QuedadaChat"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Subscription = lazy(() => import("@/pages/Subscription"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Cookies = lazy(() => import("@/pages/Cookies"));
const Admin = lazy(() => import("@/pages/Admin"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Landing = lazy(() => import("@/pages/Landing"));
const Achievements = lazy(() => import("@/pages/Achievements"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-pulse w-8 h-8 rounded-full bg-primary/20" />
  </div>
);

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <div id="main-content" tabIndex={-1} className="outline-none">
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
    </div>
  );
};
