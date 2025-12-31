import { Camera, ImageIcon, X } from "lucide-react";
import { useRef } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface PhotoSourceSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (file: File) => void;
  title?: string;
}

export const PhotoSourceSelector = ({
  open,
  onOpenChange,
  onFileSelect,
  title = "Añadir foto",
}: PhotoSourceSelectorProps) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      onOpenChange(false);
    }
    // Reset input value so same file can be selected again
    e.target.value = "";
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-8">
        <DrawerHeader className="relative">
          <DrawerTitle className="text-center font-display">
            {title}
          </DrawerTitle>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex flex-col gap-3 mt-2">
          {/* Camera option */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            size="lg"
            className="w-full h-14 justify-start gap-4 text-base"
            onClick={handleCameraClick}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium">Hacer foto</p>
              <p className="text-xs text-muted-foreground">Usar la cámara</p>
            </div>
          </Button>

          {/* Gallery option */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            size="lg"
            className="w-full h-14 justify-start gap-4 text-base"
            onClick={handleGalleryClick}
          >
            <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium">Elegir de galería</p>
              <p className="text-xs text-muted-foreground">Seleccionar una foto existente</p>
            </div>
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
