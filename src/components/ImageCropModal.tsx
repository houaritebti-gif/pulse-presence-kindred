import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Crop as CropIcon, RotateCcw, RotateCw, Check, X, FlipHorizontal, FlipVertical, ZoomIn, ZoomOut, Undo2, Redo2, Hand, MousePointerClick } from "lucide-react";
import ImageFilters, { ImageFilterValues, getFilterStyle } from "./ImageFilters";
import { useEditHistory } from "@/hooks/useEditHistory";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const GESTURE_GUIDE_SHOWN_KEY = "kiki_crop_gesture_guide_shown";
interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number;
}

interface TransformState {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

interface EditState {
  filters: ImageFilterValues;
  transform: TransformState;
  zoom: number;
}

const DEFAULT_FILTERS: ImageFilterValues = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

const DEFAULT_TRANSFORM: TransformState = {
  rotation: 0,
  flipH: false,
  flipV: false,
};

const DEFAULT_EDIT_STATE: EditState = {
  filters: DEFAULT_FILTERS,
  transform: DEFAULT_TRANSFORM,
  zoom: 1,
};

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

async function getTransformedImage(
  imageSrc: string,
  transform: TransformState
): Promise<string> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  
  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        reject(new Error("No 2d context"));
        return;
      }

      const { rotation, flipH, flipV } = transform;

      // Swap dimensions for 90/270 degree rotations
      const isVerticalRotation = rotation === 90 || rotation === 270;
      canvas.width = isVerticalRotation ? image.naturalHeight : image.naturalWidth;
      canvas.height = isVerticalRotation ? image.naturalWidth : image.naturalHeight;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Apply flip transformations
      const scaleX = flipH ? -1 : 1;
      const scaleY = flipV ? -1 : 1;
      ctx.scale(scaleX, scaleY);
      
      ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}

async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  filters: ImageFilterValues
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;

  // Apply filters to canvas context
  ctx.filter = getFilterStyle(filters);

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas is empty"));
        }
      },
      "image/jpeg",
      0.95
    );
  });
}

const ImageCropModal = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 3 / 4,
}: ImageCropModalProps) => {
  const isMobile = useIsMobile();
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transformedImageSrc, setTransformedImageSrc] = useState<string>(imageSrc);
  const [isTransforming, setIsTransforming] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Touch gesture state
  const [isPinching, setIsPinching] = useState(false);
  const initialPinchDistance = useRef<number | null>(null);
  const initialZoom = useRef<number>(1);
  const lastTapTime = useRef<number>(0);
  const DOUBLE_TAP_DELAY = 300; // ms
  
  // Zoom indicator state
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomIndicatorTimeout = useRef<NodeJS.Timeout | null>(null);
  const previousZoom = useRef<number>(1);
  
  // Gesture guide state (only show once per device)
  const [showGestureGuide, setShowGestureGuide] = useState(false);
  
  // Check if gesture guide should be shown on mount
  useEffect(() => {
    if (isMobile && isOpen) {
      const hasSeenGuide = localStorage.getItem(GESTURE_GUIDE_SHOWN_KEY);
      if (!hasSeenGuide) {
        setShowGestureGuide(true);
      }
    }
  }, [isMobile, isOpen]);
  
  const dismissGestureGuide = useCallback(() => {
    setShowGestureGuide(false);
    localStorage.setItem(GESTURE_GUIDE_SHOWN_KEY, "true");
  }, []);

  // History management for edits
  const {
    state: editState,
    setState: setEditState,
    undo,
    redo,
    reset: resetHistory,
    canUndo,
    canRedo,
  } = useEditHistory<EditState>(DEFAULT_EDIT_STATE);

  const { filters, transform, zoom } = editState;

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 3;
  const DOUBLE_TAP_ZOOM = 2;

  // Check if any transform is applied
  const hasTransform = transform.rotation !== 0 || transform.flipH || transform.flipV;

  // Show zoom indicator when zoom changes
  useEffect(() => {
    if (previousZoom.current !== zoom) {
      setShowZoomIndicator(true);
      
      // Clear existing timeout
      if (zoomIndicatorTimeout.current) {
        clearTimeout(zoomIndicatorTimeout.current);
      }
      
      // Hide after 1.5 seconds
      zoomIndicatorTimeout.current = setTimeout(() => {
        setShowZoomIndicator(false);
      }, 1500);
      
      previousZoom.current = zoom;
    }
    
    return () => {
      if (zoomIndicatorTimeout.current) {
        clearTimeout(zoomIndicatorTimeout.current);
      }
    };
  }, [zoom]);

  // Calculate distance between two touch points
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle double tap to toggle zoom
  const handleDoubleTap = useCallback(() => {
    const newZoom = zoom === MIN_ZOOM ? DOUBLE_TAP_ZOOM : MIN_ZOOM;
    setEditState({ ...editState, zoom: newZoom });
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  }, [zoom, editState, setEditState]);

  // Handle touch start for pinch gesture and double-tap detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsPinching(true);
      initialPinchDistance.current = getTouchDistance(e.touches[0], e.touches[1]);
      initialZoom.current = zoom;
    } else if (e.touches.length === 1) {
      // Double-tap detection
      const now = Date.now();
      if (now - lastTapTime.current < DOUBLE_TAP_DELAY) {
        e.preventDefault();
        handleDoubleTap();
        lastTapTime.current = 0; // Reset to prevent triple-tap
      } else {
        lastTapTime.current = now;
      }
    }
  }, [zoom, handleDoubleTap]);

  // Handle touch move for pinch gesture
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPinching || e.touches.length !== 2 || initialPinchDistance.current === null) return;
    
    e.preventDefault();
    const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
    const scale = currentDistance / initialPinchDistance.current;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, initialZoom.current * scale));
    
    setEditState({ ...editState, zoom: newZoom });
  }, [isPinching, editState, setEditState]);

  // Handle touch end for pinch gesture
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setIsPinching(false);
      initialPinchDistance.current = null;
    }
  }, []);

  // Handle mouse wheel zoom for desktop
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.002; // Invert for natural scrolling direction
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
    setEditState({ ...editState, zoom: newZoom });
  }, [zoom, editState, setEditState]);

  // Update transformed image when transform changes
  useEffect(() => {
    if (!hasTransform) {
      setTransformedImageSrc(imageSrc);
      return;
    }

    setIsTransforming(true);
    getTransformedImage(imageSrc, transform)
      .then((transformedSrc) => {
        setTransformedImageSrc(transformedSrc);
        setIsTransforming(false);
      })
      .catch((error) => {
        console.error("Error transforming image:", error);
        setIsTransforming(false);
      });
  }, [imageSrc, transform, hasTransform]);

  // Reset crop when transformed image changes
  useEffect(() => {
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, [transformedImageSrc]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    },
    [aspectRatio]
  );

  const handleRotateLeft = () => {
    setEditState({
      ...editState,
      transform: { ...transform, rotation: (transform.rotation - 90 + 360) % 360 },
    });
  };

  const handleRotateRight = () => {
    setEditState({
      ...editState,
      transform: { ...transform, rotation: (transform.rotation + 90) % 360 },
    });
  };

  const handleFlipHorizontal = () => {
    setEditState({
      ...editState,
      transform: { ...transform, flipH: !transform.flipH },
    });
  };

  const handleFlipVertical = () => {
    setEditState({
      ...editState,
      transform: { ...transform, flipV: !transform.flipV },
    });
  };

  const handleReset = () => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    }
    resetHistory(DEFAULT_EDIT_STATE);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.25, MAX_ZOOM);
    setEditState({ ...editState, zoom: newZoom });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.25, MIN_ZOOM);
    setEditState({ ...editState, zoom: newZoom });
  };

  const handleZoomChange = (value: number[]) => {
    setEditState({ ...editState, zoom: value[0] });
  };

  const handleFiltersChange = (newFilters: ImageFilterValues) => {
    setEditState({ ...editState, filters: newFilters });
  };

  const handleConfirm = async () => {
    if (!completedCrop || !imgRef.current) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop, filters);
      onCropComplete(croppedBlob);
      onClose();
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    resetHistory(DEFAULT_EDIT_STATE);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className={cn(
        "p-0 overflow-hidden flex flex-col",
        isMobile 
          ? "!fixed !inset-0 !left-0 !top-0 !translate-x-0 !translate-y-0 max-w-none w-full h-[100dvh] max-h-none rounded-none m-0 border-0" 
          : "max-w-lg max-h-[90vh]"
      )}>
        <DialogHeader className={cn("p-4 pb-2", isMobile && "pt-6")}>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className={cn("w-5 h-5 text-primary", isMobile && "w-6 h-6")} />
            <span className={cn(isMobile && "text-lg")}>Editar imagen</span>
          </DialogTitle>
        </DialogHeader>

        {/* Transform controls - larger touch targets on mobile */}
        <div className={cn(
          "px-4 pb-2 flex items-center justify-between gap-2",
          isMobile && "px-3 gap-1"
        )}>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn("h-8 w-8", isMobile && "h-11 w-11")}
              onClick={undo}
              disabled={!canUndo || isTransforming}
              title="Deshacer"
            >
              <Undo2 className={cn("w-4 h-4", isMobile && "w-5 h-5")} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn("h-8 w-8", isMobile && "h-11 w-11")}
              onClick={redo}
              disabled={!canRedo || isTransforming}
              title="Rehacer"
            >
              <Redo2 className={cn("w-4 h-4", isMobile && "w-5 h-5")} />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn("h-8 w-8", isMobile && "h-11 w-11")}
              onClick={handleRotateLeft}
              disabled={isTransforming}
              title="Rotar izquierda"
            >
              <RotateCcw className={cn("w-4 h-4", isMobile && "w-5 h-5")} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn("h-8 w-8", isMobile && "h-11 w-11")}
              onClick={handleRotateRight}
              disabled={isTransforming}
              title="Rotar derecha"
            >
              <RotateCw className={cn("w-4 h-4", isMobile && "w-5 h-5")} />
            </Button>
            <div className={cn("w-px h-6 bg-border mx-1", isMobile && "mx-0.5")} />
            <Button
              type="button"
              variant={transform.flipH ? "default" : "outline"}
              size="icon"
              className={cn("h-8 w-8", isMobile && "h-11 w-11")}
              onClick={handleFlipHorizontal}
              disabled={isTransforming}
              title="Voltear horizontal"
            >
              <FlipHorizontal className={cn("w-4 h-4", isMobile && "w-5 h-5")} />
            </Button>
            <Button
              type="button"
              variant={transform.flipV ? "default" : "outline"}
              size="icon"
              className={cn("h-8 w-8", isMobile && "h-11 w-11")}
              onClick={handleFlipVertical}
              disabled={isTransforming}
              title="Voltear vertical"
            >
              <FlipVertical className={cn("w-4 h-4", isMobile && "w-5 h-5")} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Image crop area - larger on mobile with pinch-to-zoom */}
          <div 
            ref={containerRef}
            className={cn(
              "flex items-center justify-center bg-muted/50 overflow-auto touch-none relative",
              isMobile ? "p-2 min-h-[45vh]" : "p-4 min-h-[200px]"
            )}
            onTouchStart={isMobile ? handleTouchStart : undefined}
            onTouchMove={isMobile ? handleTouchMove : undefined}
            onTouchEnd={isMobile ? handleTouchEnd : undefined}
            onWheel={!isMobile ? handleWheel : undefined}
          >
            {/* Floating zoom indicator */}
            <div
              className={cn(
                "absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-black/70 text-white text-sm font-medium backdrop-blur-sm transition-all duration-300 flex items-center gap-1.5",
                showZoomIndicator 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 -translate-y-2 pointer-events-none"
              )}
            >
              <ZoomIn className="w-4 h-4" />
              {Math.round(zoom * 100)}%
            </div>

            {isTransforming ? (
              <div className={cn(
                "flex items-center justify-center",
                isMobile ? "h-[45vh]" : "h-[35vh]"
              )}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div 
                style={{ 
                  transform: `scale(${zoom})`, 
                  transformOrigin: 'center center', 
                  transition: isPinching ? 'none' : 'transform 0.2s ease-out' 
                }}
              >
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspectRatio}
                  className="max-w-full"
                >
                  <img
                    ref={imgRef}
                    src={transformedImageSrc}
                    alt="Imagen a recortar"
                    onLoad={onImageLoad}
                    className={cn(
                      "max-w-full object-contain",
                      isMobile ? "max-h-[45vh]" : "max-h-[35vh]"
                    )}
                    style={{ filter: getFilterStyle(filters) }}
                    crossOrigin="anonymous"
                  />
                </ReactCrop>
              </div>
            )}
            
            {/* Gesture guide overlay - shown only first time on mobile */}
            {showGestureGuide && isMobile && (
              <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 animate-fade-in"
                onClick={dismissGestureGuide}
              >
                <div className="text-center space-y-8 max-w-xs">
                  <h3 className="text-white text-xl font-semibold">Gestos táctiles</h3>
                  
                  <div className="space-y-6">
                    {/* Pinch to zoom */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                        <Hand className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-white/90">
                        <p className="font-medium">Pellizca con dos dedos</p>
                        <p className="text-sm text-white/70">para hacer zoom</p>
                      </div>
                    </div>
                    
                    {/* Double tap */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                        <MousePointerClick className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-white/90">
                        <p className="font-medium">Doble toque</p>
                        <p className="text-sm text-white/70">zoom rápido 1x ↔ 2x</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="mt-4 bg-white/10 border-white/30 text-white hover:bg-white/20"
                    onClick={dismissGestureGuide}
                  >
                    Entendido
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Zoom Controls - larger on mobile */}
          <div className={cn(
            "px-4 py-2 flex items-center gap-3 border-t border-border/50",
            isMobile && "px-3 py-3 gap-2"
          )}>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn("h-8 w-8 flex-shrink-0", isMobile && "h-11 w-11")}
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM || isTransforming}
              title="Alejar"
            >
              <ZoomOut className={cn("w-4 h-4", isMobile && "w-5 h-5")} />
            </Button>
            <div className="flex-1 flex items-center gap-2">
              <Slider
                value={[zoom]}
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.1}
                onValueChange={handleZoomChange}
                disabled={isTransforming}
                className={cn("flex-1", isMobile && "[&_[role=slider]]:h-5 [&_[role=slider]]:w-5")}
              />
              <span className={cn(
                "text-xs text-muted-foreground w-12 text-right",
                isMobile && "text-sm w-14"
              )}>
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn("h-8 w-8 flex-shrink-0", isMobile && "h-11 w-11")}
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM || isTransforming}
              title="Acercar"
            >
              <ZoomIn className={cn("w-4 h-4", isMobile && "w-5 h-5")} />
            </Button>
            <div className={cn("w-px h-6 bg-border mx-0.5", isMobile && "mx-0")} />
            <Button
              type="button"
              variant={zoom === MIN_ZOOM ? "default" : "outline"}
              size="icon"
              className={cn("h-8 w-8 flex-shrink-0 text-xs font-semibold", isMobile && "h-11 w-11 text-sm")}
              onClick={() => {
                setEditState({ ...editState, zoom: MIN_ZOOM });
                if (navigator.vibrate) navigator.vibrate(10);
              }}
              disabled={isTransforming}
              title="Zoom 1x"
            >
              1x
            </Button>
            <Button
              type="button"
              variant={zoom === DOUBLE_TAP_ZOOM ? "default" : "outline"}
              size="icon"
              className={cn("h-8 w-8 flex-shrink-0 text-xs font-semibold", isMobile && "h-11 w-11 text-sm")}
              onClick={() => {
                setEditState({ ...editState, zoom: DOUBLE_TAP_ZOOM });
                if (navigator.vibrate) navigator.vibrate(10);
              }}
              disabled={isTransforming}
              title="Zoom 2x"
            >
              2x
            </Button>
          </div>

          <div className={cn("px-4 py-2", isMobile && "px-3 py-3")}>
            <ImageFilters values={filters} onChange={handleFiltersChange} />
          </div>
        </div>

        {/* Footer - sticky bottom on mobile with larger buttons */}
        <DialogFooter className={cn(
          "p-4 pt-2 flex gap-2 sm:gap-2 border-t border-border/50",
          isMobile && "p-3 gap-2 sticky bottom-0 bg-background safe-area-pb"
        )}>
          <Button
            type="button"
            variant="outline"
            size={isMobile ? "default" : "sm"}
            onClick={handleReset}
            className={cn("gap-1", isMobile && "h-12 px-4")}
          >
            <RotateCcw className={cn("w-4 h-4", isMobile && "w-5 h-5")} />
            {!isMobile && "Restablecer"}
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="ghost"
            size={isMobile ? "default" : "sm"}
            onClick={handleCancel}
            className={cn("gap-1", isMobile && "h-12 px-5")}
          >
            <X className={cn("w-4 h-4", isMobile && "w-5 h-5")} />
            Cancelar
          </Button>
          <Button
            type="button"
            size={isMobile ? "default" : "sm"}
            onClick={handleConfirm}
            disabled={!completedCrop || isProcessing || isTransforming}
            className={cn("gap-1", isMobile && "h-12 px-6 text-base font-semibold")}
          >
            <Check className={cn("w-4 h-4", isMobile && "w-5 h-5")} />
            {isProcessing ? "..." : "Aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropModal;
