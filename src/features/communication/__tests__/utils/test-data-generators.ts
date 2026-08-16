/**
 * Test data generators for the communication module.
 *
 * Provides:
 * 1. Simple factory functions (createConversation, createMessage, etc.) with partial overrides
 * 2. fast-check arbitraries for property-based tests
 *
 * Validates: Requirements 14.1
 */
import { fc } from '@fast-check/vitest';

import type { Conversation, ConversationParticipant, ConversationInvite, ConversationJoinRequest, ConversationType, ConversationStatus, ParticipantRole, ParticipantStatus } from '../../types/conversation.types';
import type { Message, MessageStatus, MessageType } from '../../types/message.types';

// ---------------------------------------------------------------------------
// Helper: deterministic ID and timestamp generation for factory functions
// ---------------------------------------------------------------------------

let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `00000000-0000-4000-8000-${String(idCounter).padStart(12, '0')}`;
}

function recentTimestamp(offsetMs = 0): string {
  return new Date(Date.now() - offsetMs).toISOString();
}

// ---------------------------------------------------------------------------
// Factory Functions
// ---------------------------------------------------------------------------

export function createConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: nextId(),
    title: 'Test Conversation',
    type: 'group' as ConversationType,
    status: 'active' as ConversationStatus,
    participantsCount: 3,
    unreadCount: 0,
    lastMessageAt: recentTimestamp(60_000),
    createdById: nextId(),
    createdAt: recentTimestamp(3_600_000),
    updatedAt: recentTimestamp(60_000),
    ...overrides,
  };
}

export function createMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: nextId(),
    conversationId: nextId(),
    senderId: nextId(),
    body: 'Hello, this is a test message.',
    type: 'text' as MessageType,
    status: 'sent' as MessageStatus,
    createdAt: recentTimestamp(30_000),
    updatedAt: recentTimestamp(30_000),
    ...overrides,
  };
}

export function createParticipant(overrides: Partial<ConversationParticipant> = {}): ConversationParticipant {
  const userId = overrides.userId ?? nextId();
  const user = {
    ...overrides.user,
    id: overrides.user?.id ?? userId,
    displayName: overrides.user?.displayName ?? 'Test User',
    userType: overrides.user?.userType ?? 'student',
  };
  return {
    id: nextId(),
    conversationId: nextId(),
    userId,
    role: 'member' as ParticipantRole,
    status: 'active' as ParticipantStatus,
    actor: {
      id: userId,
      name: 'Test User',
    },
    user,
    joinedAt: recentTimestamp(7_200_000),
    leftAt: null,
    ...overrides,
  };
}

export function createInvite(overrides: Partial<ConversationInvite> = {}): ConversationInvite {
  return {
    id: nextId(),
    conversationId: nextId(),
    invitedUserId: nextId(),
    invitedUser: {
      id: overrides.invitedUserId ?? nextId(),
      name: 'Invited User',
    },
    status: 'pending',
    expiresAt: null,
    createdAt: recentTimestamp(1_800_000),
    updatedAt: recentTimestamp(1_800_000),
    ...overrides,
  };
}

export function createJoinRequest(overrides: Partial<ConversationJoinRequest> = {}): ConversationJoinRequest {
  return {
    id: nextId(),
    conversationId: nextId(),
    userId: nextId(),
    user: {
      id: overrides.userId ?? nextId(),
      name: 'Requesting User',
    },
    status: 'pending',
    note: null,
    createdAt: recentTimestamp(900_000),
    updatedAt: recentTimestamp(900_000),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// fast-check Arbitraries
// ---------------------------------------------------------------------------

// Generate ISO date strings from integer timestamps to avoid Invalid Date issues
const MIN_TS = new Date('2020-01-01T00:00:00.000Z').getTime();
const MAX_TS = new Date('2030-12-31T23:59:59.999Z').getTime();
const isoDateArb = fc.integer({ min: MIN_TS, max: MAX_TS }).map(ts => new Date(ts).toISOString());

export const conversationArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  type: fc.constantFrom<ConversationType>('group', 'direct', 'classroom', 'grade', 'section', 'stage', 'school_wide', 'support', 'system'),
  status: fc.constantFrom<ConversationStatus>('active', 'closed', 'archived'),
  participantsCount: fc.nat({ max: 200 }),
  unreadCount: fc.nat({ max: 99 }),
  createdById: fc.uuid(),
  createdAt: isoDateArb,
  updatedAt: isoDateArb,
  lastMessageAt: fc.option(isoDateArb, { nil: null }),
});

export const messageArb = fc.record({
  id: fc.uuid(),
  conversationId: fc.uuid(),
  senderId: fc.uuid(),
  body: fc.string({ minLength: 1, maxLength: 2000 }),
  type: fc.constantFrom<MessageType>('text', 'image', 'file', 'audio', 'video', 'system'),
  status: fc.constantFrom<MessageStatus>('sent', 'hidden', 'deleted'),
  createdAt: isoDateArb,
  updatedAt: fc.option(isoDateArb, { nil: undefined }),
});

export const participantArb = fc.record({
  id: fc.uuid(),
  conversationId: fc.uuid(),
  userId: fc.uuid(),
  role: fc.constantFrom<ParticipantRole>('owner', 'admin', 'moderator', 'member', 'read_only', 'system'),
  status: fc.constantFrom<ParticipantStatus>('active', 'invited', 'left', 'removed', 'muted', 'blocked'),
  joinedAt: isoDateArb,
  leftAt: fc.option(isoDateArb, { nil: null }),
});

export const inviteArb = fc.record({
  id: fc.uuid(),
  conversationId: fc.uuid(),
  invitedUserId: fc.uuid(),
  status: fc.constantFrom('pending' as const, 'accepted' as const, 'rejected' as const, 'expired' as const),
  expiresAt: fc.option(isoDateArb, { nil: null }),
  createdAt: isoDateArb,
  updatedAt: isoDateArb,
});

export const joinRequestArb = fc.record({
  id: fc.uuid(),
  conversationId: fc.uuid(),
  userId: fc.uuid(),
  status: fc.constantFrom('pending' as const, 'approved' as const, 'rejected' as const),
  note: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
  createdAt: isoDateArb,
  updatedAt: isoDateArb,
});

export const socketMessagePayloadArb = fc.record({
  message: messageArb,
  conversationId: fc.uuid(),
});
