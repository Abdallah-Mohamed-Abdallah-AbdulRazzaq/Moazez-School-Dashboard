import type { AcademicContentType } from "../../types/contracts";

interface AcademicContentOverviewHrefInput {
  locale: string;
  routeSuffix: string;
  yearId: string;
  termId: string;
  extraQuery?: Record<string, string>;
}

export function academicContentTypeHref({
  locale,
  contentType,
  yearId,
  termId,
}: {
  locale: string;
  contentType: AcademicContentType;
  yearId: string;
  termId: string;
}): string {
  if (contentType === "TEACHER_PREPARATION") {
    return academicContentOverviewHref({
      locale,
      routeSuffix: "/preparations",
      yearId,
      termId,
    });
  }
  if (contentType === "WEEKLY_PLAN") {
    return academicContentOverviewHref({
      locale,
      routeSuffix: "/weekly-plans",
      yearId,
      termId,
    });
  }
  if (contentType === "GUARDIAN_WEEKLY_NOTE") {
    return academicContentOverviewHref({
      locale,
      routeSuffix: "/guardian-notes",
      yearId,
      termId,
    });
  }
  if (contentType === "SUBJECT_RESOURCE") {
    return academicContentOverviewHref({
      locale,
      routeSuffix: "/subject-resources",
      yearId,
      termId,
    });
  }
  if (contentType === "ONLINE_SESSION") {
    return academicContentOverviewHref({
      locale,
      routeSuffix: "/online-sessions",
      yearId,
      termId,
    });
  }
  if (contentType === "GENERAL_RESOURCE") {
    return academicContentOverviewHref({
      locale,
      routeSuffix: "/general-resources",
      yearId,
      termId,
    });
  }
  return academicContentOverviewHref({
    locale,
    routeSuffix: "/library",
    yearId,
    termId,
    extraQuery: { type: contentType },
  });
}

export function academicContentOverviewHref({
  locale,
  routeSuffix,
  yearId,
  termId,
  extraQuery = {},
}: AcademicContentOverviewHrefInput): string {
  const query = new URLSearchParams({
    year: yearId,
    term: termId,
    ...extraQuery,
  });
  return `/${locale}/academic-content-hub${routeSuffix}?${query.toString()}`;
}
