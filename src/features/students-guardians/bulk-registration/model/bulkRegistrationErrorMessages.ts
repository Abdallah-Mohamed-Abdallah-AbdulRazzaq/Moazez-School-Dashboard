import type { BulkRegistrationRowError } from "../api/bulkRegistrationDtos";

export type BulkRegistrationErrorLocale = "ar" | "en";

const copy = {
  en: {
    batch: {
      "students.bulk_registration.csv_malformed":
        "The CSV file could not be read.",
      "students.bulk_registration.header_invalid":
        "The CSV headers do not match the required template.",
      "students.bulk_registration.no_data_rows":
        "The CSV file contains no student rows.",
      "settings.login_identity.not_configured":
        "Student login settings are not configured.",
    },
    batchUnknown: "A file validation error requires attention.",
    fields: {
      firstNameEn: "First name (English)",
      fatherNameEn: "Father name (English)",
      grandfatherNameEn: "Grandfather name (English)",
      familyNameEn: "Family name (English)",
      firstNameAr: "First name (Arabic)",
      fatherNameAr: "Father name (Arabic)",
      grandfatherNameAr: "Grandfather name (Arabic)",
      familyNameAr: "Family name (Arabic)",
      gender: "Gender",
      nationality: "Nationality",
      contactEmail: "Contact email",
      studentPhone: "Student phone",
      dateOfBirth: "Date of birth",
      name: "Student name",
      unknown: "This field",
    },
    invalidField: {
      max_length: "{field} exceeds the maximum length.",
      invalid_email: "{field} must be a valid email address.",
      invalid_phone: "{field} must be a valid phone number.",
      invalid_date: "{field} must use a real YYYY-MM-DD date.",
      invalid_student_name: "Student name is incomplete or invalid.",
      unknown: "{field} is invalid.",
    },
    username: {
      username_required: "Username is required.",
      username_too_short: "Username is shorter than the school policy allows.",
      username_too_long: "Username is longer than the school policy allows.",
      username_contains_at: "Username cannot contain @.",
      username_contains_spaces: "Username cannot contain spaces.",
      username_has_unsafe_characters: "Username contains unsupported characters.",
      username_has_consecutive_dots: "Username cannot contain consecutive periods.",
      username_has_forbidden_edge_character:
        "Username cannot begin or end with a period, underscore, or hyphen.",
      reserved_username: "Username is reserved.",
      unknown: "Username does not meet the school policy.",
    },
    row: {
      "iam.user.login_email_taken": "This username is already in use.",
      "students.bulk_registration.duplicate_username":
        "This username appears more than once in the CSV.",
      "students.bulk_registration.duplicate_row": "This CSV row is duplicated.",
    },
    rowUnknown: "A row validation error requires attention.",
  },
  ar: {
    batch: {
      "students.bulk_registration.csv_malformed": "تعذرت قراءة ملف CSV.",
      "students.bulk_registration.header_invalid":
        "عناوين CSV لا تطابق القالب المطلوب.",
      "students.bulk_registration.no_data_rows": "لا يحتوي ملف CSV على صفوف طلاب.",
      "settings.login_identity.not_configured":
        "إعدادات تسجيل دخول الطلاب غير مهيأة.",
    },
    batchUnknown: "يوجد خطأ في التحقق من الملف يحتاج إلى المراجعة.",
    fields: {
      firstNameEn: "الاسم الأول بالإنجليزية",
      fatherNameEn: "اسم الأب بالإنجليزية",
      grandfatherNameEn: "اسم الجد بالإنجليزية",
      familyNameEn: "اسم العائلة بالإنجليزية",
      firstNameAr: "الاسم الأول بالعربية",
      fatherNameAr: "اسم الأب بالعربية",
      grandfatherNameAr: "اسم الجد بالعربية",
      familyNameAr: "اسم العائلة بالعربية",
      gender: "النوع",
      nationality: "الجنسية",
      contactEmail: "بريد التواصل الإلكتروني",
      studentPhone: "هاتف الطالب",
      dateOfBirth: "تاريخ الميلاد",
      name: "اسم الطالب",
      unknown: "هذا الحقل",
    },
    invalidField: {
      max_length: "تم تجاوز الحد الأقصى للطول في {field}.",
      invalid_email: "يجب أن يكون {field} عنوان بريد صالحًا.",
      invalid_phone: "يجب أن يكون {field} رقم هاتف صالحًا.",
      invalid_date: "يجب أن يكون {field} تاريخًا صالحًا بصيغة YYYY-MM-DD.",
      invalid_student_name: "اسم الطالب غير مكتمل أو غير صالح.",
      unknown: "{field} غير صالح.",
    },
    username: {
      username_required: "اسم المستخدم مطلوب.",
      username_too_short: "اسم المستخدم أقصر من الحد المسموح به في سياسة المدرسة.",
      username_too_long: "اسم المستخدم أطول من الحد المسموح به في سياسة المدرسة.",
      username_contains_at: "لا يمكن أن يحتوي اسم المستخدم على @.",
      username_contains_spaces: "لا يمكن أن يحتوي اسم المستخدم على مسافات.",
      username_has_unsafe_characters: "يحتوي اسم المستخدم على أحرف غير مدعومة.",
      username_has_consecutive_dots:
        "لا يمكن أن يحتوي اسم المستخدم على نقاط متتالية.",
      username_has_forbidden_edge_character:
        "لا يمكن أن يبدأ اسم المستخدم أو ينتهي بنقطة أو شرطة سفلية أو واصلة.",
      reserved_username: "اسم المستخدم محجوز.",
      unknown: "اسم المستخدم لا يطابق سياسة المدرسة.",
    },
    row: {
      "iam.user.login_email_taken": "اسم المستخدم هذا مستخدم بالفعل.",
      "students.bulk_registration.duplicate_username":
        "اسم المستخدم هذا مكرر في ملف CSV.",
      "students.bulk_registration.duplicate_row": "صف CSV هذا مكرر.",
    },
    rowUnknown: "يوجد خطأ في التحقق من أحد الصفوف يحتاج إلى المراجعة.",
  },
} as const;

function messageFor(
  messages: Record<string, string>,
  key: string | undefined,
  fallback: string,
): string {
  return key ? messages[key] ?? fallback : fallback;
}

function localizedField(field: string | null, locale: BulkRegistrationErrorLocale) {
  const text = copy[locale];
  return messageFor(text.fields, field ?? undefined, text.fields.unknown);
}

function invalidFieldMessage(
  error: BulkRegistrationRowError,
  locale: BulkRegistrationErrorLocale,
): string {
  const text = copy[locale];
  const template = messageFor(
    text.invalidField,
    error.reason,
    text.invalidField.unknown,
  );
  return template.replace("{field}", localizedField(error.field, locale));
}

function invalidUsernameMessage(
  reason: string | undefined,
  locale: BulkRegistrationErrorLocale,
): string {
  const text = copy[locale];
  return messageFor(text.username, reason, text.username.unknown);
}

export function getBulkRegistrationBatchValidationErrorMessage(
  errorCode: string,
  locale: BulkRegistrationErrorLocale,
): string {
  const text = copy[locale];
  return messageFor(text.batch, errorCode, text.batchUnknown);
}

export function getBulkRegistrationRowValidationErrorMessage(
  error: BulkRegistrationRowError,
  locale: BulkRegistrationErrorLocale,
): string {
  if (error.code === "students.bulk_registration.field_invalid") {
    return invalidFieldMessage(error, locale);
  }
  if (error.code === "iam.user.username_invalid") {
    return invalidUsernameMessage(error.reason, locale);
  }
  const text = copy[locale];
  return messageFor(text.row, error.code, text.rowUnknown);
}
