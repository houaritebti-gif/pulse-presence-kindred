import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Calendar, Flame, Users, User } from "lucide-react";
import { useUnreadNotificationCount } from "@/hooks/useNotificationCenter";
import { useSparkChats } from "@/hooks/useSparks";
import { useQuedadas } from "@/hooks/useQuedadas";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
  isActive: boolean;
  onClick: () => void;
}

const NavItem = ({ icon, label, badge, isActive, onClick }: NavItemProps) => {
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
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-2 relative transition-all",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span 
            className={cn(
              "absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center",
              isAnimating ? "animate-badge-bounce" : "animate-pulse-soft"
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
  const unreadCount = useUnreadNotificationCount();
  const { data: sparks } = useSparkChats();
  const { data: quedadas } = useQuedadas();

  const sparkCount = sparks?.length || 0;
  const quedadaCount = quedadas?.length || 0;

  const navItems = [
    {
      icon: <Users className="w-5 h-5" />,
      label: "Presencia",
      path: "/presence",
    },
    {
      icon: <Flame className="w-5 h-5" />,
      label: "Sparks",
      path: "/sparks",
      badge: sparkCount,
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: "Quedadas",
      path: "/quedadas",
      badge: quedadaCount,
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: "Alertas",
      path: "/notifications",
      badge: unreadCount,
    },
    {
      icon: <User className="w-5 h-5" />,
      label: "Perfil",
      path: "/profile",
    },
  ];

  // Don't show on auth, landing, or chat pages
  const hiddenPaths = ["/", "/auth", "/chat", "/spark", "/quedada"];
  const shouldHide = hiddenPaths.some(p => 
    location.pathname === p || 
    (p !== "/" && location.pathname.startsWith(p + "/"))
  );

  if (shouldHide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            badge={item.badge}
            isActive={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>
    </nav>
  );
};
