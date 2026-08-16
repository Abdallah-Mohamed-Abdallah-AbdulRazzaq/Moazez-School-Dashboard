// FILE: src/lib/api-error.ts
import axios, { type AxiosError } from "axios";

interface ApiErrorResponse {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
  details?: unknown;
  traceId?: string;
  error?: string | ApiErrorResponse;
}

export class ApiError extends Error {
  status: number;
  code: string;
  errors?: Record<string, string[]>;
  details?: unknown;
  traceId?: string;

  constructor(
    message: string,
    status: number,
    code: string = "UNKNOWN_ERROR",
    errors?: Record<string, string[]>,
    details?: unknown,
    traceId?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.details = details;
    this.traceId = traceId;
  }

  static fromAxiosError(error: AxiosError<ApiErrorResponse>): ApiError {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const responseData = error.response.data;
      const nestedError =
        responseData.error && typeof responseData.error === "object"
          ? responseData.error
          : undefined;
      const payload = nestedError ?? responseData;
      const responseError =
        typeof payload.error === "string" ? payload.error : undefined;

      const message =
        payload.message ||
        responseError ||
        responseData.message ||
        error.message ||
        "An error occurred";
      const code = payload.code || responseData.code || "API_ERROR";
      const errors = payload.errors || responseData.errors;
      const details = payload.details ?? responseData.details;
      const traceId = payload.traceId || responseData.traceId;

      return new ApiError(message, status, code, errors, details, traceId);
    } else if (error.request) {
      // The request was made but no response was received
      return ApiError.network();
    } else {
      // Something happened in setting up the request that triggered an Error
      return new ApiError(error.message, 0, "REQUEST_SETUP_ERROR");
    }
  }

  static network(): ApiError {
    const isEnglish =
      typeof window !== "undefined" &&
      (window.location.pathname === "/en" || window.location.pathname.startsWith("/en/"));
    const message = isEnglish
      ? "Network error. Please check your connection."
      : "خطأ في الشبكة. يرجى التحقق من الاتصال.";
    return new ApiError(
      message,
      0,
      "NETWORK_ERROR",
    );
  }

  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(message, 401, "UNAUTHORIZED");
  }

  isNetworkError(): boolean {
    return this.status === 0;
  }

  isValidationError(): boolean {
    return this.status === 422 || this.status === 400;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isAxiosError(error: unknown): error is AxiosError<ApiErrorResponse> {
    return axios.isAxiosError(error);
}
