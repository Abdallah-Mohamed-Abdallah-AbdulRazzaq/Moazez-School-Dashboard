/**
 * Centralized file upload validation for educational content
 * Enforces whitelist of safe file types and blocks dangerous executables
 * Per-area restrictions: MATERIALS/ASSIGNMENTS allow documents+images, VIDEO allows video files only
 */

export type UploadArea = "MATERIALS" | "ASSIGNMENTS" | "VIDEO" | "ATTENDANCE_EXCUSE";

export interface UploadRules {
  maxSizeBytes: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  blockedExtensions: string[];
  acceptString: string; // for HTML input accept attribute
  acceptLabelKey: string; // i18n key for display label
}

export interface ValidationResult {
  ok: boolean;
  reason?: "type" | "size" | "blocked";
  details?: string;
}

/**
 * Get upload rules for a specific area
 */
export function getUploadRules(area: UploadArea): UploadRules {
  const commonDocumentExtensions = [
    // PDF
    ".pdf",
    // Word
    ".doc",
    ".docx",
    // PowerPoint
    ".ppt",
    ".pptx",
    // Excel
    ".xls",
    ".xlsx",
    // Text
    ".txt",
  ];

  const commonImageExtensions = [".png", ".jpg", ".jpeg"];

  const commonDocumentMimeTypes = [
    // PDF
    "application/pdf",
    // Word
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    // PowerPoint
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Excel
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // Text
    "text/plain",
  ];

  const commonImageMimeTypes = ["image/png", "image/jpeg", "image/jpg"];

  // Security: Block dangerous file types across all areas
  const blockedExtensions = [
    // Executables
    ".exe",
    ".bat",
    ".cmd",
    ".msi",
    ".jar",
    ".apk",
    ".dmg",
    ".sh",
    ".com",
    ".scr",
    // Scripts
    ".js",
    ".vbs",
    ".ps1",
    // Archives (can contain malware)
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
  ];

  switch (area) {
    case "MATERIALS":
    case "ASSIGNMENTS":
    case "ATTENDANCE_EXCUSE": {
      const extensions = [...commonDocumentExtensions, ...commonImageExtensions];
      const mimeTypes = [...commonDocumentMimeTypes, ...commonImageMimeTypes];
      return {
        maxSizeBytes: 20 * 1024 * 1024, // 20MB
        allowedExtensions: extensions,
        allowedMimeTypes: mimeTypes,
        blockedExtensions,
        acceptString: [...extensions, ...mimeTypes].join(","),
        acceptLabelKey: 
          area === "MATERIALS" ? "allowedTypesMaterials" : 
          area === "ASSIGNMENTS" ? "allowedTypesAssignments" :
          "allowedTypesAttendanceExcuse",
      };
    }

    case "VIDEO": {
      const extensions = [".mp4", ".webm", ".mov", ".m4v"];
      const mimeTypes = ["video/mp4", "video/webm", "video/quicktime"];
      return {
        maxSizeBytes: 200 * 1024 * 1024, // 200MB for videos
        allowedExtensions: extensions,
        allowedMimeTypes: mimeTypes,
        blockedExtensions,
        acceptString: [...extensions, ...mimeTypes].join(","),
        acceptLabelKey: "allowedTypesVideo",
      };
    }

    default:
      return {
        maxSizeBytes: 20 * 1024 * 1024,
        allowedExtensions: [],
        allowedMimeTypes: [],
        blockedExtensions,
        acceptString: "",
        acceptLabelKey: "allowedTypesMaterials",
      };
  }
}

/**
 * Validate a file for a specific upload area
 */
export function validateFileForArea(file: File, area: UploadArea): ValidationResult {
  if (!file) {
    return { ok: false, reason: "type", details: "No file provided" };
  }

  const rules = getUploadRules(area);
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.substring(fileName.lastIndexOf("."));
  const fileMimeType = file.type.toLowerCase();

  // 1. Check if file is explicitly blocked (security)
  if (rules.blockedExtensions.some((ext) => fileExtension === ext)) {
    return {
      ok: false,
      reason: "blocked",
      details: `File type ${fileExtension} is blocked for security reasons`,
    };
  }

  // 2. Check file size
  if (file.size > rules.maxSizeBytes) {
    return {
      ok: false,
      reason: "size",
      details: `File size ${file.size} exceeds maximum ${rules.maxSizeBytes}`,
    };
  }

  // 3. Check if file type is allowed (whitelist)
  const extensionAllowed = rules.allowedExtensions.some((ext) => fileExtension === ext);
  const mimeTypeAllowed = rules.allowedMimeTypes.some((mime) => {
    if (mime.endsWith("/*")) {
      const category = mime.split("/")[0];
      return fileMimeType.startsWith(category + "/");
    }
    return fileMimeType === mime;
  });

  if (!extensionAllowed && !mimeTypeAllowed) {
    return {
      ok: false,
      reason: "type",
      details: `File type ${fileExtension} (${fileMimeType}) is not allowed`,
    };
  }

  return { ok: true };
}

/**
 * Build HTML accept attribute string for file input
 * @deprecated Use getUploadRules(area).acceptString instead
 */
export function buildAcceptString(area: UploadArea): string {
  const rules = getUploadRules(area);
  return rules.acceptString;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get human-readable allowed types list (localized key)
 * Returns the key WITHOUT the namespace prefix
 */
export function getAllowedTypesKey(area: UploadArea): string {
  const rules = getUploadRules(area);
  return rules.acceptLabelKey;
}
