import { useState } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";
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
    setSearchQuery("");
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <label className="font-body text-base font-black text-foreground tracking-tight">Tu género</label>
      
      {/* Main 3 options as styled toggle buttons */}
      <div className="grid grid-cols-3 gap-3">
        {GENDERS_MAIN.map((gender) => (
          <button
            key={gender.value}
            type="button"
            onClick={() => handleSelect(gender.value)}
            className={cn(
              "relative py-4 px-3 rounded-2xl font-body text-sm font-semibold transition-all duration-300",
              "border-2 shadow-sm",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              value === gender.value
                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-[1.02]"
                : "bg-card text-card-foreground border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-md dark:border-border/60"
            )}
          >
            {value === gender.value && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
            )}
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
              "w-full justify-between font-body h-12 rounded-xl border-2 transition-all duration-200",
              !isMainGender && value 
                ? "border-primary bg-primary/5 text-foreground font-medium" 
                : "border-border/60 hover:border-primary/50"
            )}
          >
            <span className="flex items-center gap-2">
              {!isMainGender && value && (
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
              {!isMainGender && value ? selectedLabel : "Otra identidad..."}
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
                placeholder="Buscar identidad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-background border-border/60 rounded-lg"
              />
            </div>
          </div>
          
          {/* Options list */}
          <div className="max-h-[240px] overflow-y-auto p-2">
            {filteredExtended.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No se encontraron opciones
              </p>
            ) : (
              <div className="space-y-1">
                {filteredExtended.map((gender) => (
                  <button
                    key={gender.value}
                    type="button"
                    onClick={() => handleSelect(gender.value)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl text-sm font-body transition-all duration-200 flex items-center justify-between",
                      value === gender.value
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    {gender.label}
                    {value === gender.value && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear button if selected */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-body group"
        >
          <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          Quitar selección
        </button>
      )}
    </div>
  );
};

export default GenderSelector;
