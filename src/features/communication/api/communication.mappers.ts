import type {
  AnnouncementAudienceRow,
  CreateAnnouncementPayload,
  LinkAnnouncementAttachmentPayload,
  UpdateAnnouncementPayload,
} from "@/features/communication/types/announcement.types";
import type {
  AddParticipantPayload,
  CreateConversationInvitePayload,
  CreateJoinRequestPayload,
  CreateConversationPayload,
  ParticipantRoleChangePayload,
  RejectConversationInvitePayload,
  ReviewJoinRequestPayload,
  UpdateParticipantPayload,
  UpdateConversationPayload,
} from "@/features/communication/types/conversation.types";
import type {
  CommunicationRecord,
  UpdateCommunicationPolicyPayload,
} from "@/features/communication/types/communication.types";
import type {
  LinkAttachmentPayload,
  SendMessagePayload,
  UpdateMessagePayload,
} from "@/features/communication/types/message.types";
import type {
  CreateBlockPayload,
  CreateMessageReportPayload,
  CreateRestrictionPayload,
  UpdateMessageReportPayload,
  UpdateRestrictionPayload,
} from "@/features/communication/types/safety.types";

type BackendPrimitive = string | number | boolean | null;
type BackendPayloadValue =
  | BackendPrimitive
  | BackendPayloadValue[]
  | { [key: string]: BackendPayloadValue };
type BackendPayload = Record<string, unknown>;
type CompactBackendPayload = Record<string, BackendPayloadValue>;
type NullableKey = string;

export interface BackendConversationCreatePayload extends BackendPayload {
  type?: BackendPayloadValue;
  title?: BackendPayloadValue;
  description?: BackendPayloadValue;
  avatarFileId?: BackendPayloadValue;
  academicYearId?: BackendPayloadValue;
  termId?: BackendPayloadValue;
  stageId?: BackendPayloadValue;
  gradeId?: BackendPayloadValue;
  sectionId?: BackendPayloadValue;
  classroomId?: BackendPayloadValue;
  subjectId?: BackendPayloadValue;
  isReadOnly?: BackendPayloadValue;
  isPinned?: BackendPayloadValue;
  metadata?: BackendPayloadValue;
}

export interface BackendConversationUpdatePayload extends BackendPayload {
  title?: BackendPayloadValue;
  description?: BackendPayloadValue;
  avatarFileId?: BackendPayloadValue;
  isReadOnly?: BackendPayloadValue;
  isPinned?: BackendPayloadValue;
  metadata?: BackendPayloadValue;
}

export interface BackendPolicyUpdatePayload extends BackendPayload {
  isEnabled?: BackendPayloadValue;
  allowDirectStaffToStaff?: BackendPayloadValue;
  allowAdminToAnyone?: BackendPayloadValue;
  allowTeacherToParent?: BackendPayloadValue;
  allowTeacherToStudent?: BackendPayloadValue;
  allowStudentToTeacher?: BackendPayloadValue;
  allowStudentToStudent?: BackendPayloadValue;
  studentDirectMode?: BackendPayloadValue;
  allowTeacherCreatedGroups?: BackendPayloadValue;
  allowStudentCreatedGroups?: BackendPayloadValue;
  requireApprovalForStudentGroups?: BackendPayloadValue;
  allowParentToParent?: BackendPayloadValue;
  allowAttachments?: BackendPayloadValue;
  allowVoiceMessages?: BackendPayloadValue;
  allowVideoMessages?: BackendPayloadValue;
  allowReactions?: BackendPayloadValue;
  allowMessageEdit?: BackendPayloadValue;
  allowMessageDelete?: BackendPayloadValue;
  allowReadReceipts?: BackendPayloadValue;
  allowDeliveryReceipts?: BackendPayloadValue;
  allowOnlinePresence?: BackendPayloadValue;
  maxGroupMembers?: BackendPayloadValue;
  maxMessageLength?: BackendPayloadValue;
  maxAttachmentSizeMb?: BackendPayloadValue;
  retentionDays?: BackendPayloadValue;
  moderationMode?: BackendPayloadValue;
  metadata?: BackendPayloadValue;
}

export interface BackendParticipantPayload extends BackendPayload {
  userId?: BackendPayloadValue;
  role?: BackendPayloadValue;
  status?: BackendPayloadValue;
  mutedUntil?: BackendPayloadValue;
  metadata?: BackendPayloadValue;
}

export interface BackendRoleChangePayload extends BackendPayload {
  targetRole?: BackendPayloadValue;
}

export interface BackendConversationInvitePayload extends BackendPayload {
  invitedUserId?: BackendPayloadValue;
  expiresAt?: BackendPayloadValue;
  metadata?: BackendPayloadValue;
}

export interface BackendReasonPayload extends BackendPayload {
  reason?: BackendPayloadValue;
}

export interface BackendJoinRequestPayload extends BackendPayload {
  note?: BackendPayloadValue;
  metadata?: BackendPayloadValue;
}

export interface BackendSendMessagePayload extends BackendPayload {
  type?: BackendPayloadValue;
  body?: BackendPayloadValue;
  content?: BackendPayloadValue;
  caption?: BackendPayloadValue;
  clientMessageId?: BackendPayloadValue;
  replyToMessageId?: BackendPayloadValue;
  attachments?: BackendPayloadValue;
  metadata?: BackendPayloadValue;
}

export interface BackendUpdateMessagePayload extends BackendPayload {
  body?: BackendPayloadValue;
  content?: BackendPayloadValue;
}

export interface BackendAnnouncementCreatePayload extends BackendPayload {
  title?: BackendPayloadValue;
  body?: BackendPayloadValue;
  status?: BackendPayloadValue;
  priority?: BackendPayloadValue;
  audienceType?: BackendPayloadValue;
  scheduledAt?: BackendPayloadValue;
  expiresAt?: BackendPayloadValue;
  audiences?: BackendPayloadValue;
  metadata?: BackendPayloadValue;
}

export type BackendAnnouncementUpdatePayload = Omit<
  BackendAnnouncementCreatePayload,
  "status"
>;

export interface BackendReportCreatePayload extends BackendPayload {
  reason?: BackendPayloadValue;
  description?: BackendPayloadValue;
  comment?: BackendPayloadValue;
  metadata?: BackendPayloadValue;
}

export interface BackendReportUpdatePayload extends BackendPayload {
  status?: BackendPayloadValue;
  note?: BackendPayloadValue;
  resolutionNote?: BackendPayloadValue;
  metadata?: BackendPayloadValue;
}

export interface BackendRestrictionCreatePayload extends BackendPayload {
  targetUserId?: BackendPayloadValue;
  type?: BackendPayloadValue;
  reason?: BackendPayloadValue;
  startsAt?: BackendPayloadValue;
  expiresAt?: BackendPayloadValue;
  metadata?: BackendPayloadValue;
}

export interface BackendRestrictionUpdatePayload extends BackendPayload {
  reason?: BackendPayloadValue;
  startsAt?: BackendPayloadValue;
  expiresAt?: BackendPayloadValue;
  metadata?: BackendPayloadValue;
}

export interface BackendBlockCreatePayload extends BackendPayload {
  targetUserId?: BackendPayloadValue;
  reason?: BackendPayloadValue;
  metadata?: BackendPayloadValue;
}

export interface BackendAttachmentLinkPayload extends BackendPayload {
  fileId?: BackendPayloadValue;
  caption?: BackendPayloadValue;
  sortOrder?: BackendPayloadValue;
}

export function toBackendPolicyUpdatePayload(
  input: UpdateCommunicationPolicyPayload,
): BackendPolicyUpdatePayload {
  return compactBackendPayload(
    {
      isEnabled: input.isEnabled,
      allowDirectStaffToStaff: input.allowDirectStaffToStaff,
      allowAdminToAnyone: input.allowAdminToAnyone,
      allowTeacherToParent: input.allowTeacherToParent,
      allowTeacherToStudent: input.allowTeacherToStudent,
      allowStudentToTeacher: input.allowStudentToTeacher,
      allowStudentToStudent: input.allowStudentToStudent,
      studentDirectMode: input.studentDirectMode,
      allowTeacherCreatedGroups: input.allowTeacherCreatedGroups,
      allowStudentCreatedGroups: input.allowStudentCreatedGroups,
      requireApprovalForStudentGroups: input.requireApprovalForStudentGroups,
      allowParentToParent: input.allowParentToParent,
      allowAttachments: input.allowAttachments,
      allowVoiceMessages: input.allowVoiceMessages,
      allowVideoMessages: input.allowVideoMessages,
      allowReactions: input.allowReactions,
      allowMessageEdit: input.allowMessageEdit,
      allowMessageDelete: input.allowMessageDelete,
      allowReadReceipts: input.allowReadReceipts,
      allowDeliveryReceipts: input.allowDeliveryReceipts,
      allowOnlinePresence: input.allowOnlinePresence,
      maxGroupMembers: input.maxGroupMembers,
      maxMessageLength: input.maxMessageLength,
      maxAttachmentSizeMb: input.maxAttachmentSizeMb,
      retentionDays: input.retentionDays,
      moderationMode: input.moderationMode,
      metadata: input.metadata,
    },
    ["metadata"],
  ) as BackendPolicyUpdatePayload;
}

export function toBackendAddParticipantPayload(
  input: AddParticipantPayload,
): BackendParticipantPayload {
  return compactBackendPayload(
    {
      userId: input.userId,
      role: input.role,
      status: input.status,
      mutedUntil: input.mutedUntil,
      metadata: input.metadata,
    },
    ["mutedUntil", "metadata"],
  ) as BackendParticipantPayload;
}

export function toBackendUpdateParticipantPayload(
  input: UpdateParticipantPayload,
): BackendParticipantPayload {
  return compactBackendPayload(
    {
      role: input.role,
      status: input.status,
      mutedUntil: input.mutedUntil,
      metadata: input.metadata,
    },
    ["mutedUntil", "metadata"],
  ) as BackendParticipantPayload;
}

export function toBackendRoleChangePayload(
  input: ParticipantRoleChangePayload,
): BackendRoleChangePayload {
  return compactBackendPayload({
    targetRole: input.targetRole,
  }) as BackendRoleChangePayload;
}

export function toBackendConversationInvitePayload(
  input: CreateConversationInvitePayload,
): BackendConversationInvitePayload {
  return compactBackendPayload(
    {
      invitedUserId: input.invitedUserId,
      expiresAt: input.expiresAt,
      metadata: input.metadata,
    },
    ["expiresAt", "metadata"],
  ) as BackendConversationInvitePayload;
}

export function toBackendRejectInvitePayload(
  input: RejectConversationInvitePayload,
): BackendReasonPayload {
  return compactBackendPayload({
    reason: input.reason,
  }) as BackendReasonPayload;
}

export function toBackendCreateJoinRequestPayload(
  input: CreateJoinRequestPayload,
): BackendJoinRequestPayload {
  return compactBackendPayload(
    {
      note: input.note,
      metadata: input.metadata,
    },
    ["metadata"],
  ) as BackendJoinRequestPayload;
}

export function toBackendReviewJoinRequestPayload(
  input: ReviewJoinRequestPayload,
): BackendReasonPayload {
  return compactBackendPayload({
    reason: input.reason,
  }) as BackendReasonPayload;
}

function isRecord(value: unknown): value is CommunicationRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringField(input: unknown, key: string): string | undefined {
  if (!isRecord(input)) return undefined;
  const value = input[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function restrictionTypeForBackend(input: unknown): string | undefined {
  const type = stringField(input, "type");

  if (type === "message_send_disabled") return "send_disabled";
  if (type === "attachment_upload_disabled" || type === "reaction_disabled") {
    return undefined;
  }

  return type;
}

function backendValue(value: unknown): BackendPayloadValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map(backendValue)
      .filter((item): item is BackendPayloadValue => item !== undefined);
  }

  if (isRecord(value)) {
    return compactBackendPayload(value as BackendPayload) as {
      [key: string]: BackendPayloadValue;
    };
  }

  return undefined;
}

export function compactBackendPayload(
  payload: BackendPayload,
  nullableKeys: readonly NullableKey[] = [],
): CompactBackendPayload {
  const nullable = new Set(nullableKeys);

  return Object.entries(payload).reduce<CompactBackendPayload>((acc, [key, value]) => {
    if (value === undefined) return acc;
    if (value === null && !nullable.has(key)) return acc;

    const nextValue = backendValue(value);
    if (nextValue === undefined) return acc;
    if (nextValue === null && !nullable.has(key)) return acc;

    acc[key] = nextValue;
    return acc;
  }, {});
}

export function toBackendConversationCreatePayload(
  input: CreateConversationPayload,
): BackendConversationCreatePayload {
  return compactBackendPayload(
    {
      type: input.type,
      title: input.title,
      description: input.description,
      avatarFileId: input.avatarFileId,
      academicYearId: input.academicYearId,
      termId: input.termId,
      stageId: input.stageId,
      gradeId: input.gradeId,
      sectionId: input.sectionId,
      classroomId: input.classroomId,
      subjectId: input.subjectId,
      isReadOnly: input.isReadOnly,
      isPinned: input.isPinned,
      metadata: input.metadata,
    },
    ["description", "avatarFileId", "metadata"],
  ) as BackendConversationCreatePayload;
}

export function toBackendConversationUpdatePayload(
  input: UpdateConversationPayload,
): BackendConversationUpdatePayload {
  return compactBackendPayload(
    {
      title: input.title,
      description: input.description,
      avatarFileId: input.avatarFileId,
      isReadOnly: input.isReadOnly,
      isPinned: input.isPinned,
      metadata: input.metadata,
    },
    ["description", "avatarFileId", "metadata"],
  ) as BackendConversationUpdatePayload;
}

export function toBackendSendMessagePayload(
  input: SendMessagePayload,
): BackendSendMessagePayload {
  const replyToMessageId =
    input.replyToMessageId ?? stringField(input, "parentMessageId");

  return compactBackendPayload(
    {
      type: input.type ?? "text",
      body: input.body,
      content: input.content,
      caption: input.caption,
      clientMessageId: input.clientMessageId,
      replyToMessageId,
      attachments: input.attachments,
      metadata: input.metadata,
    },
    ["metadata"],
  ) as BackendSendMessagePayload;
}

export function toBackendUpdateMessagePayload(
  input: UpdateMessagePayload,
): BackendUpdateMessagePayload {
  return compactBackendPayload({
    body: input.body,
    content: input.content,
  }) as BackendUpdateMessagePayload;
}

export function toBackendAnnouncementCreatePayload(
  input: CreateAnnouncementPayload,
): BackendAnnouncementCreatePayload {
  return compactBackendPayload(
    {
      title: input.title,
      body: input.body,
      status: input.status,
      priority: input.priority,
      audienceType: input.audienceType,
      scheduledAt: input.scheduledAt,
      expiresAt: input.expiresAt,
      audiences: input.audiences,
      metadata: input.metadata,
    },
    ["scheduledAt", "expiresAt", "metadata"],
  ) as BackendAnnouncementCreatePayload;
}

export function toBackendAnnouncementUpdatePayload(
  input: UpdateAnnouncementPayload,
): BackendAnnouncementUpdatePayload {
  return compactBackendPayload(
    {
      title: input.title,
      body: input.body,
      priority: input.priority,
      audienceType: input.audienceType,
      scheduledAt: input.scheduledAt,
      expiresAt: input.expiresAt,
      audiences: input.audiences,
      metadata: input.metadata,
    },
    ["scheduledAt", "expiresAt", "metadata"],
  ) as BackendAnnouncementUpdatePayload;
}

export function toBackendReportCreatePayload(
  input: CreateMessageReportPayload,
): BackendReportCreatePayload {
  const description = input.description ?? stringField(input, "details");

  return compactBackendPayload(
    {
      reason: input.reason,
      description,
      comment: input.comment,
      metadata: input.metadata,
    },
    ["description", "comment", "metadata"],
  ) as BackendReportCreatePayload;
}

export function toBackendReportUpdatePayload(
  input: UpdateMessageReportPayload,
): BackendReportUpdatePayload {
  return compactBackendPayload(
    {
      status: input.status,
      note: input.note,
      resolutionNote: input.resolutionNote,
      metadata: input.metadata,
    },
    ["note", "resolutionNote", "metadata"],
  ) as BackendReportUpdatePayload;
}

export function toBackendRestrictionCreatePayload(
  input: CreateRestrictionPayload,
): BackendRestrictionCreatePayload {
  return compactBackendPayload(
    {
      targetUserId: input.targetUserId,
      type: restrictionTypeForBackend(input),
      reason: input.reason,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      metadata: input.metadata,
    },
    ["reason", "startsAt", "expiresAt", "metadata"],
  ) as BackendRestrictionCreatePayload;
}

export function toBackendRestrictionUpdatePayload(
  input: UpdateRestrictionPayload,
): BackendRestrictionUpdatePayload {
  return compactBackendPayload(
    {
      reason: input.reason,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      metadata: input.metadata,
    },
    ["reason", "startsAt", "expiresAt", "metadata"],
  ) as BackendRestrictionUpdatePayload;
}

export function toBackendBlockCreatePayload(
  input: CreateBlockPayload,
): BackendBlockCreatePayload {
  return compactBackendPayload(
    {
      targetUserId: input.targetUserId,
      reason: input.reason,
      metadata: input.metadata,
    },
    ["reason", "metadata"],
  ) as BackendBlockCreatePayload;
}

export function toBackendAttachmentLinkPayload(
  input: LinkAttachmentPayload,
): BackendAttachmentLinkPayload {
  return compactBackendPayload(
    {
      fileId: input.fileId,
      caption: input.caption,
      sortOrder: input.sortOrder,
    },
    ["caption"],
  ) as BackendAttachmentLinkPayload;
}

export function toBackendAnnouncementAttachmentLinkPayload(
  input: LinkAnnouncementAttachmentPayload,
): BackendAttachmentLinkPayload {
  return compactBackendPayload(
    {
      fileId: input.fileId,
      caption: input.caption,
      sortOrder: input.sortOrder,
    },
    ["caption"],
  ) as BackendAttachmentLinkPayload;
}

export function audienceFromScope(
  audienceType?: string,
  audienceId?: string,
): AnnouncementAudienceRow | undefined {
  if (!audienceType || !audienceId) return undefined;

  if (
    audienceType !== "stage" &&
    audienceType !== "grade" &&
    audienceType !== "section" &&
    audienceType !== "classroom" &&
    audienceType !== "school" &&
    audienceType !== "custom"
  ) {
    return undefined;
  }

  return compactBackendPayload({
    audienceType,
    ...(audienceType === "stage" ? { stageId: audienceId } : {}),
    ...(audienceType === "grade" ? { gradeId: audienceId } : {}),
    ...(audienceType === "section" ? { sectionId: audienceId } : {}),
    ...(audienceType === "classroom" ? { classroomId: audienceId } : {}),
  }) as AnnouncementAudienceRow;
}
