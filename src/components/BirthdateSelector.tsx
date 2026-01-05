import { useState, useMemo } from "react";
import { Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BirthdateSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

const MONTHS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

export const BirthdateSelector = ({ value, onChange, className }: BirthdateSelectorProps) => {
  // Parse existing value
  const parsed = useMemo(() => {
    if (!value) return { day: "", month: "", year: "" };
    const parts = value.split("-");
    return {
      year: parts[0] || "",
      month: parts[1] || "",
      day: parts[2] || "",
    };
  }, [value]);

  const [day, setDay] = useState(parsed.day);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  // Generate year options (18-100 years old)
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const result = [];
    for (let y = currentYear - 18; y >= currentYear - 100; y--) {
      result.push(y.toString());
    }
    return result;
  }, [currentYear]);

  // Generate day options based on month and year
  const days = useMemo(() => {
    const daysInMonth = month && year 
      ? new Date(parseInt(year), parseInt(month), 0).getDate()
      : 31;
    return Array.from({ length: daysInMonth }, (_, i) => 
      (i + 1).toString().padStart(2, "0")
    );
  }, [month, year]);

  // Calculate age
  const age = useMemo(() => {
    if (!day || !month || !year) return null;
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, [day, month, year]);

  const updateValue = (newDay: string, newMonth: string, newYear: string) => {
    if (newDay && newMonth && newYear) {
      onChange(`${newYear}-${newMonth}-${newDay}`);
    } else {
      onChange(null);
    }
  };

  const handleDayChange = (newDay: string) => {
    setDay(newDay);
    updateValue(newDay, month, year);
  };

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);
    // Adjust day if it exceeds days in new month
    const daysInNewMonth = year 
      ? new Date(parseInt(year), parseInt(newMonth), 0).getDate()
      : 31;
    const adjustedDay = day && parseInt(day) > daysInNewMonth 
      ? daysInNewMonth.toString().padStart(2, "0") 
      : day;
    if (adjustedDay !== day) setDay(adjustedDay);
    updateValue(adjustedDay, newMonth, year);
  };

  const handleYearChange = (newYear: string) => {
    setYear(newYear);
    updateValue(day, month, newYear);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <label className="font-body text-sm font-medium text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Fecha de nacimiento
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">Solo mostramos tu edad, no la fecha exacta</p>
        </div>
        {age !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-sm font-bold text-primary">{age}</span>
            <span className="text-xs text-primary/80">años</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {/* Day */}
        <Select value={day} onValueChange={handleDayChange}>
          <SelectTrigger className="h-12 rounded-xl border-2 border-border/60 hover:border-primary/50 transition-colors">
            <SelectValue placeholder="Día" />
          </SelectTrigger>
          <SelectContent className="max-h-[240px]">
            {days.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Month */}
        <Select value={month} onValueChange={handleMonthChange}>
          <SelectTrigger className="h-12 rounded-xl border-2 border-border/60 hover:border-primary/50 transition-colors">
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year */}
        <Select value={year} onValueChange={handleYearChange}>
          <SelectTrigger className="h-12 rounded-xl border-2 border-border/60 hover:border-primary/50 transition-colors">
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent className="max-h-[240px]">
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default BirthdateSelector;
