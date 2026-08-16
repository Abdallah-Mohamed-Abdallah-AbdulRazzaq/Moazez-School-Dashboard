"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
  BilingualTextField,
  Button,
  DatePicker,
  Input,
  Select,
  TextArea,
} from "@/components/ui";
import {
  checkUsernameAvailability,
  previewLoginIdentityUsername,
} from "@/features/settings/login-identity/services/loginIdentityService";
import type {
  UsernameAvailabilityResponse,
  UsernamePreviewResponse,
} from "@/features/settings/login-identity/types";
import type {
  EditTeacherFormState,
  TeacherFormErrors,
  TeacherWorkDay,
} from "@/features/teachers/types/index";
import { isApiError } from "@/lib/api-error";

const workDays: TeacherWorkDay[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

interface TeacherFormSectionsProps {
  form: EditTeacherFormState;
  errors: TeacherFormErrors;
  onChange: (form: EditTeacherFormState) => void;
  showIdentity?: boolean;
  showIdentityTools?: boolean;
  loginIdentityReadOnly?: boolean;
}

type SectionProps = TeacherFormSectionsProps & {
  requiredError: (field: string) => string | undefined;
};

function IdentitySection({ form, onChange, requiredError, showIdentityTools = false, loginIdentityReadOnly = false }: SectionProps) {
  const t = useTranslations("teachers");
  const tUsers = useTranslations("settings.users");
  const [preview, setPreview] = useState<UsernamePreviewResponse | null>(null);
  const [availability, setAvailability] = useState<UsernameAvailabilityResponse | null>(null);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const updateIdentity = (patch: Partial<EditTeacherFormState["identity"]>) => {
    if ("username" in patch || "identityMode" in patch) {
      setPreview(null);
      setAvailability(null);
      setIdentityError(null);
    }
    onChange({ ...form, identity: { ...form.identity, ...patch } });
  };

  const username = form.identity.username.trim();
  const identityErrors = Array.from(
    new Set(
      (loginIdentityReadOnly ? ["contactEmail", "phone"] : ["username", "loginEmail", "contactEmail", "phone"])
        .map(requiredError)
        .filter((error): error is string => Boolean(error)),
    ),
  );
  const availabilityMessage = availability?.reason === "username_invalid"
    ? tUsers("identity.username_invalid")
    : availability?.reason === "reserved_username"
      ? tUsers("identity.username_reserved")
      : availability?.reason === "login_email_taken"
        ? tUsers("identity.username_unavailable")
        : tUsers("identity.username_unavailable");

  useEffect(() => {
    if (!showIdentityTools || form.identity.identityMode !== "username" || !username) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setIsPreviewing(true);
      void previewLoginIdentityUsername(username)
        .then((nextPreview) => {
          if (!cancelled) setPreview(nextPreview);
        })
        .catch((error) => {
          if (!cancelled) {
            setPreview(null);
            setIdentityError(
              isApiError(error) && error.code === "iam.user.username_invalid"
                ? tUsers("identity.username_invalid")
                : tUsers("identity.preview_failed"),
            );
          }
        })
        .finally(() => {
          if (!cancelled) setIsPreviewing(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [form.identity.identityMode, showIdentityTools, tUsers, username]);

  const checkAvailability = async () => {
    if (!username) {
      setIdentityError(tUsers("identity.username_required"));
      return;
    }

    setIsCheckingAvailability(true);
    setIdentityError(null);
    try {
      setAvailability(await checkUsernameAvailability(username));
    } catch {
      setAvailability(null);
      setIdentityError(tUsers("identity.availability_failed"));
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-gray-900">{t("form.identity_section")}</h3>
      {loginIdentityReadOnly ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Input label={t("fields.username")} value={form.identity.username} disabled dir="ltr" />
          <Input type="email" label={t("fields.login_email")} value={form.identity.loginEmail} disabled dir="ltr" />
        </div>
      ) : <><div className="flex gap-4">
        {(["username", "loginEmail"] as const).map((identityMode) => (
          <label key={identityMode} className="flex items-center gap-2 text-sm">
            <input type="radio" checked={form.identity.identityMode === identityMode} onChange={() => updateIdentity({ identityMode })} />
            {t(`form.identity_modes.${identityMode}`)}
          </label>
        ))}
      </div>
      {identityErrors.length > 0 && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {identityErrors.map((error) => <p key={error}>{error}</p>)}
        </div>
      )}
      {form.identity.identityMode === "username" ? (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <Input label={t("fields.username")} value={form.identity.username} onChange={(event) => updateIdentity({ username: event.target.value })} onBlur={() => void checkAvailability()} error={requiredError("username")} dir="ltr" required />
          {showIdentityTools ? <>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-gray-700">{tUsers("identity.generated_login_email")}</span>
                {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : null}
              </div>
              <p className="mt-1 break-all font-semibold text-gray-900">{preview?.loginEmail || tUsers("not_available")}</p>
              <p className="mt-1 text-xs text-gray-500">{tUsers("identity.login_identity_note")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" size="sm" loading={isCheckingAvailability} disabled={!username || isCheckingAvailability} onClick={() => void checkAvailability()}>{tUsers("identity.check_availability")}</Button>
              {availability ? <span className={`inline-flex items-center gap-1 text-sm ${availability.available ? "text-green-700" : "text-red-700"}`}>
                {availability.available ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
                {availability.available ? tUsers("identity.username_available") : availabilityMessage}
              </span> : null}
            </div>
            {identityError ? <p className="text-sm text-red-600">{identityError}</p> : null}
          </> : null}
        </div>
      ) : (
        <div className={showIdentityTools ? "space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3" : undefined}>
          <Input type="email" label={t("fields.login_email")} value={form.identity.loginEmail} onChange={(event) => updateIdentity({ loginEmail: event.target.value })} error={requiredError("loginEmail")} dir="ltr" required />
          {showIdentityTools ? <p className="text-xs text-gray-500">{t("form.legacy_login_email_help")}</p> : null}
        </div>
      )}</>}
      <div className="grid gap-3 md:grid-cols-2">
        <Input type="email" label={t("fields.contact_email")} value={form.identity.contactEmail} onChange={(event) => updateIdentity({ contactEmail: event.target.value })} error={requiredError("contactEmail")} />
        <Input type="tel" label={t("fields.phone")} value={form.identity.phone} onChange={(event) => updateIdentity({ phone: event.target.value })} error={requiredError("phone")} />
      </div>
    </section>
  );
}

function ProfileSection({ form, onChange, requiredError }: SectionProps) {
  const t = useTranslations("teachers");
  const updateProfile = (patch: Partial<EditTeacherFormState["profile"]>) =>
    onChange({ ...form, profile: { ...form.profile, ...patch } });

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-gray-900">{t("form.profile_section")}</h3>
      <Input label={t("fields.code")} value={form.profile.teacherCode} onChange={(event) => updateProfile({ teacherCode: event.target.value.toUpperCase().replace(/\s+/g, "") })} error={requiredError("teacherCode")} helperText={form.profile.teacherCode || undefined} required />
      <div className="grid gap-3 md:grid-cols-2">
        <BilingualTextField label={t("fields.first_name")} value={{ ar: form.profile.firstNameAr, en: form.profile.firstNameEn }} onChange={(names) => updateProfile({ firstNameAr: names.ar, firstNameEn: names.en })} errors={{ ar: requiredError("firstNameAr"), en: requiredError("firstNameEn") }} />
        <BilingualTextField label={t("fields.last_name")} value={{ ar: form.profile.lastNameAr, en: form.profile.lastNameEn }} onChange={(names) => updateProfile({ lastNameAr: names.ar, lastNameEn: names.en })} errors={{ ar: requiredError("lastNameAr"), en: requiredError("lastNameEn") }} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Select label={t("fields.preferred_language")} value={form.profile.preferredDisplayLanguage} onChange={(preferredDisplayLanguage) => updateProfile({ preferredDisplayLanguage: preferredDisplayLanguage as "AR" | "EN" })} options={[{ value: "AR", label: t("languages.ar") }, { value: "EN", label: t("languages.en") }]} error={requiredError("preferredDisplayLanguage")} required />
        <Select label={t("fields.gender")} value={form.profile.gender} onChange={(gender) => updateProfile({ gender: gender as "MALE" | "FEMALE" })} options={[{ value: "MALE", label: t("gender.male") }, { value: "FEMALE", label: t("gender.female") }]} error={requiredError("gender")} required />
      </div>
    </section>
  );
}

function EmploymentSection({ form, errors, onChange }: SectionProps) {
  const t = useTranslations("teachers");
  const updateProfile = (patch: Partial<EditTeacherFormState["profile"]>) =>
    onChange({ ...form, profile: { ...form.profile, ...patch } });

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-gray-900">{t("form.employment_section")}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Input label={t("fields.department")} value={form.profile.department} onChange={(event) => updateProfile({ department: event.target.value })} />
        <Input label={t("fields.specialization")} value={form.profile.specialization} onChange={(event) => updateProfile({ specialization: event.target.value })} />
        <Select label={t("fields.employment_type")} value={form.profile.employmentType} onChange={(employmentType) => updateProfile({ employmentType: employmentType as EditTeacherFormState["profile"]["employmentType"] })} options={[{ value: "FULL_TIME", label: t("employment_types.full_time") }, { value: "PART_TIME", label: t("employment_types.part_time") }, { value: "CONTRACT", label: t("employment_types.contract") }]} />
        <Input type="number" min={0} max={60} label={t("fields.experience_years")} value={form.profile.experienceYears} onChange={(event) => updateProfile({ experienceYears: event.target.value })} error={errors.experienceYears ? t("validation.experience_range") : undefined} />
        <DatePicker label={t("fields.hire_date")} value={form.profile.hireDate ? new Date(`${form.profile.hireDate}T00:00:00`) : null} onChange={(date) => updateProfile({ hireDate: date ? date.toISOString().slice(0, 10) : "" })} />
      </div>
    </section>
  );
}

function ScheduleSection({ form, errors, onChange, requiredError }: SectionProps) {
  const t = useTranslations("teachers");
  const updateSchedule = (patch: Partial<EditTeacherFormState["schedule"]>) =>
    onChange({ ...form, schedule: { ...form.schedule, ...patch } });
  const toggleWorkDay = (day: TeacherWorkDay) => {
    const selected = form.schedule.workingDays.includes(day);
    updateSchedule({ workingDays: selected ? form.schedule.workingDays.filter((current) => current !== day) : [...form.schedule.workingDays, day] });
  };

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-gray-900">{t("form.schedule_section")}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {workDays.map((day) => <label key={day} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.schedule.workingDays.includes(day)} onChange={() => toggleWorkDay(day)} />{t(`work_days.${day.toLowerCase()}`)}</label>)}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input type="time" label={t("fields.work_start_time")} value={form.schedule.workStartTime} onChange={(event) => updateSchedule({ workStartTime: event.target.value })} error={requiredError("workStartTime") ?? (errors.workTime ? t("validation.work_time_pair") : undefined)} />
        <Input type="time" label={t("fields.work_end_time")} value={form.schedule.workEndTime} onChange={(event) => updateSchedule({ workEndTime: event.target.value })} error={requiredError("workEndTime") ?? (errors.workTime ? t("validation.work_time_pair") : undefined)} />
      </div>
    </section>
  );
}

function NotesSection({ form, onChange }: SectionProps) {
  const t = useTranslations("teachers");
  const updateProfile = (patch: Partial<EditTeacherFormState["profile"]>) =>
    onChange({ ...form, profile: { ...form.profile, ...patch } });

  return (
    <section className="grid gap-3 md:grid-cols-2">
      <TextArea label={t("fields.notes_ar")} dir="rtl" maxLength={500} value={form.profile.notesAr} onChange={(event) => updateProfile({ notesAr: event.target.value })} />
      <TextArea label={t("fields.notes_en")} dir="ltr" maxLength={500} value={form.profile.notesEn} onChange={(event) => updateProfile({ notesEn: event.target.value })} />
    </section>
  );
}

export default function TeacherFormSections({ showIdentity = true, showIdentityTools = false, ...props }: TeacherFormSectionsProps) {
  const t = useTranslations("teachers");
  const tUsers = useTranslations("settings.users");
  const sectionProps: SectionProps = {
    ...props,
    requiredError: (field) => {
      const error = props.errors[field];
      if (!error) return undefined;
      if (error === "required") return t("validation.required");
      if (field === "username" && error === "username_invalid") {
        return tUsers("identity.username_invalid");
      }
      if (field === "username" && error === "reserved_username") {
        return tUsers("identity.username_reserved");
      }
      if (error.startsWith("backend.")) {
        return t(`errors.${error.slice("backend.".length)}`);
      }
      return error;
    },
  };

  return (
    <div className="space-y-6">
      {showIdentity ? <IdentitySection {...sectionProps} showIdentityTools={showIdentityTools} /> : null}
      <ProfileSection {...sectionProps} />
      <EmploymentSection {...sectionProps} />
      <ScheduleSection {...sectionProps} />
      <NotesSection {...sectionProps} />
    </div>
  );
}
