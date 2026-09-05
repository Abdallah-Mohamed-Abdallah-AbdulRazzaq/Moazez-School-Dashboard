"use client";

import Link from "next/link";
import { Send } from "lucide-react";
import { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import { useToast } from "@/components/ui/toast/Toast";
import { createAnnouncement } from "@/features/communication/api/communication.service";
import { announcementErrorMessage } from "@/features/communication/utils/announcement-error-messages";
import ClassroomSelect from "@/features/communication/components/selectors/ClassroomSelect";
import GradeSelect from "@/features/communication/components/selectors/GradeSelect";
import SectionSelect from "@/features/communication/components/selectors/SectionSelect";
import StageSelect from "@/features/communication/components/selectors/StageSelect";
import UserMultiSearchSelect from "@/features/communication/components/selectors/UserMultiSearchSelect";
import type {
  AnnouncementAudienceType,
  AnnouncementPriority,
} from "@/features/communication/types/announcement.types";
import {
  DEFAULT_DASHBOARD_ANNOUNCEMENT_DRAFT,
  dashboardAnnouncementDraftPayload,
  validateDashboardAnnouncementDraft,
  type DashboardAnnouncementDraftValues,
  type DashboardAnnouncementDraftValidationError,
} from "@/features/dashboard/utils/dashboardAnnouncementDraft";
import {
  dashboardAnnouncementLabels,
  type DashboardAnnouncementLabels,
  type DashboardAnnouncementLocale,
} from "@/features/dashboard/utils/dashboardAnnouncementLabels";

interface DashboardAnnouncementDraftFormProps {
  locale: DashboardAnnouncementLocale;
  notificationTitle: string;
}

export default function DashboardAnnouncementDraftForm({
  locale,
  notificationTitle,
}: DashboardAnnouncementDraftFormProps) {
  const labels = dashboardAnnouncementLabels[locale] ?? dashboardAnnouncementLabels.en;
  const { showError, showSuccess } = useToast();
  const [draftValues, setDraftValues] =
    useState<DashboardAnnouncementDraftValues>(
      DEFAULT_DASHBOARD_ANNOUNCEMENT_DRAFT,
    );
  const [validationError, setValidationError] =
    useState<DashboardAnnouncementDraftValidationError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const priorityOptions = useMemo(
    () => [
      { value: "normal", label: labels.normal },
      { value: "low", label: labels.low },
      { value: "high", label: labels.high },
      { value: "urgent", label: labels.urgent },
    ],
    [labels.high, labels.low, labels.normal, labels.urgent],
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

  const fieldError = errorMessage(validationError, labels);

  const updateDraft = (values: Partial<DashboardAnnouncementDraftValues>) => {
    setDraftValues((current) => ({ ...current, ...values }));
    setValidationError(null);
  };

  const submitDraft = async () => {
    const nextError = validateDashboardAnnouncementDraft(draftValues);

    if (nextError) {
      setValidationError(nextError);
      return;
    }

    setIsSubmitting(true);

    try {
      await createAnnouncement(dashboardAnnouncementDraftPayload(draftValues));
      showSuccess(labels.draftCreated);
      setDraftValues(DEFAULT_DASHBOARD_ANNOUNCEMENT_DRAFT);
      setValidationError(null);
    } catch (nextError) {
      showError(announcementErrorMessage(nextError, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <DraftFormHeader
        label={labels.openFullForm}
        href={`/${locale}/communication/announcements/new`}
        title={notificationTitle}
      />
      <DraftContentFields
        draftValues={draftValues}
        fieldError={fieldError}
        labels={labels}
        validationError={validationError}
        onUpdate={updateDraft}
      />
      <DraftAudienceFields
        audienceOptions={audienceOptions}
        draftValues={draftValues}
        fieldError={fieldError}
        labels={labels}
        priorityOptions={priorityOptions}
        validationError={validationError}
        onUpdate={updateDraft}
      />
      <Button
        type="button"
        className="w-full justify-center"
        loading={isSubmitting}
        onClick={() => void submitDraft()}
        leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}
      >
        {labels.createDraft}
      </Button>
    </div>
  );
}

function DraftFormHeader({
  href,
  label,
  title,
}: {
  href: string;
  label: string;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      <Link
        href={href}
        className="text-xs font-semibold text-primary hover:text-hover"
      >
        {label}
      </Link>
    </div>
  );
}

function DraftContentFields({
  draftValues,
  fieldError,
  labels,
  onUpdate,
  validationError,
}: {
  draftValues: DashboardAnnouncementDraftValues;
  fieldError?: string;
  labels: DashboardAnnouncementLabels;
  validationError: DashboardAnnouncementDraftValidationError | null;
  onUpdate: (values: Partial<DashboardAnnouncementDraftValues>) => void;
}) {
  return (
    <>
      <Input
        label={labels.title}
        aria-label={labels.title}
        value={draftValues.title}
        error={validationError === "title" ? fieldError : undefined}
        onChange={(event) => onUpdate({ title: event.target.value })}
      />
      <TextArea
        label={labels.body}
        aria-label={labels.body}
        value={draftValues.body}
        rows={3}
        error={validationError === "body" ? fieldError : undefined}
        onChange={(event) => onUpdate({ body: event.target.value })}
      />
    </>
  );
}

function DraftAudienceFields({
  audienceOptions,
  draftValues,
  fieldError,
  labels,
  onUpdate,
  priorityOptions,
  validationError,
}: {
  audienceOptions: { value: string; label: string }[];
  draftValues: DashboardAnnouncementDraftValues;
  fieldError?: string;
  labels: DashboardAnnouncementLabels;
  priorityOptions: { value: string; label: string }[];
  validationError: DashboardAnnouncementDraftValidationError | null;
  onUpdate: (values: Partial<DashboardAnnouncementDraftValues>) => void;
}) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <Select
          label={labels.priority}
          value={draftValues.priority}
          options={priorityOptions}
          onChange={(priority) =>
            onUpdate({ priority: priority as AnnouncementPriority })
          }
        />
        <Select
          label={labels.audienceType}
          value={draftValues.audienceType}
          options={audienceOptions}
          onChange={(audienceType) =>
            onUpdate({
              audienceType: audienceType as AnnouncementAudienceType,
              audienceId: "",
              audienceUserIds: [],
            })
          }
        />
      </div>
      <AudienceSelector
        values={draftValues}
        label={labels.audience}
        placeholder={labels.searchUsers}
        error={validationError === "audience" ? fieldError : undefined}
        onChange={onUpdate}
      />
    </>
  );
}

function errorMessage(
  error: DashboardAnnouncementDraftValidationError | null,
  labels: DashboardAnnouncementLabels,
) {
  if (error === "title") return labels.titleRequired;
  if (error === "body") return labels.bodyRequired;
  if (error === "audience") return labels.audienceRequired;
  return undefined;
}

function AudienceSelector({
  error,
  label,
  onChange,
  placeholder,
  values,
}: {
  error?: string;
  label: string;
  placeholder: string;
  values: DashboardAnnouncementDraftValues;
  onChange: (values: Partial<DashboardAnnouncementDraftValues>) => void;
}) {
  if (values.audienceType === "stage") {
    return (
      <StageSelect
        label={label}
        value={values.audienceId}
        error={error}
        onChange={(audienceId) => onChange({ audienceId })}
      />
    );
  }

  if (values.audienceType === "grade") {
    return (
      <GradeSelect
        label={label}
        value={values.audienceId}
        error={error}
        onChange={(audienceId) => onChange({ audienceId })}
      />
    );
  }

  if (values.audienceType === "section") {
    return (
      <SectionSelect
        label={label}
        value={values.audienceId}
        error={error}
        onChange={(audienceId) => onChange({ audienceId })}
      />
    );
  }

  if (values.audienceType === "classroom") {
    return (
      <ClassroomSelect
        label={label}
        value={values.audienceId}
        error={error}
        onChange={(audienceId) => onChange({ audienceId })}
      />
    );
  }

  if (values.audienceType === "custom") {
    return (
      <UserMultiSearchSelect
        label={label}
        placeholder={placeholder}
        value={values.audienceUserIds}
        error={error}
        onChange={(audienceUserIds) => onChange({ audienceUserIds })}
      />
    );
  }

  return null;
}
