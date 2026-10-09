"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { useLocale } from "next-intl";
import ButtonLink from "@/components/ui/button/ButtonLink";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import { timezones } from "@/features/settings/constants/timezones";
import type { AcademicContentEditorSectionState } from "../../../hooks/useAcademicContentEditor";
import {
  EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS,
  type AcademicContentDetailOptions,
} from "../../../services/academicContentDetailOptions";
import { isValidHttpsUrl } from "../../../model/academicContentPolicy";
import { localizedAcademicName } from "../../../model/academicContentDisplay";
import {
  ACADEMIC_ONLINE_SESSION_PLATFORMS,
  type AcademicContentOnlineSessionDetail,
  type AcademicOnlineSessionPlatform,
  type ReplaceAcademicContentOnlineSessionDetailRequest,
} from "../../../types/contracts";
import DetailFormShell from "./DetailFormShell";
import { OptionalReferenceSelect } from "./AcademicReferenceFields";
import { useAcademicContentTranslations } from "../../../hooks/useAcademicContentTranslations";
import MeetingPlatformIcon from "../../overview/MeetingPlatformIcon";

const MEETING_PLATFORM_URLS: Record<
  Exclude<AcademicOnlineSessionPlatform, "OTHER">,
  string
> = {
  GOOGLE_MEET: "https://meet.google.com/",
  ZOOM: "https://zoom.us/start/videomeeting",
  MICROSOFT_TEAMS: "https://teams.microsoft.com/l/meeting/new",
  WEBEX: "https://www.webex.com/",
};

function meetingPlatformUrl(
  platform: AcademicOnlineSessionPlatform,
): string | null {
  return platform === "OTHER" ? null : MEETING_PLATFORM_URLS[platform];
}

interface OnlineSessionFormProps {
  initial: AcademicContentOnlineSessionDetail;
  disabled: boolean;
  sectionState: AcademicContentEditorSectionState;
  options?: AcademicContentDetailOptions;
  onDirty: () => void;
  onSave: (
    request: ReplaceAcademicContentOnlineSessionDetailRequest,
  ) => Promise<boolean>;
}

function localDateTimeValue(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIsoInstant(value: string): string {
  return value ? new Date(value).toISOString() : "";
}

function validTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export default function OnlineSessionForm({
  initial,
  disabled,
  sectionState,
  options = EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS,
  onDirty,
  onSave,
}: OnlineSessionFormProps) {
  const [form, setForm] = useState(initial);
  const [validationError, setValidationError] = useState<string | null>(null);
  const t = useAcademicContentTranslations();
  const locale = useLocale();
  const platformUrl = meetingPlatformUrl(form.platform);
  const timezoneOptions = [...new Set([form.timezone, ...timezones])]
    .filter(Boolean)
    .map((timezone) => ({ value: timezone, label: timezone }));
  const update = <K extends keyof AcademicContentOnlineSessionDetail>(
    field: K,
    value: AcademicContentOnlineSessionDetail[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError(null);
    onDirty();
  };
  const save = async () => {
    if (!isValidHttpsUrl(form.joinUrl)) {
      setValidationError(t("details.https_required"));
      return;
    }
    if (form.platform === "OTHER" && !form.providerName?.trim()) {
      setValidationError(t("details.provider_required"));
      return;
    }
    if (!form.startAt || !form.endAt || form.startAt >= form.endAt) {
      setValidationError(t("details.session_order"));
      return;
    }
    if (!validTimeZone(form.timezone)) {
      setValidationError(t("details.timezone_invalid"));
      return;
    }
    setValidationError(null);
    await onSave({
      platform: form.platform,
      providerName: form.providerName?.trim() || null,
      joinUrl: form.joinUrl.trim(),
      accessCode: form.accessCode?.trim() || null,
      instructions: form.instructions?.trim() || null,
      startAt: form.startAt,
      endAt: form.endAt,
      timezone: form.timezone.trim(),
      timetableEntryId: form.timetableEntryId || null,
    });
  };
  return (
    <DetailFormShell
      title={t("details.session_title")}
      description={t("details.session_description")}
      disabled={disabled}
      sectionState={sectionState}
      validationError={validationError}
      onSave={() => void save()}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Select
            label={t("fields.platform")}
            triggerAriaLabel={t("fields.platform")}
            value={form.platform}
            options={ACADEMIC_ONLINE_SESSION_PLATFORMS.map((platform) => ({
              value: platform,
              label: t(`platforms.${platform}`),
            }))}
            required
            disabled={disabled}
            onChange={(value) => {
              const platform = value as AcademicOnlineSessionPlatform;
              setForm((current) => ({
                ...current,
                platform,
                providerName:
                  platform === "OTHER" ? current.providerName : null,
              }));
              setValidationError(null);
              onDirty();
            }}
          />
          {platformUrl ? (
            <ButtonLink
              href={platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="sm"
              leftIcon={<MeetingPlatformIcon platform={form.platform} />}
              rightIcon={
                <ExternalLink aria-hidden="true" className="size-3.5" />
              }
              className="w-fit"
            >
              {t("details.open_platform", {
                platform: t(`platforms.${form.platform}`),
              })}
            </ButtonLink>
          ) : null}
        </div>
        {form.platform === "OTHER" && (
          <Input
            label={t("fields.provider_name")}
            aria-label={t("fields.provider_name")}
            value={form.providerName ?? ""}
            maxLength={180}
            required
            disabled={disabled}
            onChange={(event) => update("providerName", event.target.value)}
          />
        )}
        <Input
          label={t("fields.join_url")}
          aria-label={t("fields.join_url")}
          type="url"
          value={form.joinUrl}
          maxLength={2048}
          required
          disabled={disabled}
          onChange={(event) => update("joinUrl", event.target.value)}
        />
        <Input
          label={t("fields.access_code")}
          aria-label={t("fields.access_code")}
          value={form.accessCode ?? ""}
          maxLength={255}
          disabled={disabled}
          onChange={(event) => update("accessCode", event.target.value)}
        />
        <Input
          label={t("fields.starts_at")}
          aria-label={t("fields.starts_at")}
          type="datetime-local"
          value={localDateTimeValue(form.startAt)}
          required
          disabled={disabled}
          onChange={(event) =>
            update("startAt", toIsoInstant(event.target.value))
          }
        />
        <Input
          label={t("fields.ends_at")}
          aria-label={t("fields.ends_at")}
          type="datetime-local"
          value={localDateTimeValue(form.endAt)}
          required
          disabled={disabled}
          onChange={(event) =>
            update("endAt", toIsoInstant(event.target.value))
          }
        />
        <Select
          label={t("fields.timezone")}
          triggerAriaLabel={t("fields.timezone")}
          value={form.timezone}
          options={timezoneOptions}
          required
          disabled={disabled}
          onChange={(value) => update("timezone", value)}
        />
        <OptionalReferenceSelect
          label={t("fields.timetable_entry")}
          value={form.timetableEntryId}
          options={options.timetableEntries.map((entry) => ({
            value: entry.id,
            label: `${localizedAcademicName(entry.classroom, locale)} · ${localizedAcademicName(entry.subject ?? undefined, locale) ?? t("common.unassigned")} · ${entry.period.label}`,
          }))}
          disabled={disabled}
          helperText={t("details.target_dependency_hint")}
          onChange={(value) => update("timetableEntryId", value)}
        />
      </div>
      <TextArea
        label={t("fields.instructions")}
        aria-label={t("fields.instructions")}
        value={form.instructions ?? ""}
        maxLength={4000}
        disabled={disabled}
        onChange={(event) => update("instructions", event.target.value)}
      />
    </DetailFormShell>
  );
}
