"use client";

import { BookOpen, CalendarClock, Link2, Tags, UsersRound } from "lucide-react";
import { useLocale } from "next-intl";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { TeacherPreparationTargetDisplay } from "../../model/teacherPreparationDetail";
import type { AcademicContentDetail } from "../../types/contracts";
import type { AcademicContentDetailOptions } from "../../services/academicContentDetailOptions";
import EditorSummaryCard from "../editor/EditorSummaryCard";
import PublicationStatusBadge from "../publication/PublicationStatusBadge";

type SubjectResourceContent = Extract<
  AcademicContentDetail,
  { type: "SUBJECT_RESOURCE" }
>;

function EmptyValue({ children }: { children: string }) {
  return <p className="text-sm text-gray-500">{children}</p>;
}

function curriculumNames(
  content: SubjectResourceContent,
  options: AcademicContentDetailOptions,
) {
  const curriculum = options.curricula.find(
    ({ id }) => id === content.details?.curriculumId,
  );
  const unit = curriculum?.units.find(
    ({ id }) => id === content.details?.curriculumUnitId,
  );
  const lesson = unit?.lessons.find(
    ({ id }) => id === content.details?.curriculumLessonId,
  );
  return [curriculum?.title, unit?.title, lesson?.title].filter(
    Boolean,
  ) as string[];
}

function PublicationDates({ content }: { content: SubjectResourceContent }) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("subject_resource_detail.context");
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const dates = [
    [t("publish_at"), content.publishAt],
    [t("visible_from"), content.visibleFrom],
    [t("visible_until"), content.visibleUntil],
    [t("created"), content.createdAt],
    [t("updated"), content.updatedAt],
  ] as const;
  return (
    <dl className="space-y-2">
      {dates.map(([label, date]) => (
        <div key={label} className="flex justify-between gap-3 text-xs">
          <dt className="text-gray-500">{label}</dt>
          <dd className="text-end font-medium text-gray-800">
            <time dateTime={date ?? undefined}>
              {date ? formatter.format(new Date(date)) : t("not_set")}
            </time>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function TextList({
  entries,
  empty,
}: {
  entries: readonly string[];
  empty: string;
}) {
  return entries.length ? (
    <ul className="space-y-2 text-sm text-gray-700">
      {entries.map((entry) => (
        <li key={entry}>{entry}</li>
      ))}
    </ul>
  ) : (
    <EmptyValue>{empty}</EmptyValue>
  );
}

export default function SubjectResourceContextRail({
  content,
  options,
  targets,
  targetError,
}: {
  content: SubjectResourceContent;
  options: AcademicContentDetailOptions;
  targets: readonly TeacherPreparationTargetDisplay[];
  targetError: string | null;
}) {
  const t = useAcademicContentTranslations("subject_resource_detail.context");
  const curriculum = curriculumNames(content, options);
  const targetLabels = targets
    .map(({ subject, scope }) => [subject, scope].filter(Boolean).join(" · "))
    .filter(Boolean);
  return (
    <aside aria-label={t("information")} className="space-y-4">
      <EditorSummaryCard
        icon={<BookOpen aria-hidden="true" className="size-5" />}
        title={t("curriculum")}
      >
        <TextList entries={curriculum} empty={t("not_set")} />
      </EditorSummaryCard>
      <EditorSummaryCard
        icon={<UsersRound aria-hidden="true" className="size-5" />}
        title={t("sharing")}
      >
        {targetError ? (
          <p role="alert" className="text-sm text-amber-700">
            {targetError}
          </p>
        ) : (
          <TextList entries={targetLabels} empty={t("no_targets")} />
        )}
      </EditorSummaryCard>
      <EditorSummaryCard
        icon={<Tags aria-hidden="true" className="size-5" />}
        title={t("tags")}
      >
        <TextList
          entries={content.tags.map(({ value }) => value)}
          empty={t("no_tags")}
        />
      </EditorSummaryCard>
      <EditorSummaryCard
        icon={<Link2 aria-hidden="true" className="size-5" />}
        title={t("links")}
      >
        {content.links.length ? (
          <ul className="space-y-2 text-sm">
            {content.links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyValue>{t("no_links")}</EmptyValue>
        )}
      </EditorSummaryCard>
      <EditorSummaryCard
        icon={<CalendarClock aria-hidden="true" className="size-5" />}
        title={t("information")}
      >
        <div className="mb-3">
          {content.publicationStatus ? (
            <PublicationStatusBadge status={content.publicationStatus} />
          ) : null}
        </div>
        <PublicationDates content={content} />
      </EditorSummaryCard>
    </aside>
  );
}
