import { describe, it, expect } from 'vitest';
import { test as fcTest } from '@fast-check/vitest';
import {
  createConversation,
  createMessage,
  createParticipant,
  createInvite,
  createJoinRequest,
  conversationArb,
  messageArb,
  participantArb,
  inviteArb,
  joinRequestArb,
  socketMessagePayloadArb,
} from './test-data-generators';

describe('Factory functions', () => {
  it('createConversation returns a valid conversation with defaults', () => {
    const conv = createConversation();
    expect(conv.id).toBeDefined();
    expect(conv.title).toBe('Test Conversation');
    expect(conv.type).toBe('group');
    expect(conv.status).toBe('active');
    expect(conv.createdAt).toBeDefined();
  });

  it('createConversation accepts partial overrides', () => {
    const conv = createConversation({ title: 'Custom', type: 'direct', unreadCount: 5 });
    expect(conv.title).toBe('Custom');
    expect(conv.type).toBe('direct');
    expect(conv.unreadCount).toBe(5);
  });

  it('createMessage returns a valid message with defaults', () => {
    const msg = createMessage();
    expect(msg.id).toBeDefined();
    expect(msg.body).toBe('Hello, this is a test message.');
    expect(msg.type).toBe('text');
    expect(msg.status).toBe('sent');
  });

  it('createMessage accepts partial overrides', () => {
    const msg = createMessage({ body: 'Override body', status: 'deleted' });
    expect(msg.body).toBe('Override body');
    expect(msg.status).toBe('deleted');
  });

  it('createParticipant returns a valid participant with defaults', () => {
    const p = createParticipant();
    expect(p.id).toBeDefined();
    expect(p.role).toBe('member');
    expect(p.status).toBe('active');
    expect(p.actor).toBeDefined();
  });

  it('createInvite returns a valid invite with defaults', () => {
    const inv = createInvite();
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
    expect(inv.invitedUser).toBeDefined();
  });

  it('createJoinRequest returns a valid join request with defaults', () => {
    const jr = createJoinRequest();
    expect(jr.id).toBeDefined();
    expect(jr.status).toBe('pending');
    expect(jr.user).toBeDefined();
  });
});

describe('fast-check arbitraries', () => {
  fcTest.prop([conversationArb])('conversationArb generates valid conversations', (conv) => {
    expect(conv.id).toBeDefined();
    expect(conv.title.length).toBeGreaterThanOrEqual(1);
    expect(['group', 'direct', 'classroom', 'grade', 'section', 'stage', 'school_wide', 'support', 'system']).toContain(conv.type);
    expect(['active', 'closed', 'archived']).toContain(conv.status);
  });

  fcTest.prop([messageArb])('messageArb generates valid messages', (msg) => {
    expect(msg.id).toBeDefined();
    expect(msg.body.length).toBeGreaterThanOrEqual(1);
    expect(['text', 'image', 'file', 'audio', 'video', 'system']).toContain(msg.type);
    expect(['sent', 'hidden', 'deleted']).toContain(msg.status);
  });

  fcTest.prop([participantArb])('participantArb generates valid participants', (p) => {
    expect(p.id).toBeDefined();
    expect(['owner', 'admin', 'moderator', 'member', 'read_only', 'system']).toContain(p.role);
    expect(['active', 'invited', 'left', 'removed', 'muted', 'blocked']).toContain(p.status);
  });

  fcTest.prop([inviteArb])('inviteArb generates valid invites', (inv) => {
    expect(inv.id).toBeDefined();
    expect(['pending', 'accepted', 'rejected', 'expired']).toContain(inv.status);
  });

  fcTest.prop([joinRequestArb])('joinRequestArb generates valid join requests', (jr) => {
    expect(jr.id).toBeDefined();
    expect(['pending', 'approved', 'rejected']).toContain(jr.status);
  });

  fcTest.prop([socketMessagePayloadArb])('socketMessagePayloadArb generates valid payloads', (payload) => {
    expect(payload.message).toBeDefined();
    expect(payload.conversationId).toBeDefined();
    expect(payload.message.id).toBeDefined();
  });
});
