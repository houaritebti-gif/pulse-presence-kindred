import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// Mock data
const mockAchievements = [
  {
    id: 'ach-1',
    profile_id: 'test-profile-id',
    achievement_key: 'first_spark_sent',
    unlocked_at: new Date().toISOString(),
    metadata: null,
  },
];

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'user_achievements') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: mockAchievements, error: null })),
          })),
          insert: vi.fn(() => Promise.resolve({ error: null })),
        };
      }
      if (table === 'profile_spark_energy') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ 
                data: { current_energy: 100, total_earned: 500 }, 
                error: null 
              })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      };
    }),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  },
}));

// Mock hooks
vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ 
    data: { id: 'test-profile-id', name: 'Test User' },
    isLoading: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/utils/haptics', () => ({
  triggerHaptic: vi.fn(),
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('@/utils/sparkConfetti', () => ({
  fireCommonAchievementConfetti: vi.fn(),
  fireUncommonAchievementConfetti: vi.fn(),
  fireRareAchievementConfetti: vi.fn(),
  fireEpicAchievementConfetti: vi.fn(),
  fireLegendaryAchievementConfetti: vi.fn(),
}));

vi.mock('@/utils/pushNotifications', () => ({
  sendPushNotification: vi.fn(() => Promise.resolve()),
}));

// Import after mocks
import { 
  useAchievements,
  ACHIEVEMENTS,
  getAchievementDefinition,
  getRarityColor,
  getRarityBgColor,
  getRarityLabel,
  type AchievementKey,
} from '@/hooks/useAchievements';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('Achievement Definitions', () => {
  it('should have valid ACHIEVEMENTS array', () => {
    expect(ACHIEVEMENTS).toBeDefined();
    expect(Array.isArray(ACHIEVEMENTS)).toBe(true);
    expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
  });

  it('each achievement should have required properties', () => {
    ACHIEVEMENTS.forEach(achievement => {
      expect(achievement).toHaveProperty('key');
      expect(achievement).toHaveProperty('name');
      expect(achievement).toHaveProperty('description');
      expect(achievement).toHaveProperty('rarity');
      expect(achievement).toHaveProperty('energyReward');
      expect(['common', 'uncommon', 'rare', 'epic', 'legendary']).toContain(achievement.rarity);
      expect(typeof achievement.energyReward).toBe('number');
    });
  });

  it('getAchievementDefinition should return correct achievement', () => {
    const firstAchievement = ACHIEVEMENTS[0];
    const result = getAchievementDefinition(firstAchievement.key);
    
    expect(result).toBeDefined();
    expect(result?.key).toBe(firstAchievement.key);
    expect(result?.name).toBe(firstAchievement.name);
  });

  it('getAchievementDefinition should return undefined for invalid key', () => {
    const result = getAchievementDefinition('invalid_key_that_does_not_exist' as AchievementKey);
    expect(result).toBeUndefined();
  });
});

describe('Rarity Utility Functions', () => {
  it('getRarityColor should return valid color class', () => {
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
    
    rarities.forEach(rarity => {
      const color = getRarityColor(rarity);
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
    });
  });

  it('getRarityBgColor should return valid background class', () => {
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
    
    rarities.forEach(rarity => {
      const bgColor = getRarityBgColor(rarity);
      expect(typeof bgColor).toBe('string');
      expect(bgColor.length).toBeGreaterThan(0);
    });
  });

  it('getRarityLabel should return Spanish label', () => {
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
    const expectedLabels = ['Común', 'Poco común', 'Raro', 'Épico', 'Legendario'];
    
    rarities.forEach((rarity, index) => {
      const label = getRarityLabel(rarity);
      expect(label).toBe(expectedLabels[index]);
    });
  });
});

describe('useAchievements Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return achievements data', () => {
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('achievements');
    expect(result.current).toHaveProperty('isLoading');
  });

  it('should provide isUnlocked function', () => {
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isUnlocked).toBeDefined();
    expect(typeof result.current.isUnlocked).toBe('function');
  });

  it('should provide getUnlockDate function', () => {
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    expect(result.current.getUnlockDate).toBeDefined();
    expect(typeof result.current.getUnlockDate).toBe('function');
  });

  it('should provide checkAndUnlock function for unlocking', () => {
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    expect(result.current.checkAndUnlock).toBeDefined();
  });

  it('should provide checkAndUnlock function', () => {
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    expect(result.current.checkAndUnlock).toBeDefined();
    expect(typeof result.current.checkAndUnlock).toBe('function');
  });

  it('isUnlocked should return boolean', () => {
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    // Use a valid achievement key
    const isFirstSparkUnlocked = result.current.isUnlocked('first_spark_sent');
    expect(typeof isFirstSparkUnlocked).toBe('boolean');
  });

  it('getUnlockDate should return Date or null', () => {
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    const unlockDate = result.current.getUnlockDate('first_spark_sent');
    expect(unlockDate === null || unlockDate instanceof Date).toBe(true);
  });
});
