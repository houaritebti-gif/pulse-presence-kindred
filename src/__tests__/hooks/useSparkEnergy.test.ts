import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// Mock data
const mockSparkEnergy = {
  id: 'test-energy-id',
  profile_id: 'test-profile-id',
  current_energy: 100,
  total_earned: 500,
  current_streak: 3,
  longest_streak: 7,
  last_activity_date: new Date().toISOString().split('T')[0],
};

const mockTransactions = [
  {
    id: 'tx-1',
    profile_id: 'test-profile-id',
    amount: 10,
    type: 'earn',
    action: 'daily_login',
    description: 'Login diario',
    created_at: new Date().toISOString(),
  },
];

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'profile_spark_energy') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: mockSparkEnergy, error: null })),
            })),
          })),
          upsert: vi.fn(() => Promise.resolve({ data: mockSparkEnergy, error: null })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        };
      }
      if (table === 'spark_transactions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null })),
                gte: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null })),
              })),
              gte: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null })),
              })),
            })),
          })),
          insert: vi.fn(() => Promise.resolve({ error: null })),
        };
      }
      if (table === 'spark_purchased_items') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gt: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
              gt: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        };
      }
      if (table === 'user_subscriptions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ 
                data: { tier: 'free' }, 
                error: null 
              })),
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      };
    }),
    rpc: vi.fn(() => Promise.resolve({ data: 50, error: null })),
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

vi.mock('@/components/EnergyGainAnimation', () => ({
  emitEnergyGain: vi.fn(),
}));

vi.mock('@/utils/notificationSound', () => ({
  playEnergyGainSound: vi.fn(),
}));

// Import after mocks
import { 
  useSparkEnergy, 
  SPARK_LEVELS, 
  DAILY_LIMITS, 
  ENERGY_AMOUNTS,
  SHOP_ITEMS,
  getSparkLevel,
  getNextLevel,
  getProgressToNextLevel,
} from '@/hooks/useSparkEnergy';

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

describe('Spark Energy Constants', () => {
  it('should have valid SPARK_LEVELS structure', () => {
    expect(SPARK_LEVELS).toBeDefined();
    expect(Array.isArray(SPARK_LEVELS)).toBe(true);
    expect(SPARK_LEVELS.length).toBeGreaterThan(0);
    
    SPARK_LEVELS.forEach(level => {
      expect(level).toHaveProperty('name');
      expect(level).toHaveProperty('minTotal');
      expect(level).toHaveProperty('level');
      expect(level).toHaveProperty('emoji');
      expect(typeof level.minTotal).toBe('number');
    });
  });

  it('should have valid DAILY_LIMITS', () => {
    expect(DAILY_LIMITS).toBeDefined();
    expect(typeof DAILY_LIMITS.daily_login).toBe('number');
    expect(typeof DAILY_LIMITS.send_ghost).toBe('number');
  });

  it('should have valid ENERGY_AMOUNTS', () => {
    expect(ENERGY_AMOUNTS).toBeDefined();
    expect(typeof ENERGY_AMOUNTS.daily_login).toBe('number');
    expect(typeof ENERGY_AMOUNTS.send_ghost).toBe('number');
  });

  it('should have valid SHOP_ITEMS', () => {
    expect(SHOP_ITEMS).toBeDefined();
    expect(typeof SHOP_ITEMS).toBe('object');
    
    Object.values(SHOP_ITEMS).forEach(item => {
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('cost');
      expect(typeof item.cost).toBe('number');
    });
  });
});

describe('Spark Level Functions', () => {
  it('getSparkLevel should return correct level for energy', () => {
    const level0 = getSparkLevel(0);
    expect(level0).toBeDefined();
    expect(level0.minTotal).toBe(0);
    
    const level1 = getSparkLevel(100);
    expect(level1).toBeDefined();
    
    const highLevel = getSparkLevel(10000);
    expect(highLevel).toBeDefined();
  });

  it('getNextLevel should return next level or null at max', () => {
    const firstLevelNum = SPARK_LEVELS[0].level;
    const nextLevel = getNextLevel(firstLevelNum);
    
    if (SPARK_LEVELS.length > 1) {
      expect(nextLevel).not.toBeNull();
    }
    
    const lastLevelNum = SPARK_LEVELS[SPARK_LEVELS.length - 1].level;
    const afterLast = getNextLevel(lastLevelNum);
    expect(afterLast).toBeNull();
  });

  it('getProgressToNextLevel should return percentage 0-100', () => {
    const progress = getProgressToNextLevel(50);
    expect(typeof progress).toBe('number');
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });
});

describe('useSparkEnergy Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return spark energy data properties', () => {
    const { result } = renderHook(() => useSparkEnergy(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('sparkEnergy');
    expect(result.current).toHaveProperty('isLoading');
  });

  it('should provide earnEnergy mutation', () => {
    const { result } = renderHook(() => useSparkEnergy(), {
      wrapper: createWrapper(),
    });

    expect(result.current.earnEnergy).toBeDefined();
    expect(typeof result.current.earnEnergy).toBe('function');
  });

  it('should provide spendEnergy mutation', () => {
    const { result } = renderHook(() => useSparkEnergy(), {
      wrapper: createWrapper(),
    });

    expect(result.current.spendEnergy).toBeDefined();
    expect(typeof result.current.spendEnergy).toBe('function');
  });

  it('should provide helper functions', () => {
    const { result } = renderHook(() => useSparkEnergy(), {
      wrapper: createWrapper(),
    });

    expect(result.current.canDoAction).toBeDefined();
    expect(result.current.getActionCountToday).toBeDefined();
    expect(result.current.canAfford).toBeDefined();
    expect(result.current.getItemCost).toBeDefined();
  });

  it('canDoAction should return boolean', () => {
    const { result } = renderHook(() => useSparkEnergy(), {
      wrapper: createWrapper(),
    });

    const canLogin = result.current.canDoAction('daily_login');
    expect(typeof canLogin).toBe('boolean');
  });
});
