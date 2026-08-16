"use client";

import { Drawer } from "@mui/material";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Clock,
  School,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  validationIssueText,
  type TimetableValidationSummary,
} from "@/features/academics/timetable/services/timetableValidationSummary";
import type {
  TimetableValidationIssue,
  TimetableValidationItem,
} from "@/features/academics/timetable/services/timetableApiTypes";
import type { TimetableConflict } from "@/features/academics/timetable/types/timetable";
import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";

interface ValidationPanelProps {
  open: boolean;
  validationSummary: TimetableValidationSummary;
  conflicts: TimetableConflict[];
  periods: TimetablePeriod[];
  teachers: NamedEntity[];
  rooms: NamedEntity[];
  onClose: () => void;
  locale: string;
}

type NamedEntity = {
  id: string;
  nameAr: string;
  nameEn: string;
};

interface ValidationSection {
  title: string;
  issues: TimetableValidationIssue[];
  severity: "warning" | "error";
}

type ValidationStatus = TimetableValidationItem["status"];

const STATUS_STYLES: Record<ValidationStatus, string> = {
  complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
  under_scheduled: "border-amber-200 bg-amber-50 text-amber-700",
  over_scheduled: "border-red-200 bg-red-50 text-red-700",
  missing_teacher_allocation: "border-red-200 bg-red-50 text-red-700",
  missing_subject_allocation: "border-red-200 bg-red-50 text-red-700",
};

export default function ValidationPanel({
  open,
  validationSummary,
  conflicts,
  periods,
  teachers,
  rooms,
  onClose,
  locale,
}: ValidationPanelProps) {
  const isRTL = locale === "ar";
  const copy = getCopy(isRTL);
  const summary = validationSummary.backendSummary;
  const issueItems = validationSummary.items.filter(
    (item) => item.status !== "complete" || item.issues.length > 0,
  );
  const fallbackSections = validationSections(
    validationSummary,
    copy,
  );
  const fallbackIssueCount = fallbackSections.reduce(
    (total, section) => total + section.issues.length,
    0,
  );
  const hasIssues =
    issueItems.length > 0 || conflicts.length > 0 || fallbackIssueCount > 0;

  return (
    <Drawer
      anchor={isRTL ? "left" : "right"}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 560,
          maxWidth: "96vw",
        },
      }}
    >
      <div
        className="flex h-full flex-col bg-slate-50"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                {copy.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{copy.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label={copy.close}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <ReadinessBanner
            canPublish={validationSummary.canPublish}
            copy={copy}
          />

          {summary && (
            <div className="grid grid-cols-2 gap-3">
              <SummaryMetric
                label={copy.classrooms}
                value={summary.classroomsChecked}
                icon={<School className="h-4 w-4" />}
              />
              <SummaryMetric
                label={copy.expectedSlots}
                value={summary.expectedWeeklySlots}
                icon={<Clock className="h-4 w-4" />}
              />
              <SummaryMetric
                label={copy.scheduledSlots}
                value={summary.actualScheduledSlots}
                icon={<BookOpen className="h-4 w-4" />}
              />
              <SummaryMetric
                label={copy.publishIssues}
                value={validationIssueCount(summary)}
                icon={<AlertTriangle className="h-4 w-4" />}
                tone={validationIssueCount(summary) > 0 ? "red" : "green"}
              />
            </div>
          )}

          {!hasIssues ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>{copy.noIssues}</span>
              </div>
            </div>
          ) : (
            <>
              {issueItems.length > 0 && (
                <section className="space-y-3">
                  <SectionTitle
                    title={copy.subjectIssues}
                    count={issueItems.length}
                  />
                  {issueItems.map((item) => (
                    <ValidationItemCard
                      key={`${item.classroomId}-${item.subjectId ?? "missing"}`}
                      item={item}
                      locale={locale}
                      copy={copy}
                    />
                  ))}
                </section>
              )}

              {conflicts.length > 0 && (
                <section className="space-y-3">
                  <SectionTitle
                    title={copy.blockingConflicts}
                    count={conflicts.length}
                  />
                  {conflicts.map((conflict, index) => (
                    <ConflictCard
                      key={`${conflict.code ?? conflict.type}-${conflict.dayKey}-${conflict.periodId ?? conflict.periodIndex}-${index}`}
                      conflict={conflict}
                      periods={periods}
                      teachers={teachers}
                      rooms={rooms}
                      locale={locale}
                      copy={copy}
                    />
                  ))}
                </section>
              )}

              {fallbackSections.map((section) => (
                <FallbackIssueSection key={section.title} section={section} />
              ))}
            </>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function ReadinessBanner({
  canPublish,
  copy,
}: {
  canPublish: boolean;
  copy: ValidationCopy;
}) {
  const Icon = canPublish ? CheckCircle : AlertCircle;
  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        canPublish
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span>{canPublish ? copy.canPublish : copy.cannotPublish}</span>
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  icon,
  tone = "slate",
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "slate" | "red" | "green";
}) {
  const toneClass =
    tone === "red"
      ? "bg-red-50 text-red-700"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-600";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-500">{label}</div>
          <div className="mt-1 text-xl font-semibold text-slate-950">
            {value}
          </div>
        </div>
        <div className={`rounded-full p-2 ${toneClass}`}>{icon}</div>
      </div>
    </div>
  );
}

function ValidationItemCard({
  item,
  locale,
  copy,
}: {
  item: TimetableValidationItem;
  locale: string;
  copy: ValidationCopy;
}) {
  const subjectName =
    localizedName(item.subject, locale) || copy.noSubjectLabel;
  const classroomName = localizedName(item.classroom, locale);
  const gradeName = localizedName(item.grade, locale);
  const expected = item.expectedWeeklyHours ?? 0;
  const actual = item.scheduledWeeklyHours;
  const delta = actual - expected;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {item.subject?.color && (
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.subject.color }}
              />
            )}
            <h4 className="truncate text-sm font-semibold text-slate-950">
              {subjectName}
            </h4>
            {item.subject?.code && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                {item.subject.code}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {gradeName} · {classroomName}
          </p>
        </div>

        <StatusBadge status={item.status} copy={copy} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniStat label={copy.expected} value={expected} />
        <MiniStat label={copy.scheduled} value={actual} />
        <MiniStat
          label={copy.delta}
          value={delta > 0 ? `+${delta}` : String(delta)}
          tone={delta === 0 ? "normal" : delta > 0 ? "red" : "amber"}
        />
      </div>

      {item.issues.length > 0 && (
        <div className="mt-3 space-y-2">
          {item.issues.map((issue, index) => (
            <div
              key={`${issue.code ?? "issue"}-${index}`}
              className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700"
            >
              {localizedIssueMessage(issue, copy)}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function StatusBadge({
  status,
  copy,
}: {
  status: ValidationStatus;
  copy: ValidationCopy;
}) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {copy.status[status]}
    </span>
  );
}

function MiniStat({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: string | number;
  tone?: "normal" | "red" | "amber";
}) {
  const toneClass =
    tone === "red"
      ? "text-red-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-slate-950";

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
        {count}
      </span>
    </div>
  );
}

function FallbackIssueSection({ section }: { section: ValidationSection }) {
  if (section.issues.length === 0) {
    return null;
  }

  const Icon = section.severity === "error" ? AlertTriangle : AlertCircle;
  const colorClass =
    section.severity === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <section className="space-y-2">
      <SectionTitle title={section.title} count={section.issues.length} />
      {section.issues.map((issue, index) => (
        <div
          key={`${section.title}-${index}`}
          className={`flex gap-2 rounded-lg border p-3 text-sm ${colorClass}`}
        >
          <Icon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{validationIssueText(issue)}</span>
        </div>
      ))}
    </section>
  );
}

const DAY_NAMES: Record<string, { ar: string; en: string }> = {
  sun: { ar: "الأحد", en: "Sunday" },
  mon: { ar: "الإثنين", en: "Monday" },
  tue: { ar: "الثلاثاء", en: "Tuesday" },
  wed: { ar: "الأربعاء", en: "Wednesday" },
  thu: { ar: "الخميس", en: "Thursday" },
  fri: { ar: "الجمعة", en: "Friday" },
  sat: { ar: "السبت", en: "Saturday" },
};

function dayLabel(dayKey: string, locale: string): string {
  const names = DAY_NAMES[dayKey];
  return names ? (locale === "ar" ? names.ar : names.en) : dayKey;
}

function ConflictCard({
  conflict,
  periods,
  teachers,
  rooms,
  locale,
  copy,
}: {
  conflict: TimetableConflict;
  periods: TimetablePeriod[];
  teachers: NamedEntity[];
  rooms: NamedEntity[];
  locale: string;
  copy: ValidationCopy;
}) {
  const period = conflict.periodId
    ? periods.find((item) => item.id === conflict.periodId)
    : periods.find((item) => item.index === conflict.periodIndex);
  const resource =
    conflict.type === "ROOM"
      ? rooms.find((room) => room.id === conflict.resourceId)
      : teachers.find((teacher) => teacher.id === conflict.resourceId);
  const resourceName =
    localizedName(resource ?? null, locale) ||
    conflict.resourceName ||
    conflict.resourceId ||
    copy.unknownResource;
  const periodLabel =
    periodLabelText(period, locale) ||
    `${copy.period} ${conflict.periodIndex || conflict.periodId || ""}`.trim();

  return (
    <article className="rounded-lg border border-red-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-red-50 p-2 text-red-700">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-950">
              {conflict.type === "ROOM"
                ? copy.roomConflictTitle
                : copy.teacherConflictTitle}
            </h4>
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
              {copy.blocking}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-700">{resourceName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {copy.day}: {dayLabel(conflict.dayKey, locale)} · {periodLabel}
          </p>
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-800">
            {conflict.type === "ROOM"
              ? copy.roomConflictMessage
              : copy.teacherConflictMessage}
          </p>
          {conflict.proposedIndexes && conflict.proposedIndexes.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-medium">{copy.affectedItems}</span>
              {conflict.proposedIndexes.map((index) => (
                <span
                  key={index}
                  className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700"
                >
                  #{index + 1}
                </span>
              ))}
            </div>
          )}
          {conflict.sections && conflict.sections.length > 0 && (
            <div className="mt-3 space-y-1">
              <span className="text-xs font-medium text-slate-600">
                {copy.conflictsWith}
              </span>
              {conflict.sections.map((section, sIdx) => (
                <div
                  key={`${section.sectionId}-${sIdx}`}
                  className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700"
                >
                  <span className="font-medium">
                    {section.classroomName ?? section.sectionName}
                  </span>
                  {section.subjectName && (
                    <span className="text-slate-500">
                      {" "}
                      · {section.subjectName}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function validationSections(
  validationSummary: TimetableValidationSummary,
  copy: ValidationCopy,
): ValidationSection[] {
  return [
    {
      title: copy.blockingReasons,
      issues: validationSummary.blockingReasons.map((message) => ({ message })),
      severity: "error",
    },
    {
      title: copy.warnings,
      issues: validationSummary.warnings.map((message) => ({ message })),
      severity: "warning",
    },
    {
      title: copy.teacherConflicts,
      issues: validationSummary.teacherConflicts,
      severity: "error",
    },
    {
      title: copy.classroomConflicts,
      issues: validationSummary.classroomConflicts,
      severity: "error",
    },
    {
      title: copy.roomConflicts,
      issues: validationSummary.roomConflicts,
      severity: "error",
    },
    {
      title: copy.conflicts,
      issues: validationSummary.conflicts,
      severity: "error",
    },
  ];
}

function validationIssueCount(
  summary: NonNullable<TimetableValidationSummary["backendSummary"]>,
) {
  return (
    summary.missingTeacherAllocations +
    summary.underScheduledSubjects +
    summary.overScheduledSubjects +
    summary.teacherConflicts +
    summary.classroomConflicts +
    summary.roomConflicts +
    summary.missingSubjectAllocationRows
  );
}

function localizedName(
  entity: { nameAr: string; nameEn: string } | null,
  locale: string,
) {
  if (!entity) return "";
  return locale === "ar"
    ? entity.nameAr || entity.nameEn
    : entity.nameEn || entity.nameAr;
}

function localizedIssueMessage(
  issue: TimetableValidationIssue,
  copy: ValidationCopy,
) {
  if (issue.code === "over_scheduled_subject") {
    return copy.overScheduledMessage;
  }
  if (issue.code === "under_scheduled_subject") {
    return copy.underScheduledMessage;
  }
  if (issue.code === "missing_teacher_allocation") {
    return copy.missingTeacherMessage;
  }
  if (issue.code === "missing_subject_allocation_row") {
    return copy.missingSubjectAllocationMessage;
  }
  return issue.message || validationIssueText(issue);
}

function periodLabelText(
  period: TimetablePeriod | undefined,
  locale: string,
): string {
  if (!period) return "";
  const name = locale === "ar" ? period.nameAr : period.nameEn;
  if (period.startTime && period.endTime) {
    return `${name} (${period.startTime} - ${period.endTime})`;
  }
  return name;
}

interface ValidationCopy {
  title: string;
  subtitle: string;
  close: string;
  canPublish: string;
  cannotPublish: string;
  classrooms: string;
  expectedSlots: string;
  scheduledSlots: string;
  publishIssues: string;
  noIssues: string;
  subjectIssues: string;
  noSubjectLabel: string;
  expected: string;
  scheduled: string;
  delta: string;
  blockingReasons: string;
  warnings: string;
  teacherConflicts: string;
  classroomConflicts: string;
  roomConflicts: string;
  conflicts: string;
  conflictAt: string;
  period: string;
  overScheduledMessage: string;
  underScheduledMessage: string;
  missingTeacherMessage: string;
  missingSubjectAllocationMessage: string;
  day: string;
  blockingConflicts: string;
  teacherConflictTitle: string;
  roomConflictTitle: string;
  teacherConflictMessage: string;
  roomConflictMessage: string;
  blocking: string;
  affectedItems: string;
  unknownResource: string;
  conflictsWith: string;
  status: Record<ValidationStatus, string>;
}

function getCopy(isRTL: boolean): ValidationCopy {
  if (isRTL) {
    return {
      title: "تحقق الجدول",
      subtitle: "مقارنة الحصص المجدولة بالساعات الأسبوعية والتعارضات.",
      close: "إغلاق",
      canPublish: "الجدول جاهز للنشر.",
      cannotPublish: "يجب حل مشاكل التحقق قبل النشر.",
      classrooms: "الفصول",
      expectedSlots: "المطلوب أسبوعيا",
      scheduledSlots: "المجدول",
      publishIssues: "مشاكل النشر",
      noIssues: "لا توجد مشاكل تحقق أو تعارضات.",
      subjectIssues: "مشاكل المواد والفصول",
      noSubjectLabel: "مادة غير محددة",
      expected: "المطلوب",
      scheduled: "المجدول",
      delta: "الفرق",
      blockingReasons: "أسباب المنع",
      warnings: "التحذيرات",
      teacherConflicts: "تعارضات المعلمين",
      classroomConflicts: "تعارضات الفصول",
      roomConflicts: "تعارضات الغرف",
      conflicts: "التعارضات",
      conflictAt: "يتعارض في",
      period: "الحصة",
      overScheduledMessage: "عدد الحصص المجدولة أعلى من الساعات الأسبوعية.",
      underScheduledMessage: "عدد الحصص المجدولة أقل من الساعات الأسبوعية.",
      missingTeacherMessage: "لا يوجد معلم مخصص لهذه المادة في هذا الفصل.",
      missingSubjectAllocationMessage:
        "لا توجد ساعات أسبوعية لهذه المادة في هذا الفصل.",
      day: "اليوم",
      blockingConflicts: "تعارضات مانعة",
      teacherConflictTitle: "تعارض معلم",
      roomConflictTitle: "تعارض غرفة",
      teacherConflictMessage: "هذا المعلم مجدول في أكثر من فصل في نفس الوقت.",
      roomConflictMessage: "هذه الغرفة محجوزة لأكثر من فصل في نفس الوقت.",
      blocking: "مانع",
      affectedItems: "العناصر المتأثرة:",
      unknownResource: "مورد غير معروف",
      conflictsWith: "يتعارض مع:",
      status: {
        complete: "مكتمل",
        under_scheduled: "أقل من المطلوب",
        over_scheduled: "أعلى من المطلوب",
        missing_teacher_allocation: "معلم ناقص",
        missing_subject_allocation: "توزيع مادة ناقص",
      },
    };
  }

  return {
    title: "Timetable validation",
    subtitle: "Compare scheduled periods with weekly hours and conflicts.",
    close: "Close",
    canPublish: "This timetable is ready to publish.",
    cannotPublish: "Resolve validation issues before publishing.",
    classrooms: "Classrooms",
    expectedSlots: "Expected slots",
    scheduledSlots: "Scheduled",
    publishIssues: "Publish issues",
    noIssues: "No validation issues or conflicts found.",
    subjectIssues: "Subject scheduling issues",
    noSubjectLabel: "No subject",
    expected: "Expected",
    scheduled: "Scheduled",
    delta: "Delta",
    blockingReasons: "Blocking reasons",
    warnings: "Warnings",
    teacherConflicts: "Teacher conflicts",
    classroomConflicts: "Classroom conflicts",
    roomConflicts: "Room conflicts",
    conflicts: "Conflicts",
    conflictAt: "conflict at",
    period: "period",
    overScheduledMessage: "Scheduled periods exceed weekly hours.",
    underScheduledMessage: "Scheduled periods are below weekly hours.",
    missingTeacherMessage:
      "This subject has no teacher allocation for this classroom.",
    missingSubjectAllocationMessage:
      "This subject has no weekly-hours row for this classroom.",
    day: "Day",
    blockingConflicts: "Blocking conflicts",
    teacherConflictTitle: "Teacher conflict",
    roomConflictTitle: "Room conflict",
    teacherConflictMessage: "This teacher is scheduled in more than one classroom at the same time.",
    roomConflictMessage: "This room is booked for more than one classroom at the same time.",
    blocking: "Blocking",
    affectedItems: "Affected items:",
    unknownResource: "Unknown resource",
    conflictsWith: "Conflicts with:",
    status: {
      complete: "Complete",
      under_scheduled: "Under scheduled",
      over_scheduled: "Over scheduled",
      missing_teacher_allocation: "Missing teacher",
      missing_subject_allocation: "Missing subject allocation",
    },
  };
}
