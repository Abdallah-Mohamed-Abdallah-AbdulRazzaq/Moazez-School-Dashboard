"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import AcademicStudentCascade, {
  type AcademicCascadeRecord,
  type AcademicStudentCascadeOptions,
} from "@/components/ui/academic/AcademicStudentCascade";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import Modal from "@/components/ui/modal/Modal";
import { listRewardCatalog } from "../services/rewardCatalogService";
import { getReinforcementFilterOptions } from "../services/reinforcementFilterOptionsService";
import type {
  CreateRewardRedemptionPayload,
  RewardCatalogItem,
} from "../types";

interface RewardRedemptionCreateModalProps {
  isOpen: boolean;
  academicYearId?: string;
  termId?: string;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateRewardRedemptionPayload) => Promise<void>;
}

interface StudentRedemptionOption {
  studentId: string;
  enrollmentId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  label: string;
  searchText: string;
}

interface CreateFormState {
  studentId: string;
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  enrollmentId: string;
  catalogItemId: string;
  requestNoteEn: string;
  requestNoteAr: string;
}

interface CreateFormErrors {
  studentId?: string;
  catalogItemId?: string;
}

const emptyFormState: CreateFormState = {
  studentId: "",
  stageId: "",
  gradeId: "",
  sectionId: "",
  classroomId: "",
  enrollmentId: "",
  catalogItemId: "",
  requestNoteEn: "",
  requestNoteAr: "",
};

const getStringField = (
  record: Record<string, unknown>,
  fields: string[],
): string | undefined => {
  for (const field of fields) {
    const value = record[field];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
};

const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

function mapStudentOption(
  value: unknown,
  locale: string,
): StudentRedemptionOption | null {
  const student = toRecord(value);
  if (!student) return null;

  const classroom = toRecord(student.classroom);
  const section = toRecord(classroom?.section);
  const grade = toRecord(section?.grade);

  const studentId = getStringField(student, ["studentId", "id", "student_id"]);
  if (!studentId) return null;

  const nameEn =
    getStringField(student, ["nameEn", "fullNameEn", "full_name_en", "name"]) ??
    studentId;
  const nameAr =
    getStringField(student, ["nameAr", "fullNameAr", "full_name_ar", "name"]) ??
    nameEn;
  const enrollmentId = getStringField(student, [
    "enrollmentId",
    "enrollment_id",
  ]);
  const label = locale === "ar" ? nameAr : nameEn;

  const stageId =
    getStringField(student, ["stageId", "stage_id"]) ??
    getStringField(grade || {}, ["stageId", "stage_id"]);
  const gradeId =
    getStringField(student, ["gradeId", "grade_id"]) ??
    getStringField(section || {}, ["gradeId", "grade_id"]) ??
    getStringField(grade || {}, ["id", "gradeId", "grade_id"]);
  const sectionId =
    getStringField(student, ["sectionId", "section_id"]) ??
    getStringField(classroom || {}, ["sectionId", "section_id"]) ??
    getStringField(section || {}, ["id", "sectionId", "section_id"]);
  const classroomId =
    getStringField(student, ["classroomId", "classroom_id"]) ??
    getStringField(classroom || {}, ["id", "classroomId", "classroom_id"]);

  return {
    studentId,
    enrollmentId,
    stageId,
    gradeId,
    sectionId,
    classroomId,
    label,
    searchText: [nameEn, nameAr, studentId, enrollmentId]
      .filter(Boolean)
      .join(" "),
  };
}

function mapRewardOption(
  item: RewardCatalogItem,
  locale: string,
): SelectOption {
  const title =
    locale === "ar"
      ? item.titleAr || item.titleEn || item.id
      : item.titleEn || item.titleAr || item.id;
  const xpCost =
    typeof item.minTotalXp === "number" ? ` · ${item.minTotalXp} XP` : "";

  return {
    value: item.id,
    label: `${title}${xpCost}`,
    searchText: [item.titleEn, item.titleAr, item.id].filter(Boolean).join(" "),
  };
}

function matchesStudentSelection(
  student: StudentRedemptionOption,
  selection: {
    studentId?: string;
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
    classroomId?: string;
  },
): boolean {
  return (
    student.studentId === selection.studentId &&
    student.stageId === selection.stageId &&
    student.gradeId === selection.gradeId &&
    student.sectionId === selection.sectionId &&
    student.classroomId === selection.classroomId
  );
}

export default function RewardRedemptionCreateModal({
  isOpen,
  academicYearId,
  termId,
  loading,
  onClose,
  onSubmit,
}: RewardRedemptionCreateModalProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const [form, setForm] = useState<CreateFormState>(emptyFormState);
  const [errors, setErrors] = useState<CreateFormErrors>({});
  const [students, setStudents] = useState<StudentRedemptionOption[]>([]);
  const [academicOptions, setAcademicOptions] =
    useState<AcademicStudentCascadeOptions>({});
  const [catalogItems, setCatalogItems] = useState<RewardCatalogItem[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadLookups = useCallback(
    async (active: { current: boolean }) => {
      setLookupsLoading(true);
      setLookupError(null);

      try {
        const [filterOptions, catalogResponse] = await Promise.all([
          getReinforcementFilterOptions({
            academicYearId,
            termId,
          }),
          listRewardCatalog({
            status: "published",
            onlyAvailable: true,
            limit: 100,
          }),
        ]);
        if (!active.current) return;
        setStudents(
          (filterOptions.students ?? [])
            .map((student) => mapStudentOption(student, locale))
            .filter((student): student is StudentRedemptionOption =>
              Boolean(student),
            ),
          );
        setAcademicOptions({
          stages: filterOptions.stages as AcademicCascadeRecord[],
          grades: filterOptions.grades as AcademicCascadeRecord[],
          sections: filterOptions.sections as AcademicCascadeRecord[],
          classrooms: filterOptions.classrooms as AcademicCascadeRecord[],
        });
        setCatalogItems(catalogResponse.items);
      } catch (error) {
        if (!active.current) return;
        setLookupError(
          error instanceof Error
            ? error.message
            : t("rewardsModule.redemptions.create.lookupFailed"),
        );
      } finally {
        if (active.current) {
          setLookupsLoading(false);
        }
      }
    },
    [academicYearId, locale, t, termId],
  );

  useEffect(() => {
    if (!isOpen) return;

    const active = { current: true };
    void Promise.resolve().then(() => loadLookups(active));

    return () => {
      active.current = false;
    };
  }, [isOpen, loadLookups]);

  const cascadeOptions = useMemo(
    () => ({
      stages: academicOptions.stages || [],
      grades: academicOptions.grades || [],
      sections: academicOptions.sections || [],
      classrooms: academicOptions.classrooms || [],
      students: students.map((student) => ({
        id: student.studentId,
        name: student.label,
        stageId: student.stageId,
        gradeId: student.gradeId,
        sectionId: student.sectionId,
        classroomId: student.classroomId,
        searchText: student.searchText,
      })),
    }),
    [academicOptions, students],
  );

  const catalogOptions = useMemo<SelectOption[]>(
    () => catalogItems.map((item) => mapRewardOption(item, locale)),
    [catalogItems, locale],
  );

  const updateForm = (field: keyof CreateFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const submit = async () => {
    const nextErrors: CreateFormErrors = {};
    if (!form.studentId) {
      nextErrors.studentId = t(
        "rewardsModule.redemptions.create.studentRequired",
      );
    }
    if (!form.catalogItemId) {
      nextErrors.catalogItemId = t(
        "rewardsModule.redemptions.create.rewardRequired",
      );
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const selectedStudent = students.find((student) =>
      matchesStudentSelection(student, form),
    );
    const requestNoteEn = form.requestNoteEn.trim();
    const requestNoteAr = form.requestNoteAr.trim();

    const payload: CreateRewardRedemptionPayload = {
      catalogItemId: form.catalogItemId,
      studentId: form.studentId,
      requestSource: "dashboard",
      ...(selectedStudent?.enrollmentId
        ? { enrollmentId: selectedStudent.enrollmentId }
        : form.enrollmentId
          ? { enrollmentId: form.enrollmentId }
        : {}),
      ...(academicYearId ? { academicYearId } : {}),
      ...(termId ? { termId } : {}),
      ...(requestNoteEn ? { requestNoteEn } : {}),
      ...(requestNoteAr ? { requestNoteAr } : {}),
    };

    try {
      setSubmitError(null);
      await onSubmit(payload);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : t("rewardsModule.redemptions.create.submitFailed"),
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("rewardsModule.redemptions.create.title")}
      size="lg"
      closeOnOverlayClick={!loading}
      footer={
        <>
          <Button variant="secondary" disabled={loading} onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="primary"
            loading={loading}
            onClick={() => void submit()}
          >
            {t("rewardsModule.redemptions.create.submit")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-gray-600">
          {t("rewardsModule.redemptions.create.description")}
        </p>

        {lookupError ? (
          <div
            role="alert"
            className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700"
          >
            {lookupError}
          </div>
        ) : null}
        {submitError ? (
          <div
            role="alert"
            className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700"
          >
            {submitError}
          </div>
        ) : null}
        <AcademicStudentCascade
          value={form}
          options={cascadeOptions}
          loading={loading || lookupsLoading}
          labels={{ student: t("rewardsModule.redemptions.create.student") }}
          onChange={(selection) => {
            const selected = students.find((student) =>
              matchesStudentSelection(student, selection),
            );
            setForm((current) => ({
              ...current,
              stageId: selection.stageId || "",
              gradeId: selection.gradeId || "",
              sectionId: selection.sectionId || "",
              classroomId: selection.classroomId || "",
              studentId: selection.studentId || "",
              enrollmentId: selected?.enrollmentId || "",
            }));
            setErrors((current) => ({ ...current, studentId: undefined }));
            setSubmitError(null);
          }}
        />
        {errors.studentId ? (
          <p className="text-sm text-red-600">{errors.studentId}</p>
        ) : null}
        <Select
          label={t("rewardsModule.redemptions.create.reward")}
          value={form.catalogItemId}
          onChange={(value) => updateForm("catalogItemId", value)}
          options={catalogOptions}
          searchable
          disabled={loading || lookupsLoading}
          error={errors.catalogItemId}
          placeholder={t("rewardsModule.redemptions.create.rewardPlaceholder")}
          searchPlaceholder={t(
            "rewardsModule.redemptions.create.searchPlaceholder",
          )}
          noOptionsText={t("rewardsModule.redemptions.create.noRewards")}
          noResultsText={t("rewardsModule.redemptions.create.noResults")}
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TextArea
            label={t("rewardsModule.redemptions.create.requestNoteEn")}
            value={form.requestNoteEn}
            onChange={(event) =>
              updateForm("requestNoteEn", event.target.value)
            }
            disabled={loading}
            rows={3}
          />
          <TextArea
            label={t("rewardsModule.redemptions.create.requestNoteAr")}
            value={form.requestNoteAr}
            onChange={(event) =>
              updateForm("requestNoteAr", event.target.value)
            }
            disabled={loading}
            rows={3}
          />
        </div>
      </div>
    </Modal>
  );
}
