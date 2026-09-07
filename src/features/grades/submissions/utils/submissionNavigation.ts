const CONTEXT_KEYS = ["year", "term", "scopeType", "scopeId", "subjectId", "deliveryMode"] as const;

function allowedContext(context: URLSearchParams): URLSearchParams {
  const result = new URLSearchParams();
  CONTEXT_KEYS.forEach((key) => {
    const value = context.get(key);
    if (value) result.set(key, value);
  });
  return result;
}

function withQuery(path: string, query: URLSearchParams): string {
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}

export function buildSubmissionDetailHref({ locale, submissionId, source, assessmentId, context }: { locale: string; submissionId: string; source: "gradebook" | "assessment-submissions"; assessmentId?: string; context: URLSearchParams }): string {
  const query = allowedContext(context);
  query.set("source", source);
  if (assessmentId) query.set("assessmentId", assessmentId);
  return withQuery(`/${locale}/grades/submissions/${submissionId}`, query);
}

export function buildAssessmentsHref({ locale, context }: { locale: string; context: URLSearchParams }): string {
  return withQuery(`/${locale}/grades/assessments`, allowedContext(context));
}

export function buildSubmissionReturnHref({ locale, source, assessmentId, context }: { locale: string; source: string | null; assessmentId: string | null; context: URLSearchParams }): string {
  if (assessmentId && source !== "gradebook") return withQuery(`/${locale}/grades/assessments/${assessmentId}/submissions`, allowedContext(context));
  if (source === "gradebook") return withQuery(`/${locale}/grades/gradebook`, allowedContext(context));
  return withQuery(`/${locale}/grades/gradebook`, allowedContext(context));
}
