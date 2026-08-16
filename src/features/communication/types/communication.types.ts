export type CommunicationId = string;
export type CommunicationDateTime = string;

export type CommunicationQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type CommunicationQueryParams = Record<
  string,
  CommunicationQueryValue | CommunicationQueryValue[]
>;

export type CommunicationRecord = Record<string, unknown>;

export interface CommunicationMeta extends CommunicationRecord {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface CommunicationEnvelope<T> extends CommunicationRecord {
  data?: T;
  item?: T;
  result?: T;
  payload?: T;
  message?: string;
  meta?: CommunicationMeta;
}

export interface CommunicationList<T> extends CommunicationRecord {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export type CommunicationResponse<T> = T | CommunicationEnvelope<T>;

export type CommunicationListResponse<T> = CommunicationResponse<
  CommunicationList<T> | T[]
>;

export interface CommunicationActor extends CommunicationRecord {
  id: CommunicationId;
  userId?: CommunicationId;
  displayName?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  role?: string;
  avatarUrl?: string | null;
}

export interface CommunicationPolicy extends CommunicationRecord {
  id?: CommunicationId;
  schoolId?: CommunicationId;
  isEnabled?: boolean;
  allowAnnouncements?: boolean;
  allowConversations?: boolean;
  allowAdminToAnyone?: boolean;
  allowDirectStaffToStaff?: boolean;
  allowTeacherToParent?: boolean;
  allowTeacherToStudent?: boolean;
  allowStudentToTeacher?: boolean;
  allowStudentToStudent?: boolean;
  studentDirectMode?: StudentDirectMode;
  allowTeacherCreatedGroups?: boolean;
  allowStudentCreatedGroups?: boolean;
  requireApprovalForStudentGroups?: boolean;
  allowParentToParent?: boolean;
  allowAttachments?: boolean;
  allowVoiceMessages?: boolean;
  allowVideoMessages?: boolean;
  allowReactions?: boolean;
  allowMessageEdit?: boolean;
  allowMessageDelete?: boolean;
  allowMessageEditing?: boolean;
  allowMessageDeleting?: boolean;
  allowReadReceipts?: boolean;
  allowDeliveryReceipts?: boolean;
  allowOnlinePresence?: boolean;
  moderationEnabled?: boolean;
  moderationMode?: ModerationMode;
  maxGroupMembers?: number;
  maxMessageLength?: number;
  maxAttachmentSizeMb?: number;
  retentionDays?: number;
  allowedAttachmentMimeTypes?: string[];
  metadata?: CommunicationPolicyMetadata;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export interface CommunicationNotificationChannelSettings
  extends CommunicationRecord {
  inAppEnabled?: boolean;
  pushEnabled?: boolean;
  firebaseProviderEnabled?: boolean;
}

export interface CommunicationPolicyMetadata extends CommunicationRecord {
  notificationChannels?: CommunicationNotificationChannelSettings;
}

export type StudentDirectMode =
  | "disabled"
  | "same_classroom"
  | "same_grade"
  | "same_school"
  | "any_school_user"
  | "approval_required";

export type ModerationMode = "standard" | "strict" | "relaxed";

export interface UpdateCommunicationPolicyPayload {
  isEnabled?: boolean;
  allowDirectStaffToStaff?: boolean;
  allowAdminToAnyone?: boolean;
  allowTeacherToParent?: boolean;
  allowTeacherToStudent?: boolean;
  allowStudentToTeacher?: boolean;
  allowStudentToStudent?: boolean;
  studentDirectMode?: StudentDirectMode;
  allowTeacherCreatedGroups?: boolean;
  allowStudentCreatedGroups?: boolean;
  requireApprovalForStudentGroups?: boolean;
  allowParentToParent?: boolean;
  allowAttachments?: boolean;
  allowVoiceMessages?: boolean;
  allowVideoMessages?: boolean;
  allowReactions?: boolean;
  allowMessageEdit?: boolean;
  allowMessageDelete?: boolean;
  allowReadReceipts?: boolean;
  allowDeliveryReceipts?: boolean;
  allowOnlinePresence?: boolean;
  maxGroupMembers?: number;
  maxMessageLength?: number;
  maxAttachmentSizeMb?: number;
  retentionDays?: number;
  moderationMode?: ModerationMode;
  metadata?: CommunicationRecord | null;
}

export interface CommunicationAdminOverview extends CommunicationRecord {
  policy: CommunicationOverviewPolicy;
  conversations: CommunicationOverviewConversationCounts;
  participants: CommunicationOverviewParticipantCounts;
  messages: CommunicationOverviewMessageCounts;
  receipts: CommunicationOverviewReceiptCounts;
  safety: CommunicationOverviewSafetyCounts;
  recentActivity: CommunicationOverviewRecentActivity;
}

export interface CommunicationOverviewPolicy extends CommunicationRecord {
  isConfigured: boolean;
  isEnabled: boolean;
  studentDirectMode: StudentDirectMode;
  allowTeacherCreatedGroups: boolean;
  allowStudentCreatedGroups: boolean;
  allowAttachments: boolean;
  allowReactions: boolean;
  allowReadReceipts: boolean;
  allowDeliveryReceipts: boolean;
  allowOnlinePresence: boolean;
}

export interface CommunicationOverviewConversationCounts extends CommunicationRecord {
  total: number;
  active: number;
  archived: number;
  closed: number;
  direct: number;
  group: number;
  classroom: number;
  grade: number;
  section: number;
  stage: number;
  schoolWide: number;
  support: number;
  system: number;
}

export interface CommunicationOverviewParticipantCounts extends CommunicationRecord {
  total: number;
  active: number;
  invited: number;
  left: number;
  removed: number;
  muted: number;
  blocked: number;
}

export interface CommunicationOverviewMessageCounts extends CommunicationRecord {
  total: number;
  sent: number;
  hidden: number;
  deleted: number;
  text: number;
  image: number;
  file: number;
  audio: number;
  video: number;
  system: number;
}

export interface CommunicationOverviewReceiptCounts extends CommunicationRecord {
  reads: number;
  deliveries: number;
  pendingDeliveries: number;
  deliveredDeliveries: number;
  failedDeliveries: number;
}

export interface CommunicationOverviewSafetyCounts extends CommunicationRecord {
  openReports: number;
  inReviewReports: number;
  resolvedReports: number;
  dismissedReports: number;
  activeBlocks: number;
  activeRestrictions: number;
  moderationActions: number;
}

export interface CommunicationOverviewRecentConversation extends CommunicationRecord {
  id: CommunicationId;
  type: string;
  status: string;
  lastMessageAt: CommunicationDateTime | null;
  createdAt: CommunicationDateTime;
  updatedAt: CommunicationDateTime;
}

export interface CommunicationOverviewRecentMessage extends CommunicationRecord {
  id: CommunicationId;
  conversationId: CommunicationId;
  senderUserId: CommunicationId | null;
  kind: string;
  status: string;
  sentAt: CommunicationDateTime;
  createdAt: CommunicationDateTime;
  updatedAt: CommunicationDateTime;
}

export interface CommunicationOverviewRecentActivity extends CommunicationRecord {
  conversations: CommunicationOverviewRecentConversation[];
  messages: CommunicationOverviewRecentMessage[];
}

export interface CommunicationFile extends CommunicationRecord {
  id: CommunicationId;
  fileId?: CommunicationId;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export type UploadFileExtraFields = Record<
  string,
  string | Blob | number | boolean | null | undefined
>;
