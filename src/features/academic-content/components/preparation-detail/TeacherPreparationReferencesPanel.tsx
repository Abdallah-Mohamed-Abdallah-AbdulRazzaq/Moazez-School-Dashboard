"use client";

import { RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import type { TeacherPreparationDetailDraftController } from "../../hooks/useTeacherPreparationDetailDraft";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentDetailOptions } from "../../services/academicContentDetailOptions";
import { OptionalReferenceSelect } from "../editor/details/AcademicReferenceFields";

interface TeacherPreparationReferencesPanelProps {
  controller: TeacherPreparationDetailDraftController;
  sectionState: AcademicContentEditorSectionState;
  options: AcademicContentDetailOptions | null;
  disabled: boolean;
  isLoading: boolean;
  loadError: string | null;
  onRetry: () => void;
}

function availableValue(value: string | null, options: readonly { id: string }[]): string | null {
  return value && options.some((option) => option.id === value) ? value : null;
}

export default function TeacherPreparationReferencesPanel({
  controller,
  sectionState,
  options,
  disabled,
  isLoading,
  loadError,
  onRetry,
}: TeacherPreparationReferencesPanelProps) {
  const t = useAcademicContentTranslations("teacher_preparation_detail.references");
  const detailsT = useAcademicContentTranslations("details");
  const locale = useLocale();
  const detail = controller.draft;

  if (isLoading) {
    return <section className="rounded-xl border border-gray-200 bg-white p-6"><p role="status">{t("loading")}</p></section>;
  }
  if (loadError || !options) {
    return (
      <section className="rounded-xl border border-red-200 bg-white p-6">
        <p role="alert" className="text-sm text-red-700">{loadError ?? t("unavailable")}</p>
        <Button type="button" className="mt-4" variant="secondary" leftIcon={<RefreshCw aria-hidden="true" className="size-4" />} onClick={onRetry}>
          {t("retry")}
        </Button>
      </section>
    );
  }

  const curriculum = options.curricula.find(({ id }) => id === detail.curriculumId);
  const unit = curriculum?.units.find(({ id }) => id === detail.curriculumUnitId);
  const plans = options.lessonPlans.filter((plan) => !detail.curriculumId || plan.curriculumId === detail.curriculumId);
  const plan = plans.find(({ id }) => id === detail.lessonPlanId);
  const hasUnavailableReference = Boolean(
    (detail.curriculumId && !curriculum) ||
    (detail.curriculumUnitId && !unit) ||
    (detail.curriculumLessonId && !unit?.lessons.some(({ id }) => id === detail.curriculumLessonId)) ||
    (detail.lessonPlanId && !plan) ||
    (detail.lessonPlanItemId && !plan?.items.some(({ id }) => id === detail.lessonPlanItemId)) ||
    (detail.timetableEntryId && !options.timetableEntries.some(({ id }) => id === detail.timetableEntryId)),
  );

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
      <p className="mt-1 text-sm text-gray-500">{t("description")}</p>
      {hasUnavailableReference ? <p role="status" className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{t("unavailable_selection")}</p> : null}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <OptionalReferenceSelect label={t("curriculum")} value={availableValue(detail.curriculumId, options.curricula)} options={options.curricula.map((item) => ({ value: item.id, label: item.title }))} disabled={disabled} helperText={detailsT("target_dependency_hint")} onChange={(value) => {
          controller.update("curriculumId", value);
          controller.update("curriculumUnitId", null);
          controller.update("curriculumLessonId", null);
          controller.update("lessonPlanId", null);
          controller.update("lessonPlanItemId", null);
        }} />
        <OptionalReferenceSelect label={t("curriculum_unit")} value={availableValue(detail.curriculumUnitId, curriculum?.units ?? [])} options={(curriculum?.units ?? []).map((item) => ({ value: item.id, label: item.title }))} disabled={disabled || !detail.curriculumId} onChange={(value) => {
          controller.update("curriculumUnitId", value);
          controller.update("curriculumLessonId", null);
        }} />
        <OptionalReferenceSelect label={t("curriculum_lesson")} value={availableValue(detail.curriculumLessonId, unit?.lessons ?? [])} options={(unit?.lessons ?? []).map((item) => ({ value: item.id, label: item.title }))} disabled={disabled || !detail.curriculumUnitId} onChange={(value) => controller.update("curriculumLessonId", value)} />
        <OptionalReferenceSelect label={t("lesson_plan")} value={availableValue(detail.lessonPlanId, plans)} options={plans.map((item) => ({ value: item.id, label: item.title }))} disabled={disabled} helperText={detailsT("target_dependency_hint")} onChange={(value) => {
          controller.update("lessonPlanId", value);
          controller.update("lessonPlanItemId", null);
        }} />
        <OptionalReferenceSelect label={t("lesson_plan_item")} value={availableValue(detail.lessonPlanItemId, plan?.items ?? [])} options={(plan?.items ?? []).map((item) => ({ value: item.id, label: item.title || item.lessonTitle }))} disabled={disabled || !detail.lessonPlanId} onChange={(value) => controller.update("lessonPlanItemId", value)} />
        <OptionalReferenceSelect label={t("timetable_entry")} value={availableValue(detail.timetableEntryId, options.timetableEntries)} options={options.timetableEntries.map((item) => ({ value: item.id, label: `${locale === "ar" ? item.classroom.nameAr : item.classroom.nameEn} · ${item.subject ? (locale === "ar" ? item.subject.nameAr : item.subject.nameEn) : t("unassigned")} · ${item.period.label}` }))} disabled={disabled} helperText={detailsT("target_dependency_hint")} onChange={(value) => controller.update("timetableEntryId", value)} />
      </div>
      {sectionState.error ? <p role="alert" className="mt-4 text-sm text-red-700">{sectionState.error.message}</p> : null}
    </section>
  );
}
