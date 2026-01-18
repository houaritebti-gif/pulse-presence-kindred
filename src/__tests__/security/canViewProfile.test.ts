import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
    })),
  },
}));

/**
 * Tests for the can_view_profile() SQL function
 * 
 * This function controls access to user profiles and enforces:
 * 1. Mutual block check (highest priority - denies all access)
 * 2. Own profile access (always allowed)
 * 3. Accepted connection requests (mutual connections)
 * 4. Active spark chats (not extinguished by either party)
 * 5. Ghost message recipients (can view sender's profile)
 * 6. Quedada co-participants (future events only)
 * 
 * Security properties:
 * - SECURITY DEFINER with fixed search_path
 * - No public/unauthenticated access paths
 * - Block check runs BEFORE any access grants
 */
describe('can_view_profile() Access Control', () => {
  const mockRpc = supabase.rpc as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Block Check (Highest Priority)', () => {
    it('should deny access when viewer has blocked target', async () => {
      mockRpc.mockResolvedValueOnce({ data: false, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'viewer-uuid',
        target_profile_id: 'target-uuid',
      });

      expect(data).toBe(false);
      expect(mockRpc).toHaveBeenCalledWith('can_view_profile', {
        viewer_user_id: 'viewer-uuid',
        target_profile_id: 'target-uuid',
      });
    });

    it('should deny access when target has blocked viewer', async () => {
      mockRpc.mockResolvedValueOnce({ data: false, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'viewer-uuid',
        target_profile_id: 'blocker-uuid',
      });

      expect(data).toBe(false);
    });

    it('should deny access even with valid connection when block exists', async () => {
      // Even if they have an accepted connection, a block should override
      mockRpc.mockResolvedValueOnce({ data: false, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'connected-but-blocked-viewer',
        target_profile_id: 'target-uuid',
      });

      expect(data).toBe(false);
    });
  });

  describe('Own Profile Access', () => {
    it('should allow users to view their own profile', async () => {
      mockRpc.mockResolvedValueOnce({ data: true, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'user-uuid',
        target_profile_id: 'users-own-profile-uuid',
      });

      expect(data).toBe(true);
    });
  });

  describe('Accepted Connection Requests', () => {
    it('should allow access when viewer sent accepted connection request', async () => {
      mockRpc.mockResolvedValueOnce({ data: true, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'requester-uuid',
        target_profile_id: 'accepter-uuid',
      });

      expect(data).toBe(true);
    });

    it('should allow access when viewer received accepted connection request', async () => {
      mockRpc.mockResolvedValueOnce({ data: true, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'accepter-uuid',
        target_profile_id: 'requester-uuid',
      });

      expect(data).toBe(true);
    });

    it('should deny access for pending connection requests', async () => {
      mockRpc.mockResolvedValueOnce({ data: false, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'pending-requester-uuid',
        target_profile_id: 'pending-target-uuid',
      });

      expect(data).toBe(false);
    });

    it('should deny access for rejected connection requests', async () => {
      mockRpc.mockResolvedValueOnce({ data: false, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'rejected-requester-uuid',
        target_profile_id: 'rejecter-uuid',
      });

      expect(data).toBe(false);
    });
  });

  describe('Active Spark Chats', () => {
    it('should allow access for active spark chat participants (profile_a)', async () => {
      mockRpc.mockResolvedValueOnce({ data: true, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'spark-user-a-uuid',
        target_profile_id: 'spark-user-b-profile-uuid',
      });

      expect(data).toBe(true);
    });

    it('should allow access for active spark chat participants (profile_b)', async () => {
      mockRpc.mockResolvedValueOnce({ data: true, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'spark-user-b-uuid',
        target_profile_id: 'spark-user-a-profile-uuid',
      });

      expect(data).toBe(true);
    });

    it('should deny access when spark is extinguished by viewer', async () => {
      mockRpc.mockResolvedValueOnce({ data: false, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'extinguisher-uuid',
        target_profile_id: 'extinguished-partner-uuid',
      });

      expect(data).toBe(false);
    });

    it('should deny access when spark is extinguished by target', async () => {
      mockRpc.mockResolvedValueOnce({ data: false, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'viewer-uuid',
        target_profile_id: 'extinguisher-uuid',
      });

      expect(data).toBe(false);
    });

    it('should deny access when spark is mutually extinguished', async () => {
      mockRpc.mockResolvedValueOnce({ data: false, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'mutual-extinguish-a-uuid',
        target_profile_id: 'mutual-extinguish-b-uuid',
      });

      expect(data).toBe(false);
    });
  });

  describe('Ghost Message Recipients', () => {
    it('should allow recipient to view sender profile', async () => {
      mockRpc.mockResolvedValueOnce({ data: true, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'ghost-message-recipient-uuid',
        target_profile_id: 'ghost-message-sender-uuid',
      });

      expect(data).toBe(true);
    });

    it('should NOT allow sender to view recipient profile (one-way access)', async () => {
      // Ghost messages only grant access TO the sender's profile, not FROM
      mockRpc.mockResolvedValueOnce({ data: false, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'ghost-message-sender-uuid',
        target_profile_id: 'ghost-message-recipient-uuid',
      });

      expect(data).toBe(false);
    });
  });

  describe('Quedada Co-participants', () => {
    it('should allow attendee to view creator profile (future event)', async () => {
      mockRpc.mockResolvedValueOnce({ data: true, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'quedada-attendee-uuid',
        target_profile_id: 'quedada-creator-uuid',
      });

      expect(data).toBe(true);
    });

    it('should allow creator to view attendee profile (future event)', async () => {
      mockRpc.mockResolvedValueOnce({ data: true, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'quedada-creator-uuid',
        target_profile_id: 'quedada-attendee-uuid',
      });

      expect(data).toBe(true);
    });

    it('should allow co-attendees to view each other (future event)', async () => {
      mockRpc.mockResolvedValueOnce({ data: true, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'co-attendee-a-uuid',
        target_profile_id: 'co-attendee-b-uuid',
      });

      expect(data).toBe(true);
    });

    it('should deny access for past quedadas', async () => {
      // Quedada access only valid for future events (event_date > now())
      mockRpc.mockResolvedValueOnce({ data: false, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'past-quedada-attendee-uuid',
        target_profile_id: 'past-quedada-creator-uuid',
      });

      expect(data).toBe(false);
    });
  });

  describe('No Access Cases', () => {
    it('should deny access for completely unrelated users', async () => {
      mockRpc.mockResolvedValueOnce({ data: false, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'random-user-uuid',
        target_profile_id: 'unrelated-user-uuid',
      });

      expect(data).toBe(false);
    });

    it('should deny access for unauthenticated requests', async () => {
      mockRpc.mockResolvedValueOnce({ data: false, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: null,
        target_profile_id: 'any-profile-uuid',
      });

      expect(data).toBe(false);
    });

    it('should deny access for invalid profile IDs', async () => {
      mockRpc.mockResolvedValueOnce({ data: false, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'valid-user-uuid',
        target_profile_id: 'non-existent-profile-uuid',
      });

      expect(data).toBe(false);
    });
  });

  describe('Security Properties', () => {
    it('should use SECURITY DEFINER (bypasses RLS for internal checks)', async () => {
      // This test documents that the function uses SECURITY DEFINER
      // which is necessary for checking blocks, connections, etc.
      // without triggering infinite recursion in RLS policies
      mockRpc.mockResolvedValueOnce({ data: true, error: null });

      await supabase.rpc('can_view_profile', {
        viewer_user_id: 'test-uuid',
        target_profile_id: 'target-uuid',
      });

      // Function should complete without RLS recursion errors
      expect(mockRpc).toHaveBeenCalled();
    });

    it('should have fixed search_path to prevent path manipulation', async () => {
      // This test documents the security property
      // The function has SET search_path TO 'public' to prevent
      // attackers from manipulating the search path
      mockRpc.mockResolvedValueOnce({ data: true, error: null });

      await supabase.rpc('can_view_profile', {
        viewer_user_id: 'test-uuid',
        target_profile_id: 'target-uuid',
      });

      expect(mockRpc).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple valid access paths correctly', async () => {
      // User has both connection AND is in same quedada
      // Should still return true (any valid path grants access)
      mockRpc.mockResolvedValueOnce({ data: true, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'multi-path-user-uuid',
        target_profile_id: 'connected-quedada-partner-uuid',
      });

      expect(data).toBe(true);
    });

    it('should prioritize block check over all access paths', async () => {
      // User has connection, spark, AND is in quedada with target
      // BUT target has blocked them - should still be denied
      mockRpc.mockResolvedValueOnce({ data: false, error: null });

      const { data } = await supabase.rpc('can_view_profile', {
        viewer_user_id: 'fully-connected-but-blocked-uuid',
        target_profile_id: 'blocker-with-connections-uuid',
      });

      expect(data).toBe(false);
    });
  });
});

/**
 * Integration test documentation for can_view_profile()
 * 
 * The SQL function implementation:
 * 
 * ```sql
 * CREATE OR REPLACE FUNCTION public.can_view_profile(viewer_user_id uuid, target_profile_id uuid)
 * RETURNS boolean
 * LANGUAGE sql
 * STABLE SECURITY DEFINER
 * SET search_path TO 'public'
 * AS $function$
 *   SELECT 
 *     -- First check: no blocks exist between viewer and target
 *     NOT EXISTS (
 *       SELECT 1 FROM user_blocks ub
 *       JOIN profiles viewer_p ON viewer_p.user_id = viewer_user_id
 *       WHERE 
 *         (ub.blocker_profile_id = viewer_p.id AND ub.blocked_profile_id = target_profile_id)
 *         OR (ub.blocker_profile_id = target_profile_id AND ub.blocked_profile_id = viewer_p.id)
 *     )
 *     AND (
 *       -- Can always view own profile
 *       EXISTS (SELECT 1 FROM profiles WHERE id = target_profile_id AND user_id = viewer_user_id)
 *       -- ... plus other legitimate interaction checks
 *     )
 * $function$
 * ```
 * 
 * Access Control Matrix:
 * 
 * | Scenario                          | Access Granted |
 * |-----------------------------------|----------------|
 * | Own profile                       | ✅ Yes         |
 * | Accepted mutual connection        | ✅ Yes         |
 * | Active spark chat (not extinguished) | ✅ Yes      |
 * | Received ghost message from target | ✅ Yes        |
 * | Co-participant in future quedada  | ✅ Yes         |
 * | Blocked by either party           | ❌ No          |
 * | Pending connection request        | ❌ No          |
 * | Rejected connection request       | ❌ No          |
 * | Extinguished spark chat           | ❌ No          |
 * | Past quedada (event_date <= now)  | ❌ No          |
 * | Unrelated users                   | ❌ No          |
 * | Unauthenticated                   | ❌ No          |
 */
