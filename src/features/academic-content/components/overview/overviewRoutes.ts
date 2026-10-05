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
  return contentType === "TEACHER_PREPARATION"
    ? academicContentOverviewHref({ locale, routeSuffix: "/preparations", yearId, termId })
    : academicContentOverviewHref({ locale, routeSuffix: "/library", yearId, termId, extraQuery: { type: contentType } });
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
