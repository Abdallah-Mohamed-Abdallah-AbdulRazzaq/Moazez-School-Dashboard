const sourceTypeLabels: Record<string, { en: string; ar: string }> = {
  communication_announcement: { en: "Announcement", ar: "إعلان" },
  communication_message: { en: "Message", ar: "رسالة" },
  school_support_message: { en: "School support message", ar: "رسالة دعم المدرسة" },
  attendance_absence_submit: { en: "Absence submission", ar: "تسجيل غياب" },
  dismissal_request: { en: "Dismissal request", ar: "طلب استئذان" },
  conversation: { en: "Conversation", ar: "محادثة" },
};

const sourceTypeAliases: Record<string, string> = {
  announcement: "communication_announcement",
  message: "communication_message",
  attendance_absence: "attendance_absence_submit",
};

export function notificationSourceTypeLabel(sourceType: string | undefined, locale: string) {
  if (!sourceType) return "";
  const knownType = sourceTypeAliases[sourceType] ?? sourceType;
  return sourceTypeLabels[knownType]?.[locale === "ar" ? "ar" : "en"] ?? sourceType;
}
