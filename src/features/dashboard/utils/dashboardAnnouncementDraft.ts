import type {
  AnnouncementAudienceRow,
  AnnouncementAudienceType,
  AnnouncementPriority,
  CreateAnnouncementPayload,
} from "@/features/communication/types/announcement.types";

export interface DashboardAnnouncementDraftValues {
  title: string;
  body: string;
  priority: AnnouncementPriority;
  audienceType: AnnouncementAudienceType;
  audienceId: string;
  audienceUserIds: string[];
}

export type DashboardAnnouncementDraftValidationError =
  | "title"
  | "body"
  | "audience";

export const DEFAULT_DASHBOARD_ANNOUNCEMENT_DRAFT: DashboardAnnouncementDraftValues =
  {
    title: "",
    body: "",
    priority: "normal",
    audienceType: "school",
    audienceId: "",
    audienceUserIds: [],
  };

export function validateDashboardAnnouncementDraft(
  values: DashboardAnnouncementDraftValues,
): DashboardAnnouncementDraftValidationError | null {
  if (!values.title.trim()) return "title";
  if (!values.body.trim()) return "body";

  if (
    values.audienceType !== "school" &&
    values.audienceType !== "custom" &&
    !values.audienceId.trim()
  ) {
    return "audience";
  }

  if (values.audienceType === "custom" && values.audienceUserIds.length === 0) {
    return "audience";
  }

  return null;
}

export function dashboardAnnouncementDraftPayload(
  values: DashboardAnnouncementDraftValues,
): CreateAnnouncementPayload {
  const audiences = dashboardAnnouncementAudiences(values);

  return {
    title: values.title.trim(),
    body: values.body.trim(),
    status: "draft",
    priority: values.priority,
    audienceType: values.audienceType,
    ...(audiences.length > 0 ? { audiences } : {}),
  };
}

function dashboardAnnouncementAudiences(
  values: DashboardAnnouncementDraftValues,
): AnnouncementAudienceRow[] {
  if (values.audienceType === "school") {
    return [];
  }

  if (values.audienceType === "custom") {
    return values.audienceUserIds.map((userId) => ({
      audienceType: "custom",
      userId,
    }));
  }

  const audienceId = values.audienceId.trim();
  const scopedAudience: AnnouncementAudienceRow = {
    audienceType: values.audienceType,
  };

  if (values.audienceType === "stage") scopedAudience.stageId = audienceId;
  if (values.audienceType === "grade") scopedAudience.gradeId = audienceId;
  if (values.audienceType === "section") scopedAudience.sectionId = audienceId;
  if (values.audienceType === "classroom") {
    scopedAudience.classroomId = audienceId;
  }

  return [scopedAudience];
}
