import { useState } from "react";
import { Filter, X, ChevronDown, ChevronUp, Users, Radio, Calendar, User } from "lucide-react";
import { TRIBES, MUSIC_CATEGORIES, OPTIONAL_DETAILS, LOOKING_FOR_OPTIONS, ALL_GENDERS } from "@/constants/profileOptions";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { GenderType } from "@/constants/profileOptions";

export interface PresenceFilters {
  tribes: string[];
  musicStyles: string[];
  details: string[];
  lookingFor: string[];
  genders: GenderType[];
  showAllProfiles?: boolean;
  ageRange?: [number, number];
}

interface PresenceFiltersProps {
  filters: PresenceFilters;
  onChange: (filters: PresenceFilters) => void;
}

const PresenceFiltersComponent = ({ filters, onChange }: PresenceFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const hasAgeFilter = filters.ageRange && (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 99);
  const hasGenderFilter = filters.genders && filters.genders.length > 0;
  const hasActiveFilters = filters.tribes.length > 0 || filters.musicStyles.length > 0 || filters.details.length > 0 || filters.lookingFor.length > 0 || hasGenderFilter || hasAgeFilter;
  const activeCount = filters.tribes.length + filters.musicStyles.length + filters.details.length + filters.lookingFor.length + filters.genders.length + (hasAgeFilter ? 1 : 0);

  const toggleShowAllProfiles = () => {
    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onChange({ ...filters, showAllProfiles: !filters.showAllProfiles });
  };

  const toggleTribe = (tribe: string) => {
    const newTribes = filters.tribes.includes(tribe)
      ? filters.tribes.filter(t => t !== tribe)
      : [...filters.tribes, tribe];
    onChange({ ...filters, tribes: newTribes });
  };

  const toggleMusicStyle = (style: string) => {
    const newStyles = filters.musicStyles.includes(style)
      ? filters.musicStyles.filter(s => s !== style)
      : [...filters.musicStyles, style];
    onChange({ ...filters, musicStyles: newStyles });
  };

  const toggleDetail = (detail: string) => {
    const newDetails = filters.details.includes(detail)
      ? filters.details.filter(d => d !== detail)
      : [...filters.details, detail];
    onChange({ ...filters, details: newDetails });
  };

  const toggleLookingFor = (option: string) => {
    const newLookingFor = filters.lookingFor.includes(option)
      ? filters.lookingFor.filter(l => l !== option)
      : [...filters.lookingFor, option];
    onChange({ ...filters, lookingFor: newLookingFor });
  };

  const toggleGender = (gender: GenderType) => {
    const newGenders = filters.genders.includes(gender)
      ? filters.genders.filter(g => g !== gender)
      : [...filters.genders, gender];
    onChange({ ...filters, genders: newGenders });
  };

  const handleAgeRangeChange = (value: number[]) => {
    onChange({ ...filters, ageRange: [value[0], value[1]] as [number, number] });
  };

  const clearFilters = () => {
    onChange({ tribes: [], musicStyles: [], details: [], lookingFor: [], genders: [], ageRange: undefined });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="mb-6 animate-fade-up space-y-4">
      {/* Primary toggle - Active now vs All profiles - ALWAYS VISIBLE */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Segmented control for Active/All toggle */}
        <div className="flex bg-card rounded-xl p-1 border border-border w-full sm:w-auto">
          <button
            onClick={() => !filters.showAllProfiles || toggleShowAllProfiles()}
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

        {/* Filter button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            hasActiveFilters
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-card-foreground hover:bg-card/80 border-border"
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filtrar</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary-foreground/20 text-xs flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Filter panel */}
      {isOpen && (
        <div className="bg-card rounded-2xl p-4 animate-fade-up border border-border">

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
          <div className="mb-4">
            <button
              onClick={() => toggleSection("tribes")}
              className="flex items-center justify-between w-full text-left mb-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span className="font-display text-sm font-semibold text-card-foreground">
                Tribus {filters.tribes.length > 0 && `(${filters.tribes.length})`}
              </span>
              {expandedSection === "tribes" ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {expandedSection === "tribes" && (
              <div className="flex flex-wrap gap-2 animate-fade-up">
                {TRIBES.map(tribe => (
                  <button
                    key={tribe.value}
                    onClick={() => toggleTribe(tribe.value)}
                    className={`px-3 py-1.5 rounded-full font-body text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      filters.tribes.includes(tribe.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                    }`}
                  >
                    {tribe.emoji} {tribe.value}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Music section */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection("music")}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <span className="font-display text-sm font-semibold text-card-foreground">
                Música {filters.musicStyles.length > 0 && `(${filters.musicStyles.length})`}
              </span>
              {expandedSection === "music" ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {expandedSection === "music" && (
              <div className="space-y-3 animate-fade-up">
                {MUSIC_CATEGORIES.map(category => (
                  <div key={category.name}>
                    <p className="font-body text-xs text-card-foreground/50 mb-1.5">{category.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {category.styles.map(style => (
                        <button
                          key={style}
                          onClick={() => toggleMusicStyle(style)}
                          className={`px-2.5 py-1 rounded-full font-body text-xs transition-all ${
                            filters.musicStyles.includes(style)
                              ? "bg-primary text-primary-foreground"
                              : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Looking for section */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection("lookingFor")}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <span className="font-display text-sm font-semibold text-card-foreground">
                Busca {filters.lookingFor.length > 0 && `(${filters.lookingFor.length})`}
              </span>
              {expandedSection === "lookingFor" ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {expandedSection === "lookingFor" && (
              <div className="flex flex-wrap gap-2 animate-fade-up">
                {LOOKING_FOR_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => toggleLookingFor(option.value)}
                    className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${
                      filters.lookingFor.includes(option.value)
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                    }`}
                  >
                    {option.emoji} {option.value}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details section */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection("details")}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <span className="font-display text-sm font-semibold text-card-foreground">
                Detalles {filters.details.length > 0 && `(${filters.details.length})`}
              </span>
              {expandedSection === "details" ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {expandedSection === "details" && (
              <div className="flex flex-wrap gap-2 animate-fade-up">
                {OPTIONAL_DETAILS.map(detail => (
                  <button
                    key={detail.key}
                    onClick={() => toggleDetail(detail.key)}
                    className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${
                      filters.details.includes(detail.key)
                        ? "bg-accent text-accent-foreground"
                        : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                    }`}
                  >
                    {detail.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Gender section */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection("gender")}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <span className="font-display text-sm font-semibold text-card-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Género {filters.genders.length > 0 && `(${filters.genders.length})`}
              </span>
              {expandedSection === "gender" ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {expandedSection === "gender" && (
              <div className="flex flex-wrap gap-2 animate-fade-up">
                {ALL_GENDERS.map(gender => (
                  <button
                    key={gender.value}
                    onClick={() => toggleGender(gender.value)}
                    className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${
                      filters.genders.includes(gender.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                    }`}
                  >
                    {gender.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Age range section */}
          <div>
            <button
              onClick={() => toggleSection("age")}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <span className="font-display text-sm font-semibold text-card-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Edad {hasAgeFilter && `(${filters.ageRange?.[0]}-${filters.ageRange?.[1]})`}
              </span>
              {expandedSection === "age" ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
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
        </div>
      )}
    </div>
  );
};

export default PresenceFiltersComponent;
