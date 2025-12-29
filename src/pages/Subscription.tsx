import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Clock, Crown, ExternalLink, Gift, Loader2, Sparkles, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const tierConfig: Record<SubscriptionTier, {
  name: string;
  price: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  gradient: string;
}> = {
  free: {
    name: "Gratis",
    price: "€0",
    description: "Perfecto para empezar",
    icon: <Star className="w-6 h-6" />,
    features: [
      "Ver perfiles en Presencia",
      "Enviar mensajes fantasma",
      "Unirse a quedadas",
      "Chat en quedadas",
    ],
    color: "text-muted-foreground",
    gradient: "from-muted/50 to-muted/30",
  },
  plus: {
    name: "Plus",
    price: "€4.99",
    description: "Para usuarios activos",
    icon: <Zap className="w-6 h-6" />,
    features: [
      "Todo lo del plan Gratis",
      "Acceso al chatbot IA",
      "Sugerencias personalizadas",
      "Soporte prioritario",
    ],
    color: "text-primary",
    gradient: "from-primary/20 to-primary/5",
  },
  premium: {
    name: "Premium",
    price: "€9.99",
    description: "La experiencia completa",
    icon: <Crown className="w-6 h-6" />,
    features: [
      "Todo lo del plan Plus",
      "Crear quedadas ilimitadas",
      "Eliminar quedadas propias",
      "Badge exclusivo de Premium",
      "Acceso anticipado a novedades",
    ],
    color: "text-amber-500",
    gradient: "from-amber-500/20 to-amber-500/5",
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

  // Handle success/cancel from Stripe checkout
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
      // Clean URL
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
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentTierConfig = tierConfig[tier];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-4 p-4">
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
              Mi Suscripción
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tu plan y beneficios
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 pb-24 space-y-6">
        {/* Trial Banner */}
        {isOnTrial && (
          <Card className="p-4 border-primary bg-gradient-to-r from-primary/20 to-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Periodo de prueba activo</h3>
                <p className="text-sm text-muted-foreground">
                  Te quedan <span className="font-bold text-primary">{trialDaysRemaining} días</span> de prueba gratuita
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Current Plan Card */}
        <Card className={cn(
          "p-6 border-2 bg-gradient-to-br",
          currentTierConfig.gradient,
          tier === "premium" ? "border-amber-500/50" : tier === "plus" ? "border-primary/50" : "border-border"
        )}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                tier === "premium" ? "bg-amber-500/20" : tier === "plus" ? "bg-primary/20" : "bg-muted"
              )}>
                <span className={currentTierConfig.color}>
                  {currentTierConfig.icon}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Plan {currentTierConfig.name}
                  </h2>
                  <Badge variant={tier === "premium" ? "default" : "secondary"} className={cn(
                    tier === "premium" && "bg-amber-500 hover:bg-amber-600",
                    isOnTrial && "bg-primary hover:bg-primary/90"
                  )}>
                    {isOnTrial ? "Prueba" : "Activo"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentTierConfig.description}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Precio</span>
              <span className="font-semibold text-foreground">
                {isOnTrial ? "Gratis (prueba)" : `${currentTierConfig.price}/mes`}
              </span>
            </div>
            {subscription?.started_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {isOnTrial ? "Prueba iniciada" : "Miembro desde"}
                </span>
                <span className="text-foreground">
                  {formatDate(isOnTrial ? subscription.trial_started_at : subscription.started_at)}
                </span>
              </div>
            )}
            {subscription?.expires_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {isOnTrial ? "Prueba termina" : "Próxima renovación"}
                </span>
                <span className="text-foreground">
                  {formatDate(subscription.expires_at)}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Tus beneficios incluyen:
            </h3>
            <ul className="space-y-2">
              {currentTierConfig.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className={cn("w-4 h-4 shrink-0", currentTierConfig.color)} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Free Trial CTA for Free Users */}
        {canStartTrial && (
          <Card className="p-6 border-2 border-dashed border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                ¡Prueba gratis 7 días!
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Accede al chatbot IA y todas las funciones del plan Plus sin compromiso
              </p>
              <Button 
                onClick={() => startTrial()}
                disabled={isStartingTrial}
                className="w-full"
              >
                {isStartingTrial ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Empezar prueba gratuita
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Sin tarjeta de crédito · Se cancela automáticamente
              </p>
            </div>
          </Card>
        )}

        {/* Trial Used Notice */}
        {trialUsed && isFree && (
          <Card className="p-4 border-muted bg-muted/30">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Ya has usado tu periodo de prueba gratuito
              </p>
            </div>
          </Card>
        )}

        {/* Upgrade Options */}
        {!isPremium && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {isOnTrial ? "Continúa con un plan" : "Mejora tu experiencia"}
            </h2>

            {(isFree || isOnTrial) && (
              <Card 
                className={cn(
                  "p-4 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 transition-colors",
                  !isCreatingCheckout && "cursor-pointer hover:border-primary/50"
                )}
                onClick={() => !isCreatingCheckout && handleUpgrade("plus")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      {isCreatingCheckout ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <Zap className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Plan Plus</h3>
                      <p className="text-sm text-muted-foreground">
                        Acceso al chatbot IA
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground">€4.99</span>
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </div>
                </div>
              </Card>
            )}

            <Card 
              className={cn(
                "p-4 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5 transition-colors",
                !isCreatingCheckout && "cursor-pointer hover:border-amber-500/50"
              )}
              onClick={() => !isCreatingCheckout && handleUpgrade("premium")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    {isCreatingCheckout ? (
                      <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                    ) : (
                      <Crown className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Plan Premium</h3>
                    <p className="text-sm text-muted-foreground">
                      {isPlus || isOnTrial ? "Crea quedadas ilimitadas" : "Chatbot IA + Crear quedadas"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground">€9.99</span>
                  <span className="text-sm text-muted-foreground">/mes</span>
                </div>
              </div>
            </Card>

            <p className="text-xs text-center text-muted-foreground">
              Los pagos se procesarán de forma segura con Stripe
            </p>
          </div>
        )}

        {/* Premium Badge */}
        {isPremium && (
          <Card className="p-6 text-center border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
            <Crown className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold text-foreground mb-1">
              ¡Eres Premium!
            </h3>
            <p className="text-sm text-muted-foreground">
              Tienes acceso a todas las funcionalidades de KIKI
            </p>
          </Card>
        )}

        {/* Manage Subscription */}
        {subscription?.stripe_subscription_id && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Gestionar suscripción
            </h2>
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
              Gestionar en Stripe
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Actualiza tu método de pago, cambia de plan o cancela tu suscripción
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
