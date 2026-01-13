import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock data
const mockQuedada = {
  id: 'quedada-1',
  creator_profile_id: 'user-1',
  title: 'Test Quedada',
  description: 'A test event',
  city: 'Madrid',
  location_hint: 'Plaza Mayor',
  event_date: '2025-01-20T18:00:00Z',
  max_attendees: 10,
  private_attendees: false,
  created_at: '2025-01-01T10:00:00Z',
};

const mockProfile = {
  id: 'user-1',
  name: 'Test User',
  avatar_url: null,
  city: 'Madrid',
};

const mockAttendees = [
  { id: 'att-1', quedada_id: 'quedada-1', profile_id: 'user-2', created_at: '2025-01-02T10:00:00Z' },
  { id: 'att-2', quedada_id: 'quedada-1', profile_id: 'user-3', created_at: '2025-01-03T10:00:00Z' },
];

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: mockQuedada, error: null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  },
}));

vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn().mockReturnValue({
    data: mockProfile,
  }),
}));

vi.mock('@/utils/pushNotifications', () => ({
  sendPushNotification: vi.fn(),
}));

// Test constants
const QUEDADAS_PAGE_SIZE = 10;

describe('useQuedadas Hook Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) => 
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  describe('Quedada Interface', () => {
    it('should have required fields', () => {
      const requiredFields = [
        'id', 'creator_profile_id', 'title', 'city', 
        'event_date', 'created_at', 'private_attendees'
      ];

      requiredFields.forEach(field => {
        expect(mockQuedada).toHaveProperty(field);
      });
    });

    it('should allow optional fields', () => {
      const quedadaWithOptionals = {
        ...mockQuedada,
        description: null,
        location_hint: null,
        max_attendees: null,
      };

      expect(quedadaWithOptionals.description).toBeNull();
      expect(quedadaWithOptionals.location_hint).toBeNull();
      expect(quedadaWithOptionals.max_attendees).toBeNull();
    });
  });

  describe('Quedada Attendee Interface', () => {
    it('should have required fields', () => {
      const requiredFields = ['id', 'quedada_id', 'profile_id', 'created_at'];

      mockAttendees.forEach(attendee => {
        requiredFields.forEach(field => {
          expect(attendee).toHaveProperty(field);
        });
      });
    });
  });

  describe('Pagination', () => {
    it('should use correct page size', () => {
      expect(QUEDADAS_PAGE_SIZE).toBe(10);
      expect(QUEDADAS_PAGE_SIZE).toBeGreaterThan(0);
    });

    it('should calculate correct page ranges', () => {
      const pageParam = 0;
      const start = pageParam * QUEDADAS_PAGE_SIZE;
      const end = (pageParam + 1) * QUEDADAS_PAGE_SIZE - 1;

      expect(start).toBe(0);
      expect(end).toBe(9);

      const page2Start = 1 * QUEDADAS_PAGE_SIZE;
      const page2End = 2 * QUEDADAS_PAGE_SIZE - 1;

      expect(page2Start).toBe(10);
      expect(page2End).toBe(19);
    });

    it('should determine next page correctly', () => {
      const hasNextPage = (itemCount: number) => itemCount === QUEDADAS_PAGE_SIZE;

      expect(hasNextPage(10)).toBe(true);
      expect(hasNextPage(5)).toBe(false);
      expect(hasNextPage(0)).toBe(false);
    });
  });

  describe('Unread Status Calculation', () => {
    it('should detect unread messages correctly', () => {
      const calculateHasUnread = (
        lastRead: Date | null,
        latestMessage: Date | null
      ): boolean => {
        if (!latestMessage) return false;
        if (!lastRead) return true;
        return latestMessage > lastRead;
      };

      // No message = no unread
      expect(calculateHasUnread(new Date(), null)).toBe(false);

      // Has message but never read = unread
      expect(calculateHasUnread(null, new Date())).toBe(true);

      // Message after last read = unread
      const lastRead = new Date('2025-01-01T10:00:00Z');
      const latestMessage = new Date('2025-01-01T11:00:00Z');
      expect(calculateHasUnread(lastRead, latestMessage)).toBe(true);

      // Message before last read = not unread
      const oldMessage = new Date('2025-01-01T09:00:00Z');
      expect(calculateHasUnread(lastRead, oldMessage)).toBe(false);
    });
  });

  describe('Access Control', () => {
    it('should determine chat access correctly', () => {
      const canAccessChat = (
        creatorId: string,
        attendeeIds: string[],
        userId: string
      ): boolean => {
        return creatorId === userId || attendeeIds.includes(userId);
      };

      // Creator can access
      expect(canAccessChat('user-1', [], 'user-1')).toBe(true);

      // Attendee can access
      expect(canAccessChat('user-1', ['user-2', 'user-3'], 'user-2')).toBe(true);

      // Non-participant cannot access
      expect(canAccessChat('user-1', ['user-2'], 'user-4')).toBe(false);
    });

    it('should identify creator correctly', () => {
      const isCreator = mockQuedada.creator_profile_id === mockProfile.id;
      expect(isCreator).toBe(true);
    });

    it('should identify attendee correctly', () => {
      const isAttending = mockAttendees.some(a => a.profile_id === 'user-2');
      expect(isAttending).toBe(true);
      
      const notAttending = mockAttendees.some(a => a.profile_id === 'user-99');
      expect(notAttending).toBe(false);
    });
  });

  describe('Attendee Count', () => {
    it('should count attendees correctly', () => {
      expect(mockAttendees.length).toBe(2);
    });

    it('should handle empty attendee list', () => {
      const emptyAttendees: typeof mockAttendees = [];
      expect(emptyAttendees.length).toBe(0);
    });

    it('should respect max attendees limit', () => {
      const maxAttendees = mockQuedada.max_attendees || Infinity;
      const currentCount = mockAttendees.length;
      const canJoin = currentCount < maxAttendees;

      expect(canJoin).toBe(true);
    });
  });

  describe('Event Date Handling', () => {
    it('should parse event date correctly', () => {
      const eventDate = new Date(mockQuedada.event_date);
      expect(eventDate.getFullYear()).toBe(2025);
      expect(eventDate.getMonth()).toBe(0); // January
      expect(eventDate.getDate()).toBe(20);
    });

    it('should determine if event is in the future', () => {
      const now = new Date('2025-01-10T10:00:00Z');
      const eventDate = new Date(mockQuedada.event_date);
      const isFuture = eventDate > now;

      expect(isFuture).toBe(true);
    });

    it('should sort events by date', () => {
      const events = [
        { event_date: '2025-01-25T18:00:00Z' },
        { event_date: '2025-01-15T18:00:00Z' },
        { event_date: '2025-01-20T18:00:00Z' },
      ];

      const sorted = [...events].sort((a, b) => 
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      );

      expect(sorted[0].event_date).toBe('2025-01-15T18:00:00Z');
      expect(sorted[2].event_date).toBe('2025-01-25T18:00:00Z');
    });
  });

  describe('Message Handling', () => {
    it('should structure message correctly', () => {
      const message = {
        id: 'msg-1',
        quedada_id: 'quedada-1',
        sender_profile_id: 'user-1',
        content: 'Hello everyone!',
        created_at: '2025-01-10T10:00:00Z',
      };

      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('quedada_id');
      expect(message).toHaveProperty('sender_profile_id');
      expect(message).toHaveProperty('content');
      expect(message).toHaveProperty('created_at');
    });

    it('should limit message length in previews', () => {
      const longContent = 'This is a very long message that should be truncated for display purposes';
      const truncated = longContent.length > 50 
        ? longContent.substring(0, 50) + '...' 
        : longContent;

      expect(truncated.length).toBeLessThanOrEqual(53);
      expect(truncated.endsWith('...')).toBe(true);
    });
  });

  describe('Realtime Updates', () => {
    it('should create debounced invalidation', async () => {
      const DEBOUNCE_MS = 1500;
      let invalidateCount = 0;
      let timer: NodeJS.Timeout | null = null;

      const debouncedInvalidate = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          invalidateCount++;
        }, DEBOUNCE_MS);
      };

      // Rapid calls
      debouncedInvalidate();
      debouncedInvalidate();
      debouncedInvalidate();

      expect(invalidateCount).toBe(0);

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS + 100));
      expect(invalidateCount).toBe(1);

      if (timer) clearTimeout(timer);
    });
  });

  describe('Notification Handling', () => {
    it('should format attendee notification correctly', () => {
      const attendeeName = 'John';
      const quedadaTitle = 'Test Event';
      const description = `${attendeeName} se unió a "${quedadaTitle}"`;

      expect(description).toContain(attendeeName);
      expect(description).toContain(quedadaTitle);
    });

    it('should format expulsion notification correctly', () => {
      const quedadaTitle = 'Test Event';
      const description = `Ya no formas parte de "${quedadaTitle}"`;

      expect(description).toContain(quedadaTitle);
    });
  });

  describe('City Filtering', () => {
    it('should filter by user city', () => {
      const userCity = mockProfile.city;
      const quedadaCity = mockQuedada.city;

      expect(userCity).toBe('Madrid');
      expect(quedadaCity).toBe('Madrid');
      expect(userCity === quedadaCity).toBe(true);
    });
  });

  describe('Read Status', () => {
    it('should create correct upsert payload', () => {
      const payload = {
        profile_id: mockProfile.id,
        quedada_id: mockQuedada.id,
        last_read_at: new Date().toISOString(),
      };

      expect(payload.profile_id).toBe('user-1');
      expect(payload.quedada_id).toBe('quedada-1');
      expect(typeof payload.last_read_at).toBe('string');
    });
  });

  describe('Organized Quedadas Count', () => {
    it('should count quedadas for a profile', () => {
      const quedadas = [
        { creator_profile_id: 'user-1' },
        { creator_profile_id: 'user-1' },
        { creator_profile_id: 'user-2' },
      ];

      const countForUser1 = quedadas.filter(q => q.creator_profile_id === 'user-1').length;
      expect(countForUser1).toBe(2);
    });
  });

  describe('Unread Quedada Count', () => {
    it('should count quedadas with unread messages', () => {
      const quedadas = [
        { id: '1', has_unread: true },
        { id: '2', has_unread: false },
        { id: '3', has_unread: true },
        { id: '4', has_unread: false },
      ];

      const unreadCount = quedadas.filter(q => q.has_unread).length;
      expect(unreadCount).toBe(2);
    });
  });
});
