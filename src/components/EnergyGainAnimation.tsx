import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";

interface EnergyGain {
  id: string;
  amount: number;
  x: number;
  y: number;
}

interface EnergyGainContextType {
  showEnergyGain: (amount: number, x?: number, y?: number) => void;
}

const EnergyGainContext = createContext<EnergyGainContextType | null>(null);

export function useEnergyGainAnimation() {
  const context = useContext(EnergyGainContext);
  if (!context) {
    throw new Error("useEnergyGainAnimation must be used within EnergyGainProvider");
  }
  return context;
}

interface EnergyGainProviderProps {
  children: ReactNode;
}

export function EnergyGainProvider({ children }: EnergyGainProviderProps) {
  const [gains, setGains] = useState<EnergyGain[]>([]);

  const showEnergyGain = useCallback((amount: number, x?: number, y?: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    
    // Default position: center-right of screen
    const posX = x ?? window.innerWidth / 2;
    const posY = y ?? window.innerHeight / 3;
    
    setGains((prev) => [...prev, { id, amount, x: posX, y: posY }]);
    
    // Auto-remove after animation
    setTimeout(() => {
      setGains((prev) => prev.filter((g) => g.id !== id));
    }, 1500);
  }, []);

  return (
    <EnergyGainContext.Provider value={{ showEnergyGain }}>
      {children}
      
      {/* Floating animations container */}
      <div className="fixed inset-0 pointer-events-none z-[100]">
        <AnimatePresence>
          {gains.map((gain) => (
            <motion.div
              key={gain.id}
              initial={{ 
                opacity: 0, 
                scale: 0.5, 
                x: gain.x - 30,
                y: gain.y
              }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.2, 1, 0.8],
                y: gain.y - 80,
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 1.4,
                ease: "easeOut",
                times: [0, 0.2, 0.6, 1]
              }}
              className="absolute flex items-center gap-1"
            >
              <span className="text-2xl font-black text-primary drop-shadow-lg">
                +{gain.amount}
              </span>
              <Flame className="w-5 h-5 text-primary fill-primary/30" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </EnergyGainContext.Provider>
  );
}

// Standalone component for simple use cases
interface FloatingEnergyGainProps {
  amount: number;
  show: boolean;
  onComplete?: () => void;
}

export function FloatingEnergyGain({ amount, show, onComplete }: FloatingEnergyGainProps) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.3, 1, 0.8],
            y: -60,
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 1.2,
            ease: "easeOut",
            times: [0, 0.15, 0.5, 1]
          }}
          className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 pointer-events-none z-50"
        >
          <span className="text-lg font-black text-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            +{amount}
          </span>
          <Flame className="w-4 h-4 text-primary fill-primary/30" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
