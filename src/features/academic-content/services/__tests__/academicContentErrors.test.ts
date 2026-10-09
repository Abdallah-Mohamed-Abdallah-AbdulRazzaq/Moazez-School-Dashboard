import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  AcademicContentUploadRestartRequiredError,
  AcademicContentUploadValidationError,
} from "../academicContentUpload";
import {
  academicContentPublicationErrorTranslationKey,
  academicContentUiError,
} from "../academicContentErrors";

describe("academicContentUiError", () => {
  it("uses Arabic errors on an Arabic page without requiring callers to pass a locale", () => {
    const originalPath = window.location.pathname;
    try {
      window.history.replaceState(null, "", "/ar/academic-content-hub");
      expect(
        academicContentUiError(
          new ApiError("Term closed", 409, "academic_content.term.closed"),
        ).message,
      ).toBe("الفصل الدراسي مغلق. لا يمكن تعديل المحتوى في هذا الفصل.");
    } finally {
      window.history.replaceState(null, "", originalPath);
    }
  });

  it("localizes a domain error while preserving diagnostic context", () => {
    expect(
      academicContentUiError(
        new ApiError(
          "Term is closed",
          409,
          "academic_content.term.closed",
          undefined,
          { termId: "term-1" },
          "trace-1",
        ),
        "ar",
      ),
    ).toEqual({
      code: "academic_content.term.closed",
      message: "الفصل الدراسي مغلق. لا يمكن تعديل المحتوى في هذا الفصل.",
      details: { termId: "term-1" },
      traceId: "trace-1",
    });
  });

  it.each([
    [
      "ar",
      "رفع الملفات غير متاح لأن خدمة تخزين المدرسة لا تدعم طريقة الرفع المطلوبة. تواصل مع مسؤول المدرسة أو الدعم لتجهيز الخدمة.",
    ],
    [
      "en",
      "File uploads are unavailable because the school's storage service does not support the required upload method. Contact your school administrator or support to configure the service.",
    ],
  ])(
    "explains unavailable upload storage instead of a content conflict in %s",
    (locale, message) => {
      const code = "academic_content.file.storage_resumable_upload_unavailable";
      expect(
        academicContentUiError(
          new ApiError(
            "Resumable upload unavailable",
            409,
            code,
            undefined,
            undefined,
            "storage-trace",
          ),
          locale,
        ),
      ).toEqual({ code, message, traceId: "storage-trace" });
    },
  );

  it("replaces unexpected errors with safe copy without inventing metadata", () => {
    expect(
      academicContentUiError(new Error("Unexpected failure"), "en"),
    ).toEqual({
      code: "UNKNOWN_ERROR",
      message:
        "This action could not be completed. Try again; contact support if the problem continues.",
    });
  });

  it.each([
    ["ar", 403, "ليس لديك صلاحية لتنفيذ هذا الإجراء."],
    ["en", 403, "You do not have permission to perform this action."],
    [
      "ar",
      422,
      "بعض البيانات غير صحيحة. راجع الحقول المطلوبة والاختيارات ثم حاول مرة أخرى.",
    ],
    [
      "en",
      500,
      "This action could not be completed. Try again; contact support if the problem continues.",
    ],
  ])(
    "uses safe %s copy for HTTP %s with an unknown code",
    (locale, status, message) => {
      const localized = academicContentUiError(
        new ApiError("Internal server details", status, "future.error", {
          title: ["required"],
        }),
        locale,
      );
      expect(localized.message).toBe(message);
      expect(localized.errors).toEqual({ title: ["required"] });
      expect(localized.code).toBe("future.error");
    },
  );

  it.each([
    [
      "UPLOAD_RESTART_REQUIRED",
      new AcademicContentUploadRestartRequiredError(),
      "انتهت صلاحية جلسة الرفع. ابدأ رفع الملف من جديد.",
    ],
    [
      "UPLOAD_FILE_TOO_LARGE",
      new AcademicContentUploadValidationError(
        "Too large",
        "UPLOAD_FILE_TOO_LARGE",
      ),
      "حجم الملف أكبر من الحد المسموح الموضح في قسم المرفقات. اختر ملفًا أصغر.",
    ],
  ])("localizes a local upload error with code %s", (code, error, message) => {
    expect(academicContentUiError(error, "ar")).toEqual({ code, message });
  });
});

describe("academicContentPublicationErrorTranslationKey", () => {
  it.each([
    [
      "academic_content.publication.idempotency_conflict",
      "idempotency_conflict",
    ],
    ["academic_content.publication.lineage_conflict", "lineage_conflict"],
    ["academic_content.publication.identical_revision", "identical_revision"],
    ["academic_content.publication.not_ready", "not_ready"],
    ["academic_content.publication.active_conflict", "active_conflict"],
    ["academic_content.publication.cannot_unschedule", "cannot_unschedule"],
    ["academic_content.publication.lifecycle_conflict", "lifecycle_conflict"],
    ["validation.failed", "validation_failed"],
  ])("maps %s to %s", (code, expectedKey) => {
    expect(academicContentPublicationErrorTranslationKey(code)).toBe(
      expectedKey,
    );
  });

  it("uses safe localized fallback copy for an unknown backend code", () => {
    expect(
      academicContentPublicationErrorTranslationKey(
        "academic_content.publication.new_conflict",
      ),
    ).toBe("unknown");
  });
});
