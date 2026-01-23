import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { KikiLogo } from "@/components/KikiLogo";

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
        {/* Logo KIKI */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <KikiLogo size="hero" variant="dark" />
        </motion.div>
        
        {/* Tagline */}
        <motion.p 
          className="text-subtitle md:text-subtitle-lg text-kiki-black/80 font-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Para gente diferente, y punto.
        </motion.p>
        
        {/* CTA Buttons */}
        <motion.div 
          className="flex flex-col items-center gap-4 pt-8 w-full max-w-xs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Button
            onClick={() => navigate("/auth?mode=signup")}
            className="w-full h-14 text-base font-semibold bg-kiki-black text-white hover:bg-kiki-black/90 rounded-xl shadow-lg shadow-kiki-black/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            ÚNETE AHORA
          </Button>
          
          <motion.button
            onClick={() => navigate("/auth?mode=login")}
            className="text-caption text-kiki-black/60 hover:text-kiki-black/90 font-medium transition-colors py-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ¿Ya tienes cuenta? <span className="underline underline-offset-2">Inicia Sesión</span>
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
