import { useState, useMemo } from "react";
import { Filter, X, ChevronDown, ChevronUp, Users, Radio, Calendar, User, MapPin, Sparkles, Music, Heart, Search, Palette, Star, Save, Bookmark, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { TRIBES, MUSIC_CATEGORIES, OPTIONAL_DETAILS, LOOKING_FOR_OPTIONS, ALL_GENDERS, CULTURAL_INTERESTS } from "@/constants/profileOptions";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { GenderType } from "@/constants/profileOptions";
import { triggerHaptic } from "@/utils/haptics";
import { motion, AnimatePresence } from "framer-motion";
import { useFilterPresets, FilterPreset } from "@/hooks/useFilterPresets";
import { toast } from "sonner";


export interface PresenceFilters {
  tribes: string[];
  musicStyles: string[];
  details: string[];
  lookingFor: string[];
  genders: GenderType[];
  cities: string[];
  interests: string[];
  showAllProfiles?: boolean;
  ageRange?: [number, number];
  minCompatibility?: number;
  hideVisited?: boolean;
}

interface PresenceFiltersProps {
  filters: PresenceFilters;
  onChange: (filters: PresenceFilters) => void;
  availableCities?: string[];
  onRealtimeUpsell?: () => void;
}

const PresenceFiltersComponent = ({ filters, onChange, availableCities = [], onRealtimeUpsell }: PresenceFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [interestSearch, setInterestSearch] = useState("");
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);
  const [presetName, setPresetName] = useState("");

  const { presets, addPreset, deletePreset, getActiveFilterCount } = useFilterPresets();

  const hasAgeFilter = filters.ageRange && (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 99);
  const hasGenderFilter = filters.genders?.length > 0;
  const hasCityFilter = filters.cities?.length > 0;
  const hasCompatibilityFilter = filters.minCompatibility && filters.minCompatibility > 0;
  const hasInterestsFilter = (filters.interests?.length ?? 0) > 0;
  const hasHideVisitedFilter = filters.hideVisited === true;
  const hasActiveFilters = (filters.tribes?.length ?? 0) > 0 || (filters.musicStyles?.length ?? 0) > 0 || (filters.details?.length ?? 0) > 0 || (filters.lookingFor?.length ?? 0) > 0 || hasGenderFilter || hasCityFilter || hasAgeFilter || hasCompatibilityFilter || hasInterestsFilter || hasHideVisitedFilter;
  const activeCount = (filters.tribes?.length ?? 0) + (filters.musicStyles?.length ?? 0) + (filters.details?.length ?? 0) + (filters.lookingFor?.length ?? 0) + (filters.genders?.length ?? 0) + (filters.cities?.length ?? 0) + (filters.interests?.length ?? 0) + (hasAgeFilter ? 1 : 0) + (hasCompatibilityFilter ? 1 : 0) + (hasHideVisitedFilter ? 1 : 0);

  // Sort cities alphabetically
  const sortedCities = useMemo(() => 
    [...availableCities].sort((a, b) => a.localeCompare(b, 'es')),
    [availableCities]
  );

  const handleSavePreset = () => {
    if (activeCount === 0) {
      toast.error("Añade filtros antes de guardar");
      return;
    }
    const saved = addPreset(presetName || `Preset ${presets.length + 1}`, filters);
    toast.success(`Preset "${saved.name}" guardado`);
    setPresetName("");
    setShowSavePresetInput(false);
    triggerHaptic('success');
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    onChange(preset.filters);
    toast.success(`Preset "${preset.name}" aplicado`);
    triggerHaptic('medium');
  };

  const handleDeletePreset = (presetId: string, presetName: string) => {
    deletePreset(presetId);
    toast.success(`Preset "${presetName}" eliminado`);
    triggerHaptic('light');
  };

  const toggleShowAllProfiles = () => {
    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onChange({ ...filters, showAllProfiles: !filters.showAllProfiles });
  };

  const toggleTribe = (tribe: string) => {
    triggerHaptic('light');
    const currentTribes = filters.tribes ?? [];
    const newTribes = currentTribes.includes(tribe)
      ? currentTribes.filter(t => t !== tribe)
      : [...currentTribes, tribe];
    onChange({ ...filters, tribes: newTribes });
  };

  const toggleMusicStyle = (style: string) => {
    triggerHaptic('light');
    const currentStyles = filters.musicStyles ?? [];
    const newStyles = currentStyles.includes(style)
      ? currentStyles.filter(s => s !== style)
      : [...currentStyles, style];
    onChange({ ...filters, musicStyles: newStyles });
  };

  const toggleDetail = (detail: string) => {
    triggerHaptic('light');
    const currentDetails = filters.details ?? [];
    const newDetails = currentDetails.includes(detail)
      ? currentDetails.filter(d => d !== detail)
      : [...currentDetails, detail];
    onChange({ ...filters, details: newDetails });
  };

  const toggleLookingFor = (option: string) => {
    triggerHaptic('light');
    const currentLookingFor = filters.lookingFor ?? [];
    const newLookingFor = currentLookingFor.includes(option)
      ? currentLookingFor.filter(l => l !== option)
      : [...currentLookingFor, option];
    onChange({ ...filters, lookingFor: newLookingFor });
  };

  const toggleGender = (gender: GenderType) => {
    triggerHaptic('light');
    const currentGenders = filters.genders ?? [];
    const newGenders = currentGenders.includes(gender)
      ? currentGenders.filter(g => g !== gender)
      : [...currentGenders, gender];
    onChange({ ...filters, genders: newGenders });
  };

  const toggleCity = (city: string) => {
    triggerHaptic('light');
    const currentCities = filters.cities ?? [];
    const newCities = currentCities.includes(city)
      ? currentCities.filter(c => c !== city)
      : [...currentCities, city];
    onChange({ ...filters, cities: newCities });
  };

  const handleAgeRangeChange = (value: number[]) => {
    onChange({ ...filters, ageRange: [value[0], value[1]] as [number, number] });
  };

  const toggleInterest = (interest: string) => {
    triggerHaptic('light');
    const currentInterests = filters.interests ?? [];
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    onChange({ ...filters, interests: newInterests });
  };

  const clearFilters = () => {
    triggerHaptic('medium');
    // Important: keep showAllProfiles explicitly set so we never fall back to "Activos ahora" due to undefined
    onChange({ tribes: [], musicStyles: [], details: [], lookingFor: [], genders: [], cities: [], interests: [], showAllProfiles: true, ageRange: undefined, minCompatibility: undefined, hideVisited: false });
  };

  const handleMinCompatibilityChange = (value: number) => {
    triggerHaptic('light');
    onChange({ ...filters, minCompatibility: value === 0 ? undefined : value });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };


  return (
    <div className="mb-6 animate-fade-up space-y-4">
      {/* Primary toggle - Active now vs All profiles - ALWAYS VISIBLE */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Segmented control for Active/All toggle */}
        <div className="flex bg-card rounded-xl p-1 border border-foreground/5 dark:border-border shadow-md shadow-foreground/10 dark:shadow-foreground/5 w-full sm:w-auto">
          <button
            onClick={() => {
              if (filters.showAllProfiles) {
                toggleShowAllProfiles();
              }
              // Trigger upsell callback when switching to "Activos ahora"
              if (onRealtimeUpsell && filters.showAllProfiles) {
                onRealtimeUpsell();
              }
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              !filters.showAllProfiles
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-card-foreground"
            }`}
          >
            <Radio className={`w-4 h-4 ${!filters.showAllProfiles ? "animate-pulse" : ""}`} />
            <span className="whitespace-nowrap">Activos ahora</span>
          </button>
          <button
            onClick={() => filters.showAllProfiles || toggleShowAllProfiles()}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              filters.showAllProfiles
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:text-card-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="whitespace-nowrap">Todos</span>
          </button>
        </div>

        {/* Filter button - enhanced design */}
        <motion.button
          onClick={() => { triggerHaptic('light'); setIsOpen(!isOpen); }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl font-body text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            hasActiveFilters
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/25"
              : "bg-card text-card-foreground hover:bg-card/90 border border-foreground/5 dark:border-border hover:border-primary/30 shadow-md shadow-foreground/10 dark:shadow-foreground/5"
          }`}
        >
          <Filter className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
          <span className="font-semibold">Filtros</span>
          <AnimatePresence mode="wait">
            {activeCount > 0 && (
              <motion.span
                key={activeCount}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="min-w-5 h-5 px-1.5 rounded-full bg-white/20 text-xs flex items-center justify-center font-bold"
              >
                {activeCount}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.button>
      </div>


      {/* Active filters summary - show when filters are active */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Activos:</span>
          {(filters.tribes ?? []).map(tribe => (
            <button
              key={tribe}
              onClick={() => {
                triggerHaptic('light');
                toggleTribe(tribe);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[11px] font-medium hover:bg-primary/30 transition-all active:scale-95"
            >
              {tribe}
              <X className="w-3 h-3" />
            </button>
          ))}
          {(filters.musicStyles ?? []).map(style => (
            <button
              key={style}
              onClick={() => {
                triggerHaptic('light');
                toggleMusicStyle(style);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground text-[11px] font-medium hover:bg-accent/30 transition-all active:scale-95"
            >
              {style}
              <X className="w-3 h-3" />
            </button>
          ))}
          {(filters.lookingFor ?? []).map(lf => (
            <button
              key={lf}
              onClick={() => {
                triggerHaptic('light');
                toggleLookingFor(lf);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground text-[11px] font-medium hover:bg-secondary/70 transition-all active:scale-95"
            >
              {lf}
              <X className="w-3 h-3" />
            </button>
          ))}
          {(filters.genders ?? []).map(g => {
            const genderLabel = ALL_GENDERS.find(ag => ag.value === g)?.label || g;
            return (
              <button
                key={g}
                onClick={() => {
                  triggerHaptic('light');
                  toggleGender(g);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-medium hover:bg-muted/80 transition-all active:scale-95"
              >
                {genderLabel}
                <X className="w-3 h-3" />
              </button>
            );
          })}
          {(filters.cities ?? []).map(city => (
            <button
              key={city}
              onClick={() => {
                triggerHaptic('light');
                toggleCity(city);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-medium hover:bg-muted/80 transition-all active:scale-95"
            >
              📍 {city}
              <X className="w-3 h-3" />
            </button>
          ))}
          {hasAgeFilter && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onChange({ ...filters, ageRange: undefined });
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-medium hover:bg-muted/80 transition-colors"
            >
              {filters.ageRange?.[0]}-{filters.ageRange?.[1]} años
              <X className="w-3 h-3" />
            </button>
          )}
          {hasCompatibilityFilter && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onChange({ ...filters, minCompatibility: undefined });
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[11px] font-medium hover:bg-primary/30 transition-all active:scale-95"
            >
              ❤️ {filters.minCompatibility}+ afín
              <X className="w-3 h-3" />
            </button>
          )}
          {(filters.interests ?? []).map(interest => {
            const interestData = CULTURAL_INTERESTS.find(ci => ci.value === interest);
            return (
              <button
                key={interest}
                onClick={() => {
                  triggerHaptic('light');
                  toggleInterest(interest);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground text-[11px] font-medium hover:bg-accent/30 transition-all active:scale-95"
              >
                {interestData?.emoji} {interest}
                <X className="w-3 h-3" />
              </button>
            );
          })}
          <button
            onClick={() => {
              triggerHaptic('medium');
              clearFilters();
            }}
            className="text-xs text-destructive hover:text-destructive/80 font-medium transition-colors"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* Filter panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-2xl p-4 border border-foreground/5 dark:border-border shadow-md shadow-foreground/10 dark:shadow-foreground/5">

              {/* Quick filters section - at the very top */}
              <div className="mb-5 pb-4 border-b border-border">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-display text-sm font-semibold text-card-foreground block">
                      Accesos rápidos
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Filtros frecuentes
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Hide visited toggle */}
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      onChange({ ...filters, hideVisited: !filters.hideVisited });
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-xs font-medium transition-all active:scale-95 ${
                      filters.hideVisited
                        ? "bg-secondary text-secondary-foreground shadow-sm"
                        : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                    }`}
                  >
                    {filters.hideVisited ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    Solo nuevos
                  </button>

                  {/* Compatibility filter chips */}
                  {[1, 2, 3, 4].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleMinCompatibilityChange(filters.minCompatibility === level ? 0 : level)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-xs font-medium transition-all active:scale-95 ${
                        filters.minCompatibility === level
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${filters.minCompatibility === level ? "fill-current" : ""}`} />
                      {level}+ afín
                    </button>
                  ))}
                  
                  {/* Quick city filter - show top 3 cities */}
                  {sortedCities.slice(0, 3).map((city) => (
                    <button
                      key={city}
                      onClick={() => toggleCity(city)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-xs font-medium transition-all active:scale-95 ${
                        (filters.cities ?? []).includes(city)
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Presets section - always at top */}
              <div className="mb-5 pb-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Bookmark className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <div>
                      <span className="font-display text-sm font-semibold text-card-foreground block">
                        Presets guardados
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {presets.length} {presets.length === 1 ? 'preset' : 'presets'}
                      </span>
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <motion.button
                      onClick={() => setShowSavePresetInput(!showSavePresetInput)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Guardar actual
                    </motion.button>
                  )}
                </div>

                {/* Save preset input */}
                <AnimatePresence>
                  {showSavePresetInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 overflow-hidden"
                    >
                      <div className="flex gap-2">
                        <Input
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          placeholder="Nombre del preset..."
                          className="flex-1 h-9 text-sm"
                          onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                        />
                        <motion.button
                          onClick={handleSavePreset}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
                        >
                          <Save className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Preset list */}
                {presets.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {presets.map((preset, index) => (
                      <motion.div
                        key={preset.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative"
                      >
                        <button
                          onClick={() => handleLoadPreset(preset)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card-foreground/5 hover:bg-card-foreground/10 text-card-foreground text-xs font-medium transition-all active:scale-95 pr-8"
                        >
                          <span>{preset.emoji}</span>
                          <span>{preset.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({getActiveFilterCount(preset.filters)})
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id, preset.name);
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No hay presets guardados. Configura filtros y guárdalos para acceso rápido.
                  </p>
                )}
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
              <X className="w-3 h-3" />
              Limpiar filtros
            </button>
          )}

          {/* Tribes section */}
          <div className="mb-5">
            <button
              onClick={() => { triggerHaptic('light'); toggleSection("tribes"); }}
              className="flex items-center justify-between w-full text-left mb-3 p-2 -mx-2 rounded-xl hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="font-display text-sm font-semibold text-card-foreground block">
                    Tribus
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {(filters.tribes?.length ?? 0) > 0 ? `${filters.tribes?.length} seleccionadas` : "Encuentra tu gente"}
                  </span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedSection === "tribes" ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </button>
            <AnimatePresence>
              {expandedSection === "tribes" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 overflow-hidden"
                >
                  {TRIBES.map((tribe, index) => (
                    <motion.button
                      key={tribe.value}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                      onClick={() => toggleTribe(tribe.value)}
                      className={`px-3 py-1.5 rounded-full font-body text-xs transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        (filters.tribes ?? []).includes(tribe.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                      }`}
                    >
                      {tribe.emoji} {tribe.value}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Music section */}
          <div className="mb-5">
            <button
              onClick={() => { triggerHaptic('light'); toggleSection("music"); }}
              className="flex items-center justify-between w-full text-left mb-3 p-2 -mx-2 rounded-xl hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Music className="w-4 h-4 text-accent-foreground" />
                </div>
                <div>
                  <span className="font-display text-sm font-semibold text-card-foreground block">
                    Música
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {(filters.musicStyles?.length ?? 0) > 0 ? `${filters.musicStyles?.length} estilos` : "¿Qué escuchas?"}
                  </span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedSection === "music" ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </button>
            <AnimatePresence>
              {expandedSection === "music" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {MUSIC_CATEGORIES.map((category, catIndex) => (
                    <motion.div 
                      key={category.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: catIndex * 0.05 }}
                    >
                      <p className="font-body text-xs text-card-foreground/50 mb-1.5">{category.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {category.styles.map((style, styleIndex) => (
                          <motion.button
                            key={style}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: catIndex * 0.05 + styleIndex * 0.02, duration: 0.15 }}
                            onClick={() => toggleMusicStyle(style)}
                            className={`px-2.5 py-1 rounded-full font-body text-xs transition-all active:scale-95 ${
                              (filters.musicStyles ?? []).includes(style)
                                ? "bg-primary text-primary-foreground"
                                : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                            }`}
                          >
                            {style}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Looking for section */}
          <div className="mb-5">
            <button
              onClick={() => { triggerHaptic('light'); toggleSection("lookingFor"); }}
              className="flex items-center justify-between w-full text-left mb-3 p-2 -mx-2 rounded-xl hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <Search className="w-4 h-4 text-secondary-foreground" />
                </div>
                <div>
                  <span className="font-display text-sm font-semibold text-card-foreground block">
                    Busca
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {(filters.lookingFor?.length ?? 0) > 0 ? `${filters.lookingFor?.length} intereses` : "¿Qué buscas aquí?"}
                  </span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedSection === "lookingFor" ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </button>
            <AnimatePresence>
              {expandedSection === "lookingFor" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 overflow-hidden"
                >
                  {LOOKING_FOR_OPTIONS.map((option, index) => (
                    <motion.button
                      key={option.value}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.2 }}
                      onClick={() => toggleLookingFor(option.value)}
                      className={`px-3 py-1.5 rounded-full font-body text-xs transition-all active:scale-95 ${
                        (filters.lookingFor ?? []).includes(option.value)
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                      }`}
                    >
                      {option.emoji} {option.value}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Details section */}
          <div className="mb-5">
            <button
              onClick={() => { triggerHaptic('light'); toggleSection("details"); }}
              className="flex items-center justify-between w-full text-left mb-3 p-2 -mx-2 rounded-xl hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <span className="font-display text-sm font-semibold text-card-foreground block">
                    Estética
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {(filters.details?.length ?? 0) > 0 ? `${filters.details?.length} detalles` : "Tattoos, piercings..."}
                  </span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedSection === "details" ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </button>
            <AnimatePresence>
              {expandedSection === "details" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 overflow-hidden"
                >
                  {OPTIONAL_DETAILS.map((detail, index) => (
                    <motion.button
                      key={detail.key}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.2 }}
                      onClick={() => toggleDetail(detail.key)}
                      className={`px-3 py-1.5 rounded-full font-body text-xs transition-all active:scale-95 ${
                        (filters.details ?? []).includes(detail.key)
                          ? "bg-accent text-accent-foreground"
                          : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                      }`}
                    >
                      {detail.emoji} {detail.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Interests section */}
          <div className="mb-5">
            <button
              onClick={() => { triggerHaptic('light'); toggleSection("interests"); }}
              className="flex items-center justify-between w-full text-left mb-3 p-2 -mx-2 rounded-xl hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-accent-foreground" />
                </div>
                <div>
                  <span className="font-display text-sm font-semibold text-card-foreground block">
                    Intereses
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {(filters.interests?.length ?? 0) > 0 ? `${filters.interests?.length} seleccionados` : "Cultura, hobbies..."}
                  </span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedSection === "interests" ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </button>
            <AnimatePresence>
              {expandedSection === "interests" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar intereses..."
                      value={interestSearch}
                      onChange={(e) => setInterestSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    {interestSearch && (
                      <button
                        onClick={() => setInterestSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Filtered interests */}
                  <div className="max-h-48 overflow-y-auto scrollbar-hide">
                    <div className="flex flex-wrap gap-2">
                      {CULTURAL_INTERESTS
                        .filter(interest => 
                          interest.value.toLowerCase().includes(interestSearch.toLowerCase()) ||
                          interest.emoji.includes(interestSearch)
                        )
                        .map((interest, index) => (
                          <motion.button
                            key={interest.value}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: Math.min(index * 0.01, 0.2), duration: 0.15 }}
                            onClick={() => toggleInterest(interest.value)}
                            className={`px-2.5 py-1.5 rounded-full font-body text-xs transition-all active:scale-95 ${
                              (filters.interests ?? []).includes(interest.value)
                                ? "bg-accent text-accent-foreground"
                                : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                            }`}
                          >
                            {interest.emoji} {interest.value}
                          </motion.button>
                        ))}
                      {CULTURAL_INTERESTS.filter(interest => 
                        interest.value.toLowerCase().includes(interestSearch.toLowerCase()) ||
                        interest.emoji.includes(interestSearch)
                      ).length === 0 && (
                        <p className="text-xs text-muted-foreground py-2">No se encontraron intereses</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Gender section */}
          <div className="mb-5">
            <button
              onClick={() => { triggerHaptic('light'); toggleSection("gender"); }}
              className="flex items-center justify-between w-full text-left mb-3 p-2 -mx-2 rounded-xl hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="font-display text-sm font-semibold text-card-foreground block">
                    Género
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {(filters.genders?.length ?? 0) > 0 ? `${filters.genders?.length} seleccionados` : "Identidad de género"}
                  </span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedSection === "gender" ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </button>
            <AnimatePresence>
              {expandedSection === "gender" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 overflow-hidden"
                >
                  {ALL_GENDERS.map((gender, index) => (
                    <motion.button
                      key={gender.value}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                      onClick={() => toggleGender(gender.value)}
                      className={`px-3 py-1.5 rounded-full font-body text-xs transition-all active:scale-95 ${
                        (filters.genders ?? []).includes(gender.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                      }`}
                    >
                      {gender.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* City section */}
          {sortedCities.length > 0 && (
            <div className="mb-5">
              <button
                onClick={() => { triggerHaptic('light'); toggleSection("city"); }}
                className="flex items-center justify-between w-full text-left mb-3 p-2 -mx-2 rounded-xl hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div>
                    <span className="font-display text-sm font-semibold text-card-foreground block">
                      Ciudad
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {(filters.cities?.length ?? 0) > 0 ? `${filters.cities?.length} ciudades` : "¿Dónde buscas?"}
                    </span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expandedSection === "city" ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </button>
              <AnimatePresence>
                {expandedSection === "city" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2 overflow-hidden"
                  >
                    {sortedCities.map((city, index) => (
                      <motion.button
                        key={city}
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        onClick={() => toggleCity(city)}
                        className={`px-3 py-1.5 rounded-full font-body text-xs transition-all active:scale-95 ${
                          (filters.cities ?? []).includes(city)
                            ? "bg-primary text-primary-foreground"
                            : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                        }`}
                      >
                        {city}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Age range section */}
          <div>
            <button
              onClick={() => { triggerHaptic('light'); toggleSection("age"); }}
              className="flex items-center justify-between w-full text-left mb-3 p-2 -mx-2 rounded-xl hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-secondary-foreground" />
                </div>
                <div>
                  <span className="font-display text-sm font-semibold text-card-foreground block">
                    Edad
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {hasAgeFilter ? `${filters.ageRange?.[0]} - ${filters.ageRange?.[1]} años` : "Rango de edad"}
                  </span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedSection === "age" ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </button>
            {expandedSection === "age" && (
              <div className="space-y-4 animate-fade-up px-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{filters.ageRange?.[0] || 18} años</span>
                  <span>{filters.ageRange?.[1] || 99} años</span>
                </div>
                <Slider
                  value={filters.ageRange || [18, 99]}
                  onValueChange={handleAgeRangeChange}
                  min={18}
                  max={99}
                  step={1}
                  className="w-full"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleAgeRangeChange([18, 25])}
                    className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${
                      filters.ageRange?.[0] === 18 && filters.ageRange?.[1] === 25
                        ? "bg-primary text-primary-foreground"
                        : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                    }`}
                  >
                    18-25
                  </button>
                  <button
                    onClick={() => handleAgeRangeChange([25, 35])}
                    className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${
                      filters.ageRange?.[0] === 25 && filters.ageRange?.[1] === 35
                        ? "bg-primary text-primary-foreground"
                        : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                    }`}
                  >
                    25-35
                  </button>
                  <button
                    onClick={() => handleAgeRangeChange([35, 50])}
                    className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${
                      filters.ageRange?.[0] === 35 && filters.ageRange?.[1] === 50
                        ? "bg-primary text-primary-foreground"
                        : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                    }`}
                  >
                    35-50
                  </button>
                  <button
                    onClick={() => handleAgeRangeChange([18, 99])}
                    className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${
                      !hasAgeFilter
                        ? "bg-primary text-primary-foreground"
                        : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                    }`}
                  >
                    Todas
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Compatibility section */}
          <div className="mb-5">
            <button
              onClick={() => { triggerHaptic('light'); toggleSection("compatibility"); }}
              className="flex items-center justify-between w-full text-left mb-3 p-2 -mx-2 rounded-xl hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="font-display text-sm font-semibold text-card-foreground block">
                    Compatibilidad mínima
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {hasCompatibilityFilter ? `${filters.minCompatibility}+ coincidencias` : "Filtrar por afinidad"}
                  </span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedSection === "compatibility" ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </button>
            <AnimatePresence>
              {expandedSection === "compatibility" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div className="flex gap-2 flex-wrap">
                    {[0, 1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => handleMinCompatibilityChange(level)}
                        className={`px-4 py-2 rounded-full font-body text-sm transition-all active:scale-95 flex items-center gap-1.5 ${
                          (filters.minCompatibility || 0) === level
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                        }`}
                      >
                        {level === 0 ? (
                          "Cualquiera"
                        ) : (
                          <>
                            <Heart className={`w-3.5 h-3.5 ${(filters.minCompatibility || 0) === level ? "fill-current" : ""}`} />
                            {level}+ {level === 5 ? "💫" : ""}
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    La compatibilidad incluye tribus, música, intereses y lo que buscas.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PresenceFiltersComponent;
