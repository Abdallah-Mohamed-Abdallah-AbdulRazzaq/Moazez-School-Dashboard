import { isApiError } from "@/lib/api-error";

export const announcementErrorMessages = {
  en: {
    sessionExpired: "Your session has expired. Please sign in again.",
    permissionDenied: "You do not have permission to perform this action.",
    validation: "Check the announcement fields and try again.",
    expiresAtMustBeFuture: "Choose an expiration time in the future.",
    stateConflict:
      "This announcement changed and can no longer be used for that action.",
    announcementNotFound: "The announcement is no longer available.",
    fileNotFound: "The selected file is no longer available.",
    fileTooLarge: "The file exceeds the allowed size.",
    fileTypeNotAllowed: "This file type is not allowed.",
    rateLimited: "Too many requests. Please try again shortly.",
    unavailable: "The service is temporarily unavailable. Please try again.",
    network: "Network error. Check your connection and try again.",
    generic: "We could not complete this action. Please try again.",
  },
  ar: {
    sessionExpired: "انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.",
    permissionDenied: "ليس لديك صلاحية تنفيذ هذا الإجراء.",
    validation: "تحقق من بيانات الإعلان ثم حاول مرة أخرى.",
    expiresAtMustBeFuture: "اختر وقت انتهاء في المستقبل.",
    stateConflict: "تغيرت حالة الإعلان ولا يمكن تنفيذ هذا الإجراء الآن.",
    announcementNotFound: "لم يعد الإعلان متاحاً.",
    fileNotFound: "لم يعد الملف المحدد متاحاً.",
    fileTooLarge: "حجم الملف يتجاوز الحد المسموح.",
    fileTypeNotAllowed: "نوع هذا الملف غير مسموح.",
    rateLimited: "تم إرسال طلبات كثيرة. حاول مرة أخرى بعد قليل.",
    unavailable: "الخدمة غير متاحة مؤقتاً. حاول مرة أخرى.",
    network: "خطأ في الشبكة. تحقق من الاتصال ثم حاول مرة أخرى.",
    generic: "تعذر إتمام الإجراء. حاول مرة أخرى.",
  },
} as const;

export type AnnouncementErrorLocale = keyof typeof announcementErrorMessages;

type AnnouncementErrorKey = keyof (typeof announcementErrorMessages)["en"];

const ERROR_KEY_BY_CODE: Record<string, AnnouncementErrorKey> = {
  "auth.token.invalid": "sessionExpired",
  UNAUTHORIZED: "sessionExpired",
  "auth.scope.missing": "permissionDenied",
  FORBIDDEN: "permissionDenied",
  "validation.failed": "validation",
  not_found: "announcementNotFound",
  "files.not_found": "fileNotFound",
  "files.upload.size_exceeded": "fileTooLarge",
  "files.upload.mime_not_allowed": "fileTypeNotAllowed",
  "rate_limit.exceeded": "rateLimited",
  NETWORK_ERROR: "network",
  internal_error: "unavailable",
};

export function announcementErrorMessage(
  requestError: unknown,
  locale: AnnouncementErrorLocale,
): string {
  return announcementErrorMessages[locale][announcementErrorKey(requestError)];
}

function announcementErrorKey(requestError: unknown): AnnouncementErrorKey {
  if (!isApiError(requestError)) return "generic";
  if (requestError.code === "communication.scope.invalid") {
    if (isExpiresAtValidationError(requestError)) {
      return "expiresAtMustBeFuture";
    }

    return requestError.status === 409 ? "stateConflict" : "validation";
  }

  return (
    ERROR_KEY_BY_CODE[requestError.code] ??
    (requestError.status >= 500 ? "unavailable" : "generic")
  );
}

function isExpiresAtValidationError(requestError: {
  details?: unknown;
  status: number;
}): boolean {
  return (
    requestError.status === 422 &&
    typeof requestError.details === "object" &&
    requestError.details !== null &&
    "field" in requestError.details &&
    requestError.details.field === "expiresAt"
  );
}
