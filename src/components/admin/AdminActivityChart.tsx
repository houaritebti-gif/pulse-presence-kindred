import { useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAdminActivityChart } from "@/hooks/useAdminData";
import { TrendingUp, Users, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type PeriodOption = 7 | 30 | 90;

const AdminActivityChart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(7);
  const { data: chartData, isLoading } = useAdminActivityChart(selectedPeriod);

  const periodLabels: Record<PeriodOption, string> = {
    7: '7 días',
    30: '30 días',
    90: '90 días',
  };

  if (isLoading) {
    return (
      <div className="p-5 rounded-xl border-2 border-border bg-card">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[250px] w-full" />
      </div>
    );
  }

  const totalNewUsers = chartData?.reduce((sum, d) => sum + d.newUsers, 0) || 0;
  const totalVerifications = chartData?.reduce((sum, d) => sum + d.verifications, 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="p-5 rounded-xl border-2 border-border bg-card"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Actividad últimos {periodLabels[selectedPeriod]}</h3>
            <p className="text-xs text-muted-foreground">Nuevos usuarios y verificaciones</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
            {([7, 30, 90] as PeriodOption[]).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className="h-7 px-2.5 text-xs font-medium"
              >
                {periodLabels[period]}
              </Button>
            ))}
          </div>
          <div className="flex gap-3 text-sm ml-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{totalNewUsers}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[hsl(160,60%,45%)] dark:text-[hsl(160,70%,55%)]" />
              <span className="font-semibold text-foreground">{totalVerifications}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorVerifications" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '2px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>
                  {value === 'newUsers' ? 'Nuevos usuarios' : 'Verificaciones'}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="newUsers"
              name="newUsers"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorNewUsers)"
            />
            <Area
              type="monotone"
              dataKey="verifications"
              name="verifications"
              stroke="hsl(160, 60%, 45%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorVerifications)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default AdminActivityChart;
