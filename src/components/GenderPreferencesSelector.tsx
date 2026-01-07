import { ChevronDown, Search, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ALL_GENDERS, GenderType } from "@/constants/profileOptions";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface GenderPreferencesSelectorProps {
  values: GenderType[];
  onChange: (values: GenderType[]) => void;
  className?: string;
}

// Simplified options for "who I want to meet"
const PREFERENCE_OPTIONS: { value: GenderType; label: string; emoji: string }[] = [
  { value: "woman", label: "Mujeres", emoji: "👩" },
  { value: "man", label: "Hombres", emoji: "👨" },
  { value: "non_binary", label: "No binarios", emoji: "🌟" },
];

export const GenderPreferencesSelector = ({ values, onChange, className }: GenderPreferencesSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleValue = (genderValue: GenderType) => {
    if (values.includes(genderValue)) {
      onChange(values.filter(v => v !== genderValue));
    } else {
      onChange([...values, genderValue]);
    }
  };

  const otherSelected = values.filter(v => !PREFERENCE_OPTIONS.some(p => p.value === v));
  
  const filteredAll = ALL_GENDERS.filter(g => 
    g.label.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !PREFERENCE_OPTIONS.some(p => p.value === g.value)
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <label className="font-body text-sm font-medium text-foreground">
          ¿A quién te gustaría conocer?
        </label>
        <p className="text-xs text-muted-foreground mt-0.5">Puedes elegir varios</p>
      </div>
      
      {/* Main options as styled toggle buttons */}
      <div className="grid grid-cols-3 gap-3">
        {PREFERENCE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleValue(option.value)}
            className={cn(
              "relative py-4 px-3 rounded-2xl font-body text-sm font-semibold transition-all duration-300",
              "border-2 shadow-sm",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              values.includes(option.value)
                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-[1.02]"
                : "bg-card text-card-foreground border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-md dark:border-border/60"
            )}
          >
            {values.includes(option.value) && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
            )}
            <span className="text-lg mb-1 block">{option.emoji}</span>
            {option.label}
          </button>
        ))}
      </div>

      {/* Dropdown for other options */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-body h-12 rounded-xl border-2 transition-all duration-200",
              otherSelected.length > 0 
                ? "border-primary bg-primary/5 text-foreground font-medium" 
                : "border-border/60 hover:border-primary/50"
            )}
          >
            <span className="flex items-center gap-2">
              {otherSelected.length > 0 && (
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {otherSelected.length}
                </div>
              )}
              {otherSelected.length > 0 
                ? `${otherSelected.length} más seleccionados` 
                : "Más opciones..."}
            </span>
            <ChevronDown className={cn(
              "ml-2 h-4 w-4 shrink-0 transition-transform duration-200",
              open && "rotate-180"
            )} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 bg-popover border-2 border-border shadow-xl z-50" align="start">
          {/* Search input */}
          <div className="p-3 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-background border-border/60 rounded-lg"
              />
            </div>
          </div>
          
          {/* Options list */}
          <div className="max-h-[240px] overflow-y-auto p-2">
            {filteredAll.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No se encontraron opciones
              </p>
            ) : (
              <div className="space-y-1">
                {filteredAll.map((gender) => (
                  <button
                    key={gender.value}
                    type="button"
                    onClick={() => toggleValue(gender.value)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl text-sm font-body transition-all duration-200 flex items-center justify-between",
                      values.includes(gender.value)
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    {gender.label}
                    {values.includes(gender.value) && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected pills */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map(v => {
            const mainOption = PREFERENCE_OPTIONS.find(p => p.value === v);
            const label = mainOption?.label || ALL_GENDERS.find(g => g.value === v)?.label || v;
            const emoji = mainOption?.emoji;
            return (
              <button
                key={v}
                type="button"
                onClick={() => toggleValue(v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-body font-medium hover:bg-primary/20 transition-all duration-200 group border border-primary/20"
              >
                {emoji && <span>{emoji}</span>}
                {label}
                <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GenderPreferencesSelector;
