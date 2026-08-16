import { describe, expect, it } from "vitest";
import type { AxiosError } from "axios";
import { ApiError } from "@/lib/api-error";

describe("ApiError", () => {
  it("preserves backend validation envelope fields without mixing metadata", () => {
    const axiosError = {
      message: "Request failed",
      response: {
        status: 400,
        data: {
          error: {
            code: "validation.failed",
            message: "Validation failed",
            details: { field: "scopeType" },
            traceId: "trace-123",
          },
        },
      },
    } as AxiosError;

    const apiError = ApiError.fromAxiosError(axiosError);

    expect(apiError.code).toBe("validation.failed");
    expect(apiError.message).toBe("Validation failed");
    expect(apiError.details).toEqual({ field: "scopeType" });
    expect(apiError.traceId).toBe("trace-123");
  });

  it("generates network error message based on locale prefix in pathname", () => {
    // 1. Default/Arabic (when window is undefined or not starting with /en)
    const errorAr = ApiError.network();
    expect(errorAr.message).toBe("خطأ في الشبكة. يرجى التحقق من الاتصال.");
    expect(errorAr.code).toBe("NETWORK_ERROR");
    expect(errorAr.status).toBe(0);

    // 2. English locale pathname
    const originalWindow = global.window;
    global.window = {
      location: {
        pathname: "/en/dashboard",
      },
    } as unknown as Window & typeof globalThis;

    try {
      const errorEn = ApiError.network();
      expect(errorEn.message).toBe("Network error. Please check your connection.");
    } finally {
      global.window = originalWindow;
    }
  });
});
