import { useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  Crown, 
  ExternalLink,
  EyeOff,
  Ghost, 
  Gift, 
  Infinity, 
  Loader2, 
  MessageCircle, 
  Radio,
  Sparkles, 
  Star, 
  Zap 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface TierFeature {
  text: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}

const tierConfig: Record<SubscriptionTier, {
  name: string;
  price: string;
  priceSubtext?: string;
  description: string;
  icon: React.ReactNode;
  features: TierFeature[];
  ghostLimit: string;
  accentClass: string;
  bgClass: string;
  iconBgClass: string;
  buttonClass: string;
}> = {
  free: {
    name: "Gratis",
    price: "€0",
    description: "Perfecto para empezar",
    icon: <Star className="w-6 h-6" />,
    ghostLimit: "5",
    features: [
      { text: "5 mensajes fantasma al día", icon: <Ghost className="w-4 h-4" /> },
      { text: "Ver perfiles en Presencia" },
      { text: "Unirse a quedadas públicas" },
      { text: "Chat en quedadas" },
    ],
    accentClass: "text-muted-foreground",
    bgClass: "bg-muted/50",
    iconBgClass: "bg-muted",
    buttonClass: "bg-muted text-muted-foreground hover:bg-muted/80",
  },
  plus: {
    name: "Plus",
    price: "€4.99",
    priceSubtext: "/mes",
    description: "Para conectar más",
    icon: <Zap className="w-6 h-6" />,
    ghostLimit: "15",
    features: [
      { text: "15 mensajes fantasma al día", icon: <Ghost className="w-4 h-4" />, highlight: true },
      { text: "Presencia en tiempo real", icon: <Radio className="w-4 h-4" />, highlight: true },
      { text: "Chatbot IA personalizado", icon: <Sparkles className="w-4 h-4" />, highlight: true },
      { text: "Ver perfiles en Presencia" },
      { text: "Unirse a quedadas públicas" },
      { text: "Chat en quedadas" },
      { text: "Soporte prioritario" },
    ],
    accentClass: "text-primary",
    bgClass: "bg-primary/10",
    iconBgClass: "bg-primary/20",
    buttonClass: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  premium: {
    name: "Premium",
    price: "€9.99",
    priceSubtext: "/mes",
    description: "La experiencia completa",
    icon: <Crown className="w-6 h-6" />,
    ghostLimit: "∞",
    features: [
      { text: "Mensajes fantasma ilimitados", icon: <Infinity className="w-4 h-4" />, highlight: true },
      { text: "Modo Invisible: ver sin ser visto", icon: <EyeOff className="w-4 h-4" />, highlight: true },
      { text: "Presencia en tiempo real", icon: <Radio className="w-4 h-4" />, highlight: true },
      { text: "Mensajes premium con ✨", icon: <Sparkles className="w-4 h-4" />, highlight: true },
      { text: "Segunda oportunidad de mensaje", icon: <MessageCircle className="w-4 h-4" />, highlight: true },
      { text: "Chatbot IA personalizado" },
      { text: "Crear quedadas ilimitadas" },
      { text: "Eliminar tus quedadas" },
      { text: "Badge dorado exclusivo" },
      { text: "Acceso anticipado a novedades" },
    ],
    accentClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    iconBgClass: "bg-amber-500/20",
    buttonClass: "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700",
  },
};

const Subscription = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { 
    tier, 
    subscription, 
    isLoading, 
    isFree, 
    isPlus, 
    isPremium,
    isOnTrial,
    trialDaysRemaining,
    canStartTrial,
    startTrial,
    isStartingTrial,
    trialUsed,
    createCheckout,
    isCreatingCheckout,
    openPortal,
    isOpeningPortal,
    checkStripeSubscription,
    refetch,
  } = useSubscription();

  // Celebration confetti animation
  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#ff69b4', '#ff1493', '#ffd700', '#ff6b6b', '#4ecdc4'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#ff69b4', '#ff1493', '#ffd700', '#ff6b6b', '#4ecdc4'],
      });
    }, 250);
  }, []);

  // Handle success/cancel from Stripe checkout
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast({
        title: "¡Pago completado!",
        description: "Tu suscripción se ha activado correctamente",
      });
      triggerConfetti();
      checkStripeSubscription();
      refetch();
      window.history.replaceState({}, '', '/subscription');
    } else if (canceled === 'true') {
      toast({
        title: "Pago cancelado",
        description: "No se ha realizado ningún cargo",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/subscription');
    }
  }, [searchParams, toast, checkStripeSubscription, refetch, triggerConfetti]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Handle trial start with confetti
  const handleStartTrial = () => {
    startTrial();
  };

  // Watch for successful trial activation
  useEffect(() => {
    if (isOnTrial && !isLoading) {
      const justActivated = sessionStorage.getItem('trial_just_activated');
      if (justActivated === 'pending') {
        sessionStorage.setItem('trial_just_activated', 'done');
        triggerConfetti();
      }
    }
  }, [isOnTrial, isLoading, triggerConfetti]);

  const handleUpgrade = (targetTier: 'plus' | 'premium') => {
    createCheckout(targetTier);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-4 p-4 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Planes KIKI
            </h1>
            <p className="text-sm text-muted-foreground">
              Elige cómo quieres conectar
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 pb-32 max-w-lg mx-auto space-y-6">
        
        {/* Trial Banner */}
        {isOnTrial && (
          <div className="bg-primary rounded-2xl p-5 text-primary-foreground">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Clock className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg">Prueba activa</h3>
                <p className="text-sm text-primary-foreground/80">
                  Disfruta <span className="font-bold">{trialDaysRemaining} días</span> gratis del plan Plus
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ghost Messages Visual Comparison */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="font-display text-xl font-bold text-foreground mb-1">
              👻 Mensajes Fantasma
            </h2>
            <p className="text-muted-foreground text-sm">
              Envía mensajes anónimos cada día
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(["free", "plus", "premium"] as SubscriptionTier[]).map((t) => {
              const config = tierConfig[t];
              const isCurrentTier = tier === t;
              
              return (
                <div
                  key={t}
                  className={cn(
                    "relative rounded-2xl p-4 text-center transition-all",
                    isCurrentTier 
                      ? "bg-card border-2 border-primary ring-2 ring-primary/20" 
                      : "bg-card border border-border"
                  )}
                >
                  {isCurrentTier && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2">
                      Tu plan
                    </Badge>
                  )}
                  
                  <Ghost className={cn("w-8 h-8 mx-auto mb-2", config.accentClass)} />
                  <p className="text-xs text-card-foreground/70 mb-1 font-medium">{config.name}</p>
                  <p className={cn("font-display text-3xl font-bold text-card-foreground")}>
                    {config.ghostLimit}
                  </p>
                  <p className="text-xs text-card-foreground/60">/día</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Realtime Presence Feature Highlight - Plus/Premium */}
        <div className="bg-card rounded-2xl overflow-hidden border border-green-500/30">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/10 px-5 py-4 border-b border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center">
                <Radio className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-card-foreground">
                  Presencia en Tiempo Real
                </h3>
                <p className="text-xs text-card-foreground/70">
                  Disponible en Plus y Premium
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-5 space-y-3">
            {/* Active Now Indicator */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0 relative">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-card-foreground">¿Quién está activo ahora?</h4>
                  <Badge className="bg-green-500 text-green-950 text-[9px] px-1.5 py-0 hover:bg-green-500">
                    Plus+
                  </Badge>
                </div>
                <p className="text-sm text-card-foreground/80 leading-relaxed">
                  Ve en tiempo real quién está conectado. Los perfiles activos se muestran con un indicador verde pulsante y separados de los inactivos.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card-foreground/5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div>
                  <h4 className="font-medium text-sm text-card-foreground">Activo ahora</h4>
                  <p className="text-xs text-card-foreground/70">Indicador verde en tiempo real</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card-foreground/5">
                <div className="w-5 h-0.5 bg-border" />
                <div>
                  <h4 className="font-medium text-sm text-card-foreground">Separación visual</h4>
                  <p className="text-xs text-card-foreground/70">Activos arriba, inactivos abajo</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Features Highlight */}
        <div className="bg-card rounded-2xl overflow-hidden border border-amber-500/30">
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 px-5 py-4 border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-card-foreground">
                  Solo en Premium
                </h3>
                <p className="text-xs text-card-foreground/70">
                  Ventajas exclusivas para ti
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-5 space-y-3">
            {/* Modo Invisible - Destacado */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <EyeOff className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-card-foreground">Modo Invisible</h4>
                  <Badge className="bg-amber-500 text-amber-950 text-[9px] px-1.5 py-0 hover:bg-amber-500">
                    EXCLUSIVO
                  </Badge>
                </div>
                <p className="text-sm text-card-foreground/80 leading-relaxed">
                  Navega por Presencia sin que nadie sepa que estás conectado. <strong>La privacidad se paga.</strong>
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card-foreground/5">
                <span className="text-xl">✨</span>
                <div>
                  <h4 className="font-medium text-sm text-card-foreground">Mensaje Premium</h4>
                  <p className="text-xs text-card-foreground/70">Destaca entre los demás</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card-foreground/5">
                <MessageCircle className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="font-medium text-sm text-card-foreground">2ª Oportunidad</h4>
                  <p className="text-xs text-card-foreground/70">Reenvía si no responden</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-card-foreground/5">
                <Infinity className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="font-medium text-sm text-card-foreground">Sin límites</h4>
                  <p className="text-xs text-card-foreground/70">Mensajes ilimitados</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-card-foreground/5">
                <Crown className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="font-medium text-sm text-card-foreground">Badge Dorado</h4>
                  <p className="text-xs text-card-foreground/70">Muestra tu estatus</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Free Trial CTA */}
        {canStartTrial && (
          <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 text-center text-primary-foreground">
            <Gift className="w-14 h-14 mx-auto mb-4 opacity-90" />
            <h3 className="font-display text-xl font-bold mb-2">
              ¡7 días gratis de Plus!
            </h3>
            <p className="text-sm text-primary-foreground/90 mb-5">
              Prueba 15 mensajes al día y chatbot IA sin compromiso
            </p>
            <Button 
              onClick={() => {
                sessionStorage.setItem('trial_just_activated', 'pending');
                handleStartTrial();
              }}
              disabled={isStartingTrial}
              size="lg"
              className="w-full max-w-xs bg-white text-primary hover:bg-white/90 font-bold"
            >
              {isStartingTrial ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Empezar prueba gratuita
                </>
              )}
            </Button>
            <p className="text-xs text-primary-foreground/70 mt-3">
              Sin tarjeta · Se cancela sola
            </p>
          </div>
        )}

        {/* Trial Used Notice */}
        {trialUsed && isFree && (
          <div className="bg-muted rounded-xl p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-foreground">
              Ya usaste tu prueba gratuita. ¡Suscríbete para seguir disfrutando!
            </p>
          </div>
        )}

        {/* Plan Cards */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground text-center">
            {isPremium ? "Tu plan actual" : "Elige tu plan"}
          </h2>

          <div className="space-y-4">
            {(["free", "plus", "premium"] as SubscriptionTier[]).map((t) => {
              const config = tierConfig[t];
              const isCurrentTier = tier === t;
              const canUpgrade = (t === "plus" && isFree) || (t === "premium" && !isPremium);
              
              return (
                <div
                  key={t}
                  className={cn(
                    "relative rounded-2xl overflow-hidden transition-all",
                    "bg-card border-2",
                    isCurrentTier 
                      ? t === "premium" 
                        ? "border-amber-500 ring-2 ring-amber-500/20" 
                        : t === "plus"
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border"
                      : "border-border/50"
                  )}
                >
                  {/* Plan Header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          config.iconBgClass
                        )}>
                          <span className={config.accentClass}>{config.icon}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-lg font-bold text-card-foreground">
                              {config.name}
                            </h3>
                            {isCurrentTier && (
                              <Badge 
                                className={cn(
                                  "text-[10px]",
                                  t === "premium" && "bg-amber-500 hover:bg-amber-500 text-amber-950",
                                  t === "plus" && "bg-primary hover:bg-primary text-primary-foreground",
                                  t === "free" && "bg-muted-foreground hover:bg-muted-foreground text-white",
                                  isOnTrial && t === "plus" && "bg-primary text-primary-foreground"
                                )}
                              >
                                {isOnTrial && t === "plus" ? "Prueba" : "Activo"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-card-foreground/70">
                            {config.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl font-bold text-card-foreground">
                          {config.price}
                        </p>
                        {config.priceSubtext && (
                          <p className="text-xs text-card-foreground/60">{config.priceSubtext}</p>
                        )}
                      </div>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-2 mb-4">
                      {config.features.slice(0, 4).map((feature, index) => (
                        <li 
                          key={index} 
                          className="flex items-center gap-2 text-sm text-card-foreground"
                        >
                          <Check className={cn("w-4 h-4 shrink-0", config.accentClass)} />
                          <span className={feature.highlight ? "font-medium" : "opacity-80"}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                      {config.features.length > 4 && (
                        <li className="text-xs text-card-foreground/60 pl-6">
                          +{config.features.length - 4} beneficios más
                        </li>
                      )}
                    </ul>

                    {/* Action Button */}
                    {canUpgrade && (
                      <Button
                        onClick={() => handleUpgrade(t as 'plus' | 'premium')}
                        disabled={isCreatingCheckout}
                        className={cn("w-full font-bold text-base py-5", config.buttonClass)}
                      >
                        {isCreatingCheckout ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            {t === "premium" ? <Crown className="w-5 h-5 mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
                            {isOnTrial && t === "plus" ? "Mantener Plus" : `Pasar a ${config.name}`}
                          </>
                        )}
                      </Button>
                    )}

                    {/* Current Plan Info */}
                    {isCurrentTier && subscription?.expires_at && (
                      <div className="mt-4 pt-4 border-t border-card-foreground/10">
                        <div className="flex justify-between text-sm">
                          <span className="text-card-foreground/70">
                            {isOnTrial ? "Prueba termina" : "Próxima renovación"}
                          </span>
                          <span className="text-card-foreground font-medium">
                            {formatDate(subscription.expires_at)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manage Subscription */}
        {subscription?.stripe_subscription_id && (
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full border-border text-foreground hover:bg-muted"
              onClick={() => openPortal()}
              disabled={isOpeningPortal}
            >
              {isOpeningPortal ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Gestionar suscripción
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Actualiza tu método de pago, cambia de plan o cancela
            </p>
          </div>
        )}

        {/* Security Note */}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            🔒 Pagos seguros con Stripe
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Cancela cuando quieras, sin compromisos
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
