import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { KikiLogo } from "@/components/KikiLogo";
import { Sparkles } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden bg-kiki-pink">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-kiki-pink/50 pointer-events-none" />
      
      {/* Main content */}
      <motion.div 
        className="relative z-10 flex flex-col items-center justify-center text-center space-y-8 max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Logo KIKI - Dramatic entrance animation */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.3, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            duration: 0.9, 
            delay: 0.1,
            type: "spring", 
            stiffness: 120,
            damping: 12
          }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.02, 1],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <KikiLogo size="hero" variant="dark" />
          </motion.div>
        </motion.div>
        
        {/* Tagline - Enhanced visual */}
        <motion.p 
          className="text-headline-sm md:text-headline text-kiki-black font-display tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ 
            textShadow: '1px 1px 6px rgba(0, 0, 0, 0.08)'
          }}
        >
          Para gente <span className="text-primary">diferente</span>, y punto.
        </motion.p>
        
        {/* CTA Buttons */}
        <motion.div 
          className="flex flex-col items-center gap-5 pt-8 w-full max-w-xs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Button
            onClick={() => navigate("/auth?mode=signup")}
            className="group w-full h-14 text-base font-semibold bg-kiki-black text-white hover:bg-kiki-black/90 rounded-xl shadow-lg shadow-kiki-black/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>ÚNETE AHORA</span>
            <motion.span
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-5 h-5" />
            </motion.span>
          </Button>
          
          <motion.button
            onClick={() => navigate("/auth?mode=login")}
            className="group flex items-center gap-2 text-subtitle-sm text-kiki-black/70 hover:text-kiki-black font-medium transition-all duration-300 py-2 px-4 rounded-full hover:bg-kiki-black/5"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span>¿Ya tienes cuenta?</span>
            <span className="font-semibold underline underline-offset-4 decoration-2 decoration-primary/60 group-hover:decoration-primary transition-colors">
              Inicia Sesión
            </span>
          </motion.button>
        </motion.div>
      </motion.div>
      
      {/* Bottom decorative element */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
      >
        <div className="w-1 h-8 bg-kiki-black/10 rounded-full" />
      </motion.div>
    </div>
  );
};

export default Landing;
