import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { KikiLogo } from "@/components/KikiLogo";
import { Sparkles } from "lucide-react";
import LandingFooter from "@/components/LandingFooter";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden bg-kiki-pink-bubble">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-kiki-pink-bubble/50 pointer-events-none" />
      
      {/* Main content */}
      <motion.div 
        className="relative z-10 flex flex-col items-center justify-center text-center space-y-8 max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Logo KIKI - Dramatic entrance animation with glow */}
        <motion.div 
          className="relative"
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
          {/* Outer glow - larger and more subtle */}
          <motion.div 
            className="absolute -inset-x-24 -inset-y-16 rounded-full pointer-events-none"
            style={{ 
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 60%)',
              filter: 'blur(50px)'
            }}
            animate={{ 
              opacity: [0.2, 0.4, 0.2],
              scale: [0.95, 1.15, 0.95]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Inner glow - smaller and more vibrant */}
          <motion.div 
            className="absolute -inset-x-12 -inset-y-8 rounded-full pointer-events-none"
            style={{ 
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.45) 0%, transparent 70%)',
              filter: 'blur(30px)'
            }}
            animate={{ 
              opacity: [0.35, 0.65, 0.35],
              scale: [0.9, 1.1, 0.9]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.div
            className="relative z-10"
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
        
        {/* Taglines - Enhanced visual */}
        <div className="flex flex-col items-center gap-3">
          <motion.p 
            className="text-headline-sm md:text-headline text-kiki-black font-display tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            style={{ 
              textShadow: '1px 1px 6px rgba(0, 0, 0, 0.08)'
            }}
          >
            Para gente <span className="text-kiki-black font-bold">diferente</span>, y punto.
          </motion.p>
          
          {/* Secondary tagline - refined visual */}
          <motion.p
            className="text-subtitle-sm md:text-subtitle text-kiki-black/70 tracking-wide"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            style={{ 
              letterSpacing: '0.02em'
            }}
          >
            aquí no hay match, hay{' '}
            <motion.span 
              className="text-kiki-red-warm font-bold relative inline-block"
              animate={{ 
                textShadow: [
                  '0 0 0px hsl(var(--kiki-red-warm) / 0)',
                  '0 0 8px hsl(var(--kiki-red-warm) / 0.4)',
                  '0 0 0px hsl(var(--kiki-red-warm) / 0)'
                ]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              chispa
              <motion.span
                className="absolute -right-4 -top-1"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                  rotate: [0, 10, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                ✨
              </motion.span>
            </motion.span>
          </motion.p>
        </div>
        
        {/* CTA Buttons */}
        <motion.div 
          className="flex flex-col items-center gap-5 pt-8 w-full max-w-xs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {/* Button with border shimmer effect */}
          <div className="relative w-full group">
            {/* Animated border glow */}
            <motion.div 
              className="absolute -inset-[2px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)',
                backgroundSize: '200% 100%'
              }}
              animate={{
                backgroundPosition: ['200% 0', '-200% 0']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            {/* Shimmer sweep overlay */}
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
              <motion.div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                  width: '50%'
                }}
                animate={{
                  x: ['-100%', '300%']
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 1
                }}
              />
            </div>
            
            <Button
              onClick={() => navigate("/auth?mode=signup")}
              className="relative w-full h-14 text-base font-semibold bg-kiki-black text-white hover:bg-kiki-black/90 rounded-xl shadow-lg shadow-kiki-black/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
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
          </div>
          
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
      
      {/* Footer minimalista */}
      <div className="absolute bottom-0 left-0 right-0">
        <LandingFooter />
      </div>
    </div>
  );
};

export default Landing;
