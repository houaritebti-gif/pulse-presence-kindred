import { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface BirthdateSelectorProps {
  value: string | null;
  onChange: (date: string | null) => void;
}

const BirthdateSelector = ({ value, onChange }: BirthdateSelectorProps) => {
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

  const isValidAge = (birthdate: string): boolean => {
    const age = calculateAge(birthdate);
    return age >= minAge;
  };

  const age = value ? calculateAge(value) : null;
  const showAgeError = value && age !== null && age < minAge;

  const handleChange = (type: "year" | "month" | "day", val: string) => {
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

  return (
    <div className="space-y-4">
      <Label className="text-base font-black text-foreground tracking-tight">Fecha de nacimiento</Label>
      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
        {/* Day selector - larger touch target */}
        <Select value={selectedDay} onValueChange={(v) => handleChange("day", v)}>
          <SelectTrigger 
            className="flex-1 min-w-[75px] h-14 text-base touch-manipulation"
            aria-label="Seleccionar día"
          >
            <SelectValue placeholder="Día" />
          </SelectTrigger>
          <SelectContent 
            position="popper" 
            side="bottom" 
            align="start"
            className="max-h-[50vh]"
            sideOffset={8}
          >
            {days.map((day) => (
              <SelectItem 
                key={day} 
                value={day}
                className="h-12 text-base"
              >
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Month selector */}
        <Select value={selectedMonth} onValueChange={(v) => handleChange("month", v)}>
          <SelectTrigger 
            className="flex-[2] min-w-[120px] h-14 text-base touch-manipulation"
            aria-label="Seleccionar mes"
          >
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent 
            position="popper" 
            side="bottom" 
            align="center"
            className="max-h-[50vh]"
            sideOffset={8}
          >
            {months.map((month) => (
              <SelectItem 
                key={month.value} 
                value={month.value}
                className="h-12 text-base"
              >
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year selector */}
        <Select value={selectedYear} onValueChange={(v) => handleChange("year", v)}>
          <SelectTrigger 
            className="flex-1 min-w-[90px] h-14 text-base touch-manipulation"
            aria-label="Seleccionar año"
          >
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent 
            position="popper" 
            side="bottom" 
            align="end"
            className="max-h-[50vh]"
            sideOffset={8}
          >
            {years.map((year) => (
              <SelectItem 
                key={year} 
                value={String(year)}
                className="h-12 text-base"
              >
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showAgeError && (
        <div 
          className="flex items-center gap-2 text-destructive text-sm p-3 rounded-xl bg-destructive/10"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Debes tener al menos 18 años para usar esta aplicación</span>
        </div>
      )}

      {age !== null && age >= minAge && (
        <p className="text-sm text-muted-foreground">
          Edad: <span className="font-medium text-foreground">{age} años</span>
        </p>
      )}
    </div>
  );
};

export { BirthdateSelector, type BirthdateSelectorProps };
export default BirthdateSelector;
