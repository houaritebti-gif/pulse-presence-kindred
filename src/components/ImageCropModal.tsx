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
import { Crop as CropIcon, RotateCcw, RotateCw, Check, X, FlipHorizontal, FlipVertical, ZoomIn, ZoomOut, Undo2, Redo2 } from "lucide-react";
import ImageFilters, { ImageFilterValues, getFilterStyle } from "./ImageFilters";
import { useEditHistory } from "@/hooks/useEditHistory";

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
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transformedImageSrc, setTransformedImageSrc] = useState<string>(imageSrc);
  const [isTransforming, setIsTransforming] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Check if any transform is applied
  const hasTransform = transform.rotation !== 0 || transform.flipH || transform.flipV;

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
      <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="w-5 h-5 text-primary" />
            Editar imagen
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={undo}
              disabled={!canUndo || isTransforming}
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={redo}
              disabled={!canRedo || isTransforming}
              title="Rehacer (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleRotateLeft}
              disabled={isTransforming}
              title="Rotar a la izquierda"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleRotateRight}
              disabled={isTransforming}
              title="Rotar a la derecha"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              type="button"
              variant={transform.flipH ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={handleFlipHorizontal}
              disabled={isTransforming}
              title="Voltear horizontalmente"
            >
              <FlipHorizontal className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant={transform.flipV ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={handleFlipVertical}
              disabled={isTransforming}
              title="Voltear verticalmente"
            >
              <FlipVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div 
            ref={containerRef}
            className="flex items-center justify-center bg-muted/50 p-4 min-h-[200px] overflow-auto"
          >
            {isTransforming ? (
              <div className="flex items-center justify-center h-[35vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}>
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
                    className="max-h-[35vh] max-w-full object-contain"
                    style={{ filter: getFilterStyle(filters) }}
                    crossOrigin="anonymous"
                  />
                </ReactCrop>
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="px-4 py-2 flex items-center gap-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM || isTransforming}
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <div className="flex-1 flex items-center gap-2">
              <Slider
                value={[zoom]}
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.1}
                onValueChange={handleZoomChange}
                disabled={isTransforming}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM || isTransforming}
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <div className="px-4 py-2">
            <ImageFilters values={filters} onChange={handleFiltersChange} />
          </div>
        </div>

        <DialogFooter className="p-4 pt-2 flex gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="gap-1"
          >
            <X className="w-4 h-4" />
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={!completedCrop || isProcessing || isTransforming}
            className="gap-1"
          >
            <Check className="w-4 h-4" />
            {isProcessing ? "Procesando..." : "Aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropModal;
