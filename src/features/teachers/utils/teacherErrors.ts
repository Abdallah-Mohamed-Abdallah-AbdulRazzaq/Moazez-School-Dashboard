import { ApiError, isApiError } from "@/lib/api-error";

export interface TeacherUiError {
  code: string;
  message: string;
  fieldErrors: Record<string, string>;
  traceId?: string;
  reasonCode?: string;
  shouldRefresh: boolean;
  allocationConflict: boolean;
  identityIntegrityConflict: boolean;
}

const errorFieldByCode: Record<string, string> = {
  "teachers.profile.code_conflict": "teacherCode",
  "iam.user.username_invalid": "username",
  "iam.user.username_taken": "username",
  "iam.user.login_email_taken": "loginEmail",
  "iam.user.email_taken": "loginEmail",
  "iam.user.login_domain_missing": "username",
};

const identityConflictCode = "teachers.account.identity_conflict";
const incompleteProfileCode = "teachers.profile.incomplete";

const localizedErrorKeyByCode: Record<string, string> = {
  "teachers.profile.code_conflict": "teacher_code_conflict",
  "teachers.profile.incomplete": "profile_incomplete",
  "teachers.account.identity_conflict": "identity_conflict",
  "teachers.account.teacher_role_required": "teacher_role_required",
  "teachers.account.role_transition_conflict": "role_transition_conflict",
  "iam.user.username_taken": "username_taken",
  "iam.user.login_email_taken": "login_email_taken",
  "iam.user.email_taken": "login_email_taken",
  "iam.user.login_domain_missing": "login_domain_missing",
  "validation.failed": "invalid_field",
};

type TeacherErrorDetails = {
  field?: string;
  fields?: string[];
  missingFields?: string[];
  reasonCode?: string;
};

function localizedErrorKey(apiError: ApiError) {
  if (
    apiError.code === "validation.failed" &&
    apiError.message.toLowerCase() === "invalid work-time pair"
  ) {
    return "work_time_order_invalid";
  }

  return localizedErrorKeyByCode[apiError.code];
}

function validationFieldErrorKey(field: string, message: string) {
  const normalizedMessage = message.toLowerCase();

  if (field === "phone" && normalizedMessage.includes("valid phone")) {
    return "phone_invalid";
  }

  if (
    ["loginEmail", "contactEmail"].includes(field) &&
    normalizedMessage.includes("valid email")
  ) {
    return "email_invalid";
  }

  if (
    ["workStartTime", "workEndTime"].includes(field) &&
    normalizedMessage.includes("work-time pair")
  ) {
    return "work_time_order_invalid";
  }

  return "invalid_field";
}

function identityConflictFieldErrorKey(field: string) {
  return {
    username: "username_conflict",
    loginEmail: "login_email_conflict",
    contactEmail: "contact_email_conflict",
    phone: "phone_conflict",
  }[field] ?? "identity_conflict";
}

const teacherFormFieldByNormalizedName: Record<string, string> = {
  username: "username",
  loginemail: "loginEmail",
  contactemail: "contactEmail",
  phone: "phone",
  teachercode: "teacherCode",
  firstnamear: "firstNameAr",
  lastnamear: "lastNameAr",
  firstnameen: "firstNameEn",
  lastnameen: "lastNameEn",
  preferreddisplaylanguage: "preferredDisplayLanguage",
  gender: "gender",
  department: "department",
  specialization: "specialization",
  employmenttype: "employmentType",
  experienceyears: "experienceYears",
  hiredate: "hireDate",
  workingdays: "workingDays",
  workstarttime: "workStartTime",
  workendtime: "workEndTime",
  notesar: "notesAr",
  notesen: "notesEn",
  employmentstatus: "employmentStatus",
};

function teacherFormField(field: string) {
  const fieldName = field.trim().split(/[.\s]/, 1)[0];
  const normalizedName = fieldName.replace(/[^a-z]/gi, "").toLowerCase();
  return teacherFormFieldByNormalizedName[normalizedName];
}

function fieldErrors(fields: string[], message: string) {
  const mappedFields = fields
    .map(teacherFormField)
    .filter((field): field is string => Boolean(field));
  const errors = Object.fromEntries(mappedFields.map((field) => [field, message]));

  return mappedFields.length === fields.length
    ? errors
    : { ...errors, form: message };
}

function identityConflictFields(fields: string[] | undefined) {
  const normalizedFields = new Set<string>();

  fields?.forEach((field) => {
    const normalized = teacherFormField(field);
    if (normalized && ["username", "loginEmail", "contactEmail", "phone"].includes(normalized)) {
      normalizedFields.add(normalized);
    }
    if (normalized === "email") {
      normalizedFields.add("loginEmail");
      normalizedFields.add("contactEmail");
    }
  });

  return normalizedFields.size
    ? [...normalizedFields]
    : ["username", "loginEmail", "contactEmail", "phone"];
}

const refreshCodes = new Set([
  "teachers.account.role_transition_conflict",
  "teachers.lifecycle.invalid_transition",
  "teachers.lifecycle.archive_conflict",
]);

function validationFieldErrors(apiError: ApiError) {
  if (apiError.errors) {
    return Object.entries(apiError.errors).reduce<Record<string, string>>(
      (errors, [field, messages]) => ({
        ...errors,
        ...fieldErrors([field], messages[0] ?? apiError.message),
      }),
      {},
    );
  }

  const details = apiError.details as TeacherErrorDetails | undefined;

  if (apiError.code === incompleteProfileCode && details?.missingFields?.length) {
    return fieldErrors(details.missingFields, apiError.message);
  }

  if (apiError.code === identityConflictCode) {
    return fieldErrors(identityConflictFields(details?.fields), apiError.message);
  }

  if (details?.field) {
    return fieldErrors([details.field], apiError.message);
  }

  if (details?.fields?.length) {
    return details.fields.reduce<Record<string, string>>(
      (errors, message) => ({
        ...errors,
        ...fieldErrors([message], message),
      }),
      {},
    );
  }

  const configuredField = errorFieldByCode[apiError.code];
  return configuredField ? { [configuredField]: apiError.message } : {};
}

export function toTeacherUiError(error: unknown): TeacherUiError {
  const apiError = isApiError(error)
    ? error
    : new ApiError("An unexpected error occurred", 0, "client.unknown_error");

  const details = apiError.details as TeacherErrorDetails | undefined;

  return {
    code: apiError.code,
    message: apiError.message,
    fieldErrors: validationFieldErrors(apiError),
    traceId: apiError.traceId,
    reasonCode: details?.reasonCode,
    shouldRefresh: refreshCodes.has(apiError.code),
    allocationConflict:
      apiError.code === "teachers.lifecycle.active_assignments",
    identityIntegrityConflict:
      apiError.code === "teachers.account.role_transition_conflict" &&
      details?.reasonCode === "teacher_identity_inconsistent",
  };
}

export function toTeacherSubmissionFormErrors(error: unknown): Record<string, string> {
  const uiError = toTeacherUiError(error);
  const fieldErrors = { ...uiError.fieldErrors };
  const apiError = isApiError(error) ? error : undefined;
  const errorKey = apiError ? localizedErrorKey(apiError) : localizedErrorKeyByCode[uiError.code];

  if (errorKey) {
    Object.keys(fieldErrors).forEach((field) => {
      fieldErrors[field] = `backend.${
        uiError.code === identityConflictCode
          ? identityConflictFieldErrorKey(field)
          : uiError.code === "validation.failed"
            ? validationFieldErrorKey(field, fieldErrors[field])
            : errorKey
      }`;
    });
  }

  if (uiError.code === "iam.user.username_invalid") {
    fieldErrors.username = "username_invalid";
  }

  if (Object.keys(fieldErrors).length) return fieldErrors;

  return errorKey
    ? { form: `backend.${errorKey}` }
    : { form: uiError.message };
}
