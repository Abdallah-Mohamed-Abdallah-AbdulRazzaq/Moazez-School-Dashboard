"use client";

import { useState } from "react";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import type { AcademicContentEditorSectionState } from "../../../hooks/useAcademicContentEditor";
import {
  EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS,
  type AcademicContentDetailOptions,
} from "../../../services/academicContentDetailOptions";
import { isValidHttpsUrl } from "../../../model/academicContentPolicy";
import {
  ACADEMIC_ONLINE_SESSION_PLATFORMS,
  type AcademicContentOnlineSessionDetail,
  type AcademicOnlineSessionPlatform,
  type ReplaceAcademicContentOnlineSessionDetailRequest,
} from "../../../types/contracts";
import DetailFormShell from "./DetailFormShell";
import { OptionalReferenceSelect } from "./AcademicReferenceFields";

interface OnlineSessionFormProps {
  initial: AcademicContentOnlineSessionDetail;
  disabled: boolean;
  sectionState: AcademicContentEditorSectionState;
  options?: AcademicContentDetailOptions;
  onDirty: () => void;
  onSave: (request: ReplaceAcademicContentOnlineSessionDetailRequest) => Promise<boolean>;
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

export default function OnlineSessionForm({ initial, disabled, sectionState, options = EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS, onDirty, onSave }: OnlineSessionFormProps) {
  const [form, setForm] = useState(initial);
  const [validationError, setValidationError] = useState<string | null>(null);
  const update = <K extends keyof AcademicContentOnlineSessionDetail>(field: K, value: AcademicContentOnlineSessionDetail[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError(null);
    onDirty();
  };
  const save = async () => {
    if (!isValidHttpsUrl(form.joinUrl)) {
      setValidationError("Join URL must be an HTTPS URL without credentials.");
      return;
    }
    if (form.platform === "OTHER" && !form.providerName?.trim()) {
      setValidationError("Provider name is required for Other.");
      return;
    }
    if (!form.startAt || !form.endAt || form.startAt >= form.endAt) {
      setValidationError("Session end must be after its start.");
      return;
    }
    if (!validTimeZone(form.timezone)) {
      setValidationError("Enter a valid IANA timezone.");
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
    <DetailFormShell title="Online session" description="Configure the meeting only; attendance actions are not part of this workspace." disabled={disabled} sectionState={sectionState} validationError={validationError} onSave={() => void save()}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Platform" triggerAriaLabel="Platform" value={form.platform} options={ACADEMIC_ONLINE_SESSION_PLATFORMS.map((platform) => ({ value: platform, label: platform }))} required disabled={disabled} onChange={(value) => {
          const platform = value as AcademicOnlineSessionPlatform;
          setForm((current) => ({ ...current, platform, providerName: platform === "OTHER" ? current.providerName : null }));
          setValidationError(null);
          onDirty();
        }} />
        {form.platform === "OTHER" && <Input label="Provider name" aria-label="Provider name" value={form.providerName ?? ""} maxLength={180} required disabled={disabled} onChange={(event) => update("providerName", event.target.value)} />}
        <Input label="Join URL" aria-label="Join URL" type="url" value={form.joinUrl} maxLength={2048} required disabled={disabled} onChange={(event) => update("joinUrl", event.target.value)} />
        <Input label="Access code" aria-label="Access code" value={form.accessCode ?? ""} maxLength={255} disabled={disabled} onChange={(event) => update("accessCode", event.target.value)} />
        <Input label="Starts at" aria-label="Starts at" type="datetime-local" value={localDateTimeValue(form.startAt)} required disabled={disabled} onChange={(event) => update("startAt", toIsoInstant(event.target.value))} />
        <Input label="Ends at" aria-label="Ends at" type="datetime-local" value={localDateTimeValue(form.endAt)} required disabled={disabled} onChange={(event) => update("endAt", toIsoInstant(event.target.value))} />
        <Input label="Timezone" aria-label="Timezone" value={form.timezone} maxLength={100} required disabled={disabled} onChange={(event) => update("timezone", event.target.value)} />
        <OptionalReferenceSelect label="Timetable entry" value={form.timetableEntryId} options={options.timetableEntries.map((entry) => ({ value: entry.id, label: `${entry.classroom.nameEn} · ${entry.subject?.nameEn ?? "Unassigned"} · ${entry.period.label}` }))} disabled={disabled} onChange={(value) => update("timetableEntryId", value)} />
      </div>
      <TextArea label="Instructions" aria-label="Instructions" value={form.instructions ?? ""} maxLength={4000} disabled={disabled} onChange={(event) => update("instructions", event.target.value)} />
    </DetailFormShell>
  );
}
