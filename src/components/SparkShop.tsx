import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  Sparkles, 
  Eye, 
  Zap, 
  RotateCcw, 
  SlidersHorizontal, 
  Palette, 
  Award,
  X,
  Check,
  Loader2,
  Gift,
  Clock,
  Package,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SparkFlame } from "@/components/SparkFlame";
import { useSparkEnergy, ShopItemKey, SHOP_ITEMS } from "@/hooks/useSparkEnergy";
import { usePurchasedItems } from "@/hooks/usePurchasedItems";
import { triggerHaptic } from "@/utils/haptics";

// Item icons mapping with gradient colors
const ITEM_CONFIG: Record<ShopItemKey, { 
  icon: React.ReactNode; 
  gradient: string;
  category: "messages" | "discovery" | "profile" | "super";
}> = {
  ghost_message_1: { 
    icon: <MessageCircle className="w-5 h-5" />, 
    gradient: "from-pink-500 to-rose-500",
    category: "messages"
  },
  ghost_message_3: { 
    icon: <Package className="w-5 h-5" />, 
    gradient: "from-pink-500 to-fuchsia-500",
    category: "messages"
  },
  super_spark: { 
    icon: <Flame className="w-5 h-5" />, 
    gradient: "from-blue-500 via-purple-500 to-pink-500",
    category: "super"
  },
  super_spark_3: { 
    icon: <Flame className="w-5 h-5" />, 
    gradient: "from-purple-500 via-pink-500 to-orange-500",
    category: "super"
  },
  highlighted_message: { 
    icon: <Sparkles className="w-5 h-5" />, 
    gradient: "from-amber-400 to-orange-500",
    category: "messages"
  },
  reveal_spark: { 
    icon: <Eye className="w-5 h-5" />, 
    gradient: "from-violet-500 to-purple-500",
    category: "discovery"
  },
  visibility_boost: { 
    icon: <Zap className="w-5 h-5" />, 
    gradient: "from-yellow-400 to-amber-500",
    category: "discovery"
  },
  second_chance: { 
    icon: <RotateCcw className="w-5 h-5" />, 
    gradient: "from-cyan-400 to-blue-500",
    category: "discovery"
  },
  extra_filter: { 
    icon: <SlidersHorizontal className="w-5 h-5" />, 
    gradient: "from-emerald-400 to-teal-500",
    category: "profile"
  },
  profile_theme: { 
    icon: <Palette className="w-5 h-5" />, 
    gradient: "from-indigo-400 to-violet-500",
    category: "profile"
  },
  badge_loyal: { 
    icon: <Award className="w-5 h-5" />, 
    gradient: "from-amber-400 to-yellow-500",
    category: "profile"
  },
};

// Item categories
const ITEM_CATEGORIES = {
  super: ["super_spark", "super_spark_3"] as ShopItemKey[],
  messages: ["ghost_message_1", "ghost_message_3", "highlighted_message"] as ShopItemKey[],
  discovery: ["reveal_spark", "visibility_boost", "second_chance"] as ShopItemKey[],
  profile: ["extra_filter", "profile_theme", "badge_loyal"] as ShopItemKey[],
};

interface ShopItemCardProps {
  itemKey: ShopItemKey;
  originalCost: number;
  discountedCost: number;
  discount: number;
  canAfford: boolean;
  availableQuantity: number;
  isActive: boolean;
  expiresAt: Date | null;
  onPurchase: () => void;
  isPurchasing: boolean;
}

function ShopItemCard({
  itemKey,
  originalCost,
  discountedCost,
  discount,
  canAfford,
  availableQuantity,
  isActive,
  expiresAt,
  onPurchase,
  isPurchasing,
}: ShopItemCardProps) {
  const item = SHOP_ITEMS[itemKey];
  const config = ITEM_CONFIG[itemKey];
  const hasDiscount = discount > 0;

  // Format time remaining
  const getTimeRemaining = () => {
    if (!expiresAt) return null;
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-300",
        "bg-gradient-to-br from-card via-card to-card/80",
        canAfford 
          ? "border-border/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10" 
          : "border-muted/30 opacity-50",
        isActive && "ring-2 ring-primary/50"
      )}
      whileHover={canAfford ? { scale: 1.02, y: -4 } : undefined}
      whileTap={canAfford ? { scale: 0.98 } : undefined}
    >
      {/* Gradient glow effect */}
      <div className={cn(
        "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20",
        `bg-gradient-to-br ${config.gradient}`
      )} />

      {/* Discount badge */}
      {hasDiscount && (
        <motion.div 
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: -12 }}
          className="absolute -top-1 -right-1 z-10"
        >
          <div className={cn(
            "px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-lg",
            `bg-gradient-to-r ${config.gradient}`
          )}>
            -{discount}%
          </div>
        </motion.div>
      )}

      {/* Owned/Active indicator */}
      {(availableQuantity > 0 || isActive) && (
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="secondary" className="gap-1 bg-primary/20 text-primary border-0">
            {isActive ? (
              <>
                <Clock className="w-3 h-3" />
                {timeRemaining}
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                {availableQuantity}x
              </>
            )}
          </Badge>
        </div>
      )}

      <div className="relative p-4">
        <div className="flex items-start gap-4">
          {/* Icon with gradient background */}
          <motion.div 
            className={cn(
              "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg",
              `bg-gradient-to-br ${config.gradient}`
            )}
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.3 }}
          >
            {config.icon}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <h4 className="font-bold text-foreground text-sm truncate">
              {item.name}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>

        {/* Price and action */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
          <div className="flex items-baseline gap-2">
            {hasDiscount && (
              <span className="text-xs text-muted-foreground/70 line-through">
                {originalCost}
              </span>
            )}
            <span className="flex items-center gap-1 font-black text-lg text-foreground">
              {discountedCost}
              <span className="text-primary text-base">🔥</span>
            </span>
          </div>

          <Button
            size="sm"
            variant={canAfford ? "default" : "outline"}
            disabled={!canAfford || isPurchasing}
            onClick={() => {
              triggerHaptic('light');
              onPurchase();
            }}
            className={cn(
              "h-9 px-4 font-semibold transition-all",
              canAfford && `bg-gradient-to-r ${config.gradient} hover:opacity-90 border-0`
            )}
          >
            {isPurchasing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Canjear"
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: typeof SHOP_ITEMS[ShopItemKey] | null;
  itemKey: ShopItemKey | null;
  discountedCost: number;
  discount: number;
  currentEnergy: number;
  onConfirm: () => void;
  isPurchasing: boolean;
}

function ConfirmDialog({
  open,
  onOpenChange,
  item,
  itemKey,
  discountedCost,
  discount,
  currentEnergy,
  onConfirm,
  isPurchasing,
}: ConfirmDialogProps) {
  if (!item || !itemKey) return null;

  const config = ITEM_CONFIG[itemKey];
  const remainingEnergy = currentEnergy - discountedCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50 overflow-hidden">
        {/* Background glow */}
        <div className={cn(
          "absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl opacity-30",
          `bg-gradient-to-br ${config.gradient}`
        )} />
        
        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="w-5 h-5 text-primary" />
            Confirmar canje
          </DialogTitle>
          <DialogDescription>
            ¿Quieres canjear este item con tu energía?
          </DialogDescription>
        </DialogHeader>

        <div className="relative space-y-4 py-4">
          {/* Item preview with gradient */}
          <div className={cn(
            "flex items-center gap-4 p-4 rounded-2xl",
            "bg-gradient-to-r from-muted/50 via-muted/30 to-transparent"
          )}>
            <motion.div 
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg",
                `bg-gradient-to-br ${config.gradient}`
              )}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {config.icon}
            </motion.div>
            <div className="flex-1">
              <h4 className="font-bold text-lg">{item.name}</h4>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-muted/20 border border-border/30">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Precio original</span>
              <span className="font-medium">{item.cost}🔥</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-primary font-medium">Descuento nivel ({discount}%)</span>
                <span className="text-primary font-medium">-{item.cost - discountedCost}🔥</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border/30">
              <span>Total a pagar</span>
              <span className="text-primary">{discountedCost}🔥</span>
            </div>
          </div>

          {/* Balance preview */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-card/50">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Saldo actual</p>
              <p className="text-xl font-bold">{currentEnergy}🔥</p>
            </div>
            <div className="text-2xl text-muted-foreground">→</div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Saldo después</p>
              <p className="text-xl font-bold text-primary">{remainingEnergy}🔥</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="relative flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={() => onOpenChange(false)}
            disabled={isPurchasing}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            className={cn(
              "flex-1 h-12 font-bold border-0",
              `bg-gradient-to-r ${config.gradient} hover:opacity-90`
            )}
            onClick={() => {
              triggerHaptic('medium');
              onConfirm();
            }}
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SparkShopProps {
  className?: string;
}

export function SparkShop({ className }: SparkShopProps) {
  const [selectedItem, setSelectedItem] = useState<ShopItemKey | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  const {
    sparkEnergy,
    currentLevel,
    spendEnergy,
    isSpending,
    getItemCost,
    canAfford,
  } = useSparkEnergy();

  const {
    getAvailableQuantity,
    isItemActive,
    getActiveItemExpiry,
    recordPurchase,
  } = usePurchasedItems();

  const handlePurchaseClick = (itemKey: ShopItemKey) => {
    setSelectedItem(itemKey);
    setConfirmOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedItem) return;
    
    try {
      // Spend energy first
      await spendEnergy({ itemKey: selectedItem });
      // Then record the purchase for tracking
      await recordPurchase(selectedItem);
      
      triggerHaptic('success');
      setConfirmOpen(false);
      setSelectedItem(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const currentEnergy = sparkEnergy?.current_energy || 0;

  const renderCategory = (
    title: string, 
    icon: React.ReactNode, 
    items: ShopItemKey[],
    gradient: string
  ) => (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center text-white",
          `bg-gradient-to-br ${gradient}`
        )}>
          {icon}
        </div>
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>
      <div className="grid gap-3">
        <AnimatePresence>
          {items.map((itemKey, index) => (
            <motion.div
              key={itemKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, type: "spring", stiffness: 300, damping: 25 }}
            >
              <ShopItemCard
                itemKey={itemKey}
                originalCost={SHOP_ITEMS[itemKey].cost}
                discountedCost={getItemCost(itemKey)}
                discount={currentLevel.discount}
                canAfford={canAfford(itemKey)}
                availableQuantity={getAvailableQuantity(itemKey)}
                isActive={isItemActive(itemKey)}
                expiresAt={getActiveItemExpiry(itemKey)}
                onPurchase={() => handlePurchaseClick(itemKey)}
                isPurchasing={isSpending && selectedItem === itemKey}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header with balance - more compact and stylish */}
      <motion.div 
        className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 border border-primary/20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-2xl" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SparkFlame level={currentLevel.level} size="md" animate />
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tu energía</p>
              <p className="text-3xl font-black text-foreground">
                {currentEnergy}
                <span className="text-primary ml-1">🔥</span>
              </p>
            </div>
          </div>
          
          {currentLevel.discount > 0 && (
            <div className="text-right bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Descuento {currentLevel.name}</p>
              <p className="text-2xl font-black text-primary">-{currentLevel.discount}%</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Categories */}
      {renderCategory("⚡ Super Chispa", <Flame className="w-4 h-4" />, ITEM_CATEGORIES.super, "from-blue-500 via-purple-500 to-pink-500")}
      {renderCategory("Mensajes", <MessageCircle className="w-4 h-4" />, ITEM_CATEGORIES.messages, "from-pink-500 to-rose-500")}
      {renderCategory("Descubrimiento", <Eye className="w-4 h-4" />, ITEM_CATEGORIES.discovery, "from-violet-500 to-purple-500")}
      {renderCategory("Perfil", <Palette className="w-4 h-4" />, ITEM_CATEGORIES.profile, "from-emerald-400 to-teal-500")}

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        item={selectedItem ? SHOP_ITEMS[selectedItem] : null}
        itemKey={selectedItem}
        discountedCost={selectedItem ? getItemCost(selectedItem) : 0}
        discount={currentLevel.discount}
        currentEnergy={currentEnergy}
        onConfirm={handleConfirmPurchase}
        isPurchasing={isSpending}
      />
    </div>
  );
}

export default SparkShop;
