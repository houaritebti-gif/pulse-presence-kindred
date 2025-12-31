import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  Crown, 
  ExternalLink, 
  Ghost, 
  Gift, 
  Infinity, 
  Loader2, 
  MessageCircle, 
  Sparkles, 
  Star, 
  Zap 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  color: string;
  borderColor: string;
  bgGradient: string;
  iconBg: string;
}> = {
  free: {
    name: "Gratis",
    price: "€0",
    description: "Perfecto para empezar a explorar",
    icon: <Star className="w-7 h-7" />,
    ghostLimit: "5",
    features: [
      { text: "5 mensajes fantasma al día", icon: <Ghost className="w-4 h-4" /> },
      { text: "Ver perfiles en Presencia" },
      { text: "Unirse a quedadas públicas" },
      { text: "Chat en quedadas" },
    ],
    color: "text-muted-foreground",
    borderColor: "border-border",
    bgGradient: "from-card to-card",
    iconBg: "bg-muted",
  },
  plus: {
    name: "Plus",
    price: "€4.99",
    priceSubtext: "/mes",
    description: "Para quienes quieren más conexiones",
    icon: <Zap className="w-7 h-7" />,
    ghostLimit: "15",
    features: [
      { text: "15 mensajes fantasma al día", icon: <Ghost className="w-4 h-4" />, highlight: true },
      { text: "Chatbot IA personalizado", icon: <Sparkles className="w-4 h-4" />, highlight: true },
      { text: "Ver perfiles en Presencia" },
      { text: "Unirse a quedadas públicas" },
      { text: "Chat en quedadas" },
      { text: "Soporte prioritario" },
    ],
    color: "text-primary",
    borderColor: "border-primary/50",
    bgGradient: "from-primary/10 via-primary/5 to-transparent",
    iconBg: "bg-primary/20",
  },
  premium: {
    name: "Premium",
    price: "€9.99",
    priceSubtext: "/mes",
    description: "La experiencia KIKI completa",
    icon: <Crown className="w-7 h-7" />,
    ghostLimit: "∞",
    features: [
      { text: "Mensajes fantasma ilimitados", icon: <Infinity className="w-4 h-4" />, highlight: true },
      { text: "Mensajes premium con ✨", icon: <Sparkles className="w-4 h-4" />, highlight: true },
      { text: "Segunda oportunidad de mensaje", icon: <MessageCircle className="w-4 h-4" />, highlight: true },
      { text: "Chatbot IA personalizado" },
      { text: "Crear quedadas ilimitadas" },
      { text: "Eliminar tus quedadas" },
      { text: "Badge dorado exclusivo" },
      { text: "Acceso anticipado a novedades" },
    ],
    color: "text-amber-500",
    borderColor: "border-amber-500/50",
    bgGradient: "from-amber-500/15 via-amber-500/5 to-transparent",
    iconBg: "bg-amber-500/20",
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

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast({
        title: "¡Pago completado!",
        description: "Tu suscripción se ha activado correctamente",
      });
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
  }, [searchParams, toast, checkStripeSubscription, refetch]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

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

  const currentTierConfig = tierConfig[tier];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-4 p-4 max-w-2xl mx-auto">
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

      <div className="p-4 pb-32 max-w-2xl mx-auto space-y-8">
        {/* Trial Banner */}
        {isOnTrial && (
          <Card className="p-5 border-2 border-primary bg-gradient-to-br from-primary/20 via-primary/10 to-transparent animate-pulse-soft">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/30 flex items-center justify-center shrink-0">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg text-foreground">Prueba activa</h3>
                <p className="text-sm text-muted-foreground">
                  Disfruta <span className="font-bold text-primary">{trialDaysRemaining} días</span> gratis del plan Plus
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Ghost Messages Comparison */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Mensajes Fantasma por Plan
            </h2>
            <p className="text-muted-foreground text-sm">
              Envía mensajes anónimos y crea conexiones auténticas
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
                    "relative rounded-2xl p-4 text-center transition-all duration-300",
                    "border-2",
                    isCurrentTier ? config.borderColor : "border-border/50",
                    isCurrentTier && "ring-2 ring-offset-2 ring-offset-background",
                    t === "premium" && isCurrentTier && "ring-amber-500/50",
                    t === "plus" && isCurrentTier && "ring-primary/50",
                    t === "free" && isCurrentTier && "ring-muted-foreground/30"
                  )}
                >
                  {isCurrentTier && (
                    <Badge 
                      className={cn(
                        "absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] px-2",
                        t === "premium" && "bg-amber-500 hover:bg-amber-500",
                        t === "plus" && "bg-primary hover:bg-primary",
                        t === "free" && "bg-muted-foreground hover:bg-muted-foreground"
                      )}
                    >
                      Tu plan
                    </Badge>
                  )}
                  
                  <div className={cn(
                    "w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center",
                    config.iconBg
                  )}>
                    <Ghost className={cn("w-5 h-5", config.color)} />
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-1">{config.name}</p>
                  <p className={cn(
                    "font-display text-3xl font-bold",
                    config.color
                  )}>
                    {config.ghostLimit}
                  </p>
                  <p className="text-xs text-muted-foreground">/día</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Premium Features Highlight */}
        <Card className="overflow-hidden border-2 border-amber-500/30">
          <div className="bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Funciones Premium Exclusivas
                </h3>
                <p className="text-sm text-muted-foreground">
                  Destaca y conecta de manera especial
                </p>
              </div>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-background/60 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-lg">✨</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Mensaje Premium</h4>
                  <p className="text-xs text-muted-foreground">
                    Marca tu mensaje con ✨ para que destaque y la persona sepa que invertiste en conectar
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-xl bg-background/60 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageCircle className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Segunda Oportunidad</h4>
                  <p className="text-xs text-muted-foreground">
                    ¿No te respondieron? Envía un segundo mensaje después de unos días
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Free Trial CTA */}
        {canStartTrial && (
          <Card className="p-6 border-2 border-dashed border-primary/50 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
            <div className="text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-float">
                <Gift className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                ¡7 días gratis de Plus!
              </h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                Prueba 15 mensajes fantasma al día y el chatbot IA sin compromiso
              </p>
              <Button 
                onClick={() => startTrial()}
                disabled={isStartingTrial}
                size="lg"
                className="w-full max-w-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
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
              <p className="text-xs text-muted-foreground mt-3">
                Sin tarjeta · Se cancela sola
              </p>
            </div>
          </Card>
        )}

        {/* Trial Used Notice */}
        {trialUsed && isFree && (
          <Card className="p-4 bg-muted/30 border-muted">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                Ya usaste tu prueba gratuita. ¡Suscríbete para seguir disfrutando!
              </p>
            </div>
          </Card>
        )}

        {/* Plan Cards */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground text-center">
            {isPremium ? "Tu plan actual" : "Elige tu plan"}
          </h2>

          <div className="space-y-4">
            {(["free", "plus", "premium"] as SubscriptionTier[]).map((t) => {
              const config = tierConfig[t];
              const isCurrentTier = tier === t;
              const canUpgrade = (t === "plus" && isFree) || (t === "premium" && !isPremium);
              
              return (
                <Card
                  key={t}
                  className={cn(
                    "relative overflow-hidden transition-all duration-300",
                    "border-2",
                    isCurrentTier ? config.borderColor : "border-border/50 hover:border-border",
                    isCurrentTier && t === "premium" && "shadow-lg shadow-amber-500/10",
                    isCurrentTier && t === "plus" && "shadow-lg shadow-primary/10"
                  )}
                >
                  {/* Background gradient */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-60",
                    config.bgGradient
                  )} />
                  
                  <div className="relative p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          config.iconBg
                        )}>
                          <span className={config.color}>{config.icon}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-lg font-bold text-foreground">
                              {config.name}
                            </h3>
                            {isCurrentTier && (
                              <Badge 
                                variant="secondary"
                                className={cn(
                                  "text-[10px]",
                                  t === "premium" && "bg-amber-500/20 text-amber-600 dark:text-amber-400",
                                  t === "plus" && "bg-primary/20 text-primary",
                                  isOnTrial && t === "plus" && "bg-primary text-primary-foreground"
                                )}
                              >
                                {isOnTrial && t === "plus" ? "Prueba" : "Activo"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {config.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl font-bold text-foreground">
                          {config.price}
                        </p>
                        {config.priceSubtext && (
                          <p className="text-xs text-muted-foreground">{config.priceSubtext}</p>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-4">
                      {config.features.map((feature, index) => (
                        <li 
                          key={index} 
                          className={cn(
                            "flex items-center gap-2 text-sm",
                            feature.highlight ? "text-foreground font-medium" : "text-muted-foreground"
                          )}
                        >
                          {feature.icon ? (
                            <span className={cn(
                              feature.highlight ? config.color : "text-muted-foreground"
                            )}>
                              {feature.icon}
                            </span>
                          ) : (
                            <Check className={cn("w-4 h-4 shrink-0", config.color)} />
                          )}
                          {feature.text}
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    {canUpgrade && (
                      <Button
                        onClick={() => handleUpgrade(t as 'plus' | 'premium')}
                        disabled={isCreatingCheckout}
                        className={cn(
                          "w-full font-semibold",
                          t === "premium" && "bg-amber-500 hover:bg-amber-600 text-amber-950 dark:text-amber-50",
                          t === "plus" && "bg-primary hover:bg-primary/90"
                        )}
                      >
                        {isCreatingCheckout ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            {t === "premium" ? <Crown className="w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                            {isOnTrial && t === "plus" ? "Mantener Plus" : `Pasar a ${config.name}`}
                          </>
                        )}
                      </Button>
                    )}

                    {/* Current Plan Info */}
                    {isCurrentTier && subscription?.expires_at && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {isOnTrial ? "Prueba termina" : "Próxima renovación"}
                          </span>
                          <span className="text-foreground font-medium">
                            {formatDate(subscription.expires_at)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Manage Subscription */}
        {subscription?.stripe_subscription_id && (
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full"
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
          <p className="text-xs text-muted-foreground">
            🔒 Pagos seguros con Stripe · Cancela cuando quieras
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
