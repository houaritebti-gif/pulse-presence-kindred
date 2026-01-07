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
  Gift
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SparkFlame } from "@/components/SparkFlame";
import { useSparkEnergy, ShopItemKey, SHOP_ITEMS } from "@/hooks/useSparkEnergy";

// Item icons mapping
const ITEM_ICONS: Record<ShopItemKey, React.ReactNode> = {
  ghost_message_1: <MessageCircle className="w-5 h-5" />,
  ghost_message_3: <MessageCircle className="w-5 h-5" />,
  highlighted_message: <Sparkles className="w-5 h-5" />,
  reveal_spark: <Eye className="w-5 h-5" />,
  visibility_boost: <Zap className="w-5 h-5" />,
  second_chance: <RotateCcw className="w-5 h-5" />,
  extra_filter: <SlidersHorizontal className="w-5 h-5" />,
  profile_theme: <Palette className="w-5 h-5" />,
  badge_loyal: <Award className="w-5 h-5" />,
};

// Item categories
const ITEM_CATEGORIES = {
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
  onPurchase: () => void;
  isPurchasing: boolean;
}

function ShopItemCard({
  itemKey,
  originalCost,
  discountedCost,
  discount,
  canAfford,
  onPurchase,
  isPurchasing,
}: ShopItemCardProps) {
  const item = SHOP_ITEMS[itemKey];
  const hasDiscount = discount > 0;

  return (
    <motion.div
      className={cn(
        "relative p-4 rounded-2xl border-2 transition-all duration-200",
        "bg-gradient-to-br from-card to-card/80",
        canAfford 
          ? "border-primary/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10" 
          : "border-muted/20 opacity-60"
      )}
      whileHover={canAfford ? { scale: 1.02, y: -2 } : undefined}
      whileTap={canAfford ? { scale: 0.98 } : undefined}
    >
      {/* Discount badge */}
      {hasDiscount && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
          -{discount}%
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
          "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
        )}>
          {ITEM_ICONS[itemKey]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground text-sm truncate">
            {item.name}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>

      {/* Price and action */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {originalCost}
            </span>
          )}
          <span className="flex items-center gap-0.5 font-bold text-foreground">
            {discountedCost}
            <span className="text-primary">🔥</span>
          </span>
        </div>

        <Button
          size="sm"
          variant={canAfford ? "default" : "outline"}
          disabled={!canAfford || isPurchasing}
          onClick={onPurchase}
          className="h-8 px-3"
        >
          {isPurchasing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Canjear"
          )}
        </Button>
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

  const remainingEnergy = currentEnergy - discountedCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Confirmar canje
          </DialogTitle>
          <DialogDescription>
            ¿Quieres canjear este item?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item preview */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              {ITEM_ICONS[itemKey]}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{item.name}</h4>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="space-y-2 p-4 rounded-xl bg-muted/30">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Precio original</span>
              <span>{item.cost}🔥</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-primary">
                <span>Descuento nivel ({discount}%)</span>
                <span>-{item.cost - discountedCost}🔥</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span>{discountedCost}🔥</span>
            </div>
          </div>

          {/* Balance preview */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border">
            <div className="text-sm">
              <span className="text-muted-foreground">Tu saldo: </span>
              <span className="font-bold">{currentEnergy}🔥</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Después: </span>
              <span className="font-bold text-primary">{remainingEnergy}🔥</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isPurchasing}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={onConfirm}
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

  const handlePurchaseClick = (itemKey: ShopItemKey) => {
    setSelectedItem(itemKey);
    setConfirmOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedItem) return;
    
    try {
      await spendEnergy({ itemKey: selectedItem });
      setConfirmOpen(false);
      setSelectedItem(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const currentEnergy = sparkEnergy?.current_energy || 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with balance */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="flex items-center gap-3">
          <SparkFlame level={currentLevel.level} size="md" animate />
          <div>
            <p className="text-sm text-muted-foreground">Tu saldo</p>
            <p className="text-2xl font-bold text-foreground">
              {currentEnergy}
              <span className="text-primary ml-1">🔥</span>
            </p>
          </div>
        </div>
        
        {currentLevel.discount > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Descuento {currentLevel.name}</p>
            <p className="text-lg font-bold text-primary">-{currentLevel.discount}%</p>
          </div>
        )}
      </div>

      {/* Messages category */}
      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
          <MessageCircle className="w-4 h-4" />
          Mensajes
        </h3>
        <div className="grid gap-3">
          <AnimatePresence>
            {ITEM_CATEGORIES.messages.map((itemKey, index) => (
              <motion.div
                key={itemKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ShopItemCard
                  itemKey={itemKey}
                  originalCost={SHOP_ITEMS[itemKey].cost}
                  discountedCost={getItemCost(itemKey)}
                  discount={currentLevel.discount}
                  canAfford={canAfford(itemKey)}
                  onPurchase={() => handlePurchaseClick(itemKey)}
                  isPurchasing={isSpending && selectedItem === itemKey}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Discovery category */}
      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
          <Eye className="w-4 h-4" />
          Descubrimiento
        </h3>
        <div className="grid gap-3">
          <AnimatePresence>
            {ITEM_CATEGORIES.discovery.map((itemKey, index) => (
              <motion.div
                key={itemKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ShopItemCard
                  itemKey={itemKey}
                  originalCost={SHOP_ITEMS[itemKey].cost}
                  discountedCost={getItemCost(itemKey)}
                  discount={currentLevel.discount}
                  canAfford={canAfford(itemKey)}
                  onPurchase={() => handlePurchaseClick(itemKey)}
                  isPurchasing={isSpending && selectedItem === itemKey}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Profile category */}
      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
          <Palette className="w-4 h-4" />
          Perfil
        </h3>
        <div className="grid gap-3">
          <AnimatePresence>
            {ITEM_CATEGORIES.profile.map((itemKey, index) => (
              <motion.div
                key={itemKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ShopItemCard
                  itemKey={itemKey}
                  originalCost={SHOP_ITEMS[itemKey].cost}
                  discountedCost={getItemCost(itemKey)}
                  discount={currentLevel.discount}
                  canAfford={canAfford(itemKey)}
                  onPurchase={() => handlePurchaseClick(itemKey)}
                  isPurchasing={isSpending && selectedItem === itemKey}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

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
