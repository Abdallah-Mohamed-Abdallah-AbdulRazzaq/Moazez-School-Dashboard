"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { conflictTimetableHref } from "../services/timetableConflictLink";
import ButtonLink from "@/components/ui/button/ButtonLink";
import type {
  BackendTimetableEntryDto,
  TimetableDashboardConfigSummaryDto,
} from "../services/timetableApiTypes";

export default function ConflictTimetableDetails({
  lesson,
  configuration,
  termId,
  academicYearId,
  children,
}: {
  lesson: BackendTimetableEntryDto;
  configuration: TimetableDashboardConfigSummaryDto | null;
  termId: string;
  academicYearId: string;
  children?: ReactNode;
}) {
  const t = useTranslations("academics.timetable.conflictInspection");
  const locale = useLocale();
  const scope = configuration?.scopeType.toLowerCase();
  const href = conflictTimetableHref({
    locale,
    academicYearId,
    termId,
    lesson,
    configuration,
  });
  return (
    <div className="space-y-3 border-t border-gray-200 pt-3">
      {configuration ? (
        <dl className="space-y-1 text-sm">
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-gray-600">{t("configurationName")}</dt>
            <dd className="break-words font-medium text-gray-900">
              {configuration.name}
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-gray-600">{t("configurationScope")}</dt>
            <dd className="font-medium text-primary-800">
              {t(`scopes.${scope}`)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-amber-900">{t("scopeUnavailable")}</p>
      )}
      <div className="flex flex-wrap gap-3">
        {children}
        {lesson.status !== "cancelled" && (
          <ButtonLink
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            prefetch={false}
            variant="secondary"
            className="min-h-11 w-full focus-visible:ring-2 focus-visible:ring-primary sm:w-auto"
            leftIcon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
          >
            {t("openNewTab")}
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
