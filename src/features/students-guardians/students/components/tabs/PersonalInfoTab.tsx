"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit2, Save, X, AlertTriangle } from "lucide-react";
import {
  Student,
  RiskFlag,
} from "@/features/students-guardians/students/types";
import {
  composeNameParts,
  getRiskFlagColor,
  getRiskFlagLabel,
  splitFullName,
} from "@/features/students-guardians/students/utils/studentUtils";
import { useTranslations } from "next-intl";
import { updateStudent } from "@/features/students-guardians/students/services/studentsService";
import { Button, Input, Select } from "@/components/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonalInfoTabProps {
  student: Student;
  onStudentUpdated?: (student: Student) => void;
}

type PersonalInfoFormData = {
  first_name_en: string;
  father_name_en: string;
  grandfather_name_en: string;
  family_name_en: string;
  first_name_ar: string;
  father_name_ar: string;
  grandfather_name_ar: string;
  family_name_ar: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  status: Student["status"];
  address_line: string;
  city: string;
  district: string;
  student_phone: string;
  student_email: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise backend gender to lowercase "male" | "female" | "" */
const normalizeGender = (raw?: string | null): string => {
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower === "female") return "female";
  if (lower === "male") return "male";
  return "";
};

/** Safely convert a nullable string field to empty string */
const str = (v: string | null | undefined): string => v ?? "";

const buildFormData = (student: Student): PersonalInfoFormData => {
  const enParts = splitFullName(str(student.full_name_en) || str(student.name));
  const arParts = splitFullName(str(student.full_name_ar));

  return {
    first_name_en: str(student.first_name_en) || enParts.firstName,
    father_name_en: str(student.father_name_en) || enParts.fatherName,
    grandfather_name_en:
      str(student.grandfather_name_en) || enParts.grandfatherName,
    family_name_en: str(student.family_name_en) || enParts.familyName,
    first_name_ar: str(student.first_name_ar) || arParts.firstName,
    father_name_ar: str(student.father_name_ar) || arParts.fatherName,
    grandfather_name_ar:
      str(student.grandfather_name_ar) || arParts.grandfatherName,
    family_name_ar: str(student.family_name_ar) || arParts.familyName,
    date_of_birth: str(student.date_of_birth) || str(student.dateOfBirth),
    gender: normalizeGender(student.gender),
    nationality: str(student.nationality),
    status: student.status,
    address_line: str(student.contact?.address_line),
    city: str(student.contact?.city),
    district: str(student.contact?.district),
    student_phone: str(student.contact?.student_phone),
    student_email: str(student.contact?.student_email),
  };
};

/**
 * Build the PATCH body.
 * - Strips null/undefined contact fields from the existing student.contact.
 * - Only includes contact fields the user has filled in.
 */
const buildPatchPayload = (
  formData: PersonalInfoFormData,
  student: Student,
) => {
  const fullNameEn = composeNameParts(
    formData.first_name_en,
    formData.father_name_en,
    formData.grandfather_name_en,
    formData.family_name_en,
  );
  const fullNameAr = composeNameParts(
    formData.first_name_ar,
    formData.father_name_ar,
    formData.grandfather_name_ar,
    formData.family_name_ar,
  );

  // Start with existing contact, stripping nulls, then overlay form values
  const baseContact: Record<string, string> = {};
  if (student.contact) {
    for (const [k, v] of Object.entries(student.contact)) {
      if (v != null && typeof v === "string") baseContact[k] = v;
    }
  }
  const contact: Record<string, string> = { ...baseContact };
  if (formData.address_line?.trim())
    contact.address_line = formData.address_line.trim();
  if (formData.city?.trim()) contact.city = formData.city.trim();
  if (formData.district?.trim()) contact.district = formData.district.trim();
  if (formData.student_phone?.trim())
    contact.student_phone = formData.student_phone.trim();
  if (formData.student_email?.trim())
    contact.student_email = formData.student_email.trim();

  return {
    name: fullNameEn,
    first_name_en: formData.first_name_en?.trim(),
    father_name_en: formData.father_name_en?.trim(),
    grandfather_name_en: formData.grandfather_name_en?.trim(),
    family_name_en: formData.family_name_en?.trim(),
    first_name_ar: formData.first_name_ar?.trim(),
    father_name_ar: formData.father_name_ar?.trim(),
    grandfather_name_ar: formData.grandfather_name_ar?.trim(),
    family_name_ar: formData.family_name_ar?.trim(),
    full_name_en: fullNameEn,
    full_name_ar: fullNameAr,
    dateOfBirth: formData.date_of_birth || undefined,
    date_of_birth: formData.date_of_birth || undefined,
    gender: formData.gender || undefined,
    nationality: formData.nationality?.trim() || undefined,
    status: formData.status,
    contact,
  };
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PersonalInfoTab({
  student,
  onStudentUpdated,
}: PersonalInfoTabProps) {
  const t = useTranslations("students_guardians.profile.personal_info");

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const initialFormData = useMemo<PersonalInfoFormData>(
    () => buildFormData(student),
    [student],
  );

  const [formData, setFormData] = useState(initialFormData);

  // Keep form in sync when parent refreshes the student prop
  useEffect(() => {
    void Promise.resolve().then(() => setFormData(buildFormData(student)));
  }, [student]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(null);

    setIsSaving(true);
    try {
      const updatedStudent = await updateStudent(
        student.id,
        buildPatchPayload(formData, student),
      );
      onStudentUpdated?.(updatedStudent);
      setSaveSuccess(t("save_success"));
      setIsEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t("save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSaveError(null);
    setSaveSuccess(null);
    setFormData(buildFormData(student));
    setIsEditing(false);
  };

  /** Generic text input bound to a form key */
  const field = (
    key: keyof PersonalInfoFormData,
    extra?: Partial<React.InputHTMLAttributes<HTMLInputElement>>,
  ) => (
    <Input
      type="text"
      value={formData[key] as string}
      onChange={(e) =>
        setFormData((prev) => ({ ...prev, [key]: e.target.value }))
      }
      disabled={!isEditing}
      variant={isEditing ? "default" : "filled"}
      {...extra}
    />
  );

  // Safe display value for read-only fields that may be null from the API
  const displayId = str(student.student_id) || "—";
  const displayCreatedAt = (() => {
    const raw =
      student.created_at ??
      (student as unknown as Record<string, unknown>).submittedDate;
    if (!raw) return "—";
    try {
      return new Date(raw as string).toLocaleString();
    } catch {
      return "—";
    }
  })();

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
        {!isEditing ? (
          <Button
            type="button"
            onClick={() => {
              setSaveError(null);
              setSaveSuccess(null);
              setIsEditing(true);
            }}
            leftIcon={<Edit2 className="w-4 h-4" />}
          >
            {t("edit")}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              leftIcon={<X className="w-4 h-4" />}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              loading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isSaving ? t("saving") : t("save")}
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        {/* Alert banners */}
        {saveError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {saveSuccess}
          </div>
        )}

        {/* Risk flags */}
        {student.risk_flags && student.risk_flags.length > 0 && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-orange-900 mb-2">
                  {t("risk_flags_detected")}
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {student.risk_flags.map((flag: RiskFlag) => (
                    <span
                      key={flag}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRiskFlagColor(flag)}`}
                    >
                      {getRiskFlagLabel(flag)}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-orange-700 mt-2">
                  {t("risk_flags_message")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Identity fields ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Read-only: student ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("student_id")}
            </label>
            <Input
              type="text"
              value={displayId}
              disabled
              variant="filled"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("cannot_be_changed")}
            </p>
          </div>

          {/* Read-only: composed full name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("full_name")}
            </label>
            <Input
              type="text"
              value={
                composeNameParts(
                  formData.first_name_en,
                  formData.father_name_en,
                  formData.grandfather_name_en,
                  formData.family_name_en,
                ) ||
                str(student.full_name_en) ||
                str(student.name)
              }
              disabled
              variant="filled"
            />
            <p className="text-xs text-gray-500 mt-1">{t("auto_generated")}</p>
          </div>

          {/* English name parts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("first_name_en")}
            </label>
            {field("first_name_en")}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("first_name_ar")}
            </label>
            {field("first_name_ar", { dir: "rtl" })}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("father_name_en")}
            </label>
            {field("father_name_en")}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("father_name_ar")}
            </label>
            {field("father_name_ar", { dir: "rtl" })}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("grandfather_name_en")}
            </label>
            {field("grandfather_name_en")}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("grandfather_name_ar")}
            </label>
            {field("grandfather_name_ar", { dir: "rtl" })}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("family_name_en")}
            </label>
            {field("family_name_en")}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("family_name_ar")}
            </label>
            {field("family_name_ar", { dir: "rtl" })}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("gender")}
            </label>
            <Select
              value={formData.gender}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, gender: value }))
              }
              disabled={!isEditing}
              variant={isEditing ? "default" : "filled"}
              options={[
                { value: "", label: t("notSet") },
                { value: "male", label: t("male") },
                { value: "female", label: t("female") },
              ]}
            />
          </div>

          {/* Date of birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("date_of_birth")}
            </label>
            <Input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  date_of_birth: e.target.value,
                }))
              }
              disabled={!isEditing}
              variant={isEditing ? "default" : "filled"}
            />
          </div>

          {/* Nationality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("nationality")}
            </label>
            {field("nationality")}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("status")}
            </label>
            <Select
              value={formData.status}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  status: value as Student["status"],
                }))
              }
              disabled={!isEditing}
              variant={isEditing ? "default" : "filled"}
              options={[
                { value: "Active", label: "Active" },
                { value: "Suspended", label: "Suspended" },
                { value: "Withdrawn", label: "Withdrawn" },
              ]}
            />
          </div>

          {/* Created at */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("created_at")}
            </label>
            <Input
              type="text"
              value={displayCreatedAt}
              disabled
              variant="filled"
            />
          </div>
        </div>

        {/* ── Contact information ──────────────────────────────────────────── */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("contact_information")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address line — full width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("address")}
              </label>
              <Input
                type="text"
                value={formData.address_line}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address_line: e.target.value,
                  }))
                }
                disabled={!isEditing}
                placeholder={t("address_placeholder")}
                variant={isEditing ? "default" : "filled"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("city")}
              </label>
              {field("city")}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("district")}
              </label>
              {field("district")}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <Input
                type="tel"
                value={formData.student_phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    student_phone: e.target.value,
                  }))
                }
                disabled={!isEditing}
                placeholder="+201100000000"
                variant={isEditing ? "default" : "filled"}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={formData.student_email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    student_email: e.target.value,
                  }))
                }
                disabled={!isEditing}
                placeholder={t("emailPlaceholder")}
                variant={isEditing ? "default" : "filled"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
