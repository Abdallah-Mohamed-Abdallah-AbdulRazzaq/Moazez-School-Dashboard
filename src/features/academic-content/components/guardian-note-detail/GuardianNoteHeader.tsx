"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Flag,
  MessageSquareText,
  UsersRound,
} from "lucide-react";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { TeacherPreparationTargetDisplay } from "../../model/teacherPreparationDetail";
import type { AcademicContentDetail } from "../../types/contracts";
import AcademicContentStatusBadge from "../library/AcademicContentStatusBadge";
import { academicContentOverviewHref } from "../overview/overviewRoutes";
import PublicationStatusBadge from "../publication/PublicationStatusBadge";

type GuardianNoteContent = Extract<
  AcademicContentDetail,
  { type: "GUARDIAN_WEEKLY_NOTE" }
>;

interface GuardianNoteHeaderProps {
  content: GuardianNoteContent;
  locale: string;
  targets: readonly TeacherPreparationTargetDisplay[];
  lifecycleActions?: ReactNode;
}

function SummaryCell({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-e border-gray-200 px-4 py-3 last:border-e-0">
      <span className="shrink-0 text-primary">{icon}</span>
      <span className="truncate text-sm font-medium text-gray-800">
        {label}
      </span>
    </div>
  );
}

export default function GuardianNoteHeader({
  content,
  locale,
  targets,
  lifecycleActions,
}: GuardianNoteHeaderProps) {
  const t = useAcademicContentTranslations("guardian_note_detail.header");
  const commonT = useAcademicContentTranslations();
  const details = content.details;
  const backHref = academicContentOverviewHref({
    locale,
    routeSuffix: "/guardian-notes",
    yearId: content.academicYearId,
    termId: content.termId,
  });

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
          {t("back")}
        </Link>
        {lifecycleActions}
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <MessageSquareText aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">
                {content.title}
              </h1>
              <p className="mt-1 text-sm text-gray-600">{t("subtitle")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AcademicContentStatusBadge status={content.status} />
            {content.publicationStatus ? (
              <PublicationStatusBadge status={content.publicationStatus} />
            ) : null}
          </div>
        </div>
        <div className="grid border-t border-gray-200 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCell
            icon={<Flag aria-hidden="true" className="size-5" />}
            label={
              details
                ? commonT(`priorities.${details.priority}`)
                : t("priority_not_set")
            }
          />
          <SummaryCell
            icon={<UsersRound aria-hidden="true" className="size-5" />}
            label={commonT(`audiences.${content.audience}`)}
          />
          <SummaryCell
            icon={<UsersRound aria-hidden="true" className="size-5" />}
            label={t("targets", { count: targets.length })}
          />
          <SummaryCell
            icon={<CheckCircle2 aria-hidden="true" className="size-5" />}
            label={
              details?.requiresAcknowledgement
                ? t("acknowledgement_required")
                : t("acknowledgement_not_required")
            }
          />
        </div>
      </section>
    </header>
  );
}
