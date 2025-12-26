import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ImageLightbox = ({ imageUrl, onClose }: ImageLightboxProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [imageUrl]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (imageUrl) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [imageUrl, onClose]);

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    return Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
  };

  const getCenter = (touch1: React.Touch, touch2: React.Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      lastTouchDistance.current = getDistance(e.touches[0], e.touches[1]);
      lastTouchCenter.current = getCenter(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      lastTouchCenter.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      e.preventDefault();
      const newDistance = getDistance(e.touches[0], e.touches[1]);
      const scaleDiff = newDistance / lastTouchDistance.current;
      const newScale = Math.min(Math.max(scale * scaleDiff, 1), 5);
      
      setScale(newScale);
      lastTouchDistance.current = newDistance;

      // If zooming out to 1, reset position
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1 && lastTouchCenter.current) {
      const deltaX = e.touches[0].clientX - lastTouchCenter.current.x;
      const deltaY = e.touches[0].clientY - lastTouchCenter.current.y;
      
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      
      lastTouchCenter.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.5, 1);
    setScale(newScale);
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleBackdropClick = () => {
    if (scale === 1) {
      onClose();
    } else {
      handleReset();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale > 1) {
      handleReset();
    } else {
      setScale(2.5);
    }
  };

  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md touch-none"
          onClick={handleBackdropClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-card/80 flex items-center justify-center text-foreground hover:bg-card transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Zoom controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
              disabled={scale <= 1}
              className="w-10 h-10 rounded-full bg-card/80 flex items-center justify-center text-foreground hover:bg-card transition-colors disabled:opacity-40"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleReset(); }}
              disabled={scale === 1}
              className="w-10 h-10 rounded-full bg-card/80 flex items-center justify-center text-foreground hover:bg-card transition-colors disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
              disabled={scale >= 5}
              className="w-10 h-10 rounded-full bg-card/80 flex items-center justify-center text-foreground hover:bg-card transition-colors disabled:opacity-40"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          {/* Zoom indicator */}
          {scale > 1 && (
            <div className="absolute top-6 left-6 z-50 px-3 py-1.5 rounded-full bg-card/80 text-foreground text-sm font-body">
              {Math.round(scale * 100)}%
            </div>
          )}

          {/* Image */}
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
            }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            src={imageUrl}
            alt="Imagen ampliada"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg select-none"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              cursor: scale > 1 ? "grab" : "zoom-in",
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={handleDoubleClick}
            draggable={false}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;
