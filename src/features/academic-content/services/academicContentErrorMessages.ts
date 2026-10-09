const ERROR_COPY = {
  unknown: {
    ar: "تعذر إكمال العملية. حاول مرة أخرى، وتواصل مع الدعم إذا استمرت المشكلة.",
    en: "This action could not be completed. Try again; contact support if the problem continues.",
  },
  network: {
    ar: "تعذر الاتصال. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.",
    en: "Could not connect. Check your internet connection and try again.",
  },
  unauthorized: {
    ar: "انتهت جلسة الدخول. سجّل الدخول مرة أخرى للمتابعة.",
    en: "Your sign-in session has ended. Sign in again to continue.",
  },
  forbidden: {
    ar: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
    en: "You do not have permission to perform this action.",
  },
  not_found: {
    ar: "العنصر المطلوب غير متاح. حدّث الصفحة وتحقق من اختيارك.",
    en: "The requested item is unavailable. Refresh the page and check your selection.",
  },
  validation: {
    ar: "بعض البيانات غير صحيحة. راجع الحقول المطلوبة والاختيارات ثم حاول مرة أخرى.",
    en: "Some information is invalid. Check the required fields and selections, then try again.",
  },
  conflict: {
    ar: "تغيرت حالة المحتوى. حدّث الصفحة قبل المحاولة مرة أخرى.",
    en: "The content status has changed. Refresh the page before trying again.",
  },
  term_closed: {
    ar: "الفصل الدراسي مغلق. لا يمكن تعديل المحتوى في هذا الفصل.",
    en: "This academic term is closed. Content in this term cannot be edited.",
  },
  read_only: {
    ar: "هذا المحتوى للقراءة فقط ولا يمكن تعديله في حالته الحالية.",
    en: "This content is read-only and cannot be edited in its current status.",
  },
  not_ready: {
    ar: "أكمل البيانات المطلوبة الظاهرة في بطاقة الجاهزية، ثم حاول مرة أخرى.",
    en: "Complete the required information shown in the readiness card, then try again.",
  },
  identical_revision: {
    ar: "هذه النسخة مطابقة للنسخة المنشورة. عدّل بيانات المحتوى واحفظ جميع التغييرات قبل إعادة النشر.",
    en: "This version matches the published version. Edit the content and save all changes before publishing again.",
  },
  active_publication: {
    ar: "يوجد نشر نشط أو مجدول لهذا المحتوى بالفعل. حدّث بيانات النشر.",
    en: "This content already has an active or scheduled publication. Refresh the publication data.",
  },
  audience_unavailable: {
    ar: "تعذر تحميل بيانات الجمهور. حدّث بيانات النشر وحاول مرة أخرى.",
    en: "Audience information could not be loaded. Refresh the publication data and try again.",
  },
  approval_not_required: {
    ar: "هذا المحتوى لا يحتاج إلى موافقة وفق إعدادات المدرسة الحالية.",
    en: "This content does not require approval under the current school settings.",
  },
  approval_type_unsupported: {
    ar: "طلب الموافقة غير متاح لهذا النوع من المحتوى.",
    en: "Approval requests are not available for this content type.",
  },
  duplicate_template: {
    ar: "يوجد قالب بهذا الاسم بالفعل. اختر اسمًا مختلفًا.",
    en: "A template with this name already exists. Choose a different name.",
  },
  attachments_disabled: {
    ar: "رفع المرفقات غير مسموح في إعدادات المدرسة الحالية.",
    en: "Attachment uploads are disabled in the current school settings.",
  },
  file_type_disabled: {
    ar: "هذا النوع من الملفات غير مسموح في إعدادات المدرسة الحالية.",
    en: "This file category is disabled in the current school settings.",
  },
  invalid_file: {
    ar: "صيغة الملف غير مدعومة أو لا تطابق محتواه. اختر ملفًا بصيغة مسموحة.",
    en: "The file format is unsupported or does not match its contents. Choose an allowed file format.",
  },
  empty_file: {
    ar: "الملف فارغ. اختر ملفًا يحتوي على بيانات.",
    en: "The file is empty. Choose a file that contains data.",
  },
  file_too_large: {
    ar: "حجم الملف أكبر من الحد المسموح الموضح في قسم المرفقات. اختر ملفًا أصغر.",
    en: "The file exceeds the size limit shown in the attachments section. Choose a smaller file.",
  },
  upload_restart: {
    ar: "انتهت صلاحية جلسة الرفع. ابدأ رفع الملف من جديد.",
    en: "The upload session has expired. Start the file upload again.",
  },
  upload_failed: {
    ar: "تعذر رفع الملف. تحقق من الاتصال وحاول رفعه مرة أخرى.",
    en: "The file could not be uploaded. Check your connection and try uploading it again.",
  },
  preview_unavailable: {
    ar: "معاينة هذا الملف غير متاحة. استخدم تنزيل الملف إذا كان مسموحًا.",
    en: "A preview is unavailable for this file. Download it if downloads are allowed.",
  },
} as const;

const ERROR_KEYS: Readonly<Record<string, keyof typeof ERROR_COPY>> = {
  NETWORK_ERROR: "network",
  UNAUTHORIZED: "unauthorized",
  "validation.failed": "validation",
  "academic_content.term.closed": "term_closed",
  "academic_content.status.read_only": "read_only",
  "academic_content.status.not_archived": "conflict",
  "academic_content.approval.invalid_revision": "conflict",
  "academic_content.approval.invalid_status": "conflict",
  "academic_content.approval.pending_missing": "conflict",
  "academic_content.approval.not_ready": "not_ready",
  "academic_content.approval.not_required": "approval_not_required",
  "academic_content.approval.type_unsupported": "approval_type_unsupported",
  "academic_content.publication.not_ready": "not_ready",
  "academic_content.publication.identical_revision": "identical_revision",
  "academic_content.publication.active_conflict": "active_publication",
  "academic_content.publication.audience_unavailable": "audience_unavailable",
  "academic_content.publication.idempotency_conflict": "conflict",
  "academic_content.publication.lineage_conflict": "conflict",
  "academic_content.publication.snapshot_conflict": "conflict",
  "academic_content.publication.lifecycle_conflict": "conflict",
  "academic_content.publication.cannot_unschedule": "conflict",
  "academic_content.preparation_template.duplicate_name": "duplicate_template",
  "academic_content.preparation_template.not_found": "not_found",
  "academic_content.preparation_template.scope_not_found": "not_found",
  "academic_content.file.mime_signature_mismatch": "invalid_file",
  "academic_content.file.preview_unavailable": "preview_unavailable",
  "academic_content.file.object_missing": "not_found",
  "academic_content.file.upload_expired": "upload_restart",
  "academic_content.file.upload_capability_not_reissuable": "upload_restart",
  "academic_content.file.verification_retryable": "upload_failed",
  "academic_content.file.upload_not_cancellable": "conflict",
  "academic_content.file.idempotency_payload_mismatch": "conflict",
  UPLOAD_ATTACHMENTS_DISABLED: "attachments_disabled",
  UPLOAD_FILE_TYPE_DISABLED: "file_type_disabled",
  UPLOAD_INVALID_FILE: "invalid_file",
  UPLOAD_EMPTY_FILE: "empty_file",
  UPLOAD_FILE_TOO_LARGE: "file_too_large",
  UPLOAD_RESTART_REQUIRED: "upload_restart",
  UPLOAD_TRANSPORT_ERROR: "upload_failed",
};

const HTTP_ERROR_KEYS: Readonly<Record<number, keyof typeof ERROR_COPY>> = {
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  422: "validation",
};

export function academicContentErrorLocale(): string {
  if (typeof window === "undefined") return "en";
  return window.location.pathname.split("/")[1] === "ar" ? "ar" : "en";
}

export function academicContentErrorMessage(
  code: string,
  locale: string,
  status?: number,
): string {
  const key = ERROR_KEYS[code] ?? HTTP_ERROR_KEYS[status ?? 0] ?? "unknown";
  return ERROR_COPY[key][locale === "ar" ? "ar" : "en"];
}
