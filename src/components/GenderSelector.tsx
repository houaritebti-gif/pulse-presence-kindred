import { useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { GENDERS_MAIN, GENDERS_EXTENDED, ALL_GENDERS, GenderType } from "@/constants/profileOptions";
import { cn } from "@/lib/utils";

interface GenderSelectorProps {
  value: GenderType | null;
  onChange: (value: GenderType | null) => void;
  className?: string;
}

export const GenderSelector = ({ value, onChange, className }: GenderSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [showExtended, setShowExtended] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedLabel = value 
    ? ALL_GENDERS.find(g => g.value === value)?.label 
    : null;

  const isMainGender = value && GENDERS_MAIN.some(g => g.value === value);

  const filteredExtended = GENDERS_EXTENDED.filter(g => 
    g.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (genderValue: GenderType) => {
    onChange(genderValue);
    setOpen(false);
    setShowExtended(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    onChange(null);
    setShowExtended(false);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label className="font-body text-sm text-muted-foreground">Tu género</label>
      
      {/* Main 3 options as buttons */}
      <div className="flex gap-2">
        {GENDERS_MAIN.map((gender) => (
          <button
            key={gender.value}
            type="button"
            onClick={() => handleSelect(gender.value)}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl font-body text-sm font-medium transition-all",
              "border",
              value === gender.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
            {gender.label}
          </button>
        ))}
      </div>

      {/* "Other" dropdown with search */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-body",
              !isMainGender && value ? "border-primary text-foreground" : ""
            )}
          >
            {!isMainGender && value ? selectedLabel : "Otra identidad..."}
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
            {filteredExtended.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se encontraron opciones
              </p>
            ) : (
              filteredExtended.map((gender) => (
                <button
                  key={gender.value}
                  type="button"
                  onClick={() => handleSelect(gender.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm font-body transition-colors",
                    value === gender.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  {gender.label}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear button if selected */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          <X className="w-3 h-3" />
          Quitar selección
        </button>
      )}
    </div>
  );
};

export default GenderSelector;