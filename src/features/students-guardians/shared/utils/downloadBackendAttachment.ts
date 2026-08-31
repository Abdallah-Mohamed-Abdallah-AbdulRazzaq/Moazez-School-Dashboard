import { apiClient } from "@/lib/api";
import type { AxiosResponse } from "axios";

function getContentDisposition(
  headers: AxiosResponse<Blob>["headers"],
): string | undefined {
  const record = headers as Record<string, unknown>;
  const axiosHeader = record.get;
  const headerValue =
    typeof axiosHeader === "function"
      ? axiosHeader.call(headers, "content-disposition")
      : record["content-disposition"] ?? record["Content-Disposition"];

  return typeof headerValue === "string" ? headerValue : undefined;
}

function sanitizeFilename(filename: string, fallbackFilename: string): string {
  return filename.replace(/[\\/\r\n]/g, "_").trim() || fallbackFilename;
}

function getDownloadFilename(
  contentDisposition: string | undefined,
  fallbackFilename: string,
): string {
  if (!contentDisposition) return fallbackFilename;

  const encodedMatch = contentDisposition.match(
    /(?:^|;)\s*filename\*\s*=\s*([^;]+)/i,
  );
  if (encodedMatch) {
    const encodedFilename = encodedMatch[1].trim().replace(/^"|"$/g, "");
    const encodedValue = encodedFilename.match(/^[^']*'[^']*'(.*)$/)?.[1];
    if (encodedValue) {
      try {
        return sanitizeFilename(decodeURIComponent(encodedValue), fallbackFilename);
      } catch {
        return fallbackFilename;
      }
    }
  }

  const quotedMatch = contentDisposition.match(
    /(?:^|;)\s*filename\s*=\s*"((?:[^"\\]|\\.)*)"/i,
  );
  if (quotedMatch) {
    return sanitizeFilename(quotedMatch[1].replace(/\\(.)/g, "$1"), fallbackFilename);
  }

  const unquotedMatch = contentDisposition.match(/(?:^|;)\s*filename\s*=\s*([^;]+)/i);
  return unquotedMatch
    ? sanitizeFilename(unquotedMatch[1].trim(), fallbackFilename)
    : fallbackFilename;
}

export async function downloadBackendAttachment(
  path: string,
  fallbackFilename: string,
): Promise<void> {
  const response = await apiClient.get<Blob>(path, { responseType: "blob" });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");

  try {
    link.href = objectUrl;
    link.download = getDownloadFilename(
      getContentDisposition(response.headers),
      fallbackFilename,
    );
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }
}
