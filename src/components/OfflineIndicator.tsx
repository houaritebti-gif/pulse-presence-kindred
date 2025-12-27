import { WifiOff, Wifi, Image, MessageSquare, Calendar, User } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-50 bg-amber-500/95 backdrop-blur-sm text-white shadow-lg"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <WifiOff className="w-5 h-5" />
              <span className="font-semibold">Sin conexión</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-amber-100">
              <div className="flex items-center gap-1.5">
                <Image className="w-4 h-4" />
                <span>Imágenes en caché</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>Tu perfil</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Quedadas recientes</span>
              </div>
            </div>
            <p className="text-center text-xs text-amber-200 mt-2">
              Los mensajes nuevos se enviarán cuando vuelvas a conectarte
            </p>
          </div>
        </motion.div>
      )}

      {isOnline && wasOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-50 bg-green-500/95 backdrop-blur-sm text-white shadow-lg"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-2">
              <Wifi className="w-5 h-5" />
              <span className="font-semibold">Conexión restaurada</span>
            </div>
            <p className="text-center text-sm text-green-100 mt-1">
              Sincronizando datos...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
