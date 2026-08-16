/**
 * Mock API service utility for testing communication features.
 * Provides vi.fn() mocks for all communicationService and filesService functions
 * with sensible default resolved values matching the API response shapes.
 *
 * Validates: Requirements 14.3
 */

import { vi } from "vitest";

/**
 * Creates a complete mock of the communicationService with all functions
 * returning default resolved values that match the expected API response shapes.
 *
 * Each mock can be individually overridden in tests via `.mockResolvedValue()` or
 * `.mockResolvedValueOnce()`.
 */
export function createMockApiService() {
  return {
    // ─── Policy ───────────────────────────────────────────────────────────────
    getPolicy: vi.fn().mockResolvedValue({
      data: {
        reactionsEnabled: true,
        attachmentsEnabled: true,
        maxMessageLength: 2000,
        maxAttachmentSizeMb: 10,
      },
    }),
    updatePolicy: vi.fn().mockResolvedValue({
      data: {
        reactionsEnabled: true,
        attachmentsEnabled: true,
        maxMessageLength: 2000,
        maxAttachmentSizeMb: 10,
      },
    }),

    // ─── Admin ────────────────────────────────────────────────────────────────
    getAdminOverview: vi.fn().mockResolvedValue({
      data: {
        policy: {
          isConfigured: false,
          isEnabled: true,
          studentDirectMode: "disabled",
          allowTeacherCreatedGroups: true,
          allowStudentCreatedGroups: false,
          allowAttachments: true,
          allowReactions: true,
          allowReadReceipts: true,
          allowDeliveryReceipts: true,
          allowOnlinePresence: true,
        },
        conversations: { total: 0, active: 0, archived: 0, closed: 0, direct: 0, group: 0, classroom: 0, grade: 0, section: 0, stage: 0, schoolWide: 0, support: 0, system: 0 },
        participants: { total: 0, active: 0, invited: 0, left: 0, removed: 0, muted: 0, blocked: 0 },
        messages: { total: 0, sent: 0, hidden: 0, deleted: 0, text: 0, image: 0, file: 0, audio: 0, video: 0, system: 0 },
        receipts: { reads: 0, deliveries: 0, pendingDeliveries: 0, deliveredDeliveries: 0, failedDeliveries: 0 },
        safety: { openReports: 0, inReviewReports: 0, resolvedReports: 0, dismissedReports: 0, activeBlocks: 0, activeRestrictions: 0, moderationActions: 0 },
        recentActivity: { conversations: [], messages: [] },
      },
    }),

    // ─── Announcements ────────────────────────────────────────────────────────
    createAnnouncement: vi.fn().mockResolvedValue({
      data: { id: "announcement-1", title: "", body: "", status: "draft" },
    }),
    getAnnouncements: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),
    getAnnouncement: vi.fn().mockResolvedValue({
      data: { id: "announcement-1", title: "", body: "", status: "draft" },
    }),
    updateAnnouncement: vi.fn().mockResolvedValue({
      data: { id: "announcement-1", title: "", body: "", status: "draft" },
    }),
    publishAnnouncement: vi.fn().mockResolvedValue({
      data: { id: "announcement-1", title: "", body: "", status: "published" },
    }),
    markAnnouncementRead: vi.fn().mockResolvedValue({
      data: { totalReaders: 0, readers: [] },
    }),
    getAnnouncementReadSummary: vi.fn().mockResolvedValue({
      data: { totalReaders: 0, readers: [] },
    }),
    archiveAnnouncement: vi.fn().mockResolvedValue({
      data: { id: "announcement-1", title: "", body: "", status: "archived" },
    }),
    cancelAnnouncement: vi.fn().mockResolvedValue({
      data: { id: "announcement-1", title: "", body: "", status: "cancelled" },
    }),
    getAnnouncementAttachments: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),
    linkAnnouncementAttachment: vi.fn().mockResolvedValue({
      data: { id: "attachment-1", fileId: "file-1", fileName: "file.pdf" },
    }),
    deleteAnnouncementAttachment: vi.fn().mockResolvedValue({
      data: { success: true },
    }),

    // ─── Conversations ────────────────────────────────────────────────────────
    createConversation: vi.fn().mockResolvedValue({
      data: {
        id: "conv-1",
        title: "",
        type: "group",
        status: "active",
        createdById: "user-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }),
    getConversations: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),
    getConversation: vi.fn().mockResolvedValue({
      data: {
        id: "conv-1",
        title: "",
        type: "group",
        status: "active",
        createdById: "user-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }),
    updateConversation: vi.fn().mockResolvedValue({
      data: {
        id: "conv-1",
        title: "",
        type: "group",
        status: "active",
        createdById: "user-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }),
    closeConversation: vi.fn().mockResolvedValue({
      data: { id: "conv-1", status: "closed" },
    }),
    reopenConversation: vi.fn().mockResolvedValue({
      data: { id: "conv-1", status: "active" },
    }),
    archiveConversation: vi.fn().mockResolvedValue({
      data: { id: "conv-1", status: "archived" },
    }),

    // ─── Participants ─────────────────────────────────────────────────────────
    addParticipant: vi.fn().mockResolvedValue({
      data: {
        id: "participant-1",
        conversationId: "conv-1",
        userId: "user-1",
        role: "member",
        status: "active",
      },
    }),
    getParticipants: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),
    updateParticipant: vi.fn().mockResolvedValue({
      data: {
        id: "participant-1",
        conversationId: "conv-1",
        userId: "user-1",
        role: "member",
        status: "active",
      },
    }),
    removeParticipant: vi.fn().mockResolvedValue({
      data: { success: true },
    }),
    leaveConversation: vi.fn().mockResolvedValue({
      data: { id: "conv-1", status: "active" },
    }),
    promoteParticipant: vi.fn().mockResolvedValue({
      data: {
        id: "participant-1",
        conversationId: "conv-1",
        userId: "user-1",
        role: "admin",
        status: "active",
      },
    }),
    demoteParticipant: vi.fn().mockResolvedValue({
      data: {
        id: "participant-1",
        conversationId: "conv-1",
        userId: "user-1",
        role: "member",
        status: "active",
      },
    }),

    // ─── Invites ──────────────────────────────────────────────────────────────
    getConversationInvites: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),
    createConversationInvite: vi.fn().mockResolvedValue({
      data: {
        id: "invite-1",
        conversationId: "conv-1",
        inviteeUserId: "user-2",
        status: "pending",
      },
    }),
    acceptConversationInvite: vi.fn().mockResolvedValue({
      data: { id: "invite-1", status: "accepted" },
    }),
    rejectConversationInvite: vi.fn().mockResolvedValue({
      data: { id: "invite-1", status: "rejected" },
    }),

    // ─── Join Requests ────────────────────────────────────────────────────────
    getJoinRequests: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),
    createJoinRequest: vi.fn().mockResolvedValue({
      data: {
        id: "join-req-1",
        conversationId: "conv-1",
        userId: "user-2",
        status: "pending",
      },
    }),
    approveJoinRequest: vi.fn().mockResolvedValue({
      data: { id: "join-req-1", status: "approved" },
    }),
    rejectJoinRequest: vi.fn().mockResolvedValue({
      data: { id: "join-req-1", status: "rejected" },
    }),

    // ─── Messages ─────────────────────────────────────────────────────────────
    sendMessage: vi.fn().mockResolvedValue({
      data: {
        id: "msg-1",
        conversationId: "conv-1",
        senderId: "user-1",
        body: "",
        type: "text",
        status: "sent",
        createdAt: new Date().toISOString(),
      },
    }),
    getMessages: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),
    getMessage: vi.fn().mockResolvedValue({
      data: {
        id: "msg-1",
        conversationId: "conv-1",
        senderId: "user-1",
        body: "",
        type: "text",
        status: "sent",
        createdAt: new Date().toISOString(),
      },
    }),
    updateMessage: vi.fn().mockResolvedValue({
      data: {
        id: "msg-1",
        conversationId: "conv-1",
        senderId: "user-1",
        body: "",
        type: "text",
        status: "sent",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }),
    deleteMessage: vi.fn().mockResolvedValue({
      data: { success: true },
    }),
    markMessageRead: vi.fn().mockResolvedValue({
      data: { id: "msg-1", status: "sent" },
    }),
    markConversationRead: vi.fn().mockResolvedValue({
      data: { totalReaders: 0, readers: [] },
    }),
    getConversationReadSummary: vi.fn().mockResolvedValue({
      data: { totalReaders: 0, readers: [] },
    }),

    // ─── Notifications ────────────────────────────────────────────────────────
    getNotifications: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),
    getNotification: vi.fn().mockResolvedValue({
      data: { id: "notif-1", type: "message", status: "unread" },
    }),
    markNotificationRead: vi.fn().mockResolvedValue({
      data: { id: "notif-1", type: "message", status: "read" },
    }),
    archiveNotification: vi.fn().mockResolvedValue({
      data: { id: "notif-1", type: "message", status: "archived" },
    }),
    markAllNotificationsRead: vi.fn().mockResolvedValue({
      data: { updatedCount: 0 },
    }),
    getNotificationDeliveries: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),
    getNotificationDelivery: vi.fn().mockResolvedValue({
      data: { id: "delivery-1", notificationId: "notif-1", status: "delivered" },
    }),

    // ─── Reactions ────────────────────────────────────────────────────────────
    upsertReaction: vi.fn().mockResolvedValue({
      data: { id: "reaction-1", messageId: "msg-1", userId: "user-1", type: "like" },
    }),
    getReactions: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),
    deleteMyReaction: vi.fn().mockResolvedValue({
      data: { success: true },
    }),

    // ─── Attachments ──────────────────────────────────────────────────────────
    linkAttachment: vi.fn().mockResolvedValue({
      data: { id: "attachment-1", messageId: "msg-1", fileId: "file-1", fileName: "file.pdf" },
    }),
    getAttachments: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),
    deleteAttachment: vi.fn().mockResolvedValue({
      data: { success: true },
    }),

    // ─── Message Reports ──────────────────────────────────────────────────────
    createMessageReport: vi.fn().mockResolvedValue({
      data: { id: "report-1", messageId: "msg-1", status: "pending", reason: "" },
    }),
    getMessageReports: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),
    getMessageReport: vi.fn().mockResolvedValue({
      data: { id: "report-1", messageId: "msg-1", status: "pending", reason: "" },
    }),
    updateMessageReport: vi.fn().mockResolvedValue({
      data: { id: "report-1", messageId: "msg-1", status: "reviewed", reason: "" },
    }),

    // ─── Moderation ───────────────────────────────────────────────────────────
    createModerationAction: vi.fn().mockResolvedValue({
      data: { id: "mod-action-1", messageId: "msg-1", action: "warn" },
    }),
    getModerationActions: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),

    // ─── Restrictions ─────────────────────────────────────────────────────────
    createRestriction: vi.fn().mockResolvedValue({
      data: { id: "restriction-1", userId: "user-1", type: "mute", status: "active" },
    }),
    getRestrictions: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),
    updateRestriction: vi.fn().mockResolvedValue({
      data: { id: "restriction-1", userId: "user-1", type: "mute", status: "active" },
    }),
    deleteRestriction: vi.fn().mockResolvedValue({
      data: { success: true },
    }),

    // ─── Blocks ───────────────────────────────────────────────────────────────
    createBlock: vi.fn().mockResolvedValue({
      data: { id: "block-1", blockedUserId: "user-2", blockedByUserId: "user-1" },
    }),
    getBlocks: vi.fn().mockResolvedValue({
      data: { items: [], total: 0 },
    }),
    deleteBlock: vi.fn().mockResolvedValue({
      data: { success: true },
    }),
  };
}

/**
 * Creates a mock of the filesService with default resolved values.
 */
export function createMockFilesService() {
  return {
    uploadFile: vi.fn().mockResolvedValue({
      data: {
        id: "file-1",
        fileName: "test-file.pdf",
        originalName: "test-file.pdf",
        mimeType: "application/pdf",
        size: 1024,
        url: "https://example.com/files/file-1",
      },
    }),
  };
}

/** Type helper for the mock API service return value */
export type MockApiService = ReturnType<typeof createMockApiService>;

/** Type helper for the mock files service return value */
export type MockFilesService = ReturnType<typeof createMockFilesService>;
