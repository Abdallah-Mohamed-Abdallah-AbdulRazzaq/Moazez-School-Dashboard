import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  announcementErrorMessage,
  type AnnouncementErrorLocale,
} from "@/features/communication/utils/announcement-error-messages";

describe("announcementErrorMessage", () => {
  it.each([
    ["auth.token.invalid", 401, "Your session has expired. Please sign in again."],
    ["auth.scope.missing", 403, "You do not have permission to perform this action."],
    ["validation.failed", 400, "Check the announcement fields and try again."],
    ["communication.scope.invalid", 422, "Check the announcement fields and try again."],
    ["communication.scope.invalid", 409, "This announcement changed and can no longer be used for that action."],
    ["not_found", 404, "The announcement is no longer available."],
    ["files.not_found", 404, "The selected file is no longer available."],
    ["files.upload.size_exceeded", 413, "The file exceeds the allowed size."],
    ["files.upload.mime_not_allowed", 415, "This file type is not allowed."],
    ["rate_limit.exceeded", 429, "Too many requests. Please try again shortly."],
    ["internal_error", 500, "The service is temporarily unavailable. Please try again."],
    ["NETWORK_ERROR", 0, "Network error. Check your connection and try again."],
  ])("maps %s (%i) to a recoverable message", (code, status, expected) => {
    expect(
      announcementErrorMessage(new ApiError("backend error", status, code), "en"),
    ).toBe(expected);
  });

  it("uses localized copy instead of the backend message", () => {
    expect(
      announcementErrorMessage(
        new ApiError("رسالة من الخادم", 413, "files.upload.size_exceeded"),
        "ar" as AnnouncementErrorLocale,
      ),
    ).toBe("حجم الملف يتجاوز الحد المسموح.");
  });

  it.each([
    ["en", "Choose an expiration time in the future."],
    ["ar", "اختر وقت انتهاء في المستقبل."],
  ] as const)(
    "maps an expiresAt validation error in %s",
    (locale, expected) => {
      expect(
        announcementErrorMessage(
          new ApiError(
            "expiresAt must be in the future",
            422,
            "communication.scope.invalid",
            undefined,
            {
              field: "expiresAt",
              expiresAt: "2026-09-04T21:32:00.000Z",
            },
          ),
          locale,
        ),
      ).toBe(expected);
    },
  );

  it("falls back safely when the error is not an API error", () => {
    expect(announcementErrorMessage(new Error("unexpected"), "en")).toBe(
      "We could not complete this action. Please try again.",
    );
  });
});
