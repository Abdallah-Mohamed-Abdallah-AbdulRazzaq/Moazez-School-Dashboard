import type {
  Application,
  ApplicationSource,
  ApplicationStatus,
  Decision,
  DecisionType,
  Document,
  DocumentStatus,
  Interview,
  InterviewStatus,
  Test,
  TestStatus,
} from "@/features/admissions/types/admissions";

type ApiRecord = Record<string, unknown>;

export interface AdmissionsPagination {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedAdmissionsResult<T> {
  items: T[];
  pagination: AdmissionsPagination;
}

const isRecord = (value: unknown): value is ApiRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const read = (record: ApiRecord, keys: string[]): unknown => {
  for (const key of keys) {
    if (typeof record[key] !== "undefined" && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
};

const readString = (
  record: ApiRecord,
  keys: string[],
  fallback = "",
): string => {
  const value = read(record, keys);
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};

const readArray = (record: ApiRecord, keys: string[]): unknown[] => {
  const value = read(record, keys);
  return Array.isArray(value) ? value : [];
};

function unwrapEnvelope(response: unknown): unknown {
  if (!isRecord(response)) return response;
  if (typeof response.data !== "undefined" && response.data !== null && (isRecord(response.data) || Array.isArray(response.data))) return response.data;
  if (typeof response.result !== "undefined" && response.result !== null && (isRecord(response.result) || Array.isArray(response.result))) return response.result;
  if (typeof response.payload !== "undefined" && response.payload !== null && (isRecord(response.payload) || Array.isArray(response.payload))) return response.payload;
  return response;
}

export function unwrapArrayResponse(response: unknown, label: string): unknown[] {
  if (Array.isArray(response)) return response;

  if (isRecord(response)) {
    if (Array.isArray(response.data)) return response.data;
    if (isRecord(response.data) && Array.isArray(response.data.items)) {
      return response.data.items;
    }
    if (Array.isArray(response.items)) return response.items;
    if (Array.isArray(response.result)) return response.result;
    if (isRecord(response.result) && Array.isArray(response.result.items)) {
      return response.result.items;
    }
    if (Array.isArray(response.payload)) return response.payload;
    if (isRecord(response.payload) && Array.isArray(response.payload.items)) {
      return response.payload.items;
    }
  }

  throw new Error(`Invalid ${label} list response shape from API.`);
}

export function unwrapItemResponse(response: unknown, label: string): unknown {
  const unwrapped = unwrapEnvelope(response);

  if (Array.isArray(unwrapped)) {
    const [first] = unwrapped;
    if (first) return first;
  }

  if (isRecord(unwrapped) && Array.isArray(unwrapped.items)) {
    const [first] = unwrapped.items;
    if (first) return first;
  }

  if (isRecord(unwrapped)) return unwrapped;

  throw new Error(`Invalid ${label} item response shape from API.`);
}

export function buildQueryString(
  params: object = {},
): string {
  const query = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (
      typeof value !== "undefined" &&
      value !== null &&
      value !== "" &&
      value !== "all"
    ) {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function toIsoFromDateAndTime(date: string, time: string): string {
  if (!date) return new Date().toISOString();
  const normalizedTime = time || "00:00";
  return new Date(`${date}T${normalizedTime}:00`).toISOString();
}

export function splitIsoDateTime(value: unknown): { date: string; time: string } {
  if (typeof value !== "string" || !value) {
    return { date: "", time: "" };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const [date = "", time = ""] = value.split("T");
    return { date, time: time.slice(0, 5) };
  }

  return {
    date: parsed.toISOString().slice(0, 10),
    time: parsed.toISOString().slice(11, 16),
  };
}

const normalizeStatus = (
  value: unknown,
  fallback: ApplicationStatus = "documents_pending",
): ApplicationStatus => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "submitted") return "submitted";
  if (normalized === "documents_pending" || normalized === "documents-pending") {
    return "documents_pending";
  }
  if (normalized === "under_review" || normalized === "under-review") {
    return "under_review";
  }
  if (normalized === "accepted") return "accepted";
  if (normalized === "waitlisted") return "waitlisted";
  if (normalized === "rejected") return "rejected";
  return fallback;
};

const normalizeSource = (value: unknown): ApplicationSource => {
  const normalized = String(value || "").trim().toLowerCase().replace(/-/g, "_");
  if (normalized === "in_app") return "in_app";
  if (normalized === "referral") return "referral";
  if (normalized === "walk_in") return "walk_in";
  return "other";
};

function normalizeDocumentStatus(status?: string | null): DocumentStatus {
  const value = String(status || "").trim().toLowerCase();

  if (
    value === "pending_review" ||
    value === "pending-review" ||
    value === "pending review"
  ) {
    return "pending_review";
  }

  if (value === "complete" || value === "accepted" || value === "approved") {
    return "complete";
  }

  if (
    value === "missing" ||
    value === "rejected" ||
    value === "replacement_requested" ||
    value === "needs_replacement"
  ) {
    return "missing";
  }

  return "missing";
}

export function unwrapPaginatedResponse(
  response: unknown,
  label: string,
): PaginatedAdmissionsResult<unknown> {
  const unwrapped = unwrapEnvelope(response);
  if (!isRecord(unwrapped) || !Array.isArray(unwrapped.items)) {
    throw new Error(`Invalid ${label} paginated response shape from API.`);
  }

  const pagination = unwrapped.pagination;
  if (!isRecord(pagination)) {
    throw new Error(`Invalid ${label} pagination metadata from API.`);
  }

  const page = pagination.page;
  const limit = pagination.limit;
  const total = pagination.total;
  if (
    !Number.isInteger(page) ||
    Number(page) < 1 ||
    !Number.isInteger(limit) ||
    Number(limit) < 1 ||
    !Number.isInteger(total) ||
    Number(total) < 0
  ) {
    throw new Error(`Invalid ${label} pagination metadata from API.`);
  }

  return {
    items: unwrapped.items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
    },
  };
}

export async function fetchAllAdmissionsPages<T extends { id: string }>(
  fetchPage: (
    page: number,
    limit: number,
  ) => Promise<PaginatedAdmissionsResult<T>>,
  limit = 100,
): Promise<T[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Admissions page limit must be between 1 and 100.");
  }

  const firstPage = await fetchPage(1, limit);
  const { pagination } = firstPage;
  if (pagination.page !== 1) {
    throw new Error("Admissions paginated response did not return page 1.");
  }

  const items = [...firstPage.items];
  const seenIds = new Set(items.map((item) => item.id));
  let latestTotal = pagination.total;
  let nextPage = 2;

  while ((nextPage - 1) * pagination.limit < latestTotal) {
    const pageResult = await fetchPage(nextPage, limit);
    if (
      pageResult.pagination.page !== nextPage ||
      pageResult.pagination.limit !== pagination.limit
    ) {
      throw new Error("Admissions pagination metadata is invalid.");
    }

    for (const item of pageResult.items) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        items.push(item);
      }
    }

    latestTotal = pageResult.pagination.total;
    if (pageResult.items.length === 0) break;
    nextPage += 1;
  }

  return items;
}

export function normalizeDocument(input: unknown): Document {
  if (!isRecord(input)) throw new Error("Invalid admissions document response.");

  const id = readString(input, ["id", "documentId", "document_id"]);
  if (!id) throw new Error("Admissions document response is missing an id.");

  const type = readString(input, ["documentType", "document_type", "type"], "document");

  return {
    id,
    type,
    name: readString(input, ["fileName", "file_name", "name"], type),
    status: normalizeDocumentStatus(readString(input, ["status"], "missing")),
    uploadedDate: readString(input, ["uploadedAt", "uploaded_at", "createdAt", "created_at"]) || undefined,
    url: readString(input, ["url", "fileUrl", "file_url"]) || undefined,
    labelEn: readString(input, ["labelEn", "label_en", "documentType", "document_type"]) || undefined,
    labelAr: readString(input, ["labelAr", "label_ar"]) || undefined,
  };
}

export function normalizeTest(input: unknown): Test {
  if (!isRecord(input)) throw new Error("Invalid placement test response.");

  const id = readString(input, ["id", "placementTestId", "placement_test_id"]);
  if (!id) throw new Error("Placement test response is missing an id.");

  const scheduledAt = readString(input, ["scheduledAt", "scheduled_at"]);
  const scheduled = splitIsoDateTime(scheduledAt);
  const status = readString(input, ["status"], "scheduled").toLowerCase() as TestStatus;
  const subjectName = readString(input, ["subjectName", "subject_name"]);
  const type = readString(input, ["type"], "Placement Test");
  const result = readString(input, ["result", "notes"]);

  return {
    id,
    applicationId: readString(input, ["applicationId", "application_id"]),
    studentName: readString(input, ["studentName", "student_name"]) || undefined,
    subjectId: readString(input, ["subjectId", "subject_id"]) || null,
    subjectName: subjectName || null,
    scheduledAt: scheduledAt || undefined,
    createdAt: readString(input, ["createdAt", "created_at"]) || undefined,
    updatedAt: readString(input, ["updatedAt", "updated_at"]) || undefined,
    type,
    subject: subjectName || type,
    date: scheduled.date,
    time: scheduled.time,
    duration: readString(input, ["duration"], "60"),
    location: readString(input, ["location"], "Admissions office"),
    proctor: readString(input, ["proctor", "proctorName", "proctor_name"]) || undefined,
    status,
    score: typeof input.score === "number" ? input.score : null,
    maxScore: typeof input.maxScore === "number" ? input.maxScore : 100,
    result: result || null,
    notes: result || undefined,
  };
}

export function normalizeInterview(input: unknown): Interview {
  if (!isRecord(input)) throw new Error("Invalid interview response.");

  const id = readString(input, ["id", "interviewId", "interview_id"]);
  if (!id) throw new Error("Interview response is missing an id.");

  const scheduledAt = readString(input, ["scheduledAt", "scheduled_at"]);
  const scheduled = splitIsoDateTime(scheduledAt);
  const status = readString(input, ["status"], "scheduled").toLowerCase() as InterviewStatus;
  const interviewerName = readString(input, ["interviewerName", "interviewer_name", "interviewer"]);

  return {
    id,
    applicationId: readString(input, ["applicationId", "application_id"]),
    studentName: readString(input, ["studentName", "student_name"]) || undefined,
    scheduledAt: scheduledAt || undefined,
    interviewerUserId: readString(input, ["interviewerUserId", "interviewer_user_id"]) || undefined,
    interviewerName: interviewerName || undefined,
    createdAt: readString(input, ["createdAt", "created_at"]) || undefined,
    updatedAt: readString(input, ["updatedAt", "updated_at"]) || undefined,
    date: scheduled.date,
    time: scheduled.time,
    duration: readString(input, ["duration"], "30"),
    interviewer:
      interviewerName ||
      readString(input, ["interviewerUserId", "interviewer_user_id"], "Admissions team"),
    location: readString(input, ["location"], "Admissions office"),
    status,
    notes: readString(input, ["notes"]) || undefined,
    rating: typeof input.rating === "number" ? input.rating : undefined,
  };
}

export function normalizeDecision(input: unknown): Decision {
  if (!isRecord(input)) throw new Error("Invalid admissions decision response.");

  const id = readString(input, ["id", "decisionId", "decision_id"]);
  if (!id) throw new Error("Admissions decision response is missing an id.");

  return {
    id,
    applicationId: readString(input, ["applicationId", "application_id"]),
    studentName: readString(input, ["studentName", "student_name"]),
    decision: readString(input, ["decision"], "accept") as DecisionType,
    reason: readString(input, ["reason"]),
    decisionDate: readString(
      input,
      ["decisionDate", "decision_date", "decidedAt", "decided_at", "createdAt", "created_at"],
      new Date().toISOString(),
    ),
    decidedBy: readString(
      input,
      [
        "decidedByName",
        "decided_by_name",
        "decidedBy",
        "decided_by",
        "decidedByUserId",
        "decided_by_user_id",
        "createdByName",
        "created_by_name",
      ],
      "Admissions",
    ),
    applicationStatus:
      readString(input, ["applicationStatus", "application_status"]) || undefined,
  };
}

export function normalizeApplication(input: unknown): Application {
  if (!isRecord(input)) throw new Error("Invalid application response.");

  const id = readString(input, ["id", "applicationId", "application_id"]);
  if (!id) throw new Error("Application response is missing an id.");

  const studentName = readString(input, ["studentName", "student_name", "name"]);
  const fullNameEn = readString(input, ["full_name_en", "fullNameEn", "studentName", "student_name"], studentName);
  const fullNameAr = readString(input, ["full_name_ar", "fullNameAr"], fullNameEn);
  const submittedDate = readString(input, ["submittedDate", "submitted_date", "submittedAt", "submitted_at", "createdAt", "created_at"], new Date().toISOString());
  const gradeRequested = readString(input, ["gradeRequested", "grade_requested", "requestedGradeName", "requested_grade_name", "requestedGradeId", "requested_grade_id"]);
  const guardians = readArray(input, ["guardians"]);
  const primaryGuardian = guardians.find(isRecord) as ApiRecord | undefined;
  const decisionValue = read(input, ["decision"]);

  return {
    ...input,
    id,
    leadId: readString(input, ["leadId", "lead_id"]) || undefined,
    source: normalizeSource(read(input, ["source", "channel"])),
    status: normalizeStatus(read(input, ["status"])),
    submittedDate,
    full_name_ar: fullNameAr,
    full_name_en: fullNameEn,
    studentName: studentName || fullNameEn || fullNameAr,
    studentNameArabic: fullNameAr,
    gender: readString(input, ["gender"], "N/A"),
    date_of_birth: readString(input, ["date_of_birth", "dateOfBirth"]),
    dateOfBirth: readString(input, ["date_of_birth", "dateOfBirth"]),
    nationality: readString(input, ["nationality"], "N/A"),
    grade_requested: gradeRequested,
    gradeRequested: gradeRequested,
    guardians: guardians.filter(isRecord).map((guardian, index) => ({
      id: readString(guardian, ["id"], `${id}-guardian-${index + 1}`),
      full_name: readString(guardian, ["full_name", "fullName", "name"]),
      relation: readString(guardian, ["relation"], "guardian"),
      phone_primary: readString(guardian, ["phone_primary", "phone", "mobile"]),
      phone_secondary: readString(guardian, ["phone_secondary"]),
      email: readString(guardian, ["email"]),
      national_id: readString(guardian, ["national_id", "nationalId"]),
      job_title: readString(guardian, ["job_title", "jobTitle"]),
      workplace: readString(guardian, ["workplace"]),
      is_primary: Boolean(guardian.is_primary ?? guardian.isPrimary ?? index === 0),
      can_pickup: Boolean(guardian.can_pickup ?? guardian.canPickup ?? true),
      can_receive_notifications: Boolean(guardian.can_receive_notifications ?? guardian.canReceiveNotifications ?? true),
    })),
    guardianName: primaryGuardian ? readString(primaryGuardian, ["full_name", "fullName", "name"]) : readString(input, ["guardianName", "guardian_name"]),
    guardianPhone: primaryGuardian ? readString(primaryGuardian, ["phone_primary", "phone", "mobile"]) : readString(input, ["guardianPhone", "guardian_phone"]),
    guardianEmail: primaryGuardian ? readString(primaryGuardian, ["email"]) : readString(input, ["guardianEmail", "guardian_email"]),
    documents: readArray(input, ["documents"]).map(normalizeDocument),
    tests: readArray(input, ["tests", "placementTests", "placement_tests"]).map(normalizeTest),
    interviews: readArray(input, ["interviews"]).map(normalizeInterview),
    decision: isRecord(decisionValue) ? normalizeDecision(decisionValue) : undefined,
    notes: readString(input, ["notes"]) || undefined,
  };
}
