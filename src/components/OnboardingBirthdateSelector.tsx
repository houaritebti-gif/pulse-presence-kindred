import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Check, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";

interface OnboardingBirthdateSelectorProps {
  value: string | null;
  onChange: (date: string | null) => void;
}

const OnboardingBirthdateSelector = ({ value, onChange }: OnboardingBirthdateSelectorProps) => {
  const currentYear = new Date().getFullYear();
  const minAge = 18;
  const maxAge = 100;
  
  const years = useMemo(() => {
    const yearList = [];
    for (let year = currentYear - minAge; year >= currentYear - maxAge; year--) {
      yearList.push(year);
    }
    return yearList;
  }, [currentYear]);

  const months = [
    { value: "01", label: "Enero", short: "Ene" },
    { value: "02", label: "Febrero", short: "Feb" },
    { value: "03", label: "Marzo", short: "Mar" },
    { value: "04", label: "Abril", short: "Abr" },
    { value: "05", label: "Mayo", short: "May" },
    { value: "06", label: "Junio", short: "Jun" },
    { value: "07", label: "Julio", short: "Jul" },
    { value: "08", label: "Agosto", short: "Ago" },
    { value: "09", label: "Septiembre", short: "Sep" },
    { value: "10", label: "Octubre", short: "Oct" },
    { value: "11", label: "Noviembre", short: "Nov" },
    { value: "12", label: "Diciembre", short: "Dic" },
  ];

  const getDaysInMonth = (month: string, year: string) => {
    if (!month || !year) return 31;
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  };

  const parsed = value ? value.split("-") : ["", "", ""];
  const selectedYear = parsed[0] || "";
  const selectedMonth = parsed[1] || "";
  const selectedDay = parsed[2] || "";

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => 
    String(i + 1).padStart(2, "0")
  );

  const calculateAge = (birthdate: string): number => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = value && !value.includes("0000") && !value.includes("00-00") 
    ? calculateAge(value) 
    : null;
  const showAgeError = age !== null && age < minAge;
  const isComplete = selectedDay && selectedMonth && selectedYear && !showAgeError;

  const handleChange = (type: "year" | "month" | "day", val: string) => {
    triggerHaptic("selection");
    
    let newYear = selectedYear;
    let newMonth = selectedMonth;
    let newDay = selectedDay;

    if (type === "year") newYear = val;
    if (type === "month") newMonth = val;
    if (type === "day") newDay = val;

    if (newYear && newMonth && newDay) {
      const newDate = `${newYear}-${newMonth}-${newDay}`;
      onChange(newDate);
    } else if (newYear || newMonth || newDay) {
      const partialDate = `${newYear || "0000"}-${newMonth || "00"}-${newDay || "00"}`;
      onChange(partialDate);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "tween" as const,
        duration: 0.2,
      }
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  return (
    <motion.div 
      className="space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hint */}
      <motion.div 
        className="flex items-center gap-2 text-muted-foreground"
        variants={itemVariants}
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm">Solo mostraremos tu edad, no la fecha</span>
      </motion.div>

      {/* Date selectors */}
      <motion.div 
        className="flex gap-3"
        variants={itemVariants}
      >
        {/* Day */}
        <div className="flex-1">
          <Select value={selectedDay} onValueChange={(v) => handleChange("day", v)}>
            <SelectTrigger 
              className={cn(
                "w-full h-14 text-base rounded-2xl border-2 transition-all duration-200 touch-manipulation",
                selectedDay 
                  ? "border-primary/40 bg-primary/5" 
                  : "border-border/60 hover:border-primary/30"
              )}
              aria-label="Seleccionar día"
            >
              <SelectValue placeholder="Día" />
            </SelectTrigger>
            <SelectContent 
              position="popper" 
              side="bottom" 
              align="center"
              className="max-h-[60vh] z-50"
              sideOffset={8}
              collisionPadding={16}
            >
              {days.map((day) => (
                <SelectItem 
                  key={day} 
                  value={day}
                  className="h-11 text-base"
                >
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Month */}
        <div className="flex-[1.5]">
          <Select value={selectedMonth} onValueChange={(v) => handleChange("month", v)}>
            <SelectTrigger 
              className={cn(
                "w-full h-14 text-base rounded-2xl border-2 transition-all duration-200 touch-manipulation",
                selectedMonth 
                  ? "border-primary/40 bg-primary/5" 
                  : "border-border/60 hover:border-primary/30"
              )}
              aria-label="Seleccionar mes"
            >
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent 
              position="popper" 
              side="bottom" 
              align="center"
              className="max-h-[60vh] z-50"
              sideOffset={8}
              collisionPadding={16}
            >
              {months.map((month) => (
                <SelectItem 
                  key={month.value} 
                  value={month.value}
                  className="h-11 text-base"
                >
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year */}
        <div className="flex-1">
          <Select value={selectedYear} onValueChange={(v) => handleChange("year", v)}>
            <SelectTrigger 
              className={cn(
                "w-full h-14 text-base rounded-2xl border-2 transition-all duration-200 touch-manipulation",
                selectedYear 
                  ? "border-primary/40 bg-primary/5" 
                  : "border-border/60 hover:border-primary/30"
              )}
              aria-label="Seleccionar año"
            >
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent 
              position="popper" 
              side="bottom" 
              align="center"
              className="max-h-[60vh] z-50"
              sideOffset={8}
              collisionPadding={16}
            >
              {years.map((year) => (
                <SelectItem 
                  key={year} 
                  value={String(year)}
                  className="h-11 text-base"
                >
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Age error */}
      <AnimatePresence>
        {showAgeError && (
          <motion.div 
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div 
              className="flex items-center gap-3 text-destructive text-sm p-4 rounded-2xl bg-destructive/10 border border-destructive/20"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">Debes tener al menos 18 años para usar KIKI</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success age display */}
      <AnimatePresence>
        {age !== null && age >= minAge && isComplete && (
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary font-semibold text-base shadow-sm">
              <Check className="w-5 h-5" />
              {age} años
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingBirthdateSelector;
