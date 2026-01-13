import { useState, useEffect, useRef, forwardRef } from "react";
import { Ghost, Check, MoreVertical, Flag, Ban, Send, X, Sparkles, Zap, Heart, User, MapPin, ChevronDown, Music, Star, Flame } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReducedMotion, getExitAnimationConfig } from "@/hooks/useReducedMotion";
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
import BlurPlaceholderImage from "@/components/BlurPlaceholderImage";
import GhostMessageLimitModal from "@/components/GhostMessageLimitModal";
import SparkleTrail from "@/components/SparkleTrail";
import VisitedIndicator from "@/components/VisitedIndicator";
import { getSparkleTrailEnabled } from "@/hooks/useAdvancedSettings";
import { useProfile } from "@/hooks/useProfile";
import { useGhostMessageLimit } from "@/hooks/useSparks";
import { useSparkDetection } from "@/hooks/useSparkDetection";
import { useSparkEnergy } from "@/hooks/useSparkEnergy";
import { usePurchasedItems } from "@/hooks/usePurchasedItems";
import { checkProfileVisited } from "@/hooks/useVisitedProfiles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";
import { firePerfectCompatibilityConfetti } from "@/utils/sparkConfetti";

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
const SWIPE_VERTICAL_THRESHOLD = 140; // Higher threshold to prevent accidental Super Chispa during scroll
const SWIPE_VELOCITY_THRESHOLD = 400;
const SWIPE_VERTICAL_VELOCITY_THRESHOLD = 600; // Higher velocity threshold for vertical swipes

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
  const prefersReducedMotion = useReducedMotion();
  
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationMode, setModerationMode] = useState<"report" | "block">("report");
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showProfileConfirmModal, setShowProfileConfirmModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [sparkCreated, setSparkCreated] = useState(false);
  const [exitDirection, setExitDirection] = useState<SwipeDirection>(null);
  const [showCompatibilityDetails, setShowCompatibilityDetails] = useState(false);
  const [hasShownPerfectConfetti, setHasShownPerfectConfetti] = useState(false);
  const [currentSwipeDirection, setCurrentSwipeDirection] = useState<SwipeDirection>(null);
  const [isVisited, setIsVisited] = useState(false);
  const confettiShownRef = useRef(false);

  // Check if this profile has been visited before (cached in IndexedDB)
  useEffect(() => {
    if (presence.profile?.id) {
      checkProfileVisited(presence.profile.id).then(setIsVisited);
    }
  }, [presence.profile?.id]);

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
  
  // Rotation based on x movement (disabled for reduced motion)
  const rotate = useTransform(
    x, 
    [-300, 0, 300], 
    prefersReducedMotion ? [0, 0, 0] : [-15, 0, 15]
  );
  
  // Opacity based on movement (subtle for reduced motion)
  const cardOpacity = useTransform(
    [x, y],
    ([latestX, latestY]: number[]) => {
      if (prefersReducedMotion) return 1;
      const distance = Math.sqrt(latestX * latestX + latestY * latestY);
      return distance > 150 ? 0.7 : 1;
    }
  );
  
  // Swipe indicator opacities - 4 directions (instant for reduced motion)
  const leftIndicatorOpacity = useTransform(
    x, 
    prefersReducedMotion ? [-60, -30, 0] : [-120, -40, 0], 
    [1, 0.5, 0]
  );
  const rightIndicatorOpacity = useTransform(
    x, 
    prefersReducedMotion ? [0, 30, 60] : [0, 40, 120], 
    [0, 0.5, 1]
  );
  const upIndicatorOpacity = useTransform(
    y, 
    prefersReducedMotion ? [-60, -30, 0] : [-120, -40, 0], 
    [1, 0.5, 0]
  );
  const downIndicatorOpacity = useTransform(
    y, 
    prefersReducedMotion ? [0, 30, 60] : [0, 40, 120], 
    [0, 0.5, 1]
  );

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
      // Use higher threshold to prevent accidental triggers during scroll
      const verticalVelocityMet = Math.abs(velocity.y) > SWIPE_VERTICAL_VELOCITY_THRESHOLD;
      const verticalOffsetMet = absY > SWIPE_VERTICAL_THRESHOLD;
      
      // Require BOTH significant offset AND velocity for vertical swipes
      // This prevents accidental Super Chispa when user is just scrolling
      if (verticalOffsetMet && verticalVelocityMet) {
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

  // Get exit animation based on direction (respects reduced motion)
  const getExitAnimation = () => {
    return getExitAnimationConfig(exitDirection, prefersReducedMotion);
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
      setShowProfileConfirmModal(true);
    }
  };

  const confirmViewProfile = () => {
    if (presence.profile?.id) {
      setShowProfileConfirmModal(false);
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
        drag={!prefersReducedMotion}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={prefersReducedMotion ? 0 : 0.9}
        onDragStart={() => {
          setIsDragging(true);
          if (!prefersReducedMotion) triggerHaptic('light');
        }}
        onDrag={prefersReducedMotion ? undefined : handleDrag}
        onDragEnd={(e, info) => {
          setIsDragging(false);
          setShowSparkleTrail(false);
          setSparkleIntensity(0);
          handleDragEnd(e, info);
        }}
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && setIsHovering(false)}
        animate={exitDirection ? getExitAnimation() : undefined}
        whileHover={!isMobile && !prefersReducedMotion ? { scale: 1.01 } : undefined}
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
            <BlurPlaceholderImage 
              src={displayPhoto} 
              alt=""
              className="w-full h-full"
              enableBlurUp={true}
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
            {/* KIKI Now HOT badge with flame animation */}
            {isBoosted && (
              <div className="relative flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 shadow-lg shadow-orange-500/40 animate-hot-badge">
                <Flame className="w-4 h-4 text-white fill-white animate-flame" />
                <span className="text-xs font-extrabold text-white uppercase tracking-wider">HOT</span>
                <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300 animate-pulse" />
              </div>
            )}

            {/* Visibility boost badge */}
            {hasVisibilityBoost && !isBoosted && (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wide">Boost</span>
              </div>
            )}

            {/* Activity status with tooltip */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full backdrop-blur-md cursor-help",
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
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[240px] p-3">
                  {canSeeRealtimePresence ? (
                    <div className="space-y-1.5">
                      <p className="font-medium text-sm flex items-center gap-1.5">
                        {activityStatus.isActive ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Conectado ahora
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-muted-foreground/60" />
                            Última conexión
                          </>
                        )}
                      </p>
                      {presence.last_pulse && (
                        <p className="text-xs text-muted-foreground">
                          {activityStatus.isActive 
                            ? "Está navegando en KIKI ahora mismo"
                            : `${activityStatus.label}`
                          }
                        </p>
                      )}
                      <p className="text-xs text-primary/80 mt-1">
                        ✨ Ventaja Premium activa
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="font-medium text-sm">Estado de actividad</p>
                      <p className="text-xs text-muted-foreground">
                        Suscríbete a Plus o Premium para ver la actividad en tiempo real
                      </p>
                      <p className="text-xs text-primary/80 mt-1 flex items-center gap-1">
                        👑 Desbloquea con Plus
                      </p>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full cursor-help transition-all relative overflow-hidden",
                    compatibility >= 5
                      ? "bg-gradient-to-r from-primary to-accent animate-perfect-glow"
                      : compatibility >= 4 
                        ? "bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer-badge shadow-lg shadow-primary/30" 
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
                <TooltipContent side="bottom" className="max-w-[280px] p-3">
                  {compatibilityBreakdown ? (
                    <div className="space-y-2.5">
                      {/* Header */}
                      {compatibility >= 5 ? (
                        <p className="text-primary font-bold text-sm">💫 ¡Compatibilidad perfecta!</p>
                      ) : compatibility >= 4 ? (
                        <p className="text-primary font-bold text-sm">✨ ¡Alta compatibilidad!</p>
                      ) : (
                        <p className="font-medium text-sm">Desglose de compatibilidad</p>
                      )}
                      
                      {/* Tribes breakdown */}
                      {compatibilityBreakdown.tribes > 0 && (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium flex items-center gap-1">
                            🏴 Tribus en común ({compatibilityBreakdown.tribes})
                          </p>
                          {compatibilityBreakdown.sharedTribes && compatibilityBreakdown.sharedTribes.length > 0 && (
                            <p className="text-xs text-muted-foreground pl-4">
                              {compatibilityBreakdown.sharedTribes.join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Music breakdown */}
                      {compatibilityBreakdown.music > 0 && (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium flex items-center gap-1">
                            🎵 Estilos musicales ({compatibilityBreakdown.music})
                          </p>
                          {compatibilityBreakdown.sharedMusic && compatibilityBreakdown.sharedMusic.length > 0 && (
                            <p className="text-xs text-muted-foreground pl-4">
                              {compatibilityBreakdown.sharedMusic.slice(0, 4).join(", ")}
                              {compatibilityBreakdown.sharedMusic.length > 4 && ` +${compatibilityBreakdown.sharedMusic.length - 4}`}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Looking for breakdown */}
                      {compatibilityBreakdown.lookingFor > 0 && (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium flex items-center gap-1">
                            🔍 Buscan lo mismo ({compatibilityBreakdown.lookingFor})
                          </p>
                          {compatibilityBreakdown.sharedLookingFor && compatibilityBreakdown.sharedLookingFor.length > 0 && (
                            <p className="text-xs text-muted-foreground pl-4">
                              {compatibilityBreakdown.sharedLookingFor.join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Interests breakdown */}
                      {compatibilityBreakdown.interests > 0 && (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium flex items-center gap-1">
                            ⭐ Intereses culturales ({compatibilityBreakdown.interests})
                          </p>
                          {compatibilityBreakdown.sharedInterests && compatibilityBreakdown.sharedInterests.length > 0 && (
                            <p className="text-xs text-muted-foreground pl-4">
                              {compatibilityBreakdown.sharedInterests.slice(0, 4).join(", ")}
                              {compatibilityBreakdown.sharedInterests.length > 4 && ` +${compatibilityBreakdown.sharedInterests.length - 4}`}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Empty state */}
                      {compatibilityBreakdown.tribes === 0 && 
                       compatibilityBreakdown.music === 0 && 
                       compatibilityBreakdown.lookingFor === 0 && 
                       compatibilityBreakdown.interests === 0 && (
                        <p className="text-xs text-muted-foreground">Sin coincidencias aún</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs">{compatibility} coincidencias</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Visited indicator - subtle, non-invasive */}
            {isVisited && (
              <VisitedIndicator 
                className="bg-black/40 backdrop-blur-md text-white/70" 
                showTooltip={true} 
              />
            )}
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

          {/* Ghost message button - floating */}
          <button
            onClick={handleOpenDialog}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-primary/90 hover:bg-primary backdrop-blur-md shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Ghost className="w-6 h-6 text-primary-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Ghost message dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-lg text-card-foreground flex items-center gap-2">
              {messageSent 
                ? sparkCreated 
                  ? "🔥 ¡Chispa mutua!" 
                  : "✓ Mensaje enviado"
                : (
                  <>
                    <Ghost className="w-5 h-5" />
                    Mensaje fantasma
                  </>
                )}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {messageSent 
                ? sparkCreated
                  ? "¡Hay conexión! Ya pueden chatear."
                  : "Tu identidad permanecerá oculta hasta que haya interés mutuo."
                : "Envía un mensaje anónimo. Si hay interés mutuo, ¡habrá chispa!"}
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

      {/* Profile view confirmation modal */}
      <Dialog open={showProfileConfirmModal} onOpenChange={setShowProfileConfirmModal}>
        <DialogContent className="max-w-xs overflow-hidden">
          <AnimatePresence>
            {showProfileConfirmModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 350, 
                  damping: 25 
                }}
              >
                <DialogHeader>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <User className="w-5 h-5 text-primary" />
                    <DialogTitle>Ver perfil</DialogTitle>
                  </motion.div>
                  <DialogDescription>
                    ¿Quieres ver el perfil completo de {presence.profile?.name || "esta persona"}?
                  </DialogDescription>
                </DialogHeader>
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <DialogFooter className="flex flex-row gap-2 sm:flex-row pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => setShowProfileConfirmModal(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={confirmViewProfile}
                      className="flex-1"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Ver perfil
                    </Button>
                  </DialogFooter>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
});

FullScreenPresenceCard.displayName = "FullScreenPresenceCard";

export default FullScreenPresenceCard;
