import { useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Sparkles, ImagePlus } from "lucide-react";
import UploadProgress, { UploadPhase } from "@/components/UploadProgress";
import { cn } from "@/lib/utils";

interface OnboardingPhotoUploadProps {
  avatarUrl: string | null;
  isUploading: boolean;
  uploadPhase: UploadPhase;
  uploadProgress: number;
  errorMessage: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRetry: () => void;
  onCancel: () => void;
}

const OnboardingPhotoUpload = ({
  avatarUrl,
  isUploading,
  uploadPhase,
  uploadProgress,
  errorMessage,
  onFileSelect,
  onRetry,
  onCancel,
}: OnboardingPhotoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "tween" as const,
        duration: 0.2,
      }
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div 
      className="space-y-6 flex flex-col items-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="user"
        onChange={onFileSelect}
      />
      
      {/* Show progress overlay when uploading */}
      {(isUploading || uploadPhase === "error") && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <UploadProgress 
            isVisible={true}
            phase={uploadPhase}
            progress={uploadProgress}
            errorMessage={errorMessage}
            onRetry={onRetry}
            onCancel={onCancel}
            showCancel={isUploading}
          />
        </motion.div>
      )}

      {/* Photo button with enhanced design */}
      {!isUploading && uploadPhase !== "error" && (
        <motion.button
          type="button"
          onClick={handleClick}
          variants={itemVariants}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-40 h-40 rounded-full flex items-center justify-center overflow-hidden",
            "transition-all duration-300 touch-manipulation",
            "ring-4 ring-offset-4 ring-offset-background",
            avatarUrl 
              ? "ring-primary/40 hover:ring-primary/60" 
              : "ring-primary/20 hover:ring-primary/40 bg-gradient-to-br from-card to-muted/50"
          )}
        >
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Tu foto de perfil" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 p-4">
              <div className="relative">
                <Camera className="w-12 h-12 text-primary" />
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Sparkles className="w-4 h-4 text-primary/60" />
                </motion.div>
              </div>
              <span className="text-sm text-muted-foreground font-medium text-center">
                Subir foto
              </span>
            </div>
          )}
        </motion.button>
      )}

      {/* Change photo option when avatar exists */}
      {avatarUrl && !isUploading && uploadPhase !== "error" && (
        <motion.button
          type="button"
          onClick={handleClick}
          variants={itemVariants}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors touch-manipulation py-2"
        >
          <ImagePlus className="w-4 h-4" />
          <span>Cambiar foto</span>
        </motion.button>
      )}

      {/* Status messages */}
      {!isUploading && uploadPhase !== "error" && (
        <motion.div 
          className="text-center space-y-2"
          variants={itemVariants}
        >
          <p className="text-sm text-muted-foreground">
            {avatarUrl 
              ? "¡Perfecta! Ya puedes continuar" 
              : "Toca para subir una foto"
            }
          </p>
          {!avatarUrl && (
            <p className="text-xs text-primary/80 font-medium">
              La foto es obligatoria para crear tu perfil
            </p>
          )}
        </motion.div>
      )}

      {/* Safari/iOS hint */}
      {!avatarUrl && !isUploading && (
        <motion.p 
          className="text-center text-[10px] text-muted-foreground/50 max-w-[220px]"
          variants={itemVariants}
        >
          En iPhone, usa fotos de tu galería para mejor velocidad
        </motion.p>
      )}
    </motion.div>
  );
};

export default OnboardingPhotoUpload;
