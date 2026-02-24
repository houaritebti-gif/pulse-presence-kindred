import { motion } from "framer-motion";
import { 
  MapPin, Calendar, Heart, Sparkles, Music, 
  Users, Target, Check, Edit2 
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ALL_GENDERS, VIBES, TRIBES } from "@/constants/profileOptions";
import { GenderType } from "@/constants/profileOptions";

interface OnboardingSummaryProps {
  name: string;
  city: string;
  zone: string;
  birthdate: string | null;
  selectedGender: GenderType | null;
  selectedGenderPreferences: GenderType[];
  selectedInterests: string[];
  selectedVibes: string[];
  selectedTribes: string[];
  selectedMusicStyles: string[];
  selectedLookingFor: string[];
  bio: string;
  avatarUrl: string | null;
  onEditStep: (step: number) => void;
}

const OnboardingSummary = ({
  name,
  city,
  zone,
  birthdate,
  selectedGender,
  selectedGenderPreferences,
  selectedInterests,
  selectedVibes,
  selectedTribes,
  selectedMusicStyles,
  selectedLookingFor,
  bio,
  avatarUrl,
  onEditStep,
}: OnboardingSummaryProps) => {
  const calculateAge = (birthdateStr: string): number => {
    const today = new Date();
    const birth = new Date(birthdateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = birthdate && !birthdate.includes("0000") ? calculateAge(birthdate) : null;
  const fullCity = zone ? `${city} - ${zone}` : city;
  
  const genderLabel = selectedGender 
    ? ALL_GENDERS.find(g => g.value === selectedGender)?.label 
    : null;

  const vibesData = selectedVibes.map(v => 
    VIBES.find(vibe => vibe.value === v)
  ).filter(Boolean);

  const tribesData = selectedTribes.map(t => 
    TRIBES.find(tribe => tribe.value === t)
  ).filter(Boolean);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Map summary fields to their edit step numbers in the new flow
  const SummaryRow = ({ 
    icon: Icon, 
    label, 
    value, 
    step,
    badges,
  }: { 
    icon: typeof MapPin; 
    label: string; 
    value?: string | null;
    step: number;
    badges?: string[];
  }) => (
    <motion.div 
      variants={itemVariants}
      className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground/80 mb-0.5 font-medium">{label}</p>
        {badges && badges.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {badges.slice(0, 4).map((badge, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="text-xs font-semibold bg-black dark:bg-white/15 text-[hsl(344,80%,65%)] dark:text-[hsl(344,80%,73%)] border-0"
              >
                {badge}
              </Badge>
            ))}
            {badges.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{badges.length - 4}
              </Badge>
            )}
          </div>
        ) : (
          <p className={cn(
            "text-sm font-semibold truncate text-foreground",
            !value && "text-muted-foreground italic font-medium"
          )}>
            {value || "No especificado"}
          </p>
        )}
      </div>
      <button
        onClick={() => onEditStep(step)}
        className="flex-shrink-0 p-2 rounded-full hover:bg-muted/60 transition-colors touch-manipulation"
        aria-label={`Editar ${label}`}
      >
        <Edit2 className="w-4 h-4 text-muted-foreground" />
      </button>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header with avatar and name */}
      <motion.div 
        className="flex flex-col items-center mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative mb-4">
          <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-lg">
            <AvatarImage src={avatarUrl || undefined} alt={name} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {name.charAt(0).toUpperCase() || "K"}
            </AvatarFallback>
          </Avatar>
          <motion.div
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
          >
            <Check className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        </div>
        <h2 className="text-xl font-bold">{name || "Tu perfil"}</h2>
        <p className="text-muted-foreground text-sm">
          {age && `${age} años · `}{fullCity}
        </p>
      </motion.div>

      {/* Summary list – step numbers map to the new 7-step flow */}
      <motion.div 
        className="flex-1 overflow-y-auto -mx-1 px-1"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
          <SummaryRow 
            icon={Target} 
            label="Buscas" 
            step={1}
            badges={selectedLookingFor}
          />
          <SummaryRow 
            icon={Calendar} 
            label="Edad" 
            value={age ? `${age} años` : null}
            step={2}
          />
          <SummaryRow 
            icon={Sparkles} 
            label="Vibras" 
            step={3}
            badges={vibesData.map(v => v ? `${v.emoji} ${v.value}` : "")}
          />
          <SummaryRow 
            icon={Heart} 
            label="Quieres ver" 
            step={4}
            badges={selectedGenderPreferences.map(g => 
              ALL_GENDERS.find(gender => gender.value === g)?.label || g
            )}
          />
          <SummaryRow 
            icon={MapPin} 
            label="Ciudad" 
            value={fullCity}
            step={5}
          />
          {genderLabel && (
            <SummaryRow 
              icon={Heart} 
              label="Género" 
              value={genderLabel}
              step={4}
            />
          )}
          {selectedTribes.length > 0 && (
            <SummaryRow 
              icon={Users} 
              label="Tribus" 
              step={7}
              badges={tribesData.map(t => t ? `${t.emoji} ${t.value}` : "")}
            />
          )}
          {selectedMusicStyles.length > 0 && (
            <SummaryRow 
              icon={Music} 
              label="Música" 
              step={7}
              badges={selectedMusicStyles}
            />
          )}
          {selectedInterests.length > 0 && (
            <SummaryRow 
              icon={Sparkles} 
              label="Intereses" 
              step={7}
              badges={selectedInterests}
            />
          )}
        </div>
      </motion.div>

      {/* Confirmation message */}
      <motion.div 
        className="mt-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-sm text-muted-foreground">
          ¿Todo listo? Pulsa <span className="font-semibold text-primary">¡Empezar!</span> para unirte a KIKI
        </p>
      </motion.div>
    </div>
  );
};

export default OnboardingSummary;
