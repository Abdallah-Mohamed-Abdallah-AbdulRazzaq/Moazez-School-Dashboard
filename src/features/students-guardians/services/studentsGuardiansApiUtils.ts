import type {
  Student,
  StudentDocument,
  StudentGuardian,
  StudentGuardianLink,
  StudentMedicalProfile,
  StudentNote,
  StudentTimelineEvent,
  StudentEnrollment,
} from "@/features/students-guardians/students/types";

type ApiRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ApiRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const readRecord = (value: unknown, label: string): ApiRecord => {
  if (!isRecord(value)) {
    throw new Error(`${label} API response item must be an object.`);
  }
  return value;
};

const pickString = (
  source: ApiRecord,
  keys: string[],
  fallback = "",
): string => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
  }
  return fallback;
};

const pickBoolean = (
  source: ApiRecord,
  keys: string[],
  fallback = false,
): boolean => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") return value;
  }
  return fallback;
};

const pickStringList = (source: ApiRecord, keys: string[]): string[] => {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value.filter(
        (entry): entry is string => typeof entry === "string",
      );
    }
    if (typeof value === "string" && value.trim()) {
      return value
        .split(/\r?\n|,/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const unwrapNested = (response: unknown): unknown => {
  if (!isRecord(response)) return response;

  if (Array.isArray(response.data) || isRecord(response.data))
    return response.data;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.result) || isRecord(response.result)) {
    const result = response.result;
    return isRecord(result) && Array.isArray(result.items)
      ? result.items
      : result;
  }
  if (Array.isArray(response.payload) || isRecord(response.payload)) {
    const payload = response.payload;
    return isRecord(payload) && Array.isArray(payload.items)
      ? payload.items
      : payload;
  }

  return response;
};

export function unwrapArrayResponse<T = unknown>(
  response: unknown,
  label: string,
): T[] {
  const unwrapped = unwrapNested(response);
  if (!Array.isArray(unwrapped)) {
    throw new Error(
      `${label} API response must be an array or an envelope containing an array.`,
    );
  }
  return unwrapped as T[];
}

export function unwrapItemResponse<T = unknown>(
  response: unknown,
  label: string,
): T {
  const unwrapped = unwrapNested(response);
  if (!isRecord(unwrapped)) {
    throw new Error(
      `${label} API response must be an object or an envelope containing an object.`,
    );
  }
  return unwrapped as T;
}

export function buildQueryString(params?: object): string {
  if (!params) return "";

  const searchParams = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === "all"
    ) {
      return;
    }
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

const normalizeStudentStatus = (value: string): Student["status"] => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "suspended") return "Suspended";
  if (normalized === "withdrawn") return "Withdrawn";
  return "Active";
};

export function normalizeStudent(raw: unknown): Student {
  const item = readRecord(raw, "Student");
  const id = pickString(item, ["id", "studentId", "student_id"]);
  const fullNameEn = pickString(item, [
    "full_name_en",
    "fullNameEn",
    "studentName",
    "name",
    "full_name",
  ]);
  const fullNameAr = pickString(item, [
    "full_name_ar",
    "fullNameAr",
    "studentNameArabic",
  ]);
  const dateOfBirth = pickString(item, ["dateOfBirth", "date_of_birth"]);
  const contact = isRecord(item.contact) ? item.contact : {};

  return {
    ...(item as Partial<Student>),
    id,
    student_id: pickString(item, ["student_id", "studentCode"], id),
    name: pickString(item, ["name"], fullNameEn),
    full_name_en: fullNameEn,
    full_name_ar: fullNameAr,
    dateOfBirth,
    date_of_birth: dateOfBirth,
    gender: pickString(item, ["gender"]),
    nationality: pickString(item, ["nationality"]),
    gradeRequested: pickString(item, ["gradeRequested", "grade", "gradeName"]),
    status: normalizeStudentStatus(pickString(item, ["status"], "Active")),
    submittedDate: pickString(item, ["submittedDate", "created_at"], ""),
    created_at: pickString(item, ["created_at", "submittedDate"], ""),
    contact: {
      ...(contact as Student["contact"]),
      address_line: pickString(contact, ["address_line", "addressLine"]),
      city: pickString(contact, ["city"]),
      district: pickString(contact, ["district"]),
      student_phone: pickString(contact, ["student_phone", "studentPhone"]),
      student_email: pickString(contact, ["student_email", "studentEmail"]),
    },
  };
}

export function normalizeGuardian(
  raw: unknown,
): StudentGuardian & { id: string } {
  const item = readRecord(raw, "Guardian");
  const guardianId = pickString(item, ["guardianId", "id", "guardian_id"]);

  return {
    ...(item as Partial<StudentGuardian>),
    id: guardianId,
    guardianId,
    full_name: pickString(item, ["full_name", "fullName", "name"]),
    relation: pickString(item, ["relation"], "guardian"),
    phone_primary: pickString(item, ["phone_primary", "phonePrimary", "phone"]),
    phone_secondary: pickString(item, ["phone_secondary", "phoneSecondary"]),
    email: pickString(item, ["email"]),
    national_id: pickString(item, ["national_id", "nationalId"]),
    job_title: pickString(item, ["job_title", "jobTitle"]),
    workplace: pickString(item, ["workplace"]),
    is_primary: pickBoolean(item, ["is_primary", "isPrimary"]),
    can_pickup: pickBoolean(item, ["can_pickup", "canPickup"]),
    can_receive_notifications: pickBoolean(item, [
      "can_receive_notifications",
      "canReceiveNotifications",
    ]),
  };
}

export function normalizeStudentGuardianLink(
  raw: unknown,
): StudentGuardianLink & { id: string } {
  const item = readRecord(raw, "Student guardian link");
  const studentId = pickString(item, ["studentId", "student_id"]);
  const guardianId = pickString(item, ["guardianId", "guardian_id", "id"]);
  return {
    ...(item as Partial<StudentGuardianLink>),
    id: pickString(item, ["id"], `${studentId}:${guardianId}`),
    studentId,
    guardianId,
    relation: pickString(item, ["relation"], "guardian"),
    is_primary: pickBoolean(item, ["is_primary", "isPrimary"]),
  };
}

export function normalizeEnrollment(
  raw: unknown,
): StudentEnrollment & { id: string } {
  const item = readRecord(raw, "Enrollment");
  const enrollmentId = pickString(item, [
    "enrollmentId",
    "id",
    "enrollment_id",
  ]);

  return {
    ...(item as Partial<StudentEnrollment>),
    id: enrollmentId,
    enrollmentId,
    studentId: pickString(item, ["studentId", "student_id"]),
    academicYearId: pickString(item, ["academicYearId", "academic_year_id"]),
    academicYear: pickString(item, ["academicYear", "academic_year"]),
    gradeId: pickString(item, ["gradeId", "grade_id"]),
    grade: pickString(item, ["grade", "gradeName"]),
    sectionId: pickString(item, ["sectionId", "section_id"]),
    section: pickString(item, ["section", "sectionName"]),
    classroomId: pickString(item, ["classroomId", "classroom_id"]),
    classroom: pickString(item, ["classroom", "classroomName"]),
    enrollmentDate: pickString(item, ["enrollmentDate", "enrollment_date"]),
    status: pickString(
      item,
      ["status"],
      "active",
    ) as StudentEnrollment["status"],
  };
}

export function normalizeStudentDocument(
  raw: unknown,
): StudentDocument & {
  studentDocumentId?: string;
  notes?: string;
  url?: string;
} {
  const item = readRecord(raw, "Student document");
  const id = pickString(item, ["id", "studentDocumentId", "documentId"]);
  return {
    ...(item as Partial<StudentDocument>),
    id,
    studentDocumentId: pickString(item, ["studentDocumentId"], id),
    studentId: pickString(item, ["studentId", "student_id"]),
    type: pickString(item, ["type", "documentType"]),
    name: pickString(item, ["name", "fileName", "file_name"], "Document"),
    status: pickString(
      item,
      ["status"],
      "missing",
    ) as StudentDocument["status"],
    fileId: pickString(item, ["fileId", "file_id"]),
    uploadedDate: pickString(item, [
      "uploadedDate",
      "uploaded_at",
      "created_at",
    ]),
    notes: pickString(item, ["notes"]),
    url: pickString(item, ["url", "fileUrl", "file_url"]),
  };
}

export function normalizeMedicalProfile(raw: unknown): StudentMedicalProfile {
  const item = readRecord(raw, "Medical profile");
  return {
    ...(item as Partial<StudentMedicalProfile>),
    studentId: pickString(item, ["studentId", "student_id"]),
    blood_type: pickString(item, ["blood_type", "bloodType"]),
    allergies: pickString(item, ["allergies"]),
    conditions: pickStringList(item, ["conditions"]),
    medications: pickStringList(item, ["medications"]),
    notes: pickString(item, ["notes"]),
  };
}

export function normalizeStudentNote(raw: unknown): StudentNote {
  const item = readRecord(raw, "Student note");
  return {
    ...(item as Partial<StudentNote>),
    id: pickString(item, ["id", "studentNoteId", "noteId"]),
    studentId: pickString(item, ["studentId", "student_id"]),
    date: pickString(item, ["date", "created_at", "createdAt"]),
    category: pickString(
      item,
      ["category"],
      "general",
    ) as StudentNote["category"],
    note: pickString(item, ["note", "content", "text"]),
    visibility: pickString(
      item,
      ["visibility"],
      "internal",
    ) as StudentNote["visibility"],
    created_by: pickString(item, ["created_by", "createdBy"]),
  };
}

export function normalizeTimelineEvent(raw: unknown): StudentTimelineEvent {
  const item = readRecord(raw, "Timeline event");
  return {
    ...(item as Partial<StudentTimelineEvent>),
    id: pickString(item, ["id", "eventId"]),
    studentId: pickString(item, ["studentId", "student_id"]),
    type: pickString(item, ["type"], "note") as StudentTimelineEvent["type"],
    date: pickString(item, ["date", "created_at", "createdAt"]),
    title: pickString(item, ["title", "label", "name", "description"]),
    label: pickString(item, ["label", "title", "name"]),
    description: pickString(item, ["description"]),
    meta: isRecord(item.meta) ? item.meta : undefined,
  };
}
