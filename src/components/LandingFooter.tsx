import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LandingFooter = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.footer 
        className="w-full py-3 px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-center gap-4 text-xs text-kiki-black/50">
          <Link 
            to="/privacidad" 
            className="hover:text-kiki-black/80 transition-colors"
          >
            Privacidad
          </Link>
          <span className="text-kiki-black/30">·</span>
          <Link 
            to="/terminos" 
            className="hover:text-kiki-black/80 transition-colors"
          >
            Términos
          </Link>
          <span className="text-kiki-black/30">·</span>
          <Link 
            to="/cookies" 
            className="hover:text-kiki-black/80 transition-colors"
          >
            Cookies
          </Link>
          <span className="text-kiki-black/30">·</span>
          <Link 
            to="/codigo-kiki" 
            className="hover:text-kiki-black/80 transition-colors"
          >
            Código KIKI
          </Link>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-2 p-1 rounded-full hover:bg-kiki-black/10 transition-colors"
            aria-label="Cerrar footer"
          >
            <X className="w-3 h-3 text-kiki-black/40" />
          </button>
        </div>
      </motion.footer>
    </AnimatePresence>
  );
};

export default LandingFooter;
