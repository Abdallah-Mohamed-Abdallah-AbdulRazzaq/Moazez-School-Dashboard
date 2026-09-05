"use client";

import { useMemo, useState } from "react";
import AttachmentUploadArea from "@/components/ui/attachment-upload/AttachmentUploadArea";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import ClassroomSelect from "@/features/communication/components/selectors/ClassroomSelect";
import GradeSelect from "@/features/communication/components/selectors/GradeSelect";
import SectionSelect from "@/features/communication/components/selectors/SectionSelect";
import StageSelect from "@/features/communication/components/selectors/StageSelect";
import UserMultiSearchSelect from "@/features/communication/components/selectors/UserMultiSearchSelect";
import type {
  Announcement,
  AnnouncementAudienceType,
  AnnouncementPriority,
  CreateAnnouncementStatus,
} from "@/features/communication/types/announcement.types";
import type { AnnouncementFormValues } from "@/features/communication/hooks/useAnnouncements";
import { FILES_UPLOAD_CONSTRAINTS } from "@/features/communication/api/files.service";

export interface AnnouncementEditorLabels {
  title: string;
  body: string;
  status: string;
  draft: string;
  scheduled: string;
  priority: string;
  normal: string;
  low: string;
  high: string;
  urgent: string;
  audienceType: string;
  audienceId: string;
  audienceRequired?: string;
  searchUsers?: string;
  school: string;
  stage: string;
  grade: string;
  section: string;
  classroom: string;
  custom: string;
  scheduledAt: string;
  expiresAt: string;
  saveDraft: string;
  saveChanges: string;
  attachments: string;
  addAttachments: string;
  removeAttachment: string;
  titleRequired: string;
  bodyRequired: string;
}

export interface AnnouncementEditorProps {
  labels: AnnouncementEditorLabels;
  announcement?: Announcement | null;
  isSubmitting?: boolean;
  readOnly?: boolean;
  submitLabel?: string;
  allowAttachments?: boolean;
  maxAttachmentSizeMb?: number;
  allowedAttachmentMimeTypes?: string[];
  onSubmit: (
    values: AnnouncementFormValues,
    attachmentFiles: File[],
  ) => Promise<void> | void;
}

function initialValues(announcement?: Announcement | null): AnnouncementFormValues {
  const firstAudience = announcement?.audiences?.[0];
  const audienceType =
    firstAudience?.audienceType ?? announcement?.audienceType ?? "";
  const audienceId =
    firstAudience?.stageId ??
    firstAudience?.gradeId ??
    firstAudience?.sectionId ??
    firstAudience?.classroomId ??
    firstAudience?.studentId ??
    firstAudience?.guardianId ??
    firstAudience?.userId ??
    firstAudience?.teacherUserId ??
    "";

  return {
    title: announcement?.title ?? "",
    body: announcement?.body ?? "",
    status:
      announcement?.status === "scheduled" ? "scheduled" : "draft",
    priority: announcement?.priority ?? "normal",
    ...(audienceType ? { audienceType } : {}),
    audienceId,
    audienceUserIds:
      firstAudience?.userId && audienceType === "custom" ? [firstAudience.userId] : [],
    scheduledAt: datetimeLocalValue(announcement?.scheduledAt),
    expiresAt: datetimeLocalValue(announcement?.expiresAt),
  };
}

function datetimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function AnnouncementEditor({
  announcement,
  isSubmitting = false,
  labels,
  onSubmit,
  readOnly = false,
  submitLabel,
  allowAttachments = true,
  allowedAttachmentMimeTypes,
  maxAttachmentSizeMb,
}: AnnouncementEditorProps) {
  const maxAttachmentSizeBytes = Math.min(
    maxAttachmentSizeMb
      ? maxAttachmentSizeMb * 1024 * 1024
      : FILES_UPLOAD_CONSTRAINTS.maxSizeBytes,
    FILES_UPLOAD_CONSTRAINTS.maxSizeBytes,
  );
  const allowedAnnouncementAttachmentMimeTypes =
    allowedAttachmentMimeTypes?.length
      ? FILES_UPLOAD_CONSTRAINTS.allowedMimeTypes.filter((mimeType) =>
          allowedAttachmentMimeTypes.includes(mimeType),
        )
      : FILES_UPLOAD_CONSTRAINTS.allowedMimeTypes;
  const [values, setValues] = useState<AnnouncementFormValues>(() =>
    initialValues(announcement),
  );
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const priorityOptions = useMemo(
    () => [
      { value: "normal", label: labels.normal },
      { value: "low", label: labels.low },
      { value: "high", label: labels.high },
      { value: "urgent", label: labels.urgent },
    ],
    [labels.high, labels.low, labels.normal, labels.urgent],
  );
  const statusOptions = useMemo(
    () => [
      { value: "draft", label: labels.draft },
      { value: "scheduled", label: labels.scheduled },
    ],
    [labels.draft, labels.scheduled],
  );
  const audienceOptions = useMemo(
    () => [
      { value: "school", label: labels.school },
      { value: "stage", label: labels.stage },
      { value: "grade", label: labels.grade },
      { value: "section", label: labels.section },
      { value: "classroom", label: labels.classroom },
      { value: "custom", label: labels.custom },
    ],
    [
      labels.classroom,
      labels.custom,
      labels.grade,
      labels.school,
      labels.section,
      labels.stage,
    ],
  );

  const handleSubmit = async () => {
    if (!values.title?.trim()) {
      setError(labels.titleRequired);
      return;
    }

    if (!values.body?.trim()) {
      setError(labels.bodyRequired);
      return;
    }
    if (
      values.audienceType &&
      values.audienceType !== "school" &&
      values.audienceType !== "custom" &&
      !values.audienceId
    ) {
      setError(labels.audienceRequired ?? labels.audienceId);
      return;
    }
    if (values.audienceType === "custom" && !values.audienceUserIds?.length) {
      setError(labels.audienceRequired ?? labels.audienceId);
      return;
    }

    setError(null);
    await onSubmit(values, attachmentFiles);
  };

  return (
    <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <Input
        label={labels.title}
        value={values.title ?? ""}
        disabled={readOnly}
        error={error === labels.titleRequired ? error : undefined}
        onChange={(event) =>
          setValues((current) => ({ ...current, title: event.target.value }))
        }
      />
      <TextArea
        label={labels.body}
        value={values.body ?? ""}
        rows={5}
        disabled={readOnly}
        onChange={(event) =>
          setValues((current) => ({ ...current, body: event.target.value }))
        }
      />
      {!readOnly && allowAttachments ? (
        <AttachmentUploadArea
          allowedMimeTypes={
            allowedAnnouncementAttachmentMimeTypes
          }
          files={attachmentFiles}
          labels={{
            title: labels.attachments,
            addFiles: labels.addAttachments,
            removeFile: labels.removeAttachment,
          }}
          maxSizeBytes={maxAttachmentSizeBytes}
          onFilesChange={setAttachmentFiles}
        />
      ) : null}
      {!announcement ? (
        <Select
          label={labels.status}
          value={values.status ?? "draft"}
          disabled={readOnly}
          options={statusOptions}
          onChange={(selectedStatus) =>
            setValues((current) => ({
              ...current,
              status: selectedStatus as CreateAnnouncementStatus,
              scheduledAt:
                selectedStatus === "draft" ? "" : current.scheduledAt,
            }))
          }
        />
      ) : null}
      <Select
        label={labels.priority}
        value={values.priority ?? "normal"}
        disabled={readOnly}
        options={priorityOptions}
        onChange={(value) =>
          setValues((current) => ({
            ...current,
            priority: value as AnnouncementPriority,
          }))
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label={labels.audienceType}
          value={values.audienceType ?? "school"}
          disabled={readOnly}
          options={audienceOptions}
          onChange={(value) =>
            setValues((current) => ({
              ...current,
              audienceType: value as AnnouncementAudienceType,
              audienceId: "",
              audienceUserIds: [],
            }))
          }
        />
        {values.audienceType === "stage" ? (
          <StageSelect
            label={labels.audienceId}
            value={values.audienceId ?? ""}
            disabled={readOnly}
            error={error === labels.audienceRequired ? error : undefined}
            onChange={(audienceId) =>
              setValues((current) => ({ ...current, audienceId }))
            }
          />
        ) : null}
        {values.audienceType === "grade" ? (
          <GradeSelect
            label={labels.audienceId}
            value={values.audienceId ?? ""}
            disabled={readOnly}
            error={error === labels.audienceRequired ? error : undefined}
            onChange={(audienceId) =>
              setValues((current) => ({ ...current, audienceId }))
            }
          />
        ) : null}
        {values.audienceType === "section" ? (
          <SectionSelect
            label={labels.audienceId}
            value={values.audienceId ?? ""}
            disabled={readOnly}
            error={error === labels.audienceRequired ? error : undefined}
            onChange={(audienceId) =>
              setValues((current) => ({ ...current, audienceId }))
            }
          />
        ) : null}
        {values.audienceType === "classroom" ? (
          <ClassroomSelect
            label={labels.audienceId}
            value={values.audienceId ?? ""}
            disabled={readOnly}
            error={error === labels.audienceRequired ? error : undefined}
            onChange={(audienceId) =>
              setValues((current) => ({ ...current, audienceId }))
            }
          />
        ) : null}
        {values.audienceType === "custom" ? (
          <UserMultiSearchSelect
            label={labels.audienceId}
            placeholder={labels.searchUsers}
            value={values.audienceUserIds ?? []}
            disabled={readOnly}
            error={error === labels.audienceRequired ? error : undefined}
            onChange={(audienceUserIds) =>
              setValues((current) => ({ ...current, audienceUserIds }))
            }
          />
        ) : null}
        {values.status === "scheduled" ? (
          <Input
            label={labels.scheduledAt}
            type="datetime-local"
            value={values.scheduledAt ?? ""}
            disabled={readOnly}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                scheduledAt: event.target.value,
              }))
            }
          />
        ) : null}
        <Input
          label={labels.expiresAt}
          type="datetime-local"
          value={values.expiresAt ?? ""}
          disabled={readOnly}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              expiresAt: event.target.value,
            }))
          }
        />
      </div>
      {!readOnly ? (
        <div className="flex justify-end">
          <Button
            type="button"
            loading={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {submitLabel ?? labels.saveDraft}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
