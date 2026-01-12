import { useState, useEffect } from "react";
import { Eye, Heart, Flame, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

interface ProfileStats {
  ghostMessagesReceived: number;
  ghostMessagesSent: number;
  sparksCreated: number;
  matchRate: number;
}

const ProfileStatsCard = () => {
  const { data: profile } = useProfile();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return;

      try {
        // Fetch ghost messages received
        const { count: receivedCount } = await supabase
          .from("ghost_messages")
          .select("id", { count: "exact", head: true })
          .eq("to_profile_id", profile.id);

        // Fetch ghost messages sent
        const { count: sentCount } = await supabase
          .from("ghost_messages")
          .select("id", { count: "exact", head: true })
          .eq("from_profile_id", profile.id);

        // Fetch spark chats (matches)
        const { count: sparkCount } = await supabase
          .from("spark_chats")
          .select("id", { count: "exact", head: true })
          .or(`profile_a_id.eq.${profile.id},profile_b_id.eq.${profile.id}`);

        // Calculate match rate (sparks / received messages)
        const matchRate = receivedCount && receivedCount > 0 
          ? Math.round((sparkCount || 0) / receivedCount * 100) 
          : 0;

        setStats({
          ghostMessagesReceived: receivedCount || 0,
          ghostMessagesSent: sentCount || 0,
          sparksCreated: sparkCount || 0,
          matchRate: Math.min(matchRate, 100), // Cap at 100%
        });
      } catch (error) {
        console.error("Error fetching profile stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [profile?.id]);

  if (isLoading || !stats) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-foreground/5 shadow-md shadow-foreground/10 animate-pulse">
        <div className="h-20" />
      </div>
    );
  }

  const statItems = [
    {
      icon: Eye,
      value: stats.ghostMessagesReceived,
      label: "Chispas recibidas",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Sparkles,
      value: stats.ghostMessagesSent,
      label: "Chispas enviadas",
      color: "text-accent-foreground",
      bgColor: "bg-accent/20",
    },
    {
      icon: Flame,
      value: stats.sparksCreated,
      label: "Matches",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: TrendingUp,
      value: `${stats.matchRate}%`,
      label: "Ratio match",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-foreground/5 shadow-md shadow-foreground/10"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-card-foreground">
            Tus estadísticas
          </h3>
          <p className="text-xs text-muted-foreground">
            Resumen de tu actividad en KIKI
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`${item.bgColor} rounded-xl p-3 flex flex-col items-center justify-center gap-1`}
          >
            <item.icon className={`w-5 h-5 ${item.color}`} />
            <span className={`text-xl font-bold ${item.color}`}>
              {item.value}
            </span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ProfileStatsCard;
