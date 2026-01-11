import { useState, useEffect, useRef, forwardRef } from "react";
import { Ghost, Check, MoreVertical, Flag, Ban, Send, X, Sparkles, Zap, Heart, User, MapPin, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Music, Star, Flame } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion";
import { ALL_GENDERS, VIBES, CULTURAL_INTERESTS } from "@/constants/profileOptions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import UserModerationModal from "@/components/UserModerationModal";
import LazyImage from "@/components/LazyImage";
import GhostMessageLimitModal from "@/components/GhostMessageLimitModal";
import SparkleTrail from "@/components/SparkleTrail";
import { getSparkleTrailEnabled } from "@/hooks/useAdvancedSettings";
import { useProfile } from "@/hooks/useProfile";
import { useGhostMessageLimit } from "@/hooks/useSparks";
import { useSparkDetection } from "@/hooks/useSparkDetection";
import { useSparkEnergy } from "@/hooks/useSparkEnergy";
import { usePurchasedItems } from "@/hooks/usePurchasedItems";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";
import { firePerfectCompatibilityConfetti } from "@/utils/sparkConfetti";
import { fireSuperSparkConfetti } from "@/utils/superSparkConfetti";
import { SuperSparkButton } from "@/components/SuperSparkButton";

// Swipe direction type
type SwipeDirection = "left" | "right" | "up" | "down" | null;

interface CompatibilityBreakdown {
  tribes: number;
  music: number;
  lookingFor: number;
  interests: number;
  sharedTribes?: string[];
  sharedMusic?: string[];
  sharedInterests?: string[];
  sharedLookingFor?: string[];
}

interface FullScreenPresenceCardProps {
  presence: {
    id: string;
    profile: {
      id: string;
      name: string | null;
      avatar_url: string | null;
      city?: string | null;
      vibe?: string | null;
      looking_for?: string[] | null;
      gender?: string | null;
      birthdate?: string | null;
    } | null;
    tribes: string[];
    musicStyles: string[];
    interests: string[];
    last_pulse?: string;
    is_present?: boolean;
  };
  isBoosted?: boolean;
  canSeeRealtimePresence?: boolean;
  compatibility?: number;
  compatibilityBreakdown?: CompatibilityBreakdown;
  hasVisibilityBoost?: boolean;
  photos?: string[];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

const getGenderLabel = (genderValue: string | null | undefined): string | null => {
  if (!genderValue) return null;
  const gender = ALL_GENDERS.find(g => g.value === genderValue);
  return gender?.label || null;
};

const calculateAge = (birthdate: string | null | undefined): number | null => {
  if (!birthdate) return null;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const GHOST_MESSAGES = [
  "Me gustó tu vibra.",
  "Algo me dice que conectamos.",
  "Curiosidad.",
  "Ojalá coincidamos.",
];

const getActivityStatus = (lastPulse?: string, isPresent?: boolean, canSeeRealtime: boolean = true) => {
  if (!lastPulse) return { isActive: false, label: "Inactivo", color: "bg-muted-foreground/50" };
  
  const pulseTime = new Date(lastPulse).getTime();
  const now = Date.now();
  const diffMinutes = (now - pulseTime) / (1000 * 60);
  
  if (canSeeRealtime && isPresent && diffMinutes <= 5) {
    return { isActive: true, label: "Activo ahora", color: "bg-green-500" };
  }
  
  if (diffMinutes <= 60) {
    return { isActive: false, label: `Hace ${Math.round(diffMinutes)} min`, color: canSeeRealtime ? "bg-yellow-500" : "bg-muted-foreground/60" };
  } else if (diffMinutes <= 1440) {
    const hours = Math.round(diffMinutes / 60);
    return { isActive: false, label: `Hace ${hours}h`, color: "bg-orange-500" };
  } else {
    const days = Math.round(diffMinutes / 1440);
    return { isActive: false, label: `Hace ${days}d`, color: "bg-muted-foreground/50" };
  }
};

const SWIPE_THRESHOLD = 80;
const SWIPE_VERTICAL_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 400;

const FullScreenPresenceCard = forwardRef<HTMLDivElement, FullScreenPresenceCardProps>(({ 
  presence, 
  isBoosted = false, 
  canSeeRealtimePresence = true, 
  compatibility = 0, 
  compatibilityBreakdown, 
  hasVisibilityBoost = false,
  photos = [],
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
}, ref) => {
  const { data: myProfile } = useProfile();
  const { data: limitData, refetch: refetchLimit } = useGhostMessageLimit();
  const { checkForNewSpark } = useSparkDetection();
  const { earnEnergy, canDoAction } = useSparkEnergy();
  const { getAvailableQuantity } = usePurchasedItems();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationMode, setModerationMode] = useState<"report" | "block">("report");
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [sparkCreated, setSparkCreated] = useState(false);
  const [exitDirection, setExitDirection] = useState<SwipeDirection>(null);
  const [showCompatibilityDetails, setShowCompatibilityDetails] = useState(false);
  const [hasShownPerfectConfetti, setHasShownPerfectConfetti] = useState(false);
  const [currentSwipeDirection, setCurrentSwipeDirection] = useState<SwipeDirection>(null);
  const confettiShownRef = useRef(false);

  // Check available Super Spark items
  const availableSuperSparks = getAvailableQuantity("super_spark");

  // Trigger confetti for perfect compatibility (5/5)
  useEffect(() => {
    if (compatibility >= 5 && !confettiShownRef.current) {
      confettiShownRef.current = true;
      // Small delay to let the card appear first
      const timer = setTimeout(() => {
        firePerfectCompatibilityConfetti();
        triggerHaptic('success');
        setHasShownPerfectConfetti(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [compatibility]);

  // Swipe gesture state - both X and Y
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Rotation based on x movement
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  
  // Opacity based on movement
  const cardOpacity = useTransform(
    [x, y],
    ([latestX, latestY]: number[]) => {
      const distance = Math.sqrt(latestX * latestX + latestY * latestY);
      return distance > 150 ? 0.7 : 1;
    }
  );
  
  // Swipe indicator opacities - 4 directions
  const leftIndicatorOpacity = useTransform(x, [-120, -40, 0], [1, 0.5, 0]);
  const rightIndicatorOpacity = useTransform(x, [0, 40, 120], [0, 0.5, 1]);
  const upIndicatorOpacity = useTransform(y, [-120, -40, 0], [1, 0.5, 0]);
  const downIndicatorOpacity = useTransform(y, [0, 40, 120], [0, 0.5, 1]);

  // Sparkle trail state - intensity based on swipe distance
  const [sparkleIntensity, setSparkleIntensity] = useState(0);
  const [showSparkleTrail, setShowSparkleTrail] = useState(false);
  const sparkleTrailEnabledRef = useRef(getSparkleTrailEnabled());
  const cardContainerRef = useRef<HTMLDivElement>(null);

  const displayPhoto = photos.length > 0 ? photos[0] : presence.profile?.avatar_url;
  const activityStatus = getActivityStatus(presence.last_pulse, presence.is_present, canSeeRealtimePresence);

  // Determine swipe direction during drag
  const handleDrag = (_: any, info: PanInfo) => {
    const { offset } = info;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    
    // Calculate sparkle intensity for right swipe (Chispa) if enabled
    if (offset.x > 20 && absX > absY && sparkleTrailEnabledRef.current) {
      setShowSparkleTrail(true);
      // Intensity from 0 to 1 based on swipe distance (20-150px)
      const intensity = Math.min(1, Math.max(0, (offset.x - 20) / 130));
      setSparkleIntensity(intensity);
    } else {
      setShowSparkleTrail(false);
      setSparkleIntensity(0);
    }
    
    // Determine dominant direction
    if (absX > 30 || absY > 30) {
      if (absX > absY) {
        setCurrentSwipeDirection(offset.x > 0 ? "right" : "left");
      } else {
        setCurrentSwipeDirection(offset.y > 0 ? "down" : "up");
      }
    } else {
      setCurrentSwipeDirection(null);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    
    // Reset current swipe direction and sparkle trail
    setCurrentSwipeDirection(null);
    setShowSparkleTrail(false);
    setSparkleIntensity(0);
    
    // Determine if horizontal or vertical swipe is dominant
    const isHorizontal = absX > absY;
    
    if (isHorizontal) {
      // Horizontal swipe: left (pass) or right (chispa)
      if (absX > SWIPE_THRESHOLD || Math.abs(velocity.x) > SWIPE_VELOCITY_THRESHOLD) {
        if (offset.x > 0) {
          // Swipe right - send ghost message
          setExitDirection("right");
          triggerHaptic('success');
          onSwipeRight?.();
        } else {
          // Swipe left - pass
          setExitDirection("left");
          triggerHaptic('light');
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe: up (super spark) or down (view profile)
      if (absY > SWIPE_VERTICAL_THRESHOLD || Math.abs(velocity.y) > SWIPE_VELOCITY_THRESHOLD) {
        if (offset.y < 0) {
          // Swipe up - Super Chispa
          setExitDirection("up");
          triggerHaptic('success');
          onSwipeUp?.();
        } else {
          // Swipe down - View profile
          triggerHaptic('light');
          onSwipeDown?.();
        }
      }
    }
  };

  // Get exit animation based on direction
  const getExitAnimation = () => {
    switch (exitDirection) {
      case "left":
        return { x: -500, opacity: 0, transition: { duration: 0.3 } };
      case "right":
        return { x: 500, opacity: 0, transition: { duration: 0.3 } };
      case "up":
        return { y: -500, opacity: 0, scale: 1.1, transition: { duration: 0.3 } };
      case "down":
        return { y: 500, opacity: 0, transition: { duration: 0.3 } };
      default:
        return undefined;
    }
  };

  const handleOpenDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection');
    
    if (!limitData?.canSend) {
      setShowLimitModal(true);
      return;
    }
    
    setShowMessageDialog(true);
  };

  const handleSendGhostMessage = async (isPremiumMessage: boolean = false) => {
    if (!selectedMessage || !myProfile?.id || !presence.profile?.id) return;

    if (!limitData?.canSend) {
      setShowLimitModal(true);
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("ghost_messages").insert({
        from_profile_id: myProfile.id,
        to_profile_id: presence.profile.id,
        content: selectedMessage,
        is_premium_message: isPremiumMessage,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya enviaste un mensaje a esta persona");
          setShowMessageDialog(false);
        } else {
          throw error;
        }
      } else {
        setMessageSent(true);
        refetchLimit();
        queryClient.invalidateQueries({ queryKey: ["ghost_message_count"] });
        
        if (canDoAction("send_ghost")) {
          try {
            await earnEnergy({ 
              action: "send_ghost", 
              description: "Ghost message enviado" 
            });
          } catch (e) {
            console.log("[SparkEnergy] Could not award energy:", e);
          }
        }
        
        setTimeout(async () => {
          const hasNewSpark = await checkForNewSpark(presence.profile!.id);
          
          if (hasNewSpark) {
            setSparkCreated(true);
            
            try {
              await earnEnergy({ 
                action: "mutual_spark", 
                description: "¡Chispa mutua!" 
              });
            } catch (e) {
              console.log("[SparkEnergy] Could not award mutual spark energy:", e);
            }
            
            toast.success("🔥 ¡Chispa mutua!", {
              action: {
                label: "Ver perfil",
                onClick: () => navigate(`/user/${presence.profile!.id}`),
              },
            });
          } else {
            toast.success("Mensaje ghost enviado");
          }
          
          setTimeout(() => setShowMessageDialog(false), 1500);
        }, 500);
      }
    } catch (error: any) {
      toast.error("Error al enviar: " + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModerationMode("report");
    setShowModerationModal(true);
  };

  const handleBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModerationMode("block");
    setShowModerationModal(true);
  };

  const handleViewProfile = () => {
    if (presence.profile?.id) {
      triggerHaptic('light');
      navigate(`/user/${presence.profile.id}`);
    }
  };

  // Desktop drag enhancement - show drag hint on hover
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <>
      <motion.div
        ref={(node) => {
          // Combine refs: external ref + internal cardContainerRef
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          (cardContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        style={{ x, y, rotate, opacity: cardOpacity }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.9}
        onDragStart={() => {
          setIsDragging(true);
          triggerHaptic('light');
        }}
        onDrag={handleDrag}
        onDragEnd={(e, info) => {
          setIsDragging(false);
          setShowSparkleTrail(false);
          setSparkleIntensity(0);
          handleDragEnd(e, info);
        }}
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && setIsHovering(false)}
        animate={exitDirection ? getExitAnimation() : undefined}
        whileHover={!isMobile ? { scale: 1.01 } : undefined}
        className={cn(
          "relative w-full aspect-[3/4] max-h-[calc(100vh-180px)] min-h-[500px] rounded-3xl overflow-hidden",
          "shadow-2xl shadow-foreground/20",
          // Cursor states for desktop
          !isMobile && "cursor-grab",
          !isMobile && isDragging && "cursor-grabbing",
          isBoosted && "ring-2 ring-primary/50",
          // Hover glow effect on desktop
          !isMobile && isHovering && !isDragging && "ring-2 ring-primary/30"
        )}
      >
        {/* Sparkle trail for right swipe (Chispa) */}
        <SparkleTrail 
          isActive={showSparkleTrail} 
          intensity={sparkleIntensity}
          containerRef={cardContainerRef}
        />
        {/* Desktop drag hint - appears on hover */}
        {!isMobile && isHovering && !isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
            <div className="flex flex-col items-center gap-3 z-10">
              <motion.div
                animate={{ 
                  x: [0, 15, 0, -15, 0],
                  y: [0, 0, -10, 0, 10, 0]
                }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center"
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-lg" />
              </motion.div>
              <p className="text-white/90 text-sm font-medium bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                Arrastra para interactuar
              </p>
            </div>
          </motion.div>
        )}

        {/* Drag direction trail effect on desktop */}
        {!isMobile && isDragging && currentSwipeDirection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className={cn(
              "absolute inset-0 z-10 pointer-events-none",
              currentSwipeDirection === "left" && "bg-gradient-to-r from-muted-foreground/30 to-transparent",
              currentSwipeDirection === "right" && "bg-gradient-to-l from-primary/30 to-transparent",
              currentSwipeDirection === "up" && "bg-gradient-to-b from-purple-500/30 to-transparent",
              currentSwipeDirection === "down" && "bg-gradient-to-t from-accent/30 to-transparent"
            )}
          />
        )}

        {/* 4-Direction Swipe indicators */}
        {/* LEFT - Pass */}
        <motion.div 
          style={{ opacity: leftIndicatorOpacity }}
          className="absolute top-1/2 left-6 -translate-y-1/2 z-30 pointer-events-none"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/90 backdrop-blur-md border-2 border-muted-foreground/30 shadow-xl">
              <X className="w-8 h-8 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
              Pasar 👋
            </span>
          </div>
        </motion.div>
        
        {/* RIGHT - Chispa (Like) */}
        <motion.div 
          style={{ opacity: rightIndicatorOpacity }}
          className="absolute top-1/2 right-6 -translate-y-1/2 z-30 pointer-events-none"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/90 backdrop-blur-md border-2 border-primary shadow-xl shadow-primary/40">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium text-white bg-primary/80 backdrop-blur-sm px-2 py-1 rounded-full">
              Chispa ✨
            </span>
          </div>
        </motion.div>

        {/* UP - Super Chispa */}
        <motion.div 
          style={{ opacity: upIndicatorOpacity }}
          className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 backdrop-blur-md border-2 border-purple-400 shadow-xl shadow-purple-500/40 animate-pulse">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <span className="text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 backdrop-blur-sm px-3 py-1 rounded-full">
              Super Chispa 🔥
            </span>
          </div>
        </motion.div>

        {/* DOWN - View Profile */}
        <motion.div 
          style={{ opacity: downIndicatorOpacity }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent/90 backdrop-blur-md border-2 border-accent shadow-xl shadow-accent/30">
              <User className="w-8 h-8 text-accent-foreground" />
            </div>
            <span className="text-xs font-medium text-white bg-accent/80 backdrop-blur-sm px-2 py-1 rounded-full">
              Ver perfil 👤
            </span>
          </div>
        </motion.div>

        {/* Current swipe direction indicator at center */}
        <AnimatePresence>
          {currentSwipeDirection && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
            >
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center backdrop-blur-sm",
                currentSwipeDirection === "left" && "bg-muted/70",
                currentSwipeDirection === "right" && "bg-primary/70",
                currentSwipeDirection === "up" && "bg-gradient-to-br from-purple-500/70 to-blue-500/70",
                currentSwipeDirection === "down" && "bg-accent/70",
              )}>
                {currentSwipeDirection === "left" && <X className="w-12 h-12 text-muted-foreground" />}
                {currentSwipeDirection === "right" && <Sparkles className="w-12 h-12 text-primary-foreground" />}
                {currentSwipeDirection === "up" && <Flame className="w-12 h-12 text-white" />}
                {currentSwipeDirection === "down" && <User className="w-12 h-12 text-accent-foreground" />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full-screen photo background */}
        <div className="absolute inset-0">
          {displayPhoto ? (
            <LazyImage 
              src={displayPhoto} 
              alt=""
              className="w-full h-full object-cover"
              placeholderClassName="w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10" />
          )}
        </div>

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top badges row */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-20">
          {/* Left side badges */}
          <div className="flex flex-col gap-2">
            {/* KIKI Now boost badge */}
            {isBoosted && (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg animate-pulse">
                <Zap className="w-3.5 h-3.5 text-white fill-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wide">Now</span>
              </div>
            )}

            {/* Visibility boost badge */}
            {hasVisibilityBoost && !isBoosted && (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wide">Boost</span>
              </div>
            )}

            {/* Activity status */}
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full backdrop-blur-md",
              "bg-black/40"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                activityStatus.color,
                activityStatus.isActive && "animate-pulse shadow-sm shadow-green-500/50"
              )} />
              <span className="text-xs font-medium text-white">
                {activityStatus.label}
              </span>
            </div>
          </div>

          {/* Right side - menu and compatibility */}
          <div className="flex flex-col items-end gap-2">
            {/* Options menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); }}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-black/60 active:scale-90 transition-all"
                >
                  <MoreVertical className="w-5 h-5 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={(e) => { triggerHaptic('medium'); handleReport(e); }} className="gap-2 cursor-pointer py-3">
                  <Flag className="w-4 h-4" />
                  Reportar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { triggerHaptic('warning'); handleBlock(e); }} className="gap-2 text-destructive cursor-pointer py-3">
                  <Ban className="w-4 h-4" />
                  Bloquear
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Compatibility badge */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full cursor-help transition-all",
                    compatibility >= 5
                      ? "bg-gradient-to-r from-primary to-accent animate-pulse"
                      : compatibility >= 4 
                        ? "bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30" 
                        : "bg-black/40 backdrop-blur-md"
                  )}>
                    <Heart className={cn(
                      "w-4 h-4",
                      compatibility >= 4 
                        ? "text-white fill-white" 
                        : "text-primary fill-primary"
                    )} />
                    <span className={cn(
                      "text-sm font-bold",
                      compatibility >= 4 ? "text-white" : "text-white"
                    )}>
                      {Math.min(compatibility, 5)}/5
                    </span>
                    {compatibility >= 5 && (
                      <span className="text-sm">💫</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {compatibilityBreakdown ? (
                    <div className="space-y-1">
                      {compatibility >= 5 ? (
                        <p className="text-primary font-semibold">💫 ¡Compatibilidad perfecta!</p>
                      ) : compatibility >= 4 ? (
                        <p className="text-primary font-semibold">✨ ¡Alta compatibilidad!</p>
                      ) : null}
                      {compatibilityBreakdown.tribes > 0 && (
                        <p>🏴 {compatibilityBreakdown.tribes} {compatibilityBreakdown.tribes === 1 ? "tribu" : "tribus"}</p>
                      )}
                      {compatibilityBreakdown.music > 0 && (
                        <p>🎵 {compatibilityBreakdown.music} {compatibilityBreakdown.music === 1 ? "estilo" : "estilos"}</p>
                      )}
                      {compatibilityBreakdown.lookingFor > 0 && (
                        <p>🔍 {compatibilityBreakdown.lookingFor} coincidencias</p>
                      )}
                      {compatibilityBreakdown.interests > 0 && (
                        <p>⭐ {compatibilityBreakdown.interests} intereses</p>
                      )}
                    </div>
                  ) : (
                    <p>{compatibility} coincidencias</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Bottom content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
          {/* Profile info */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white">
                {presence.profile?.name || "Anónimo/a"}
              </h2>
              {presence.profile?.birthdate && (
                <span className="text-xl text-white/80">
                  {calculateAge(presence.profile.birthdate)}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-white/70 text-sm">
              {presence.profile?.gender && (
                <span>{getGenderLabel(presence.profile.gender)}</span>
              )}
              {presence.profile?.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {presence.profile.city}
                </span>
              )}
              {presence.profile?.vibe && (
                <span className="flex items-center gap-1">
                  {VIBES.find(v => v.value === presence.profile?.vibe)?.emoji || "✨"} {presence.profile.vibe}
                </span>
              )}
            </div>

            {/* Tribes preview */}
            {presence.tribes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {presence.tribes.slice(0, 3).map((tribe) => (
                  <span 
                    key={tribe} 
                    className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs text-white font-medium"
                  >
                    {tribe}
                  </span>
                ))}
                {presence.tribes.length > 3 && (
                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs text-white/70">
                    +{presence.tribes.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Expandable compatibility details */}
            {compatibilityBreakdown && compatibility > 0 && (
              <motion.div className="mt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); setShowCompatibilityDetails(!showCompatibilityDetails); }}
                  className="flex items-center gap-2 text-white/80 text-sm font-medium hover:text-white transition-colors"
                >
                  <Heart className="w-4 h-4 fill-primary text-primary" />
                  <span>Ver {compatibility} coincidencias</span>
                  <motion.div
                    animate={{ rotate: showCompatibilityDetails ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {showCompatibilityDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 p-3 rounded-xl bg-black/40 backdrop-blur-md space-y-2">
                        {/* Shared tribes */}
                        {compatibilityBreakdown.sharedTribes && compatibilityBreakdown.sharedTribes.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-white/60 text-xs">Tribus en común:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {compatibilityBreakdown.sharedTribes.map(tribe => (
                                  <span key={tribe} className="px-2 py-0.5 rounded-full bg-primary/30 text-xs text-white">
                                    {tribe}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Shared music */}
                        {compatibilityBreakdown.sharedMusic && compatibilityBreakdown.sharedMusic.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Music className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-white/60 text-xs">Música en común:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {compatibilityBreakdown.sharedMusic.slice(0, 4).map(style => (
                                  <span key={style} className="px-2 py-0.5 rounded-full bg-accent/30 text-xs text-white">
                                    {style}
                                  </span>
                                ))}
                                {compatibilityBreakdown.sharedMusic.length > 4 && (
                                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/60">
                                    +{compatibilityBreakdown.sharedMusic.length - 4}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Shared interests */}
                        {compatibilityBreakdown.sharedInterests && compatibilityBreakdown.sharedInterests.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-white/60 text-xs">Intereses en común:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {compatibilityBreakdown.sharedInterests.slice(0, 5).map(interest => {
                                  const interestData = CULTURAL_INTERESTS.find(ci => ci.value === interest);
                                  return (
                                    <span key={interest} className="px-2 py-0.5 rounded-full bg-yellow-400/20 text-xs text-white">
                                      {interestData?.emoji} {interest}
                                    </span>
                                  );
                                })}
                                {compatibilityBreakdown.sharedInterests.length > 5 && (
                                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/60">
                                    +{compatibilityBreakdown.sharedInterests.length - 5}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Shared looking for */}
                        {compatibilityBreakdown.sharedLookingFor && compatibilityBreakdown.sharedLookingFor.length > 0 && (
                          <div className="flex items-center gap-2 text-white/80 text-xs">
                            <span>🔍</span>
                            <span>Ambos buscáis: {compatibilityBreakdown.sharedLookingFor.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* Action buttons - 3 buttons layout */}
          <div className="flex gap-2">
            {/* Ver perfil */}
            <Button
              onClick={handleViewProfile}
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md text-white border-0 hover:bg-white/30"
            >
              <User className="w-5 h-5" />
            </Button>
            
            {/* Mensaje Ghost - Normal "like" */}
            <Button
              onClick={handleOpenDialog}
              variant="default"
              className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/30"
            >
              <Ghost className="w-4 h-4 mr-2" />
              Chispa
            </Button>
            
            {/* Super Chispa - Premium "super like" */}
            {presence.profile?.id && (
              <SuperSparkButton
                targetProfileId={presence.profile.id}
                targetProfileName={presence.profile.name || undefined}
                className="h-12 w-12"
              />
            )}
          </div>

          {/* Swipe hint - 4 directions (mobile only) */}
          {isMobile && (
            <div className="flex justify-center mt-4">
              <div className="grid grid-cols-4 gap-3 text-white/50 text-[10px]">
                <span className="flex flex-col items-center gap-0.5">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Pasar</span>
                </span>
                <span className="flex flex-col items-center gap-0.5">
                  <ChevronRight className="w-3.5 h-3.5 text-primary/70" />
                  <span>Chispa</span>
                </span>
                <span className="flex flex-col items-center gap-0.5">
                  <ChevronUp className="w-3.5 h-3.5 text-purple-400/70" />
                  <span>Super</span>
                </span>
                <span className="flex flex-col items-center gap-0.5">
                  <ChevronDown className="w-3.5 h-3.5 text-accent/70" />
                  <span>Perfil</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Ghost message dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-lg text-card-foreground">
              {messageSent 
                ? sparkCreated 
                  ? "🔥 ¡Chispa mutua!" 
                  : "✓ Enviado" 
                : "Envía un mensaje ghost"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {messageSent 
                ? sparkCreated
                  ? "¡Hay conexión! Ya pueden chatear."
                  : "Si hay interés mutuo, se creará una chispa."
                : "Elige qué quieres transmitir."}
            </DialogDescription>
          </DialogHeader>

          {!messageSent && (
            <div className="grid gap-2 py-4">
              {GHOST_MESSAGES.map((msg) => (
                <button
                  key={msg}
                  onClick={() => setSelectedMessage(msg)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl transition-all",
                    "border-2 hover:scale-[1.02] active:scale-[0.98]",
                    selectedMessage === msg
                      ? "border-primary bg-primary/10 text-card-foreground"
                      : "border-border bg-card hover:border-primary/50 text-card-foreground"
                  )}
                >
                  <span className="font-body text-sm">{msg}</span>
                </button>
              ))}
            </div>
          )}

          {!messageSent && (
            <DialogFooter className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowMessageDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleSendGhostMessage()}
                disabled={!selectedMessage || sending}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {sending ? (
                  <span className="animate-pulse">Enviando...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </DialogFooter>
          )}

          {messageSent && (
            <div className="flex justify-center py-4">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                sparkCreated 
                  ? "bg-primary/20 animate-pulse" 
                  : "bg-green-500/20"
              )}>
                {sparkCreated ? (
                  <Sparkles className="w-8 h-8 text-primary" />
                ) : (
                  <Check className="w-8 h-8 text-green-500" />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Moderation modal */}
      {presence.profile?.id && showModerationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <UserModerationModal
            profileId={presence.profile.id}
            profileName={presence.profile.name || "Este perfil"}
            onClose={() => setShowModerationModal(false)}
            initialMode={moderationMode}
          />
        </div>
      )}

      {/* Limit modal */}
      <GhostMessageLimitModal
        open={showLimitModal}
        onOpenChange={setShowLimitModal}
      />
    </>
  );
});

FullScreenPresenceCard.displayName = "FullScreenPresenceCard";

export default FullScreenPresenceCard;
