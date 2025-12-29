import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sun, Contrast, Palette, RotateCcw, Sparkles, Plus, X, Save, Heart } from "lucide-react";
import { useCustomPresets, CustomPreset } from "@/hooks/useCustomPresets";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface ImageFilterValues {
  brightness: number;
  contrast: number;
  saturation: number;
}

interface ImageFiltersProps {
  values: ImageFilterValues;
  onChange: (values: ImageFilterValues) => void;
}

const DEFAULT_VALUES: ImageFilterValues = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

interface FilterPreset {
  name: string;
  values: ImageFilterValues;
  gradient: string;
}

const FILTER_PRESETS: FilterPreset[] = [
  {
    name: "Original",
    values: { brightness: 100, contrast: 100, saturation: 100 },
    gradient: "from-gray-400 to-gray-600",
  },
  {
    name: "Vintage",
    values: { brightness: 95, contrast: 85, saturation: 70 },
    gradient: "from-amber-600 to-orange-800",
  },
  {
    name: "B&W",
    values: { brightness: 105, contrast: 120, saturation: 0 },
    gradient: "from-gray-800 to-black",
  },
  {
    name: "Vivid",
    values: { brightness: 105, contrast: 115, saturation: 140 },
    gradient: "from-pink-500 to-purple-600",
  },
  {
    name: "Warm",
    values: { brightness: 102, contrast: 100, saturation: 115 },
    gradient: "from-orange-400 to-red-500",
  },
  {
    name: "Cool",
    values: { brightness: 100, contrast: 105, saturation: 90 },
    gradient: "from-blue-400 to-cyan-500",
  },
];

export const getFilterStyle = (values: ImageFilterValues): string => {
  return `brightness(${values.brightness}%) contrast(${values.contrast}%) saturate(${values.saturation}%)`;
};

const ImageFilters = ({ values, onChange }: ImageFiltersProps) => {
  const isMobile = useIsMobile();
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const { presets: customPresets, addPreset, deletePreset } = useCustomPresets();

  const handleReset = () => {
    onChange(DEFAULT_VALUES);
  };

  const handlePresetClick = (preset: FilterPreset | CustomPreset) => {
    onChange(preset.values);
    // Haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const isPresetActive = (preset: FilterPreset | CustomPreset) => {
    return (
      values.brightness === preset.values.brightness &&
      values.contrast === preset.values.contrast &&
      values.saturation === preset.values.saturation
    );
  };

  const hasChanges =
    values.brightness !== DEFAULT_VALUES.brightness ||
    values.contrast !== DEFAULT_VALUES.contrast ||
    values.saturation !== DEFAULT_VALUES.saturation;

  const isCustomValues = hasChanges && ![...FILTER_PRESETS, ...customPresets].some(isPresetActive);

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error("Escribe un nombre para el preset");
      return;
    }
    addPreset(newPresetName.trim(), values);
    toast.success(`Preset "${newPresetName.trim()}" guardado`);
    setNewPresetName("");
    setIsAddingPreset(false);
  };

  const handleDeletePreset = (e: React.MouseEvent, preset: CustomPreset) => {
    e.stopPropagation();
    deletePreset(preset.id);
    toast.success(`Preset "${preset.name}" eliminado`);
  };

  const handleCancelAddPreset = () => {
    setIsAddingPreset(false);
    setNewPresetName("");
  };

  return (
    <div className={cn(
      "space-y-4 bg-muted/30 rounded-lg",
      isMobile ? "p-3 space-y-3" : "p-4"
    )}>
      <div className="flex items-center justify-between">
        <h4 className={cn(
          "font-medium text-foreground",
          isMobile ? "text-base" : "text-sm"
        )}>
          Ajustes de imagen
        </h4>
        {hasChanges && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className={cn(
              "gap-1",
              isMobile ? "h-9 text-sm px-3" : "h-7 text-xs"
            )}
          >
            <RotateCcw className={cn(isMobile ? "w-4 h-4" : "w-3 h-3")} />
            Restablecer
          </Button>
        )}
      </div>

      {/* Filter Presets - larger touch targets on mobile */}
      <div className="space-y-2">
        <Label className={cn(
          "flex items-center gap-1.5",
          isMobile ? "text-sm" : "text-xs"
        )}>
          <Sparkles className={cn(
            "text-yellow-500",
            isMobile ? "w-4 h-4" : "w-3.5 h-3.5"
          )} />
          Presets rápidos
        </Label>
        <div className={cn(
          "flex gap-2 overflow-x-auto pb-1 scrollbar-hide",
          isMobile && "gap-2.5 pb-2 -mx-1 px-1"
        )}>
          {FILTER_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={cn(
                "flex-shrink-0 rounded-full font-medium transition-all duration-200 bg-gradient-to-r text-white",
                preset.gradient,
                isMobile ? "px-4 py-2.5 text-sm min-w-[72px]" : "px-3 py-1.5 text-xs",
                isPresetActive(preset)
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                  : "opacity-80 hover:opacity-100 hover:scale-105 active:scale-95"
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Presets */}
      {(customPresets.length > 0 || isAddingPreset) && (
        <div className="space-y-2">
          <Label className={cn(
            "flex items-center gap-1.5",
            isMobile ? "text-sm" : "text-xs"
          )}>
            <Heart className={cn(
              "text-rose-500",
              isMobile ? "w-4 h-4" : "w-3.5 h-3.5"
            )} />
            Mis presets
          </Label>
          <div className={cn(
            "flex gap-2 overflow-x-auto pb-1 scrollbar-hide",
            isMobile && "gap-2.5 pb-2 -mx-1 px-1"
          )}>
            {customPresets.map((preset) => (
              <div key={preset.id} className="relative group flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    "rounded-full font-medium transition-all duration-200 bg-gradient-to-r text-white",
                    preset.gradient,
                    isMobile ? "px-4 py-2.5 text-sm pr-8" : "px-3 py-1.5 text-xs pr-7",
                    isPresetActive(preset)
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                      : "opacity-80 hover:opacity-100 hover:scale-105 active:scale-95"
                  )}
                >
                  {preset.name}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeletePreset(e, preset)}
                  className={cn(
                    "absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors",
                    isMobile ? "w-6 h-6" : "w-5 h-5"
                  )}
                  title="Eliminar preset"
                >
                  <X className={cn(isMobile ? "w-3.5 h-3.5" : "w-3 h-3", "text-white")} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Preset UI */}
      {isAddingPreset ? (
        <div className={cn(
          "flex items-center gap-2 bg-background/50 rounded-lg border border-border/50",
          isMobile ? "p-3 flex-wrap" : "p-2"
        )}>
          <Input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Nombre del preset..."
            className={cn(
              "flex-1",
              isMobile ? "h-11 text-base min-w-[150px]" : "h-8 text-xs"
            )}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSavePreset();
              if (e.key === "Escape") handleCancelAddPreset();
            }}
          />
          <Button
            type="button"
            size={isMobile ? "default" : "sm"}
            className={cn("gap-1", isMobile && "h-11 px-4")}
            onClick={handleSavePreset}
          >
            <Save className={cn(isMobile ? "w-4 h-4" : "w-3.5 h-3.5")} />
            Guardar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size={isMobile ? "default" : "sm"}
            className={cn(isMobile ? "h-11 w-11 p-0" : "h-8 w-8 p-0")}
            onClick={handleCancelAddPreset}
          >
            <X className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
          </Button>
        </div>
      ) : (
        isCustomValues && (
          <Button
            type="button"
            variant="outline"
            size={isMobile ? "default" : "sm"}
            className={cn(
              "w-full gap-1.5",
              isMobile ? "h-11 text-sm" : "h-8 text-xs"
            )}
            onClick={() => setIsAddingPreset(true)}
          >
            <Plus className={cn(isMobile ? "w-4 h-4" : "w-3.5 h-3.5")} />
            Guardar como preset personalizado
          </Button>
        )
      )}

      {/* Sliders - larger touch area on mobile */}
      <div className={cn("space-y-4", isMobile && "space-y-5")}>
        {/* Brightness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className={cn(
              "flex items-center gap-1.5",
              isMobile ? "text-sm" : "text-xs"
            )}>
              <Sun className={cn(
                "text-amber-500",
                isMobile ? "w-4 h-4" : "w-3.5 h-3.5"
              )} />
              Brillo
            </Label>
            <span className={cn(
              "text-muted-foreground text-right",
              isMobile ? "text-sm w-12" : "text-xs w-10"
            )}>
              {values.brightness}%
            </span>
          </div>
          <Slider
            value={[values.brightness]}
            onValueChange={([v]) => onChange({ ...values, brightness: v })}
            min={50}
            max={150}
            step={1}
            className={cn("w-full", isMobile && "[&_[role=slider]]:h-5 [&_[role=slider]]:w-5")}
          />
        </div>

        {/* Contrast */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className={cn(
              "flex items-center gap-1.5",
              isMobile ? "text-sm" : "text-xs"
            )}>
              <Contrast className={cn(
                "text-blue-500",
                isMobile ? "w-4 h-4" : "w-3.5 h-3.5"
              )} />
              Contraste
            </Label>
            <span className={cn(
              "text-muted-foreground text-right",
              isMobile ? "text-sm w-12" : "text-xs w-10"
            )}>
              {values.contrast}%
            </span>
          </div>
          <Slider
            value={[values.contrast]}
            onValueChange={([v]) => onChange({ ...values, contrast: v })}
            min={50}
            max={150}
            step={1}
            className={cn("w-full", isMobile && "[&_[role=slider]]:h-5 [&_[role=slider]]:w-5")}
          />
        </div>

        {/* Saturation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className={cn(
              "flex items-center gap-1.5",
              isMobile ? "text-sm" : "text-xs"
            )}>
              <Palette className={cn(
                "text-pink-500",
                isMobile ? "w-4 h-4" : "w-3.5 h-3.5"
              )} />
              Saturación
            </Label>
            <span className={cn(
              "text-muted-foreground text-right",
              isMobile ? "text-sm w-12" : "text-xs w-10"
            )}>
              {values.saturation}%
            </span>
          </div>
          <Slider
            value={[values.saturation]}
            onValueChange={([v]) => onChange({ ...values, saturation: v })}
            min={0}
            max={200}
            step={1}
            className={cn("w-full", isMobile && "[&_[role=slider]]:h-5 [&_[role=slider]]:w-5")}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageFilters;
