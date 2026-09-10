import type { TimetablePublishReason } from "./timetableApiTypes";

export type PublicationReasonCategory =
  | "configuration"
  | "curriculum"
  | "teachers"
  | "weekly_hours"
  | "conflicts"
  | "rooms";

export interface PublicationReasonGroup {
  category: PublicationReasonCategory;
  reasons: TimetablePublishReason[];
}

export interface PublicationReasonPresentation {
  message: string;
  details: Array<{ label: string; value: string }>;
}

const categories: PublicationReasonCategory[] = [
  "configuration",
  "curriculum",
  "teachers",
  "weekly_hours",
  "conflicts",
  "rooms",
];

const categoryByCode: Record<string, PublicationReasonCategory> = {
  missing_subject_allocation: "curriculum",
  missing_subject_allocation_row: "curriculum",
  subject_not_taught: "curriculum",
  invalid_allocation_reference: "teachers",
  allocation_mismatch: "teachers",
  missing_teacher_allocation: "teachers",
  teacher_allocation_missing: "teachers",
  under_scheduled_subject: "weekly_hours",
  over_scheduled_subject: "weekly_hours",
  conflicts: "conflicts",
  duplicate_slot: "conflicts",
  teacher_conflict: "conflicts",
  classroom_conflict: "conflicts",
  room_conflict: "conflicts",
  invalid_room_reference: "rooms",
  room_not_found: "rooms",
  room_inactive: "rooms",
  room_capacity_insufficient: "rooms",
};

const messages: Record<string, { ar: string; en: string }> = {
  not_draft: bilingual(
    "يمكن نشر إعدادات الجدول الموجودة في حالة المسودة فقط.",
    "Only draft timetable configurations can be published.",
  ),
  no_instructional_periods: bilingual(
    "يجب إضافة حصة دراسية واحدة على الأقل.",
    "Add at least one instructional period.",
  ),
  no_entries: bilingual(
    "يجب إضافة حصص إلى الجدول قبل نشره.",
    "Add timetable entries before publishing.",
  ),
  conflicts: bilingual(
    "يحتوي الجدول على تعارضات مانعة.",
    "The timetable contains blocking scheduling conflicts.",
  ),
  invalid_academic_context: bilingual(
    "السنة الدراسية أو الفصل الدراسي المرتبط بالجدول غير صالح.",
    "The timetable academic year or term is invalid.",
  ),
  term_closed: bilingual(
    "الفصل الدراسي مغلق أمام تعديلات الجدول.",
    "The term is closed for timetable changes.",
  ),
  invalid_period_reference: bilingual(
    "توجد حصة تشير إلى فترة غير صالحة.",
    "A timetable entry references an invalid period.",
  ),
  invalid_day: bilingual(
    "توجد حصة في يوم غير مفعّل في إعدادات الجدول.",
    "A timetable entry uses a day outside the active days.",
  ),
  invalid_classroom_reference: bilingual(
    "توجد حصة تشير إلى فصل دراسي غير صالح.",
    "A timetable entry references an invalid classroom.",
  ),
  classroom_scope_mismatch: bilingual(
    "يوجد فصل دراسي خارج نطاق إعدادات الجدول.",
    "A timetable entry classroom is outside the configuration scope.",
  ),
  invalid_allocation_reference: bilingual(
    "توجد حصة تشير إلى تخصيص معلم غير صالح.",
    "A timetable entry references an invalid teacher allocation.",
  ),
  allocation_mismatch: bilingual(
    "تخصيص المعلم لا يطابق الفصل أو المادة أو المعلم في الحصة.",
    "A teacher allocation does not match the entry context.",
  ),
  subject_not_taught: bilingual(
    "توجد حصة لمادة غير مفعّلة ضمن متطلبات المنهج.",
    "A timetable entry is not backed by an active curriculum requirement.",
  ),
  missing_subject_allocation: bilingual(
    "لا يوجد توزيع منهج نشط يدعم إحدى حصص الجدول.",
    "A timetable entry has no active curriculum allocation.",
  ),
  missing_subject_allocation_row: bilingual(
    "لا توجد ساعات أسبوعية مخصصة للمادة في هذا الصف.",
    "A subject has no active weekly-hours allocation for this grade.",
  ),
  missing_teacher_allocation: bilingual(
    "لا يوجد معلم مخصص للمادة في هذا الفصل.",
    "A subject has no teacher allocation for this classroom.",
  ),
  under_scheduled_subject: bilingual(
    "عدد الحصص المجدولة أقل من الساعات الأسبوعية المطلوبة.",
    "Scheduled periods are below the required weekly hours.",
  ),
  over_scheduled_subject: bilingual(
    "عدد الحصص المجدولة أعلى من الساعات الأسبوعية المطلوبة.",
    "Scheduled periods exceed the required weekly hours.",
  ),
  invalid_room_reference: bilingual(
    "توجد حصة تشير إلى غرفة غير صالحة.",
    "A timetable entry references an invalid room.",
  ),
  room_not_found: bilingual(
    "الغرفة المجدولة غير موجودة أو لم تعد متاحة.",
    "A scheduled room is missing or no longer available.",
  ),
  room_inactive: bilingual(
    "توجد حصة مجدولة في غرفة غير نشطة.",
    "A timetable entry uses an inactive room.",
  ),
  room_capacity_insufficient: bilingual(
    "سعة إحدى الغرف أقل من سعة الفصل الدراسي.",
    "A scheduled room is too small for its classroom.",
  ),
};

const detailLabels: Record<string, { ar: string; en: string }> = {
  timetableConfigId: bilingual("إعداد الجدول", "Timetable configuration"),
  status: bilingual("الحالة", "Status"),
  count: bilingual("العدد", "Count"),
  academicYearId: bilingual("السنة الدراسية", "Academic year"),
  termId: bilingual("الفصل الدراسي", "Term"),
  entryId: bilingual("الحصة", "Entry"),
  periodId: bilingual("الفترة", "Period"),
  dayOfWeek: bilingual("اليوم", "Day"),
  activeDays: bilingual("الأيام النشطة", "Active days"),
  classroomId: bilingual("الفصل", "Classroom"),
  teacherSubjectAllocationId: bilingual("تخصيص المعلم", "Teacher allocation"),
  subjectId: bilingual("المادة", "Subject"),
  roomId: bilingual("الغرفة", "Room"),
  roomCapacity: bilingual("سعة الغرفة", "Room capacity"),
  classroomCapacity: bilingual("سعة الفصل", "Classroom capacity"),
  expectedWeeklyHours: bilingual("الساعات المطلوبة", "Expected weekly hours"),
  scheduledWeeklyHours: bilingual("الساعات المجدولة", "Scheduled weekly hours"),
};

export function classifyPublicationReasons(
  reasons: TimetablePublishReason[] = [],
): PublicationReasonGroup[] {
  const grouped = new Map<
    PublicationReasonCategory,
    TimetablePublishReason[]
  >();
  for (const reason of reasons) {
    const category = categoryByCode[reason.code] ?? "configuration";
    grouped.set(category, [...(grouped.get(category) ?? []), reason]);
  }
  return categories.flatMap((category) => {
    const categoryReasons = grouped.get(category);
    return categoryReasons ? [{ category, reasons: categoryReasons }] : [];
  });
}

export function publicationReasonPresentation(
  reason: TimetablePublishReason,
  locale: string,
): PublicationReasonPresentation {
  const language = locale === "ar" ? "ar" : "en";
  return {
    message: messages[reason.code]?.[language] ?? reason.message,
    details: Object.entries(reason.details ?? {}).flatMap(
      ([detailName, detailValue]) => {
        const value = displayedDetailValue(detailValue);
        return value === null
          ? []
          : [
              {
                label: detailLabels[detailName]?.[language] ?? detailName,
                value,
              },
            ];
      },
    ),
  };
}

function displayedDetailValue(detailValue: unknown): string | null {
  if (typeof detailValue === "string" || typeof detailValue === "number") {
    return String(detailValue);
  }
  if (!Array.isArray(detailValue)) return null;

  const displayableValues = detailValue.filter(
    (value): value is string | number =>
      typeof value === "string" || typeof value === "number",
  );
  return displayableValues.length > 0 ? displayableValues.join(", ") : null;
}

function bilingual(ar: string, en: string) {
  return { ar, en };
}
