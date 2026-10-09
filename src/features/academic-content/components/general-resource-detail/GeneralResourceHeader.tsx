"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  FolderOpen,
  Paperclip,
  Target,
  Users,
} from "lucide-react";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentDetail } from "../../types/contracts";
import AcademicContentStatusBadge from "../library/AcademicContentStatusBadge";
import { academicContentOverviewHref } from "../overview/overviewRoutes";
import PublicationStatusBadge from "../publication/PublicationStatusBadge";

type GeneralResourceContent = Extract<
  AcademicContentDetail,
  { type: "GENERAL_RESOURCE" }
>;

interface Props {
  content: GeneralResourceContent;
  locale: string;
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

export default function GeneralResourceHeader({
  content,
  locale,
  lifecycleActions,
}: Props) {
  const t = useAcademicContentTranslations("general_resource_detail");
  const commonT = useAcademicContentTranslations();
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const backHref = academicContentOverviewHref({
    locale,
    routeSuffix: "/general-resources",
    yearId: content.academicYearId,
    termId: content.termId,
  });

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
          {t("header.back")}
        </Link>
        {lifecycleActions}
      </div>
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <FolderOpen aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">
                {content.title}
              </h1>
              {content.description ? (
                <RichTextContent
                  value={content.description}
                  className="mt-2 text-sm text-gray-600"
                />
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  {t("header.no_description")}
                </p>
              )}
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
            icon={<Users aria-hidden="true" className="size-5" />}
            label={commonT(`audiences.${content.audience}`)}
          />
          <SummaryCell
            icon={<Target aria-hidden="true" className="size-5" />}
            label={t("header.targets", { count: content.targets.length })}
          />
          <SummaryCell
            icon={<Paperclip aria-hidden="true" className="size-5" />}
            label={t("header.attachments", { count: content.assets.length })}
          />
          <SummaryCell
            icon={<Clock3 aria-hidden="true" className="size-5" />}
            label={formatter.format(new Date(content.updatedAt))}
          />
        </div>
      </section>
    </header>
  );
}
