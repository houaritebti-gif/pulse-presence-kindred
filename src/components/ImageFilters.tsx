import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sun, Contrast, Palette, RotateCcw, Sparkles } from "lucide-react";

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
  const handleReset = () => {
    onChange(DEFAULT_VALUES);
  };

  const handlePresetClick = (preset: FilterPreset) => {
    onChange(preset.values);
  };

  const isPresetActive = (preset: FilterPreset) => {
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

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Ajustes de imagen</h4>
        {hasChanges && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Restablecer
          </Button>
        )}
      </div>

      {/* Filter Presets */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
          Presets rápidos
        </Label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-gradient-to-r ${preset.gradient} text-white ${
                isPresetActive(preset)
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                  : "opacity-80 hover:opacity-100 hover:scale-105"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Brightness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Brillo
            </Label>
            <span className="text-xs text-muted-foreground w-10 text-right">
              {values.brightness}%
            </span>
          </div>
          <Slider
            value={[values.brightness]}
            onValueChange={([v]) => onChange({ ...values, brightness: v })}
            min={50}
            max={150}
            step={1}
            className="w-full"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-1.5">
              <Contrast className="w-3.5 h-3.5 text-blue-500" />
              Contraste
            </Label>
            <span className="text-xs text-muted-foreground w-10 text-right">
              {values.contrast}%
            </span>
          </div>
          <Slider
            value={[values.contrast]}
            onValueChange={([v]) => onChange({ ...values, contrast: v })}
            min={50}
            max={150}
            step={1}
            className="w-full"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-500" />
              Saturación
            </Label>
            <span className="text-xs text-muted-foreground w-10 text-right">
              {values.saturation}%
            </span>
          </div>
          <Slider
            value={[values.saturation]}
            onValueChange={([v]) => onChange({ ...values, saturation: v })}
            min={0}
            max={200}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default ImageFilters;
