import { ChevronDown, Search } from "lucide-react";
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
const PREFERENCE_OPTIONS: { value: GenderType; label: string }[] = [
  { value: "woman", label: "Mujeres" },
  { value: "man", label: "Hombres" },
  { value: "non_binary", label: "No binarios" },
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
    <div className={cn("space-y-3", className)}>
      <label className="font-body text-sm text-muted-foreground">
        ¿A quién te gustaría conocer?
        <span className="text-xs ml-1 opacity-70">(puedes elegir varios)</span>
      </label>
      
      {/* Main options as toggle buttons */}
      <div className="flex gap-2">
        {PREFERENCE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleValue(option.value)}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl font-body text-sm font-medium transition-all",
              "border",
              values.includes(option.value)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
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
              "w-full justify-between font-body",
              otherSelected.length > 0 ? "border-primary text-foreground" : ""
            )}
          >
            {otherSelected.length > 0 
              ? `${otherSelected.length} más seleccionados` 
              : "Más opciones..."}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-popover border-border z-50" align="start">
          {/* Search input */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-background"
              />
            </div>
          </div>
          
          {/* Options list */}
          <div className="max-h-[200px] overflow-y-auto p-2">
            {filteredAll.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se encontraron opciones
              </p>
            ) : (
              filteredAll.map((gender) => (
                <button
                  key={gender.value}
                  type="button"
                  onClick={() => toggleValue(gender.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm font-body transition-colors flex items-center justify-between",
                    values.includes(gender.value)
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  {gender.label}
                  {values.includes(gender.value) && (
                    <span className="text-primary">✓</span>
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected pills */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map(v => {
            const label = ALL_GENDERS.find(g => g.value === v)?.label || v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => toggleValue(v)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-body hover:bg-primary/20 transition-colors"
              >
                {label}
                <span className="ml-0.5">×</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GenderPreferencesSelector;