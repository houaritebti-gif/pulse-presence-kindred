import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        gt: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    })),
    removeChannel: vi.fn(),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  },
}));

// Mock hooks
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}));

vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ 
    data: { id: 'test-profile-id', name: 'Test User' },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => ({ isOnline: true }),
}));

// Import after mocks
import { usePresenceList, useMyPresence, useSetPresence } from '@/hooks/usePresence';

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

describe('usePresenceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return data property', () => {
    const { result } = renderHook(() => usePresenceList(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeDefined();
  });

  it('should support showAllProfiles parameter', () => {
    const { result } = renderHook(() => usePresenceList(true), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeDefined();
  });

  it('should have infinite query methods', () => {
    const { result } = renderHook(() => usePresenceList(), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchNextPage).toBeDefined();
    expect(result.current.hasNextPage).toBeDefined();
    expect(result.current.isFetchingNextPage).toBeDefined();
  });

  it('should have isLoading state', () => {
    const { result } = renderHook(() => usePresenceList(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.isLoading).toBe('boolean');
  });
});

describe('useMyPresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have data property', () => {
    const { result } = renderHook(() => useMyPresence(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('data');
  });

  it('should have isLoading state', () => {
    const { result } = renderHook(() => useMyPresence(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.isLoading).toBe('boolean');
  });
});

describe('useSetPresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide mutation function', () => {
    const { result } = renderHook(() => useSetPresence(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
  });

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useSetPresence(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isIdle).toBe(true);
    expect(result.current.isPending).toBe(false);
  });
});
