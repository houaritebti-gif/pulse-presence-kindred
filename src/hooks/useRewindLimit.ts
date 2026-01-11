import { useState, useEffect } from "react";
import { useSubscription } from "./useSubscription";

const STORAGE_KEY = "kiki_rewind_data";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface RewindData {
  usedThisWeek: number;
  weekStart: number;
}

interface RewindLimits {
  free: number;
  plus: number;
  premium: number;
}

const REWIND_LIMITS: RewindLimits = {
  free: 2,      // 2 per week
  plus: 10,     // 10 per week (5x free)
  premium: -1,  // unlimited (-1)
};

const getRewindData = (): RewindData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: RewindData = JSON.parse(stored);
      // Check if we're still in the same week
      const now = Date.now();
      if (now - data.weekStart >= WEEK_MS) {
        // New week - reset counter
        const newData: RewindData = { usedThisWeek: 0, weekStart: now };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        return newData;
      }
      return data;
    }
  } catch (e) {
    console.log("[RewindLimit] Error reading data:", e);
  }
  // Default - start fresh week
  const newData: RewindData = { usedThisWeek: 0, weekStart: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  return newData;
};

const saveRewindData = (data: RewindData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const useRewindLimit = () => {
  const { tier } = useSubscription();
  const [data, setData] = useState<RewindData>(() => getRewindData());

  // Refresh data on mount and when tier changes
  useEffect(() => {
    setData(getRewindData());
  }, [tier]);

  const limit = REWIND_LIMITS[tier] ?? REWIND_LIMITS.free;
  const isUnlimited = limit === -1;
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - data.usedThisWeek);
  const canRewind = isUnlimited || remaining > 0;

  const useRewind = (): boolean => {
    if (!canRewind) return false;

    const newData: RewindData = {
      ...data,
      usedThisWeek: data.usedThisWeek + 1,
    };
    saveRewindData(newData);
    setData(newData);
    return true;
  };

  // Get a friendly message about the limit
  const getLimitMessage = (): string => {
    if (isUnlimited) return "Rebobinados ilimitados";
    if (remaining === 0) {
      return "Sin rebobinados esta semana";
    }
    return `${remaining} rebobinado${remaining !== 1 ? "s" : ""} esta semana`;
  };

  return {
    canRewind,
    remaining: isUnlimited ? undefined : remaining,
    usedThisWeek: data.usedThisWeek,
    limit: isUnlimited ? undefined : limit,
    isUnlimited,
    useRewind,
    getLimitMessage,
    tier,
  };
};
