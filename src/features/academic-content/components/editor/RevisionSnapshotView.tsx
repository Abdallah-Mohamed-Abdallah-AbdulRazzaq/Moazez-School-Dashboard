"use client";

import type { ReactNode } from "react";
import { CalendarDays, FileText, LockKeyhole, Target } from "lucide-react";
import { useLocale } from "next-intl";
import { RichTextContent } from "@/components/ui/rich-text-content";
import type { AcademicContentRevisionDetail } from "../../types/contracts";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import RevisionSnapshotDetails from "./RevisionSnapshotDetails";
import RevisionSnapshotResources from "./RevisionSnapshotResources";
import RevisionSnapshotTargets, {
  type RevisionDisplayContext,
} from "./RevisionSnapshotTargets";
import { formatRevisionDateTime } from "./revisionSnapshotFormatting";

interface RevisionSnapshotViewProps {
  revision: AcademicContentRevisionDetail;
  displayContext?: RevisionDisplayContext;
}

function SnapshotHeader({
  revision,
}: {
  revision: AcademicContentRevisionDetail;
}) {
  const t = useAcademicContentTranslations();
  return (
    <header className="border-b border-gray-200 bg-gray-50/70 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600">
        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-gray-200">
          {t(`types.${revision.type}`)}
        </span>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800 ring-1 ring-amber-200">
          {t(`statuses.${revision.sourceStatus}`)}
        </span>
      </div>
      <h2 className="mt-4 text-xl font-bold text-gray-950 sm:text-2xl">
        {revision.title}
      </h2>
      {revision.description && (
        <RichTextContent
          value={revision.description}
          className="mt-2 max-w-4xl text-sm leading-6 text-gray-600"
        />
      )}
    </header>
  );
}

function SnapshotOverview({
  revision,
  displayContext,
}: RevisionSnapshotViewProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations();
  const metadata: Array<{ label: string; value: ReactNode }> = [
    { label: t("revisions.field_type"), value: t(`types.${revision.type}`) },
    {
      label: t("revisions.field_audience"),
      value: t(`audiences.${revision.audience}`),
    },
    {
      label: t("revisions.field_source_status"),
      value: t(`statuses.${revision.sourceStatus}`),
    },
    {
      label: t("revisions.field_academic_year"),
      value:
        displayContext?.academicYearName ?? t("revisions.context_unavailable"),
    },
    {
      label: t("revisions.field_term"),
      value: displayContext?.termName ?? t("revisions.context_unavailable"),
    },
    {
      label: t("revisions.field_captured_at"),
      value: (
        <time dateTime={revision.capturedAt}>
          {formatRevisionDateTime(revision.capturedAt, locale)}
        </time>
      ),
    },
  ];

  return (
    <section aria-labelledby="revision-overview-heading">
      <h3
        id="revision-overview-heading"
        className="flex items-center gap-2 text-base font-bold text-gray-950"
      >
        <CalendarDays aria-hidden="true" className="size-5 text-primary" />
        {t("revisions.overview")}
      </h3>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metadata.map((metadataEntry) => (
          <div
            key={metadataEntry.label}
            className="rounded-xl border border-gray-200 px-4 py-3"
          >
            <dt className="text-xs font-medium text-gray-500">
              {metadataEntry.label}
            </dt>
            <dd className="mt-1 break-words text-sm font-semibold text-gray-900">
              {metadataEntry.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function RevisionSnapshotView({
  revision,
  displayContext,
}: RevisionSnapshotViewProps) {
  const t = useAcademicContentTranslations("revisions");
  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <SnapshotHeader revision={revision} />
      <div className="space-y-8 p-5 sm:p-6">
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>{t("immutable", { version: revision.snapshotContractVersion })}</p>
        </div>

        <SnapshotOverview revision={revision} displayContext={displayContext} />

        <section aria-labelledby="revision-details-heading">
          <h3
            id="revision-details-heading"
            className="flex items-center gap-2 text-base font-bold text-gray-950"
          >
            <FileText aria-hidden="true" className="size-5 text-primary" />
            {t("type_details")}
          </h3>
          <div className="mt-4">
            {revision.details ? (
              <RevisionSnapshotDetails details={revision.details} />
            ) : (
              <p className="text-sm text-gray-500">{t("no_details")}</p>
            )}
          </div>
        </section>

        <section aria-labelledby="revision-targets-heading">
          <h3
            id="revision-targets-heading"
            className="flex items-center gap-2 text-base font-bold text-gray-950"
          >
            <Target aria-hidden="true" className="size-5 text-primary" />
            {t("targets")}
          </h3>
          <div className="mt-4">
            {revision.targets.length ? (
              <RevisionSnapshotTargets
                targets={revision.targets}
                displayContext={displayContext}
              />
            ) : (
              <p className="text-sm text-gray-500">{t("no_targets")}</p>
            )}
          </div>
        </section>

        <RevisionSnapshotResources revision={revision} />
      </div>
    </article>
  );
}
