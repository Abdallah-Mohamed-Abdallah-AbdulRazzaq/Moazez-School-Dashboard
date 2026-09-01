import { describe, expect, it } from "vitest";
import type { BulkRegistrationRowError } from "../../api/bulkRegistrationDtos";
import {
  getBulkRegistrationBatchValidationErrorMessage,
  getBulkRegistrationRowValidationErrorMessage,
} from "../bulkRegistrationErrorMessages";

describe("bulkRegistrationErrorMessages", () => {
  it.each([
    [
      "students.bulk_registration.csv_malformed",
      "The CSV file could not be read.",
      "تعذرت قراءة ملف CSV.",
    ],
    [
      "students.bulk_registration.header_invalid",
      "The CSV headers do not match the required template.",
      "عناوين CSV لا تطابق القالب المطلوب.",
    ],
    [
      "students.bulk_registration.no_data_rows",
      "The CSV file contains no student rows.",
      "لا يحتوي ملف CSV على صفوف طلاب.",
    ],
    [
      "settings.login_identity.not_configured",
      "Student login settings are not configured.",
      "إعدادات تسجيل دخول الطلاب غير مهيأة.",
    ],
  ] as const)(
    "localizes the batch validation code %s",
    (errorCode, englishMessage, arabicMessage) => {
      expect(
        getBulkRegistrationBatchValidationErrorMessage(errorCode, "en"),
      ).toBe(englishMessage);
      expect(
        getBulkRegistrationBatchValidationErrorMessage(errorCode, "ar"),
      ).toBe(arabicMessage);
    },
  );

  it.each([
    [
      {
        code: "students.bulk_registration.field_invalid",
        field: "firstNameEn",
        reason: "max_length",
      },
      "First name (English) exceeds the maximum length.",
      "تم تجاوز الحد الأقصى للطول في الاسم الأول بالإنجليزية.",
    ],
    [
      {
        code: "students.bulk_registration.field_invalid",
        field: "fatherNameEn",
        reason: "max_length",
      },
      "Father name (English) exceeds the maximum length.",
      "تم تجاوز الحد الأقصى للطول في اسم الأب بالإنجليزية.",
    ],
    [
      {
        code: "students.bulk_registration.field_invalid",
        field: "grandfatherNameEn",
        reason: "max_length",
      },
      "Grandfather name (English) exceeds the maximum length.",
      "تم تجاوز الحد الأقصى للطول في اسم الجد بالإنجليزية.",
    ],
    [
      {
        code: "students.bulk_registration.field_invalid",
        field: "familyNameEn",
        reason: "max_length",
      },
      "Family name (English) exceeds the maximum length.",
      "تم تجاوز الحد الأقصى للطول في اسم العائلة بالإنجليزية.",
    ],
    [
      {
        code: "students.bulk_registration.field_invalid",
        field: "firstNameAr",
        reason: "max_length",
      },
      "First name (Arabic) exceeds the maximum length.",
      "تم تجاوز الحد الأقصى للطول في الاسم الأول بالعربية.",
    ],
    [
      {
        code: "students.bulk_registration.field_invalid",
        field: "fatherNameAr",
        reason: "max_length",
      },
      "Father name (Arabic) exceeds the maximum length.",
      "تم تجاوز الحد الأقصى للطول في اسم الأب بالعربية.",
    ],
    [
      {
        code: "students.bulk_registration.field_invalid",
        field: "grandfatherNameAr",
        reason: "max_length",
      },
      "Grandfather name (Arabic) exceeds the maximum length.",
      "تم تجاوز الحد الأقصى للطول في اسم الجد بالعربية.",
    ],
    [
      {
        code: "students.bulk_registration.field_invalid",
        field: "familyNameAr",
        reason: "max_length",
      },
      "Family name (Arabic) exceeds the maximum length.",
      "تم تجاوز الحد الأقصى للطول في اسم العائلة بالعربية.",
    ],
    [
      {
        code: "students.bulk_registration.field_invalid",
        field: "gender",
        reason: "max_length",
      },
      "Gender exceeds the maximum length.",
      "تم تجاوز الحد الأقصى للطول في النوع.",
    ],
    [
      {
        code: "students.bulk_registration.field_invalid",
        field: "nationality",
        reason: "max_length",
      },
      "Nationality exceeds the maximum length.",
      "تم تجاوز الحد الأقصى للطول في الجنسية.",
    ],
    [
      {
        code: "students.bulk_registration.field_invalid",
        field: "contactEmail",
        reason: "invalid_email",
      },
      "Contact email must be a valid email address.",
      "يجب أن يكون بريد التواصل الإلكتروني عنوان بريد صالحًا.",
    ],
    [
      {
        code: "students.bulk_registration.field_invalid",
        field: "studentPhone",
        reason: "invalid_phone",
      },
      "Student phone must be a valid phone number.",
      "يجب أن يكون هاتف الطالب رقم هاتف صالحًا.",
    ],
    [
      {
        code: "students.bulk_registration.field_invalid",
        field: "dateOfBirth",
        reason: "invalid_date",
      },
      "Date of birth must use a real YYYY-MM-DD date.",
      "يجب أن يكون تاريخ الميلاد تاريخًا صالحًا بصيغة YYYY-MM-DD.",
    ],
    [
      {
        code: "students.bulk_registration.field_invalid",
        field: "name",
        reason: "invalid_student_name",
      },
      "Student name is incomplete or invalid.",
      "اسم الطالب غير مكتمل أو غير صالح.",
    ],
    [
      {
        code: "iam.user.username_invalid",
        field: "username",
        reason: "username_required",
      },
      "Username is required.",
      "اسم المستخدم مطلوب.",
    ],
    [
      {
        code: "iam.user.username_invalid",
        field: "username",
        reason: "username_too_short",
      },
      "Username is shorter than the school policy allows.",
      "اسم المستخدم أقصر من الحد المسموح به في سياسة المدرسة.",
    ],
    [
      {
        code: "iam.user.username_invalid",
        field: "username",
        reason: "username_too_long",
      },
      "Username is longer than the school policy allows.",
      "اسم المستخدم أطول من الحد المسموح به في سياسة المدرسة.",
    ],
    [
      {
        code: "iam.user.username_invalid",
        field: "username",
        reason: "username_contains_at",
      },
      "Username cannot contain @.",
      "لا يمكن أن يحتوي اسم المستخدم على @.",
    ],
    [
      {
        code: "iam.user.username_invalid",
        field: "username",
        reason: "username_contains_spaces",
      },
      "Username cannot contain spaces.",
      "لا يمكن أن يحتوي اسم المستخدم على مسافات.",
    ],
    [
      {
        code: "iam.user.username_invalid",
        field: "username",
        reason: "username_has_unsafe_characters",
      },
      "Username contains unsupported characters.",
      "يحتوي اسم المستخدم على أحرف غير مدعومة.",
    ],
    [
      {
        code: "iam.user.username_invalid",
        field: "username",
        reason: "username_has_consecutive_dots",
      },
      "Username cannot contain consecutive periods.",
      "لا يمكن أن يحتوي اسم المستخدم على نقاط متتالية.",
    ],
    [
      {
        code: "iam.user.username_invalid",
        field: "username",
        reason: "username_has_forbidden_edge_character",
      },
      "Username cannot begin or end with a period, underscore, or hyphen.",
      "لا يمكن أن يبدأ اسم المستخدم أو ينتهي بنقطة أو شرطة سفلية أو واصلة.",
    ],
    [
      {
        code: "iam.user.username_invalid",
        field: "username",
        reason: "reserved_username",
      },
      "Username is reserved.",
      "اسم المستخدم محجوز.",
    ],
    [
      {
        code: "iam.user.login_email_taken",
        field: "username",
      },
      "This username is already in use.",
      "اسم المستخدم هذا مستخدم بالفعل.",
    ],
    [
      {
        code: "students.bulk_registration.duplicate_username",
        field: "username",
      },
      "This username appears more than once in the CSV.",
      "اسم المستخدم هذا مكرر في ملف CSV.",
    ],
    [
      {
        code: "students.bulk_registration.duplicate_row",
        field: null,
      },
      "This CSV row is duplicated.",
      "صف CSV هذا مكرر.",
    ],
  ] as const satisfies ReadonlyArray<
    readonly [BulkRegistrationRowError, string, string]
  >)(
    "localizes the row validation error %s",
    (error, englishMessage, arabicMessage) => {
      expect(getBulkRegistrationRowValidationErrorMessage(error, "en")).toBe(
        englishMessage,
      );
      expect(getBulkRegistrationRowValidationErrorMessage(error, "ar")).toBe(
        arabicMessage,
      );
    },
  );
});
