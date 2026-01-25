import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Calendar, Flame, Users, User, Ghost, CloudOff, UserPlus } from "lucide-react";
import { useNavBadgeCounts } from "@/hooks/useNavBadgeCounts";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { useSparkEnergy } from "@/hooks/useSparkEnergy";
import { SparkFlameCompact } from "@/components/SparkFlame";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, useCallback } from "react";

// Route prefetch map - lazy imports for prefetching
const routePrefetchMap: Record<string, () => Promise<unknown>> = {
  "/presence": () => import("@/pages/Presence"),
  "/sparks": () => import("@/pages/Sparks"),
  "/quedadas": () => import("@/pages/Quedadas"),
  "/notifications": () => import("@/pages/Notifications"),
  "/profile": () => import("@/pages/Profile"),
};

// Track which routes have been prefetched
const prefetchedRoutes = new Set<string>();

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
  isActive: boolean;
  onClick: () => void;
  onPrefetch: () => void;
  isOfflineBadge?: boolean;
  hasSuperSparkPulse?: boolean;
}

const NavItem = ({ icon, label, badge, isActive, onClick, onPrefetch, isOfflineBadge, hasSuperSparkPulse }: NavItemProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevBadgeRef = useRef(badge);

  useEffect(() => {
    // Trigger animation when badge increases
    if (badge !== undefined && prevBadgeRef.current !== undefined) {
      if (badge > prevBadgeRef.current) {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 600);
        return () => clearTimeout(timer);
      }
    }
    prevBadgeRef.current = badge;
  }, [badge]);

  return (
    <button
      onClick={onClick}
      onMouseEnter={onPrefetch}
      onTouchStart={onPrefetch}
      onFocus={onPrefetch}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-2 relative transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className={cn(
        "relative",
        hasSuperSparkPulse && "animate-super-spark-pulse"
      )}>
        {icon}
        {badge !== undefined && badge > 0 && (
          <span 
            className={cn(
              "absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center",
              isOfflineBadge 
                ? "animate-offline-pulse text-destructive-foreground" 
                : hasSuperSparkPulse
                  ? "bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 text-white animate-shimmer-badge"
                  : "bg-primary text-primary-foreground",
              isAnimating && !isOfflineBadge && "animate-badge-bounce",
              !isAnimating && !isOfflineBadge && !hasSuperSparkPulse && "animate-badge-pulse"
            )}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-body">{label}</span>
      {isActive && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
      )}
    </button>
  );
};

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: counts } = useNavBadgeCounts();
  const { pendingCount } = useOfflineQueue();
  const { sparkEnergy, currentLevel } = useSparkEnergy();

  // Prefetch a route's component
  const prefetchRoute = useCallback((path: string) => {
    if (prefetchedRoutes.has(path)) return;
    
    const prefetchFn = routePrefetchMap[path];
    if (prefetchFn) {
      prefetchedRoutes.add(path);
      // Use requestIdleCallback for non-blocking prefetch
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => prefetchFn(), { timeout: 2000 });
      } else {
        setTimeout(() => prefetchFn(), 100);
      }
    }
  }, []);

  // Prefetch adjacent routes on mount (after a small delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Prefetch all nav routes after initial render
      Object.keys(routePrefetchMap).forEach(path => {
        if (path !== location.pathname) {
          prefetchRoute(path);
        }
      });
    }, 2000); // Wait 2 seconds after mount

    return () => clearTimeout(timer);
  }, [location.pathname, prefetchRoute]);

  // Extract counts with defaults
  const unreadSparkCount = counts?.unreadSparks || 0;
  const unreadQuedadaCount = counts?.unreadQuedadas || 0;
  const unreadGhostCount = counts?.unreadGhostMessages || 0;
  const unreadSuperSparkCount = counts?.unreadSuperSparks || 0;
  const pendingConnectionCount = counts?.pendingConnections || 0;
  const totalAlertCount = counts?.totalAlerts || 0;

  const navItems = [
    {
      icon: <Users className="w-5 h-5" />,
      label: "Presencia",
      path: "/presence",
    },
    {
      icon: <Flame className="w-5 h-5" />,
      label: "Chispas",
      path: "/sparks",
      badge: unreadSparkCount > 0 ? unreadSparkCount : undefined,
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: "Quedadas",
      path: "/quedadas",
      badge: unreadQuedadaCount > 0 ? unreadQuedadaCount : undefined,
    },
    {
      icon: pendingConnectionCount > 0 ? <UserPlus className="w-5 h-5" /> : unreadGhostCount > 0 ? <Ghost className="w-5 h-5" /> : <Bell className="w-5 h-5" />,
      label: "Alertas",
      path: "/notifications",
      badge: totalAlertCount > 0 ? totalAlertCount : undefined,
      hasSuperSparkPulse: unreadSuperSparkCount > 0,
    },
    {
      icon: pendingCount > 0 ? <CloudOff className="w-5 h-5" /> : <User className="w-5 h-5" />,
      label: "Perfil",
      path: "/profile",
      badge: pendingCount > 0 ? pendingCount : undefined,
      isOfflineBadge: pendingCount > 0,
    },
  ];

  // Don't show on auth, landing, chat, or onboarding pages
  const hiddenPaths = ["/", "/auth", "/chat", "/spark", "/quedada", "/onboarding"];
  const shouldHide = hiddenPaths.some(p => 
    location.pathname === p || 
    (p !== "/" && location.pathname.startsWith(p + "/"))
  );

  if (shouldHide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-between max-w-md mx-auto px-2">
        <div className="flex items-center justify-around flex-1">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              badge={item.badge}
              isActive={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              onPrefetch={() => prefetchRoute(item.path)}
              isOfflineBadge={item.isOfflineBadge}
              hasSuperSparkPulse={item.hasSuperSparkPulse}
            />
          ))}
        </div>
        
        {/* Spark Energy indicator - properly sized */}
        <SparkFlameCompact
          level={currentLevel.level}
          energy={sparkEnergy?.current_energy || 0}
          onClick={() => navigate("/spark-energy")}
          className="ml-1 mr-1"
        />
      </div>
    </nav>
  );
};