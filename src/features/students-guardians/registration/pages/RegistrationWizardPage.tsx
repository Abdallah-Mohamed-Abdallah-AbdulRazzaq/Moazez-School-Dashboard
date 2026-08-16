"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Input from "@/components/ui/input/Input";
import { isApiError } from "@/lib/api-error";
import { fetchGuardians } from "@/features/students-guardians/guardians/services/guardiansApiService";
import PaginatedUserSelect from "@/features/settings/users/components/PaginatedUserSelect";
import {
  fetchAcademicYears,
  fetchStructureTree,
  fetchTermsByYear,
  type AcademicYear,
  type StructureTree,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { submitRegistration } from "@/features/students-guardians/registration/services/registrationApiService";
import type {
  RegistrationAccountFormState,
  RegistrationGuardianFormState,
  RegistrationResult,
  RegistrationWizardFormState,
} from "@/features/students-guardians/registration/types/registration";
import {
  validateRegistrationForm,
  validateRegistrationStep,
  type RegistrationStep,
} from "@/features/students-guardians/registration/utils/registrationValidation";
import type { StudentGuardian } from "@/features/students-guardians/students/types";
import RegistrationResultPanel from "@/features/students-guardians/registration/components/RegistrationResultPanel";

const stepsKeys = [
  "student",
  "guardians",
  "accounts",
  "enrollment",
  "review",
] as const;
const newAccount = (): RegistrationAccountFormState => ({
  mode: "create",
  username: "",
  contactEmail: "",
  generatePassword: true,
});
const newGuardian = (primary = false): RegistrationGuardianFormState => ({
  key: crypto.randomUUID(),
  mode: "create",
  relation: "guardian",
  isPrimary: primary,
  canPickup: true,
  canReceiveNotifications: true,
  account: newAccount(),
});
const initialState = (): RegistrationWizardFormState => ({
  student: { fullNameEn: "" },
  studentAccount: newAccount(),
  guardians: [newGuardian(true)],
  enrollment: {
    academicYearId: "",
    classroomId: "",
    enrollmentDate: new Date().toISOString().slice(0, 10),
    status: "active",
  },
});
const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100";

function Field({
  label,
  value = "",
  onChange,
  type = "text",
  required = false,
  disabled = false,
  error,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}) {
  const name = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return (
    <Input
      name={name}
      label={label}
      type={type}
      value={value}
      disabled={disabled}
      required={required}
      error={error}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  required?: boolean;
}) {
  const t = useTranslations("students_guardians.registration");
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-600"> *</span>}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        <option value="">{t("buttons.select")}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SearchSelect<T>({
  label,
  query,
  setQuery,
  items,
  getId,
  getLabel,
  onSelect,
  loading,
}: {
  label: string;
  query: string;
  setQuery: (value: string) => void;
  items: T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
  loading: boolean;
}) {
  const t = useTranslations("students_guardians.registration");
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative mt-1">
        <Search className="absolute start-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={`${inputClass} mt-0 ps-9`}
          placeholder={t("guardians_step.fields.search_users_placeholder")}
        />
      </div>
      {query.trim().length >= 2 && (
        <div className="mt-1 max-h-44 overflow-auto rounded-lg border border-border bg-white shadow-lg">
          {loading ? (
            <p className="p-3 text-sm text-gray-500">
              {t("guardians_step.fields.searching")}
            </p>
          ) : items.length ? (
            items.map((item) => (
              <button
                type="button"
                key={getId(item)}
                onClick={() => onSelect(item)}
                className="block w-full cursor-pointer px-3 py-2 text-start text-sm hover:bg-gray-50 focus:bg-gray-50"
              >
                {getLabel(item)}
              </button>
            ))
          ) : (
            <p className="p-3 text-sm text-gray-500">
              {t("guardians_step.fields.no_results")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function RegistrationWizardPage() {
  const t = useTranslations("students_guardians.registration");
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const [form, setForm] = useState<RegistrationWizardFormState>(() =>
    initialState(),
  );
  const [step, setStep] = useState<RegistrationStep>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [usernamePolicyError, setUsernamePolicyError] = useState<{
    username?: string;
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [tree, setTree] = useState<StructureTree | null>(null);
  const academicYearId = form.enrollment.academicYearId;
  const termId = form.enrollment.termId;
  const previousAcademicYearIdRef = useRef(academicYearId);
  const previousStructureSelectionRef = useRef({
    academicYearId,
    termId,
  });
  const hasExisting = form.guardians.some(
    (guardian) => guardian.mode === "existing",
  );

  const steps = useMemo(() => stepsKeys.map((key) => t(`steps.${key}`)), [t]);

  useEffect(() => {
    void fetchAcademicYears()
      .then(setYears)
      .catch(() => setErrors([t("errors.load_years_failed")]));
  }, [t]);
  useEffect(() => {
    const previousAcademicYearId = previousAcademicYearIdRef.current;
    previousAcademicYearIdRef.current = academicYearId;

    if (!academicYearId) {
      if (previousAcademicYearId) {
        void Promise.resolve().then(() => setTerms([]));
      }
      return;
    }
    void fetchTermsByYear(academicYearId)
      .then(setTerms)
      .catch(() => setTerms([]));
  }, [academicYearId]);
  useEffect(() => {
    const previousSelection = previousStructureSelectionRef.current;
    previousStructureSelectionRef.current = { academicYearId, termId };

    if (!academicYearId || !termId) {
      if (previousSelection.academicYearId && previousSelection.termId) {
        void Promise.resolve().then(() => setTree(null));
      }
      return;
    }
    void fetchStructureTree(academicYearId, termId)
      .then(setTree)
      .catch(() => setTree(null));
  }, [academicYearId, termId]);

  const updateGuardian = (
    key: string,
    patch: Partial<RegistrationGuardianFormState>,
  ) =>
    setForm((current) => ({
      ...current,
      guardians: current.guardians.map((guardian) =>
        guardian.key === key ? { ...guardian, ...patch } : guardian,
      ),
    }));
  const next = () => {
    const nextErrors = validateRegistrationStep(form, step);
    setErrors(nextErrors);
    if (nextErrors.length) {
      requestAnimationFrame(() =>
        stepContentRef.current
          ?.querySelector<HTMLElement>(
            "input:not(:disabled), select:not(:disabled), button:not(:disabled)",
          )
          ?.focus(),
      );
      return;
    }
    if (step < 4) setStep((step + 1) as RegistrationStep);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateRegistrationForm(form);
    setErrors(nextErrors);
    setUsernamePolicyError(null);
    if (nextErrors.length) return;
    setSubmitting(true);
    try {
      setResult(await submitRegistration(form));
    } catch (error) {
      if (isApiError(error) && error.code === "iam.user.username_invalid") {
        const username = (error.details as { username?: string } | undefined)
          ?.username;
        const message = t("errors.username_invalid");
        setUsernamePolicyError({ username, message });
        setErrors([message]);
        setStep(2);
        return;
      }
      setErrors([
        error instanceof Error
          ? error.message
          : t("errors.registration_failed"),
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <header>
        <p className="text-sm font-semibold text-primary">
          {t("header_category")}
        </p>
        <h1 className="text-2xl font-bold text-gray-900">
          {t("header_title")}
        </h1>
        <p className="mt-1 text-sm text-gray-600">{t("header_subtitle")}</p>
      </header>
      <nav
        aria-label={t("header_title")}
        className="rounded-xl border bg-white p-3 shadow-sm"
      >
        <ol className="grid grid-cols-5 gap-2">
          {steps.map((label, index) => (
            <li key={label}>
              <button
                type="button"
                onClick={() =>
                  index < step && setStep(index as RegistrationStep)
                }
                className={`flex w-full items-center gap-2 rounded-lg p-2 text-xs font-medium sm:text-sm cursor-pointer ${
                  index === step
                    ? "bg-primary text-white"
                    : index < step
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-50 text-gray-500"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-gray-700">
                  {index < step ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      {errors.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <ul className="list-disc ps-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {result ? (
        <RegistrationResultPanel
          result={result}
          onViewStudentProfile={(id) =>
            router.push(`/${lang}/students-guardians/students/${id}`)
          }
          onBackToStudents={() =>
            router.push(`/${lang}/students-guardians/students`)
          }
        />
      ) : (
        <form
          onSubmit={submit}
          className="rounded-xl border border-border bg-white shadow-sm"
        >
          <div ref={stepContentRef} className="min-h-[430px] p-5 sm:p-7">
            {step === 0 && <StudentStep form={form} setForm={setForm} />}
            {step === 1 && (
              <GuardiansStep
                form={form}
                setForm={setForm}
                updateGuardian={updateGuardian}
              />
            )}
            {step === 2 && (
              <AccountsStep
                form={form}
                setForm={setForm}
                updateGuardian={updateGuardian}
                usernamePolicyError={usernamePolicyError}
                onAccountChange={() => setUsernamePolicyError(null)}
              />
            )}
            {step === 3 && (
              <EnrollmentStep
                form={form}
                setForm={setForm}
                years={years}
                terms={terms}
                tree={tree}
              />
            )}
            {step === 4 && (
              <Review form={form} hasExisting={hasExisting} edit={setStep} />
            )}
          </div>
          <footer className="flex items-center justify-between border-t border-border bg-gray-50 px-5 py-4">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => {
                setErrors([]);
                setStep((step - 1) as RegistrationStep);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft
                className={`h-4 w-4 ${lang === "ar" ? "rotate-180" : ""}`}
              />
              {t("buttons.previous")}
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white cursor-pointer"
              >
                {t("buttons.next")}
                <ChevronRight
                  className={`h-4 w-4 ${lang === "ar" ? "rotate-180" : ""}`}
                />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 cursor-pointer"
              >
                {submitting ? t("buttons.submitting") : t("buttons.submit")}
              </button>
            )}
          </footer>
        </form>
      )}
    </div>
  );
}

function StudentStep({
  form,
  setForm,
}: {
  form: RegistrationWizardFormState;
  setForm: React.Dispatch<React.SetStateAction<RegistrationWizardFormState>>;
}) {
  const t = useTranslations("students_guardians.registration");
  const update = (patch: Partial<RegistrationWizardFormState["student"]>) =>
    setForm((current) => ({
      ...current,
      student: { ...current.student, ...patch },
    }));
  return (
    <Step
      title={t("student_step.title")}
      description={t("student_step.description")}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label={t("student_step.fields.full_name_en")}
          required
          value={form.student.fullNameEn}
          onChange={(value) => update({ fullNameEn: value })}
        />
        <Field
          label={t("student_step.fields.full_name_ar")}
          value={form.student.fullNameAr}
          onChange={(value) => update({ fullNameAr: value })}
        />
        <Field
          label={t("student_step.fields.date_of_birth")}
          type="date"
          value={form.student.dateOfBirth}
          onChange={(value) => update({ dateOfBirth: value })}
        />
        <SelectField
          label={t("student_step.fields.gender")}
          value={form.student.gender || ""}
          onChange={(value) => update({ gender: value })}
          options={[
            {
              value: "male",
              label: t("student_step.fields.gender_options.male"),
            },
            {
              value: "female",
              label: t("student_step.fields.gender_options.female"),
            },
          ]}
        />
        <Field
          label={t("student_step.fields.nationality")}
          value={form.student.nationality}
          onChange={(value) => update({ nationality: value })}
        />
        <Field
          label={t("student_step.fields.email")}
          type="email"
          value={form.student.studentEmail}
          onChange={(value) => update({ studentEmail: value })}
        />
        <Field
          label={t("student_step.fields.phone")}
          type="tel"
          value={form.student.studentPhone}
          onChange={(value) => update({ studentPhone: value })}
        />
        <Field
          label={t("student_step.fields.address")}
          value={form.student.addressLine}
          onChange={(value) => update({ addressLine: value })}
        />
        <Field
          label={t("student_step.fields.city")}
          value={form.student.city}
          onChange={(value) => update({ city: value })}
        />
        <Field
          label={t("student_step.fields.district")}
          value={form.student.district}
          onChange={(value) => update({ district: value })}
        />
      </div>
    </Step>
  );
}

function GuardiansStep({
  form,
  setForm,
  updateGuardian,
}: {
  form: RegistrationWizardFormState;
  setForm: React.Dispatch<React.SetStateAction<RegistrationWizardFormState>>;
  updateGuardian: (
    key: string,
    patch: Partial<RegistrationGuardianFormState>,
  ) => void;
}) {
  const t = useTranslations("students_guardians.registration");
  return (
    <Step
      title={t("guardians_step.title")}
      description={t("guardians_step.description")}
    >
      <div className="space-y-4">
        {form.guardians.map((guardian, index) => (
          <GuardianCard
            key={guardian.key}
            guardian={guardian}
            index={index}
            update={updateGuardian}
            setPrimary={() =>
              setForm((current) => ({
                ...current,
                guardians: current.guardians.map((item) => ({
                  ...item,
                  isPrimary: item.key === guardian.key,
                })),
              }))
            }
            remove={() =>
              setForm((current) => ({
                ...current,
                guardians: current.guardians.filter(
                  (item) => item.key !== guardian.key,
                ),
              }))
            }
            canRemove={form.guardians.length > 1}
          />
        ))}
        <button
          type="button"
          onClick={() =>
            setForm((current) => ({
              ...current,
              guardians: [...current.guardians, newGuardian()],
            }))
          }
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary"
        >
          <Plus className="h-4 w-4" />
          {t("guardians_step.add_guardian")}
        </button>
      </div>
    </Step>
  );
}

function GuardianCard({
  guardian,
  index,
  update,
  setPrimary,
  remove,
  canRemove,
}: {
  guardian: RegistrationGuardianFormState;
  index: number;
  update: (key: string, patch: Partial<RegistrationGuardianFormState>) => void;
  setPrimary: () => void;
  remove: () => void;
  canRemove: boolean;
}) {
  const t = useTranslations("students_guardians.registration");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Array<StudentGuardian & { id: string }>>(
    [],
  );
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (guardian.mode !== "existing" || query.trim().length < 2) return;
    const timer = setTimeout(() => {
      setLoading(true);
      void fetchGuardians({ search: query })
        .then(setItems)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, guardian.mode]);
  return (
    <section className="rounded-xl border border-border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          {t("guardians_step.guardian_title", { number: index + 1 })}
        </h3>
        {canRemove && (
          <button
            type="button"
            onClick={remove}
            aria-label={t("guardians_step.remove_guardian")}
            className="cursor-pointer rounded p-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label={t("guardians_step.fields.profile")}
          value={guardian.mode}
          onChange={(value) =>
            update(guardian.key, {
              mode: value as "create" | "existing",
              existingGuardianId: undefined,
              existingGuardianLabel: undefined,
            })
          }
          options={[
            {
              value: "create",
              label: t("guardians_step.fields.profile_options.create"),
            },
            {
              value: "existing",
              label: t("guardians_step.fields.profile_options.existing"),
            },
          ]}
        />
        {guardian.mode === "existing" ? (
          <div className="md:col-span-2">
            {guardian.existingGuardianId ? (
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
                <span>{guardian.existingGuardianLabel}</span>
                <button
                  type="button"
                  onClick={() =>
                    update(guardian.key, {
                      existingGuardianId: undefined,
                      existingGuardianLabel: undefined,
                    })
                  }
                  className="text-primary cursor-pointer"
                >
                  {t("guardians_step.fields.change_existing")}
                </button>
              </div>
            ) : (
              <SearchSelect
                label={t("guardians_step.fields.search_placeholder")}
                query={query}
                setQuery={setQuery}
                items={items}
                loading={loading}
                getId={(item) => item.id}
                getLabel={(item) =>
                  `${item.full_name} · ${item.phone_primary || item.email || ""}`
                }
                onSelect={(item) => {
                  update(guardian.key, {
                    existingGuardianId: item.id,
                    existingGuardianLabel: item.full_name,
                  });
                  setQuery("");
                }}
              />
            )}
          </div>
        ) : (
          <>
            <Field
              label={t("guardians_step.fields.full_name")}
              required
              value={guardian.fullName}
              onChange={(value) => update(guardian.key, { fullName: value })}
            />
            <Field
              label={t("guardians_step.fields.relation")}
              required
              value={guardian.relation}
              onChange={(value) => update(guardian.key, { relation: value })}
            />
            <Field
              label={t("guardians_step.fields.phone_primary")}
              type="tel"
              required
              value={guardian.phonePrimary}
              onChange={(value) =>
                update(guardian.key, { phonePrimary: value })
              }
            />
            <Field
              label={t("guardians_step.fields.phone_secondary")}
              type="tel"
              value={guardian.phoneSecondary}
              onChange={(value) =>
                update(guardian.key, { phoneSecondary: value })
              }
            />
            <Field
              label={t("guardians_step.fields.email")}
              type="email"
              value={guardian.email}
              onChange={(value) => update(guardian.key, { email: value })}
            />
            <Field
              label={t("guardians_step.fields.national_id")}
              value={guardian.nationalId}
              onChange={(value) => update(guardian.key, { nationalId: value })}
            />
            <Field
              label={t("guardians_step.fields.job_title")}
              value={guardian.jobTitle}
              onChange={(value) => update(guardian.key, { jobTitle: value })}
            />
            <Field
              label={t("guardians_step.fields.workplace")}
              value={guardian.workplace}
              onChange={(value) => update(guardian.key, { workplace: value })}
            />
          </>
        )}
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="radio"
          name="primaryGuardian"
          checked={guardian.isPrimary}
          onChange={setPrimary}
          className="cursor-pointer"
        />
        {t("guardians_step.primary_guardian")}
      </label>
    </section>
  );
}

function AccountsStep({
  form,
  setForm,
  updateGuardian,
  usernamePolicyError,
  onAccountChange,
}: {
  form: RegistrationWizardFormState;
  setForm: React.Dispatch<React.SetStateAction<RegistrationWizardFormState>>;
  updateGuardian: (
    key: string,
    patch: Partial<RegistrationGuardianFormState>,
  ) => void;
  usernamePolicyError: { username?: string; message: string } | null;
  onAccountChange: () => void;
}) {
  const t = useTranslations("students_guardians.registration");
  return (
    <Step
      title={t("accounts_step.title")}
      description={t("accounts_step.description")}
    >
      <div className="space-y-4">
        <AccountCard
          title={t("accounts_step.student_account")}
          account={form.studentAccount}
          update={(account) => {
            onAccountChange();
            setForm((current) => ({ ...current, studentAccount: account }));
          }}
          usernameError={
            usernamePolicyError &&
            (!usernamePolicyError.username ||
              usernamePolicyError.username === form.studentAccount.username?.trim())
              ? usernamePolicyError.message
              : undefined
          }
        />
        {form.guardians.map((guardian, index) => (
          <AccountCard
            key={guardian.key}
            title={t("accounts_step.guardian_account", {
              number: index + 1,
              name:
                guardian.existingGuardianLabel ||
                guardian.fullName ||
                t("guardians_step.fields.profile_options.create"),
            })}
            account={guardian.account}
            update={(account) => {
              onAccountChange();
              updateGuardian(guardian.key, { account });
            }}
            existingGuardian={guardian.mode === "existing"}
            usernameError={
              usernamePolicyError &&
              (!usernamePolicyError.username ||
                usernamePolicyError.username === guardian.account.username?.trim())
                ? usernamePolicyError.message
                : undefined
            }
          />
        ))}
      </div>
    </Step>
  );
}

function AccountCard({
  title,
  account,
  update,
  existingGuardian = false,
  usernameError,
}: {
  title: string;
  account: RegistrationAccountFormState;
  update: (account: RegistrationAccountFormState) => void;
  existingGuardian?: boolean;
  usernameError?: string;
}) {
  const t = useTranslations("students_guardians.registration");
  return (
    <section className="rounded-xl border p-4">
      <h3 className="mb-3 font-semibold text-gray-900">{title}</h3>
      {existingGuardian && (
        <p className="mb-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          {t("accounts_step.guardian_account_help")}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label={t("accounts_step.fields.action")}
          value={account.mode}
          onChange={(mode) =>
            update({ ...newAccount(), mode: mode as "create" | "link" })
          }
          options={[
            {
              value: "create",
              label: t("accounts_step.fields.action_options.create"),
            },
            {
              value: "link",
              label: t("accounts_step.fields.action_options.link"),
            },
          ]}
        />
        {account.mode === "create" ? (
          <>
            <Field
              label={t("accounts_step.fields.username")}
              required
              value={account.username}
              onChange={(username) => update({ ...account, username })}
              error={usernameError}
            />
            <Field
              label={t("accounts_step.fields.contact_email")}
              type="email"
              value={account.contactEmail}
              onChange={(contactEmail) => update({ ...account, contactEmail })}
            />
            <label className="flex items-center gap-2 self-end pb-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={account.generatePassword !== false}
                onChange={(event) =>
                  update({ ...account, generatePassword: event.target.checked })
                }
                className="cursor-pointer"
              />
              {t("accounts_step.fields.generate_password")}
            </label>
          </>
        ) : (
          <div className="md:col-span-2">
            {account.userId ? (
              <div className="flex justify-between rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
                <span>{account.userLabel}</span>
                <button
                  type="button"
                  onClick={() =>
                    update({
                      ...account,
                      userId: undefined,
                      userLabel: undefined,
                    })
                  }
                  className="text-primary cursor-pointer"
                >
                  {t("guardians_step.fields.change_existing")}
                </button>
              </div>
            ) : (
              <PaginatedUserSelect
                label={t("accounts_step.fields.search_users")}
                value={account.userId}
                status="active"
                loadOnMount
                onChange={(userId) => {
                  update({
                    ...account,
                    userId: userId || undefined,
                    userLabel: userId ? account.userLabel : undefined,
                  });
                }}
                onOptionChange={(item) => {
                  if (!item) return;
                  update({
                    ...account,
                    userId: item.id,
                    userLabel: item.description
                      ? `${item.label} (${item.description})`
                      : item.label,
                  });
                }}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function EnrollmentStep({
  form,
  setForm,
  years,
  terms,
  tree,
}: {
  form: RegistrationWizardFormState;
  setForm: React.Dispatch<React.SetStateAction<RegistrationWizardFormState>>;
  years: AcademicYear[];
  terms: Term[];
  tree: StructureTree | null;
}) {
  const t = useTranslations("students_guardians.registration");
  const update = (patch: Partial<RegistrationWizardFormState["enrollment"]>) =>
    setForm((current) => ({
      ...current,
      enrollment: { ...current.enrollment, ...patch },
    }));
  const grades = tree?.grades || [];
  const sections = (tree?.sections || []).filter(
    (item) => item.gradeId === form.enrollment.gradeId,
  );
  const classrooms = (tree?.classrooms || []).filter(
    (item) => item.sectionId === form.enrollment.sectionId,
  );
  return (
    <Step
      title={t("enrollment_step.title")}
      description={t("enrollment_step.description")}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label={t("enrollment_step.fields.academic_year")}
          required
          value={form.enrollment.academicYearId}
          onChange={(academicYearId) =>
            update({
              academicYearId,
              termId: "",
              gradeId: "",
              sectionId: "",
              classroomId: "",
            })
          }
          options={years.map((item) => ({ value: item.id, label: item.name }))}
        />
        <SelectField
          label={t("enrollment_step.fields.term")}
          value={form.enrollment.termId || ""}
          disabled={!form.enrollment.academicYearId}
          onChange={(termId) =>
            update({ termId, gradeId: "", sectionId: "", classroomId: "" })
          }
          options={terms.map((item) => ({ value: item.id, label: item.name }))}
        />
        <SelectField
          label={t("enrollment_step.fields.grade")}
          value={form.enrollment.gradeId || ""}
          disabled={!tree}
          onChange={(gradeId) =>
            update({ gradeId, sectionId: "", classroomId: "" })
          }
          options={grades.map((item) => ({ value: item.id, label: item.name }))}
        />
        <SelectField
          label={t("enrollment_step.fields.section")}
          value={form.enrollment.sectionId || ""}
          disabled={!form.enrollment.gradeId}
          onChange={(sectionId) => update({ sectionId, classroomId: "" })}
          options={sections.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
        />
        <SelectField
          label={t("enrollment_step.fields.classroom")}
          required
          value={form.enrollment.classroomId}
          disabled={!form.enrollment.sectionId}
          onChange={(classroomId) => update({ classroomId })}
          options={classrooms.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
        />
        <Field
          label={t("enrollment_step.fields.enrollment_date")}
          required
          type="date"
          value={form.enrollment.enrollmentDate}
          onChange={(enrollmentDate) => update({ enrollmentDate })}
        />
      </div>
    </Step>
  );
}

function Review({
  form,
  hasExisting,
  edit,
}: {
  form: RegistrationWizardFormState;
  hasExisting: boolean;
  edit: (step: RegistrationStep) => void;
}) {
  const t = useTranslations("students_guardians.registration");
  const rows = useMemo(
    () =>
      [
        {
          title: t("review_step.fields.student"),
          value: form.student.fullNameEn,
          step: 0,
        },
        {
          title: t("review_step.fields.guardians"),
          value: form.guardians
            .map((item) => item.existingGuardianLabel || item.fullName)
            .join(", "),
          step: 1,
        },
        {
          title: t("review_step.fields.accounts"),
          value: t("review_step.fields.accounts_configured", {
            count: form.guardians.length + 1,
          }),
          step: 2,
        },
        {
          title: t("review_step.fields.enrollment"),
          value: form.enrollment.classroomId,
          step: 3,
        },
      ] as const,
    [form, t],
  );
  return (
    <Step
      title={t("review_step.title")}
      description={t("review_step.description")}
    >
      {hasExisting && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {t("review_step.warning_existing_guardian")}
        </div>
      )}
      <dl className="divide-y rounded-xl border">
        {rows.map((row) => (
          <div
            key={row.title}
            className="flex items-center justify-between p-4"
          >
            <div>
              <dt className="font-medium text-gray-900">{row.title}</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {row.value || t("review_step.fields.not_selected")}
              </dd>
            </div>
            <button
              type="button"
              onClick={() => edit(row.step)}
              className="text-sm font-medium text-primary cursor-pointer"
            >
              {t("review_step.fields.edit")}
            </button>
          </div>
        ))}
      </dl>
    </Step>
  );
}

function Step({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
      {children}
    </>
  );
}
