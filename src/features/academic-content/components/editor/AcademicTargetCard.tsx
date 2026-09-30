"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import { requiresSubject } from "../../model/academicContentPolicy";
import {
  eligibleSubjectsForTarget,
  teacherAllocationsForTarget,
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
  onUpdate: (update: Partial<EditableAcademicTarget>) => void;
  onRemove: () => void;
}

function selectOptions<T extends { id: string; name: string }>(items: T[]): SelectOption[] {
  return items.map((item) => ({ value: item.id, label: item.name }));
}

function withSelectedFallback(
  options: SelectOption[],
  selectedValue: string | null | undefined,
  unavailableLabel: (id: string) => string,
): SelectOption[] {
  if (!selectedValue || options.some((option) => option.value === selectedValue)) {
    return options;
  }
  return [
    ...options,
    { value: selectedValue, label: unavailableLabel(selectedValue), disabled: true },
  ];
}

export default function AcademicTargetCard({
  row,
  index,
  options,
  contentType,
  disabled,
  onUpdate,
  onRemove,
}: AcademicTargetCardProps) {
  const t = useAcademicContentTranslations("targets");
  const position = index + 1;
  const scopeOptions: SelectOption[] = [
    { value: "SCHOOL", label: t("whole_school") },
    { value: "STAGE", label: t("stage") },
    { value: "GRADE", label: t("grade") },
    { value: "SECTION", label: t("section") },
    { value: "CLASSROOM", label: t("classroom") },
  ];
  const unavailableLabel = (id: string) => t("unavailable_value", { id });
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
  const subjectOptions = eligibleSubjectsForTarget(options, row).map((subject) => ({
    value: subject.id,
    label: subject.name,
  }));
  const allocationOptions = teacherAllocationsForTarget(options, row).map(
    (allocation) => ({
      value: allocation.id,
      label: allocation.teacherId
        ? t("teacher_assignment", { id: allocation.teacherId })
        : t("teacher_assignment", { id: allocation.id }),
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
        <div className="mb-4 flex items-center gap-3" aria-label={t("alternative")}>
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-bold text-gray-500">{t("or")}</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>
      )}
      <article className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-900">{t("target", { index: position })}</h3>
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
            label={t("scope")}
            triggerAriaLabel={`${t("scope")} ${position}`}
            value={row.scopeType}
            options={scopeOptions}
            disabled={disabled}
            onChange={(value) => changeScope(value as AcademicContentTargetScope)}
          />
          {row.scopeType !== "SCHOOL" && (
            <Select
              label={t("stage")}
              triggerAriaLabel={`${t("stage")} ${position}`}
              value={row.stageContextId}
              options={withSelectedFallback(
                selectOptions(options.structure.stages),
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
              label={t("grade")}
              triggerAriaLabel={`${t("grade")} ${position}`}
              value={row.gradeContextId}
              options={withSelectedFallback(selectOptions(grades), row.gradeContextId, unavailableLabel)}
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
              label={t("section")}
              triggerAriaLabel={`${t("section")} ${position}`}
              value={row.sectionContextId}
              options={withSelectedFallback(
                selectOptions(sections),
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
              label={t("classroom")}
              triggerAriaLabel={`${t("classroom")} ${position}`}
              value={row.classroomId ?? ""}
              options={withSelectedFallback(selectOptions(classrooms), row.classroomId, unavailableLabel)}
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
            label={subjectIsRequired ? t("subject") : t("optional", { label: t("subject") })}
            triggerAriaLabel={`${t("subject")} ${position}`}
            value={row.subjectId ?? ""}
            options={[
              ...(subjectIsRequired ? [] : [{ value: "", label: t("no_subject") }]),
              ...withSelectedFallback(subjectOptions, row.subjectId, unavailableLabel),
            ]}
            disabled={disabled}
            required={subjectIsRequired}
            onChange={(value) =>
              onUpdate({
                subjectId: value || null,
                teacherSubjectAllocationId: null,
              })
            }
          />
          {row.scopeType === "CLASSROOM" && row.subjectId && (
            <Select
              label={t("optional", { label: t("teacher_allocation") })}
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
              disabled={disabled}
              onChange={(value) =>
                onUpdate({ teacherSubjectAllocationId: value || null })
              }
            />
          )}
        </div>
        <p className="mt-3 text-xs font-medium text-gray-500">
          {t("and_hint")}
        </p>
      </article>
    </div>
  );
}
