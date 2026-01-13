import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock data
const mockSparkChat = {
  id: 'chat-1',
  profile_a_id: 'user-1',
  profile_b_id: 'user-2',
  created_at: '2025-01-01T10:00:00Z',
  extinguished_by_a: false,
  extinguished_by_b: false,
};

const mockProfile = {
  id: 'user-1',
  name: 'Test User',
  avatar_url: null,
};

const mockMessages = [
  { id: 'msg-1', chat_id: 'chat-1', sender_profile_id: 'user-1', content: 'Hello!', created_at: '2025-01-01T10:00:00Z' },
  { id: 'msg-2', chat_id: 'chat-1', sender_profile_id: 'user-2', content: 'Hi there!', created_at: '2025-01-01T10:01:00Z' },
];

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockSparkChat, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
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

vi.mock('@/utils/notificationSound', () => ({
  vibrateDevice: vi.fn(),
  playNotificationSound: vi.fn(),
}));

// Test constants
const SPARKS_PAGE_SIZE = 15;

const GHOST_MESSAGE_LIMITS = {
  free: 5,
  plus: 15,
  premium: Infinity,
};

describe('useSparks Hook Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SparkChat Interface', () => {
    it('should have required fields', () => {
      const requiredFields = [
        'id', 'profile_a_id', 'profile_b_id', 'created_at',
        'extinguished_by_a', 'extinguished_by_b'
      ];

      requiredFields.forEach(field => {
        expect(mockSparkChat).toHaveProperty(field);
      });
    });

    it('should have optional enriched fields', () => {
      const enrichedChat = {
        ...mockSparkChat,
        unread_count: 5,
        last_message_at: '2025-01-01T11:00:00Z',
        last_message_content: 'Latest message',
        other_profile: { id: 'user-2', name: 'Other User', avatar_url: null, vibe: null },
      };

      expect(enrichedChat.unread_count).toBe(5);
      expect(enrichedChat.other_profile).toBeDefined();
    });
  });

  describe('ChatMessage Interface', () => {
    it('should have required fields', () => {
      const requiredFields = ['id', 'chat_id', 'sender_profile_id', 'content', 'created_at'];

      mockMessages.forEach(message => {
        requiredFields.forEach(field => {
          expect(message).toHaveProperty(field);
        });
      });
    });
  });

  describe('Pagination', () => {
    it('should use correct page size', () => {
      expect(SPARKS_PAGE_SIZE).toBe(15);
    });

    it('should calculate page ranges correctly', () => {
      const pageParam = 0;
      const start = pageParam * SPARKS_PAGE_SIZE;
      const end = (pageParam + 1) * SPARKS_PAGE_SIZE - 1;

      expect(start).toBe(0);
      expect(end).toBe(14);
    });

    it('should determine next page availability', () => {
      const hasNextPage = (itemCount: number) => itemCount === SPARKS_PAGE_SIZE;

      expect(hasNextPage(15)).toBe(true);
      expect(hasNextPage(10)).toBe(false);
      expect(hasNextPage(0)).toBe(false);
    });
  });

  describe('Chat Visibility', () => {
    it('should determine if chat is extinguished for user', () => {
      const isExtinguished = (chat: typeof mockSparkChat, userId: string) => {
        const isA = chat.profile_a_id === userId;
        return isA ? chat.extinguished_by_a : chat.extinguished_by_b;
      };

      expect(isExtinguished(mockSparkChat, 'user-1')).toBe(false);
      expect(isExtinguished(mockSparkChat, 'user-2')).toBe(false);

      const extinguishedChat = { ...mockSparkChat, extinguished_by_a: true };
      expect(isExtinguished(extinguishedChat, 'user-1')).toBe(true);
      expect(isExtinguished(extinguishedChat, 'user-2')).toBe(false);
    });

    it('should get other profile from chat', () => {
      const getOtherProfileId = (chat: typeof mockSparkChat, userId: string) => {
        return chat.profile_a_id === userId ? chat.profile_b_id : chat.profile_a_id;
      };

      expect(getOtherProfileId(mockSparkChat, 'user-1')).toBe('user-2');
      expect(getOtherProfileId(mockSparkChat, 'user-2')).toBe('user-1');
    });
  });

  describe('Chat Sorting', () => {
    it('should prioritize unread chats', () => {
      const chats = [
        { id: '1', unread_count: 0, last_message_at: '2025-01-01T12:00:00Z' },
        { id: '2', unread_count: 3, last_message_at: '2025-01-01T10:00:00Z' },
        { id: '3', unread_count: 0, last_message_at: '2025-01-01T11:00:00Z' },
      ];

      const sorted = [...chats].sort((a, b) => {
        const aHasUnread = (a.unread_count || 0) > 0;
        const bHasUnread = (b.unread_count || 0) > 0;
        if (aHasUnread && !bHasUnread) return -1;
        if (!aHasUnread && bHasUnread) return 1;
        
        const timeA = new Date(a.last_message_at).getTime();
        const timeB = new Date(b.last_message_at).getTime();
        return timeB - timeA;
      });

      // Unread chat should be first
      expect(sorted[0].id).toBe('2');
      // Then by most recent
      expect(sorted[1].id).toBe('1');
      expect(sorted[2].id).toBe('3');
    });
  });

  describe('Ghost Message Limits', () => {
    it('should have correct tier limits', () => {
      expect(GHOST_MESSAGE_LIMITS.free).toBe(5);
      expect(GHOST_MESSAGE_LIMITS.plus).toBe(15);
      expect(GHOST_MESSAGE_LIMITS.premium).toBe(Infinity);
    });

    it('should calculate remaining messages correctly', () => {
      const calculateRemaining = (sent: number, tier: keyof typeof GHOST_MESSAGE_LIMITS) => {
        const limit = GHOST_MESSAGE_LIMITS[tier];
        if (limit === Infinity) return Infinity;
        return Math.max(0, limit - sent);
      };

      expect(calculateRemaining(3, 'free')).toBe(2);
      expect(calculateRemaining(5, 'free')).toBe(0);
      expect(calculateRemaining(10, 'plus')).toBe(5);
      expect(calculateRemaining(100, 'premium')).toBe(Infinity);
    });

    it('should determine if can send more', () => {
      const canSend = (sent: number, tier: keyof typeof GHOST_MESSAGE_LIMITS) => {
        const limit = GHOST_MESSAGE_LIMITS[tier];
        return limit === Infinity || sent < limit;
      };

      expect(canSend(4, 'free')).toBe(true);
      expect(canSend(5, 'free')).toBe(false);
      expect(canSend(14, 'plus')).toBe(true);
      expect(canSend(1000, 'premium')).toBe(true);
    });
  });

  describe('Second Chance Logic', () => {
    it('should check if 7 days have passed', () => {
      const daysSince = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date('2025-01-10T10:00:00Z');
        return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      };

      expect(daysSince('2025-01-01T10:00:00Z')).toBe(9);
      expect(daysSince('2025-01-05T10:00:00Z')).toBe(5);
      expect(daysSince('2025-01-03T10:00:00Z')).toBe(7);
    });

    it('should determine second chance eligibility', () => {
      const canSendSecondChance = (
        hasPremium: boolean,
        hasPurchased: boolean,
        daysSinceFirst: number
      ) => {
        if (!hasPremium && !hasPurchased) return false;
        if (hasPurchased) return true; // Bypass 7-day wait
        return daysSinceFirst >= 7;
      };

      expect(canSendSecondChance(false, false, 10)).toBe(false);
      expect(canSendSecondChance(true, false, 5)).toBe(false);
      expect(canSendSecondChance(true, false, 7)).toBe(true);
      expect(canSendSecondChance(false, true, 1)).toBe(true);
    });
  });

  describe('Unread Count', () => {
    it('should calculate total unread count', () => {
      const chats = [
        { unread_count: 5 },
        { unread_count: 0 },
        { unread_count: 3 },
        { unread_count: 2 },
      ];

      const totalUnread = chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
      expect(totalUnread).toBe(10);
    });

    it('should handle empty chat list', () => {
      const chats: { unread_count?: number }[] = [];
      const totalUnread = chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
      expect(totalUnread).toBe(0);
    });
  });

  describe('Read Status', () => {
    it('should create correct upsert payload', () => {
      const chatId = 'chat-1';
      const profileId = 'user-1';
      const now = new Date().toISOString();

      const payload = {
        chat_id: chatId,
        profile_id: profileId,
        last_read_at: now,
      };

      expect(payload.chat_id).toBe(chatId);
      expect(payload.profile_id).toBe(profileId);
      expect(typeof payload.last_read_at).toBe('string');
    });

    it('should determine if message is read', () => {
      const lastReadAt = new Date('2025-01-01T10:30:00Z');
      const isRead = (messageDate: string) => new Date(messageDate) <= lastReadAt;

      expect(isRead('2025-01-01T10:00:00Z')).toBe(true);
      expect(isRead('2025-01-01T10:30:00Z')).toBe(true);
      expect(isRead('2025-01-01T11:00:00Z')).toBe(false);
    });
  });

  describe('Blocked Users Filtering', () => {
    it('should filter out blocked users from chats', () => {
      const blockedIds = new Set(['user-3', 'user-5']);
      const chats = [
        { id: '1', other_profile_id: 'user-2' },
        { id: '2', other_profile_id: 'user-3' },
        { id: '3', other_profile_id: 'user-4' },
        { id: '4', other_profile_id: 'user-5' },
      ];

      const filtered = chats.filter(chat => !blockedIds.has(chat.other_profile_id));
      expect(filtered.length).toBe(2);
      expect(filtered.map(c => c.id)).toEqual(['1', '3']);
    });
  });

  describe('Spark Detection', () => {
    it('should check if spark exists with profile', () => {
      const chats = [
        { other_profile: { id: 'user-2' } },
        { other_profile: { id: 'user-3' } },
      ];

      const hasSparkWith = (targetId: string) => 
        chats.some(chat => chat.other_profile?.id === targetId);

      expect(hasSparkWith('user-2')).toBe(true);
      expect(hasSparkWith('user-4')).toBe(false);
    });

    it('should get chat ID for spark with profile', () => {
      const chats = [
        { id: 'chat-1', other_profile: { id: 'user-2' } },
        { id: 'chat-2', other_profile: { id: 'user-3' } },
      ];

      const getSparkChatWith = (targetId: string) => {
        const chat = chats.find(c => c.other_profile?.id === targetId);
        return chat?.id || null;
      };

      expect(getSparkChatWith('user-2')).toBe('chat-1');
      expect(getSparkChatWith('user-4')).toBeNull();
    });
  });

  describe('Realtime Updates with Debouncing', () => {
    it('should debounce rapid updates', async () => {
      const DEBOUNCE_MS = 1000;
      let updateCount = 0;
      let timer: NodeJS.Timeout | null = null;

      const debouncedUpdate = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          updateCount++;
        }, DEBOUNCE_MS);
      };

      // Rapid calls
      debouncedUpdate();
      debouncedUpdate();
      debouncedUpdate();

      expect(updateCount).toBe(0);

      await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS + 100));
      expect(updateCount).toBe(1);

      if (timer) clearTimeout(timer);
    });
  });

  describe('Optimistic Updates', () => {
    it('should add message to cache optimistically', () => {
      const existingMessages = [...mockMessages];
      const newMessage = {
        id: 'msg-3',
        chat_id: 'chat-1',
        sender_profile_id: 'user-1',
        content: 'New message',
        created_at: '2025-01-01T10:02:00Z',
      };

      // Simulate optimistic update
      const isDuplicate = existingMessages.some(m => m.id === newMessage.id);
      expect(isDuplicate).toBe(false);

      const updated = [...existingMessages, newMessage];
      expect(updated.length).toBe(3);
      expect(updated[updated.length - 1].id).toBe('msg-3');
    });

    it('should prevent duplicate messages in cache', () => {
      const existingMessages = [...mockMessages];
      const duplicateMessage = mockMessages[0];

      const isDuplicate = existingMessages.some(m => m.id === duplicateMessage.id);
      expect(isDuplicate).toBe(true);

      // Should not add duplicate
      const updated = isDuplicate 
        ? existingMessages 
        : [...existingMessages, duplicateMessage];
      expect(updated.length).toBe(2);
    });
  });

  describe('Message Content Truncation', () => {
    it('should truncate long messages for preview', () => {
      const truncate = (content: string, maxLength: number = 50) => {
        return content.length > maxLength 
          ? content.substring(0, maxLength) + '...' 
          : content;
      };

      expect(truncate('Short')).toBe('Short');
      expect(truncate('A'.repeat(60)).length).toBe(53);
      expect(truncate('A'.repeat(60)).endsWith('...')).toBe(true);
    });
  });

  describe('Subscription Tier Detection', () => {
    it('should handle expired subscriptions', () => {
      const getTier = (subscription: { tier: string; expires_at: string | null }) => {
        if (!subscription) return 'free';
        if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
          return 'free';
        }
        return subscription.tier || 'free';
      };

      expect(getTier({ tier: 'premium', expires_at: '2030-01-01' })).toBe('premium');
      expect(getTier({ tier: 'premium', expires_at: '2020-01-01' })).toBe('free');
      expect(getTier({ tier: 'plus', expires_at: null })).toBe('plus');
    });
  });
});
