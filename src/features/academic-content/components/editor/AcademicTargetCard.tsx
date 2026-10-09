"use client";

import { Info, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import { requiresSubject } from "../../model/academicContentPolicy";
import {
  academicTargetScopeName,
  academicSubjectName,
  localizedAcademicName,
} from "../../model/academicContentDisplay";
import {
  eligibleSubjectsForTarget,
  teacherAllocationsForTarget,
  toTargetInput,
  type AcademicTargetOptions,
} from "../../services/academicContentSelectors";
import type {
  AcademicContentTargetDraft,
  AcademicContentTargetScope,
  AcademicContentType,
} from "../../types/contracts";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

export interface EditableAcademicTarget extends AcademicContentTargetDraft {
  key: string;
  stageContextId: string;
  gradeContextId: string;
  sectionContextId: string;
}

interface AcademicTargetCardProps {
  row: EditableAcademicTarget;
  index: number;
  options: AcademicTargetOptions;
  contentType: AcademicContentType;
  disabled: boolean;
  overlapHint?: string;
  onUpdate: (update: Partial<EditableAcademicTarget>) => void;
  onRemove: () => void;
}

function selectOptions<T extends { id: string; name: string }>(
  items: T[],
  locale: string,
): SelectOption[] {
  return items.map((item) => ({
    value: item.id,
    label: localizedAcademicName(item, locale) ?? item.name,
  }));
}

function withSelectedFallback(
  options: SelectOption[],
  selectedValue: string | null | undefined,
  unavailableLabel: string,
): SelectOption[] {
  if (
    !selectedValue ||
    options.some((option) => option.value === selectedValue)
  ) {
    return options;
  }
  return [
    ...options,
    { value: selectedValue, label: unavailableLabel, disabled: true },
  ];
}

export default function AcademicTargetCard({
  row,
  index,
  options,
  contentType,
  disabled,
  overlapHint,
  onUpdate,
  onRemove,
}: AcademicTargetCardProps) {
  const t = useAcademicContentTranslations("targets");
  const locale = useLocale();
  const selectCopy = {
    placeholder: t("choose_option"),
    noOptionsText: t("no_options"),
    noResultsText: t("no_results"),
  };
  const scopeName =
    row.scopeType === "SCHOOL"
      ? t("whole_school")
      : academicTargetScopeName(toTargetInput(row), options, locale);
  const subjectName = academicSubjectName(row.subjectId, options, locale);
  const scopeReady =
    row.scopeType === "SCHOOL" ||
    Boolean(
      row.scopeType === "STAGE"
        ? row.stageId
        : row.scopeType === "GRADE"
          ? row.gradeId
          : row.scopeType === "SECTION"
            ? row.sectionId
            : row.classroomId,
    );
  const fieldStyle = (scope: AcademicContentTargetScope) =>
    row.scopeType === scope
      ? "border-primary/30 bg-primary/5"
      : "border-gray-200 bg-gray-50";
  const subjectDependency = !scopeReady
    ? t("subject_dependency", { scope: t(row.scopeType.toLowerCase()) })
    : undefined;
  const position = index + 1;
  const scopeOptions: SelectOption[] = [
    { value: "SCHOOL", label: t("whole_school") },
    { value: "STAGE", label: t("stage") },
    { value: "GRADE", label: t("grade") },
    { value: "SECTION", label: t("section") },
    { value: "CLASSROOM", label: t("classroom") },
  ];
  const unavailableLabel = t("unavailable_value");
  const showsGrade = ["GRADE", "SECTION", "CLASSROOM"].includes(row.scopeType);
  const showsSection = ["SECTION", "CLASSROOM"].includes(row.scopeType);
  const subjectIsRequired = requiresSubject(contentType);
  const grades = options.structure.grades.filter(
    (grade) => grade.stageId === row.stageContextId,
  );
  const sections = options.structure.sections.filter(
    (section) => section.gradeId === row.gradeContextId,
  );
  const classrooms = options.structure.classrooms.filter(
    (classroom) => classroom.sectionId === row.sectionContextId,
  );
  const subjectOptions = eligibleSubjectsForTarget(options, row).map(
    (subject) => ({
      value: subject.id,
      label: localizedAcademicName(subject, locale) ?? subject.name,
    }),
  );
  const allocationOptions = teacherAllocationsForTarget(options, row).map(
    (allocation) => ({
      value: allocation.id,
      label: allocation.teacherName?.trim() || t("teacher_unavailable_label"),
    }),
  );

  const changeScope = (scopeType: AcademicContentTargetScope) => {
    onUpdate({
      scopeType,
      stageId: null,
      gradeId: null,
      sectionId: null,
      classroomId: null,
      subjectId: null,
      teacherSubjectAllocationId: null,
      stageContextId: "",
      gradeContextId: "",
      sectionContextId: "",
    });
  };

  return (
    <div>
      {index > 0 && (
        <div
          className="mb-4 flex items-center gap-3"
          aria-label={t("alternative")}
        >
          <span className="h-px flex-1 bg-gray-200" />
          <span className="max-w-full text-center text-xs font-medium text-gray-600">
            {t("includes_any")}
          </span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>
      )}
      <article className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900">
              {t("target", { index: position })}
            </h3>
            <p className="mt-1 break-words text-sm text-primary">
              {scopeName
                ? [scopeName, subjectName].filter(Boolean).join(" · ")
                : t("summary_incomplete")}
            </p>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={t("remove", { index: position })}
              leftIcon={<Trash2 aria-hidden="true" className="size-4" />}
              onClick={onRemove}
            >
              {t("remove", { index: position })}
            </Button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Select
            {...selectCopy}
            label={t("scope")}
            className="border-primary/40 bg-primary/5 font-medium"
            helperText={t("scope_hint")}
            triggerAriaLabel={`${t("scope")} ${position}`}
            value={row.scopeType}
            options={scopeOptions}
            disabled={disabled}
            onChange={(value) =>
              changeScope(value as AcademicContentTargetScope)
            }
          />
          {row.scopeType !== "SCHOOL" && (
            <Select
              {...selectCopy}
              label={t("stage")}
              className={fieldStyle("STAGE")}
              triggerAriaLabel={`${t("stage")} ${position}`}
              value={row.stageContextId}
              options={withSelectedFallback(
                selectOptions(options.structure.stages, locale),
                row.stageContextId,
                unavailableLabel,
              )}
              disabled={disabled}
              onChange={(value) =>
                onUpdate({
                  stageContextId: value,
                  gradeContextId: "",
                  sectionContextId: "",
                  stageId: row.scopeType === "STAGE" ? value : null,
                  gradeId: null,
                  sectionId: null,
                  classroomId: null,
                  subjectId: null,
                  teacherSubjectAllocationId: null,
                })
              }
            />
          )}
          {showsGrade && (
            <Select
              {...selectCopy}
              label={t("grade")}
              className={fieldStyle("GRADE")}
              helperText={
                !row.stageContextId ? t("select_stage_first") : undefined
              }
              triggerAriaLabel={`${t("grade")} ${position}`}
              value={row.gradeContextId}
              options={withSelectedFallback(
                selectOptions(grades, locale),
                row.gradeContextId,
                unavailableLabel,
              )}
              disabled={disabled || !row.stageContextId}
              onChange={(value) =>
                onUpdate({
                  gradeContextId: value,
                  sectionContextId: "",
                  gradeId: row.scopeType === "GRADE" ? value : null,
                  sectionId: null,
                  classroomId: null,
                  subjectId: null,
                  teacherSubjectAllocationId: null,
                })
              }
            />
          )}
          {showsSection && (
            <Select
              {...selectCopy}
              label={t("section")}
              className={fieldStyle("SECTION")}
              helperText={
                !row.gradeContextId ? t("select_grade_first") : undefined
              }
              triggerAriaLabel={`${t("section")} ${position}`}
              value={row.sectionContextId}
              options={withSelectedFallback(
                selectOptions(sections, locale),
                row.sectionContextId,
                unavailableLabel,
              )}
              disabled={disabled || !row.gradeContextId}
              onChange={(value) =>
                onUpdate({
                  sectionContextId: value,
                  sectionId: row.scopeType === "SECTION" ? value : null,
                  classroomId: null,
                  subjectId: null,
                  teacherSubjectAllocationId: null,
                })
              }
            />
          )}
          {row.scopeType === "CLASSROOM" && (
            <Select
              {...selectCopy}
              label={t("classroom")}
              className={fieldStyle("CLASSROOM")}
              helperText={
                !row.sectionContextId ? t("select_section_first") : undefined
              }
              triggerAriaLabel={`${t("classroom")} ${position}`}
              value={row.classroomId ?? ""}
              options={withSelectedFallback(
                selectOptions(classrooms, locale),
                row.classroomId,
                unavailableLabel,
              )}
              disabled={disabled || !row.sectionContextId}
              onChange={(value) =>
                onUpdate({
                  classroomId: value,
                  subjectId: null,
                  teacherSubjectAllocationId: null,
                })
              }
            />
          )}
          <Select
            {...selectCopy}
            label={
              subjectIsRequired
                ? t("subject")
                : t("optional", { label: t("subject") })
            }
            helperText={subjectDependency}
            triggerAriaLabel={`${t("subject")} ${position}`}
            value={row.subjectId ?? ""}
            options={[
              ...(subjectIsRequired
                ? []
                : [{ value: "", label: t("no_subject") }]),
              ...withSelectedFallback(
                subjectOptions,
                row.subjectId,
                unavailableLabel,
              ),
            ]}
            disabled={disabled || !scopeReady}
            required={subjectIsRequired}
            onChange={(value) =>
              onUpdate({
                subjectId: value || null,
                teacherSubjectAllocationId: null,
              })
            }
          />
          {row.scopeType === "CLASSROOM" && (
            <Select
              {...selectCopy}
              label={t("optional", { label: t("teacher_allocation") })}
              helperText={
                !row.classroomId || !row.subjectId
                  ? `${t("teacher_dependency")} ${t("teacher_assignment_hint")}`
                  : t("teacher_assignment_hint")
              }
              triggerAriaLabel={`${t("teacher_allocation")} ${position}`}
              value={row.teacherSubjectAllocationId ?? ""}
              options={[
                { value: "", label: t("no_teacher_allocation") },
                ...withSelectedFallback(
                  allocationOptions,
                  row.teacherSubjectAllocationId,
                  unavailableLabel,
                ),
              ]}
              disabled={disabled || !row.classroomId || !row.subjectId}
              onChange={(value) =>
                onUpdate({ teacherSubjectAllocationId: value || null })
              }
            />
          )}
        </div>
        {overlapHint && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
          >
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>{overlapHint}</p>
          </div>
        )}
        <p className="mt-3 text-xs font-medium text-gray-500">
          {t("and_hint")}
        </p>
      </article>
    </div>
  );
}
