"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import type { Student } from "@/features/students-guardians/students/types";
import { createEnrollment, upsertEnrollment, validateEnrollment } from "../api/enrollmentApi";
import type { EnrollmentRecord } from "../model/enrollment";
import { studentDisplayName } from "../model/enrollmentMappers";
import {
  buildEnrollmentPlacementPayload,
  type PlacementAcademicContextOption,
  type PlacementOption,
} from "../model/enrollmentPlacement";

type PlacementField =
  | "studentId"
  | "gradeId"
  | "sectionId"
  | "classroomId"
  | "enrollmentDate";

interface EnrollmentPlacementDialogProps {
  open: boolean;
  enrollment: EnrollmentRecord | null;
  students: Student[];
  academicYear: PlacementAcademicContextOption | null;
  term: PlacementAcademicContextOption | null;
  grades: PlacementOption[];
  sections: PlacementOption[];
  classrooms: PlacementOption[];
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function EnrollmentPlacementDialog({
  open,
  enrollment,
  students,
  academicYear,
  term,
  grades,
  sections,
  classrooms,
  onClose,
  onSuccess,
}: EnrollmentPlacementDialogProps) {
  const t = useTranslations("admissions.enrollment");
  const locale = useLocale();
  const [studentId, setStudentId] = useState(enrollment?.studentId ?? "");
  const [gradeId, setGradeId] = useState(enrollment?.gradeId ?? "");
  const [sectionId, setSectionId] = useState(enrollment?.sectionId ?? "");
  const [classroomId, setClassroomId] = useState(
    enrollment?.classroomId ?? "",
  );
  const [enrollmentDate, setEnrollmentDate] = useState(
    enrollment?.enrollmentDate?.slice(0, 10) ??
      new Date().toISOString().slice(0, 10),
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<PlacementField, string>>
  >({});
  const [saving, setSaving] = useState(false);

  const shownSections = useMemo(
    () => sections.filter((section) => !gradeId || section.parentId === gradeId),
    [gradeId, sections],
  );
  const shownClassrooms = useMemo(
    () =>
      classrooms.filter(
        (classroom) => !sectionId || classroom.parentId === sectionId,
      ),
    [classrooms, sectionId],
  );

  if (!open) return null;

  const clearFieldError = (field: PlacementField) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setErrors([]);
  };

  const requiredFieldErrors = () => ({
    studentId: studentId
      ? undefined
      : t("dialogs.placement.validation.student_required"),
    gradeId: gradeId
      ? undefined
      : t("dialogs.placement.validation.grade_required"),
    sectionId: sectionId
      ? undefined
      : t("dialogs.placement.validation.section_required"),
    classroomId: classroomId
      ? undefined
      : t("dialogs.placement.validation.classroom_required"),
    enrollmentDate: enrollmentDate
      ? undefined
      : t("dialogs.placement.validation.enrollment_date_required"),
  });

  const submit = async () => {
    const nextFieldErrors = requiredFieldErrors();
    setFieldErrors(nextFieldErrors);
    if (Object.values(nextFieldErrors).some(Boolean)) return;
    if (!academicYear || !term) return;

    const payload = buildEnrollmentPlacementPayload({
      studentId,
      academicYear,
      termId: term.id,
      gradeId,
      sectionId,
      classroomId,
      enrollmentDate,
      grades,
      sections,
      classrooms,
    });

    setSaving(true);
    setErrors([]);
    try {
      const validation = await validateEnrollment({
        ...payload,
        enrollmentId: enrollment?.id,
      });
      if (!validation.valid) {
        setErrors(validation.errors);
        return;
      }
      if (enrollment) await upsertEnrollment(payload);
      else await createEnrollment(payload);
      await onSuccess();
      onClose();
    } catch {
      setErrors([t("dialogs.placement.save_error")]);
    } finally {
      setSaving(false);
    }
  };

  const academicYearLabel =
    locale === "ar"
      ? academicYear?.nameAr || academicYear?.name
      : academicYear?.nameEn || academicYear?.name;
  const termLabel =
    locale === "ar"
      ? term?.nameAr || term?.name
      : term?.nameEn || term?.name;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        enrollment
          ? t("dialogs.placement.edit_title")
          : t("dialogs.placement.new_title")
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => void submit()}
            loading={saving}
            disabled={saving || !academicYear || !term}
          >
            {t("actions.save")}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 md:col-span-2">
          <p className="text-sm font-semibold text-blue-950">
            {t("dialogs.placement.academic_context")}
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-blue-700">
                {t("dialogs.placement.academic_year")}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-blue-950">
                {academicYearLabel}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-blue-700">
                {t("dialogs.placement.term")}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-blue-950">
                {termLabel}
              </dd>
            </div>
          </dl>
        </div>
        <Select
          label={t("dialogs.placement.student")}
          value={studentId}
          disabled={Boolean(enrollment)}
          required
          error={fieldErrors.studentId}
          onChange={(nextStudentId) => {
            setStudentId(nextStudentId);
            clearFieldError("studentId");
          }}
          searchable
          options={students.map((student) => ({
            value: student.id,
            label: studentDisplayName(student, locale),
          }))}
        />
        <Select
          label={t("dialogs.placement.grade")}
          value={gradeId}
          required
          error={fieldErrors.gradeId}
          onChange={(nextGradeId) => {
            setGradeId(nextGradeId);
            setSectionId("");
            setClassroomId("");
            clearFieldError("gradeId");
          }}
          options={grades.map((grade) => ({
            value: grade.id,
            label: grade.name,
          }))}
        />
        <Select
          label={t("dialogs.placement.section")}
          value={sectionId}
          required
          error={fieldErrors.sectionId}
          onChange={(nextSectionId) => {
            setSectionId(nextSectionId);
            setClassroomId("");
            clearFieldError("sectionId");
          }}
          options={shownSections.map((section) => ({
            value: section.id,
            label: section.name,
          }))}
        />
        <Select
          label={t("dialogs.placement.classroom")}
          value={classroomId}
          required
          error={fieldErrors.classroomId}
          onChange={(nextClassroomId) => {
            setClassroomId(nextClassroomId);
            clearFieldError("classroomId");
          }}
          options={shownClassrooms.map((classroom) => ({
            value: classroom.id,
            label: classroom.name,
          }))}
        />
        <Input
          label={t("dialogs.placement.enrollment_date")}
          type="date"
          value={enrollmentDate}
          required
          error={fieldErrors.enrollmentDate}
          onChange={(event) => {
            setEnrollmentDate(event.target.value);
            clearFieldError("enrollmentDate");
          }}
        />
        {errors.length > 0 && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700 md:col-span-2"
          >
            <ul className="list-disc space-y-1 ps-5">
              {errors.map((error, index) => (
                <li key={`${index}:${error}`}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
