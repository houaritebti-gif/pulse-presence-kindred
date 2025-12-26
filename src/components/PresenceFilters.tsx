import { useState } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { TRIBES, MUSIC_CATEGORIES, OPTIONAL_DETAILS } from "@/constants/profileOptions";

export interface PresenceFilters {
  tribes: string[];
  musicStyles: string[];
  details: string[];
}

interface PresenceFiltersProps {
  filters: PresenceFilters;
  onChange: (filters: PresenceFilters) => void;
}

const PresenceFiltersComponent = ({ filters, onChange }: PresenceFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const hasActiveFilters = filters.tribes.length > 0 || filters.musicStyles.length > 0 || filters.details.length > 0;
  const activeCount = filters.tribes.length + filters.musicStyles.length + filters.details.length;

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

  const clearFilters = () => {
    onChange({ tribes: [], musicStyles: [], details: [] });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="mb-6 animate-fade-up">
      {/* Filter toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-body text-sm transition-all ${
          hasActiveFilters
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground hover:bg-card/80"
        }`}
      >
        <Filter className="w-4 h-4" />
        <span>Filtrar</span>
        {activeCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-primary-foreground/20 text-xs flex items-center justify-center">
            {activeCount}
          </span>
        )}
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Filter panel */}
      {isOpen && (
        <div className="mt-4 bg-card rounded-2xl p-4 animate-fade-up">
          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <X className="w-3 h-3" />
              Limpiar filtros
            </button>
          )}

          {/* Tribes section */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection("tribes")}
              className="flex items-center justify-between w-full text-left mb-2"
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
                    key={tribe}
                    onClick={() => toggleTribe(tribe)}
                    className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${
                      filters.tribes.includes(tribe)
                        ? "bg-primary text-primary-foreground"
                        : "bg-card-foreground/10 text-card-foreground/70 hover:bg-card-foreground/20"
                    }`}
                  >
                    {tribe}
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

          {/* Details section */}
          <div>
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
        </div>
      )}
    </div>
  );
};

export default PresenceFiltersComponent;
