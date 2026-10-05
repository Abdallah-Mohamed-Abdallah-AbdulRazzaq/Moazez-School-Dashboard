import { BookOpen, CalendarDays } from "lucide-react";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { TeacherPreparationReferenceDisplay } from "../../model/teacherPreparationDetail";

interface TeacherPreparationReferenceCardsProps {
  references: TeacherPreparationReferenceDisplay;
  error: string | null;
}

function ReferenceValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-end font-medium text-gray-800">{value}</dd>
    </div>
  );
}

export default function TeacherPreparationReferenceCards({
  references,
  error,
}: TeacherPreparationReferenceCardsProps) {
  const t = useAcademicContentTranslations("teacher_preparation_detail.context");
  const unavailable = t("unavailable");
  return (
    <>
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900"><BookOpen aria-hidden="true" className="size-4 text-primary" />{t("curriculum_reference")}</h2>
        {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : (
          <dl className="mt-4 space-y-2">
            <ReferenceValue label={t("curriculum")} value={references.curriculum ?? unavailable} />
            <ReferenceValue label={t("unit")} value={references.curriculumUnit ?? unavailable} />
            <ReferenceValue label={t("lesson")} value={references.curriculumLesson ?? unavailable} />
            <ReferenceValue label={t("lesson_plan")} value={references.lessonPlan ?? unavailable} />
          </dl>
        )}
      </section>
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900"><CalendarDays aria-hidden="true" className="size-4 text-primary" />{t("timetable_reference")}</h2>
        {references.timetable ? (
          <dl className="mt-4 space-y-2">
            <ReferenceValue label={t("classroom")} value={references.timetable.classroom} />
            <ReferenceValue label={t("subject")} value={references.timetable.subject ?? unavailable} />
            <ReferenceValue label={t("teacher")} value={references.timetable.teacher ?? unavailable} />
            <ReferenceValue label={t("period")} value={`${references.timetable.period} · ${references.timetable.time}`} />
          </dl>
        ) : <p className="mt-3 text-sm text-gray-500">{unavailable}</p>}
      </section>
    </>
  );
}
