interface AcademicContentOverviewHrefInput {
  locale: string;
  routeSuffix: string;
  yearId: string;
  termId: string;
  extraQuery?: Record<string, string>;
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
