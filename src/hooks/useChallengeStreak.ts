import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

export interface StreakDay {
  date: string;
  completedCount: number;
  totalCount: number;
  allCompleted: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDaysCompleted: number;
  last30Days: StreakDay[];
}

export const useChallengeStreak = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['challenge_streak', profile?.id],
    queryFn: async (): Promise<StreakData> => {
      if (!profile?.id) throw new Error('No profile');

      // Get last 30 days of challenge progress
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_challenge_progress')
        .select('challenge_date, completed_at')
        .eq('profile_id', profile.id)
        .gte('challenge_date', thirtyDaysAgoStr)
        .order('challenge_date', { ascending: true });

      if (error) throw error;

      // Group by date
      const dateMap = new Map<string, { completed: number; total: number }>();
      
      (data || []).forEach(row => {
        const date = row.challenge_date;
        const existing = dateMap.get(date) || { completed: 0, total: 0 };
        existing.total += 1;
        if (row.completed_at) existing.completed += 1;
        dateMap.set(date, existing);
      });

      // Build last 30 days array
      const last30Days: StreakDay[] = [];
      const today = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayData = dateMap.get(dateStr);
        
        last30Days.push({
          date: dateStr,
          completedCount: dayData?.completed || 0,
          totalCount: dayData?.total || 0,
          allCompleted: dayData ? dayData.completed >= 3 && dayData.total >= 3 : false,
        });
      }

      // Calculate current streak (consecutive days with all challenges completed, ending today or yesterday)
      let currentStreak = 0;
      const todayStr = today.toISOString().split('T')[0];
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Start from today and go backwards
      for (let i = last30Days.length - 1; i >= 0; i--) {
        const day = last30Days[i];
        
        // Skip today if no challenges yet (day not started)
        if (day.date === todayStr && day.totalCount === 0) continue;
        
        if (day.allCompleted) {
          currentStreak++;
        } else {
          // If it's today and not all completed, check if yesterday was completed
          if (day.date === todayStr) continue;
          break;
        }
      }

      // Calculate longest streak ever
      let longestStreak = 0;
      let tempStreak = 0;
      
      // Get all historical data for longest streak
      const { data: allData, error: allError } = await supabase
        .from('daily_challenge_progress')
        .select('challenge_date, completed_at')
        .eq('profile_id', profile.id)
        .order('challenge_date', { ascending: true });

      if (!allError && allData) {
        const allDateMap = new Map<string, { completed: number; total: number }>();
        
        allData.forEach(row => {
          const date = row.challenge_date;
          const existing = allDateMap.get(date) || { completed: 0, total: 0 };
          existing.total += 1;
          if (row.completed_at) existing.completed += 1;
          allDateMap.set(date, existing);
        });

        // Sort dates and check for consecutive completed days
        const sortedDates = Array.from(allDateMap.keys()).sort();
        let prevDate: Date | null = null;

        for (const dateStr of sortedDates) {
          const dayData = allDateMap.get(dateStr)!;
          const allCompleted = dayData.completed >= 3 && dayData.total >= 3;
          const currentDate = new Date(dateStr);

          if (allCompleted) {
            if (prevDate) {
              const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
              if (daysDiff === 1) {
                tempStreak++;
              } else {
                tempStreak = 1;
              }
            } else {
              tempStreak = 1;
            }
            longestStreak = Math.max(longestStreak, tempStreak);
            prevDate = currentDate;
          } else {
            tempStreak = 0;
            prevDate = null;
          }
        }
      }

      // Count total days with all challenges completed
      const totalDaysCompleted = last30Days.filter(d => d.allCompleted).length;

      return {
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
        totalDaysCompleted,
        last30Days,
      };
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export default useChallengeStreak;
