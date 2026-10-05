"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, FileText, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { TeacherPreparationTargetDisplay } from "../../model/teacherPreparationDetail";
import type { AcademicContentDetail } from "../../types/contracts";
import AcademicContentStatusBadge from "../library/AcademicContentStatusBadge";
import { academicContentOverviewHref } from "../overview/overviewRoutes";

type PreparationContent = Extract<AcademicContentDetail, { type: "TEACHER_PREPARATION" }>;

interface TeacherPreparationHeaderProps {
  content: PreparationContent;
  locale: string;
  academicYearName: string;
  termName: string;
  targets: readonly TeacherPreparationTargetDisplay[];
  canSubmit: boolean;
  showSubmit: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  submissionHint: string;
  onSubmit: () => void;
  lifecycleActions?: ReactNode;
}

interface ContextCardProps {
  icon: ReactNode;
  label: string;
}

function ContextCard({ icon, label }: ContextCardProps) {
  return (
    <div className="flex min-w-0 items-center gap-2 border-e border-gray-200 px-4 py-3 last:border-e-0">
      <span className="shrink-0 text-primary">{icon}</span>
      <span className="truncate text-sm font-medium text-gray-800">{label}</span>
    </div>
  );
}

function uniqueLabels(labels: Array<string | null>): string[] {
  return [...new Set(labels.filter((label): label is string => Boolean(label)))];
}

export default function TeacherPreparationHeader({
  content,
  locale,
  academicYearName,
  termName,
  targets,
  canSubmit,
  showSubmit,
  isSubmitting,
  submitLabel,
  submissionHint,
  onSubmit,
  lifecycleActions,
}: TeacherPreparationHeaderProps) {
  const t = useAcademicContentTranslations("teacher_preparation_detail");
  const subjects = uniqueLabels(targets.map(({ subject }) => subject));
  const scopes = uniqueLabels(targets.map(({ scope }) => scope));
  const teachers = uniqueLabels(targets.map(({ assignedTeacher }) => assignedTeacher));
  const backHref = academicContentOverviewHref({
    locale,
    routeSuffix: "/preparations",
    yearId: content.academicYearId,
    termId: content.termId,
  });

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary">
          <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
          {t("back_to_preparations")}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {showSubmit ? (
            <Button
              type="button"
              loading={isSubmitting}
              disabled={!canSubmit}
              title={submissionHint}
              leftIcon={<Send aria-hidden="true" className="size-4" />}
              onClick={onSubmit}
            >
              {submitLabel}
            </Button>
          ) : null}
          {lifecycleActions}
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
              <FileText aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">{content.title}</h1>
              {content.description ? <p className="mt-1 text-sm text-gray-600 sm:text-base">{content.description}</p> : null}
            </div>
          </div>
          <AcademicContentStatusBadge status={content.status} />
        </div>
        <div className="grid border-t border-gray-200 sm:grid-cols-2 xl:grid-cols-4">
          <ContextCard icon={<CalendarDays aria-hidden="true" className="size-5" />} label={`${academicYearName} · ${termName}`} />
          <ContextCard icon={<BookOpen aria-hidden="true" className="size-5" />} label={subjects.length === 1 ? subjects[0] : t("subjects_count", { count: subjects.length })} />
          <ContextCard icon={<Users aria-hidden="true" className="size-5" />} label={targets.length === 1 && scopes[0] ? scopes[0] : t("targets_count", { count: targets.length })} />
          <ContextCard icon={<Users aria-hidden="true" className="size-5" />} label={teachers.length === 0 ? t("assigned_teacher_unavailable") : teachers.length === 1 ? t("assigned_teacher", { name: teachers[0] }) : t("assigned_teachers_count", { count: teachers.length })} />
        </div>
      </section>
    </header>
  );
}
