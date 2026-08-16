import type {
  CommunicationActor,
  CommunicationDateTime,
  CommunicationId,
  CommunicationRecord,
} from "./communication.types";

export type AnnouncementStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "archived"
  | "cancelled";
export type CreateAnnouncementStatus = "draft" | "scheduled";
export type AnnouncementPriority = "low" | "normal" | "high" | "urgent";
export type AnnouncementAudienceType =
  | "school"
  | "stage"
  | "grade"
  | "section"
  | "classroom"
  | "custom";

export interface AnnouncementAudienceRow {
  audienceType?: AnnouncementAudienceType;
  stageId?: CommunicationId;
  gradeId?: CommunicationId;
  sectionId?: CommunicationId;
  classroomId?: CommunicationId;
  studentId?: CommunicationId;
  guardianId?: CommunicationId;
  userId?: CommunicationId;
  teacherUserId?: CommunicationId;
}

export interface Announcement extends CommunicationRecord {
  id: CommunicationId;
  title?: string;
  titleAr?: string;
  titleEn?: string;
  body?: string;
  bodyAr?: string;
  bodyEn?: string;
  status?: AnnouncementStatus;
  priority?: AnnouncementPriority;
  audienceType?: AnnouncementAudienceType;
  audiences?: AnnouncementAudienceRow[];
  author?: CommunicationActor;
  authorId?: CommunicationId;
  scheduledAt?: CommunicationDateTime | null;
  expiresAt?: CommunicationDateTime | null;
  publishedAt?: CommunicationDateTime | null;
  archivedAt?: CommunicationDateTime | null;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export interface CreateAnnouncementPayload {
  title: string;
  body: string;
  status?: CreateAnnouncementStatus;
  priority?: AnnouncementPriority;
  audienceType?: AnnouncementAudienceType;
  scheduledAt?: CommunicationDateTime | null;
  expiresAt?: CommunicationDateTime | null;
  audiences?: AnnouncementAudienceRow[];
  metadata?: CommunicationRecord | null;
}

export interface UpdateAnnouncementPayload {
  title?: string;
  body?: string;
  priority?: AnnouncementPriority;
  audienceType?: AnnouncementAudienceType;
  scheduledAt?: CommunicationDateTime | null;
  expiresAt?: CommunicationDateTime | null;
  audiences?: AnnouncementAudienceRow[];
  metadata?: CommunicationRecord | null;
}

export type ListAnnouncementsParams = {
  status?: AnnouncementStatus;
  priority?: AnnouncementPriority;
  audienceType?: AnnouncementAudienceType;
  search?: string;
  publishedFrom?: CommunicationDateTime;
  publishedTo?: CommunicationDateTime;
  createdById?: CommunicationId;
  page?: number;
  limit?: number;
};

export interface AnnouncementReadSummary extends CommunicationRecord {
  announcementId: CommunicationId;
  readCount?: number;
  unreadCount?: number;
  totalRecipients?: number;
  readers?: CommunicationActor[];
}

export interface LinkAnnouncementAttachmentPayload {
  fileId: CommunicationId;
  caption?: string;
  sortOrder?: number;
}
