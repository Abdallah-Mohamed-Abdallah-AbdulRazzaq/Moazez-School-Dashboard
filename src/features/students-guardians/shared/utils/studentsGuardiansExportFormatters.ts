import type {
  StudentDocument,
  Student,
  StudentGuardian,
} from "@/features/students-guardians/students/types";
import type {
  TransferApplication,
  WithdrawalApplication,
} from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";
import type { TransferWithdrawalRequestRow } from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";
import type { StudentsGuardiansExportLocale } from "./studentsGuardiansExport";
import {
  getStudentClassroom,
  getStudentDisplayId,
} from "@/features/students-guardians/students/utils/studentUtils";

type ExportRecord = Record<string, unknown>;
interface StudentDocumentCenterItem extends StudentDocument {
  studentName: string;
  grade: string;
}
type OverviewKpis = Array<{ label: string; value: string | number; subtitle?: string }>;
type OverviewSeriesPoint = Record<string, string | number>;
type StudentsGuardiansDashboardAnalytics = {
  generatedAt: string;
  kpis: OverviewKpis;
  riskSummary: Array<{ label: string; value: number }>;
  studentsByStatus: Array<{ status: string; count: number }>;
  studentsByGrade: Array<{ grade: string; count: number }>;
  retentionCohort: Array<{ year: string; retained: number; left: number }>;
  passFail: { pass: number; fail: number; total: number; passRate: string };
  absenceHeatmap: Array<{
    week: string;
    sat: number;
    sun: number;
    mon: number;
    tue: number;
    wed: number;
    thu: number;
  }>;
  passFailLabels: {
    pass: string;
    fail: string;
    totalStudents: string;
    passRate: string;
  };
};
type ExportStudent = Student & {
  enrollment?: {
    grade?: string;
    section?: string;
    classroom?: string;
  };
  contextPerformance?: {
    attendance: number;
    gradeAverage: number;
    riskFlags: string[];
  };
  ytdPerformance?: {
    attendance: number;
    gradeAverage: number;
    riskFlags: string[];
  };
};

function toDisplayDate(value: string | undefined, locale: StudentsGuardiansExportLocale) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(locale === "ar" ? "ar" : "en-US");
}

function localizeRowKeys(
  row: ExportRecord,
  locale: StudentsGuardiansExportLocale,
  labels: Record<string, string>,
): ExportRecord {
  if (locale !== "ar") {
    return row;
  }

  const localized: ExportRecord = {};

  Object.entries(row).forEach(([key, value]) => {
    localized[labels[key] || key] = value;
  });

  return localized;
}

function localizeStudentStatus(
  status: string,
  locale: StudentsGuardiansExportLocale,
) {
  if (locale !== "ar") return status;
  const labels: Record<string, string> = {
    Active: "نشط",
    Suspended: "موقوف",
    Withdrawn: "منسحب",
  };
  return labels[status] || status;
}

function localizeDocumentStatus(
  status: string,
  locale: StudentsGuardiansExportLocale,
) {
  if (locale !== "ar") return status;
  const labels: Record<string, string> = {
    complete: "مكتمل",
    missing: "مفقود",
  };
  return labels[status] || status;
}

function localizeRelation(
  relation: string,
  locale: StudentsGuardiansExportLocale,
) {
  if (locale !== "ar") {
    return relation;
  }

  const labels: Record<string, string> = {
    father: "الأب",
    mother: "الأم",
    guardian: "ولي الأمر",
    other: "أخرى",
  };

  return labels[relation.toLowerCase()] || relation;
}

function localizeBoolean(
  value: boolean,
  locale: StudentsGuardiansExportLocale,
) {
  if (locale !== "ar") return value ? "Yes" : "No";
  return value ? "نعم" : "لا";
}

function localizeStage(stage: string, locale: StudentsGuardiansExportLocale) {
  if (locale !== "ar") return stage;

  const normalized = stage.toLowerCase();
  const labels: Record<string, string> = {
    primary: "ابتدائي",
    preparatory: "إعدادي",
    secondary: "ثانوي",
  };

  return labels[normalized] || stage;
}

function localizeGrade(grade: string, locale: StudentsGuardiansExportLocale) {
  if (locale !== "ar") return grade;
  if (!grade.startsWith("Grade ")) return grade;
  return `الصف ${grade.replace("Grade ", "")}`;
}

function localizeTransferType(
  type: string,
  locale: StudentsGuardiansExportLocale,
) {
  if (locale !== "ar") return type;
  const labels: Record<string, string> = {
    internal: "داخلي",
    external: "خارجي",
  };
  return labels[type] || type;
}

function localizeBehaviorBand(
  behaviorBand: string,
  locale: StudentsGuardiansExportLocale,
) {
  if (locale !== "ar") return behaviorBand;
  const labels: Record<string, string> = {
    low: "منخفض",
    medium: "متوسط",
    high: "مرتفع",
  };
  return labels[behaviorBand] || behaviorBand;
}

function localizeApplicationStatus(
  status: string,
  locale: StudentsGuardiansExportLocale,
) {
  if (locale !== "ar") return status;
  const labels: Record<string, string> = {
    draft: "مسودة",
    submitted: "مرسل",
    under_review: "قيد المراجعة",
    finance_clearance: "مراجعة مالية",
    behavior_review: "مراجعة سلوكية",
    approved: "مقبول",
    rejected: "مرفوض",
    executed: "منفذ",
  };
  return labels[status] || status;
}

function localizeWithdrawalReason(
  reason: string,
  locale: StudentsGuardiansExportLocale,
) {
  if (locale !== "ar") return reason;
  const labels: Record<string, string> = {
    relocation: "انتقال",
    financial: "مالي",
    academic: "أكاديمي",
    behavior: "سلوكي",
    health: "صحي",
    other: "أخرى",
    "transfer in": "تحويل داخلي",
  };
  return labels[reason.toLowerCase()] || reason;
}

function localizeFinancialClearance(
  status: string,
  locale: StudentsGuardiansExportLocale,
) {
  if (locale !== "ar") return status;
  const labels: Record<string, string> = {
    pending: "قيد الانتظار",
    cleared: "مخالص",
    blocked: "موقوف",
  };
  return labels[status] || status;
}

function formatStudentName(
  student: Student,
  locale: StudentsGuardiansExportLocale,
) {
  return locale === "ar"
    ? student.full_name_ar || student.full_name_en
    : student.full_name_en || student.full_name_ar;
}

export function formatStudentsForExport(
  students: Student[],
  locale: StudentsGuardiansExportLocale,
): ExportRecord[] {
  return students.map((rawStudent) => {
    const student = rawStudent as ExportStudent;
    return localizeRowKeys(
      {
        "Student ID": getStudentDisplayId(student),
        "Student Name": formatStudentName(student, locale),
        "Student Name (English)": student.full_name_en,
        "Student Name (Arabic)": student.full_name_ar,
        Grade: localizeGrade(
          student.enrollment?.grade || student.gradeRequested,
          locale,
        ),
        Section: student.enrollment?.section || student.section || "N/A",
        Classroom: getStudentClassroom(student),
        Status: localizeStudentStatus(student.status, locale),
        Gender: student.gender,
        Nationality: student.nationality,
        "Date of Birth": toDisplayDate(student.dateOfBirth, locale),
        "Enrollment Year": student.enrollment_year ?? "N/A",
        "Attendance %":
          student.attendance_percentage ??
          student.contextPerformance?.attendance ??
          student.ytdPerformance?.attendance ??
          "N/A",
        "Current Average":
          student.current_average ??
          student.contextPerformance?.gradeAverage ??
          student.ytdPerformance?.gradeAverage ??
          "N/A",
        "Risk Flags":
          student.risk_flags?.join(", ") ||
          student.contextPerformance?.riskFlags.join(", ") ||
          student.ytdPerformance?.riskFlags.join(", ") ||
          "None",
        "Submitted Date": toDisplayDate(
          student.created_at || student.submittedDate,
          locale,
        ),
      },
      locale,
      {
        "Student ID": "رقم الطالب",
        "Student Name": "اسم الطالب",
        "Student Name (English)": "اسم الطالب (إنجليزي)",
        "Student Name (Arabic)": "اسم الطالب (عربي)",
        Grade: "الصف",
        Section: "الشعبة",
        Classroom: "الفصل",
        Status: "الحالة",
        Gender: "النوع",
        Nationality: "الجنسية",
        "Date of Birth": "تاريخ الميلاد",
        "Enrollment Year": "سنة القيد",
        "Attendance %": "نسبة الحضور",
        "Current Average": "المعدل الحالي",
        "Risk Flags": "علامات الخطر",
        "Submitted Date": "تاريخ الإضافة",
      },
    );
  });
}

export function formatGuardiansForExport(
  guardians: StudentGuardian[],
  locale: StudentsGuardiansExportLocale,
): ExportRecord[] {
  return guardians.map((guardian) =>
    localizeRowKeys(
      {
        "Guardian ID": guardian.guardianId,
        "Full Name": guardian.full_name,
        Relation: localizeRelation(guardian.relation, locale),
        "National ID": guardian.national_id,
        "Primary Phone": guardian.phone_primary,
        "Secondary Phone": guardian.phone_secondary || "N/A",
        Email: guardian.email,
        "Job Title": guardian.job_title || "N/A",
        Workplace: guardian.workplace || "N/A",
        "Primary Guardian": localizeBoolean(guardian.is_primary, locale),
        "Can Pickup": localizeBoolean(guardian.can_pickup, locale),
        "Receive Notifications": localizeBoolean(
          guardian.can_receive_notifications,
          locale,
        ),
      },
      locale,
      {
        "Guardian ID": "رقم ولي الأمر",
        "Full Name": "الاسم الكامل",
        Relation: "صلة القرابة",
        "National ID": "الرقم القومي",
        "Primary Phone": "الهاتف الأساسي",
        "Secondary Phone": "الهاتف الثانوي",
        Email: "البريد الإلكتروني",
        "Job Title": "المسمى الوظيفي",
        Workplace: "جهة العمل",
        "Primary Guardian": "ولي الأمر الأساسي",
        "Can Pickup": "مصرح بالاستلام",
        "Receive Notifications": "استلام الإشعارات",
      },
    ),
  );
}

export function formatDocumentsForExport(
  documents: StudentDocumentCenterItem[],
  locale: StudentsGuardiansExportLocale,
): ExportRecord[] {
  return documents.map((document) =>
    localizeRowKeys(
      {
        "Document ID": document.id,
        "Student ID": document.studentId,
        "Student Name": document.studentName,
        Grade: localizeGrade(document.grade, locale),
        "Document Type": document.type,
        "File Name": document.name,
        Status: localizeDocumentStatus(document.status, locale),
        "Uploaded Date": toDisplayDate(document.uploadedDate, locale) || "N/A",
      },
      locale,
      {
        "Document ID": "رقم المستند",
        "Student ID": "رقم الطالب",
        "Student Name": "اسم الطالب",
        Grade: "الصف",
        "Document Type": "نوع المستند",
        "File Name": "اسم الملف",
        Status: "الحالة",
        "Uploaded Date": "تاريخ الرفع",
      },
    ),
  );
}

export function formatTransfersForExport(
  transfers: TransferApplication[],
  locale: StudentsGuardiansExportLocale,
): ExportRecord[] {
  return transfers.map((transfer) =>
    localizeRowKeys(
      {
        "Transfer ID": transfer.id,
        "Student ID": transfer.studentId,
        "Student Name":
          locale === "ar" ? transfer.studentNameAr || transfer.studentName : transfer.studentName,
        Stage: localizeStage(transfer.stage, locale),
        Grade: localizeGrade(transfer.grade, locale),
        Section: transfer.section || "N/A",
        Classroom: transfer.classroom || "N/A",
        Type: localizeTransferType(transfer.type, locale),
        Reason: transfer.reason,
        "Behavior Score": transfer.behaviorScore ?? "N/A",
        "Behavior Band": transfer.behaviorBand
          ? localizeBehaviorBand(transfer.behaviorBand, locale)
          : "N/A",
        Status: localizeApplicationStatus(transfer.status, locale),
        "Request Date": toDisplayDate(transfer.requestDate, locale),
        "Effective Date": toDisplayDate(transfer.effectiveDate, locale),
        "Target Section": transfer.targetSection || "N/A",
        "Target Classroom": transfer.targetClassroom || "N/A",
        "External School": transfer.externalSchool || "N/A",
      },
      locale,
      {
        "Transfer ID": "رقم التحويل",
        "Student ID": "رقم الطالب",
        "Student Name": "اسم الطالب",
        Stage: "المرحلة",
        Grade: "الصف",
        Section: "الشعبة",
        Classroom: "الفصل",
        Type: "نوع التحويل",
        Reason: "السبب",
        "Behavior Score": "درجة السلوك",
        "Behavior Band": "مستوى السلوك",
        Status: "الحالة",
        "Request Date": "تاريخ الطلب",
        "Effective Date": "تاريخ التنفيذ",
        "Target Section": "الشعبة المستهدفة",
        "Target Classroom": "الفصل المستهدف",
        "External School": "المدرسة الخارجية",
      },
    ),
  );
}

export function formatWithdrawalsForExport(
  withdrawals: WithdrawalApplication[],
  locale: StudentsGuardiansExportLocale,
): ExportRecord[] {
  return withdrawals.map((withdrawal) =>
    localizeRowKeys(
      {
        "Withdrawal ID": withdrawal.id,
        "Student ID": withdrawal.studentId,
        "Student Name":
          locale === "ar"
            ? withdrawal.studentNameAr || withdrawal.studentName
            : withdrawal.studentName,
        Stage: localizeStage(withdrawal.stage, locale),
        Grade: localizeGrade(withdrawal.grade, locale),
        Section: withdrawal.section || "N/A",
        Classroom: withdrawal.classroom || "N/A",
        Reason: localizeWithdrawalReason(withdrawal.reason, locale),
        "Behavior Average": withdrawal.behaviorAvg ?? "N/A",
        "Behavior Band": withdrawal.behaviorBand
          ? localizeBehaviorBand(withdrawal.behaviorBand, locale)
          : "N/A",
        "Attendance %": withdrawal.attendancePercent ?? "N/A",
        "Financial Clearance": withdrawal.financialClearance
          ? localizeFinancialClearance(withdrawal.financialClearance, locale)
          : "N/A",
        Status: localizeApplicationStatus(withdrawal.status, locale),
        "Request Date": toDisplayDate(withdrawal.requestDate, locale),
        "Effective Date": toDisplayDate(withdrawal.effectiveDate, locale),
      },
      locale,
      {
        "Withdrawal ID": "رقم الانسحاب",
        "Student ID": "رقم الطالب",
        "Student Name": "اسم الطالب",
        Stage: "المرحلة",
        Grade: "الصف",
        Section: "الشعبة",
        Classroom: "الفصل",
        Reason: "السبب",
        "Behavior Average": "متوسط السلوك",
        "Behavior Band": "مستوى السلوك",
        "Attendance %": "نسبة الحضور",
        "Financial Clearance": "المخالصة المالية",
        Status: "الحالة",
        "Request Date": "تاريخ الطلب",
        "Effective Date": "تاريخ التنفيذ",
      },
    ),
  );
}

export function formatTransferWithdrawalRequestsForExport(
  requests: TransferWithdrawalRequestRow[],
  locale: StudentsGuardiansExportLocale,
): ExportRecord[] {
  return requests.map((request) =>
    localizeRowKeys(
      {
        "Request ID": request.id,
        Type:
          locale === "ar"
            ? request.type === "Transfer"
              ? "تحويل"
              : "انسحاب"
            : request.type,
        "Student Name":
          locale === "ar" ? request.studentNameAr || request.studentName : request.studentName,
        Stage: localizeStage(request.stage, locale),
        Grade: localizeGrade(request.grade, locale),
        "Behavior Average": request.behaviorAvg,
        "Attendance %": request.attendancePercent || "N/A",
        Reason: localizeWithdrawalReason(request.reason, locale),
        Status: localizeApplicationStatus(request.status, locale),
        "Request Date": toDisplayDate(request.requestDate, locale),
      },
      locale,
      {
        "Request ID": "رقم الطلب",
        Type: "النوع",
        "Student Name": "اسم الطالب",
        Stage: "المرحلة",
        Grade: "الصف",
        "Behavior Average": "متوسط السلوك",
        "Attendance %": "نسبة الحضور",
        Reason: "السبب",
        Status: "الحالة",
        "Request Date": "تاريخ الطلب",
      },
    ),
  );
}

function localizeSection(section: string, locale: StudentsGuardiansExportLocale) {
  if (locale !== "ar") return section;
  const labels: Record<string, string> = {
    KPIs: "المؤشرات",
    "Risk Summary": "ملخص المخاطر",
    "Students by Status": "الطلاب حسب الحالة",
    "Students by Grade": "الطلاب حسب الصف",
    "Retention Cohort": "الاحتفاظ حسب الدفعة",
    "Pass/Fail Ratio": "نسبة النجاح والرسوب",
    "Absence Heatmap": "خريطة الغياب الحرارية",
    "Trend Analysis": "تحليل الاتجاهات",
    "Reason Analysis": "تحليل الأسباب",
    "Stage Analysis": "تحليل المراحل",
    "Behavior Analysis": "تحليل السلوك",
  };
  return labels[section] || section;
}

function flattenOverviewAnalytics(
  locale: StudentsGuardiansExportLocale,
  sections: Array<{
    name: string;
    rows: OverviewSeriesPoint[];
  }>,
): ExportRecord[] {
  return sections.flatMap((section) =>
    section.rows.map((row) =>
      localizeRowKeys(
        normalizeOverviewRow(section.name, row, locale),
        locale,
        {
          Section: "القسم",
          Label: "البند",
          Value: "القيمة",
          Comparison: "مقارنة",
          Notes: "ملاحظات",
        },
      ),
    ),
  );
}

function normalizeOverviewRow(
  sectionName: string,
  row: OverviewSeriesPoint,
  locale: StudentsGuardiansExportLocale,
): ExportRecord {
  const section = localizeSection(sectionName, locale);

  if ("Metric" in row) {
    return {
      Section: section,
      Label: row.Metric,
      Value: row.Value,
      Comparison: row.Subtitle || "",
      Notes: "",
    };
  }

  if ("Label" in row && "Value" in row) {
    return {
      Section: section,
      Label: row.Label || "",
      Value: row.Value ?? "",
      Comparison: row.Comparison ?? "",
      Notes: row.Notes ?? "",
    };
  }

  if ("Internal" in row || "External" in row) {
    return {
      Section: section,
      Label: row.Period || "",
      Value: row.Internal ?? "",
      Comparison: row.External ?? "",
      Notes:
        locale === "ar"
          ? "داخلي / خارجي"
          : "Internal / External",
    };
  }

  if ("Withdrawals" in row && "Period" in row) {
    return {
      Section: section,
      Label: row.Period || "",
      Value: row.Withdrawals ?? "",
      Comparison: "",
      Notes: locale === "ar" ? "الانسحاب" : "Withdrawals",
    };
  }

  if ("Stage" in row && "Transfers" in row) {
    return {
      Section: section,
      Label: row.Stage || "",
      Value: row.Transfers ?? "",
      Comparison: row.Withdrawals ?? "",
      Notes:
        locale === "ar"
          ? "التحويلات / الانسحاب"
          : "Transfers / Withdrawals",
    };
  }

  if ("Stage" in row && "Behavior Related" in row) {
    return {
      Section: section,
      Label: row.Stage || "",
      Value: row["Behavior Related"] ?? "",
      Comparison:
        `${row["Financial Related"] ?? ""} | ${row["Other Reasons"] ?? ""}`,
      Notes:
        locale === "ar"
          ? "سلوكي | مالي | أخرى"
          : "Behavior | Financial | Other",
    };
  }

  if ("Reason" in row) {
    return {
      Section: section,
      Label: row.Reason || "",
      Value: row.Percentage ?? row.Count ?? "",
      Comparison: "",
      Notes: "",
    };
  }

  if ("Category" in row) {
    return {
      Section: section,
      Label: row.Category || "",
      Value: row.Count ?? "",
      Comparison: "",
      Notes: "",
    };
  }

  const [firstKey, firstValue] = Object.entries(row)[0] || ["", ""];
  return {
    Section: section,
    Label: firstKey,
    Value: firstValue,
    Comparison: "",
    Notes: "",
  };
}

export function formatTransfersOverviewAnalyticsForExport(
  data: {
    kpis: OverviewKpis;
    trend: Array<{ period: string; internal: number; external: number }>;
    reasons: Array<{ reason: string; percentage: number }>;
    byStage: Array<{ stage: string; transfers: number; withdrawals: number }>;
  },
  locale: StudentsGuardiansExportLocale,
): ExportRecord[] {
  return flattenOverviewAnalytics(locale, [
    {
      name: "KPIs",
      rows: data.kpis.map((kpi) => ({
        Metric: kpi.label,
        Value: kpi.value,
        Subtitle: kpi.subtitle || "",
      })),
    },
    {
      name: "Trend Analysis",
      rows: data.trend.map((item) => ({
        Period: item.period,
        Internal: item.internal,
        External: item.external,
      })),
    },
    {
      name: "Reason Analysis",
      rows: data.reasons.map((item) => ({
        Reason: item.reason,
        Percentage: `${item.percentage}%`,
      })),
    },
    {
      name: "Stage Analysis",
      rows: data.byStage.map((item) => ({
        Stage: item.stage,
        Transfers: item.transfers,
        Withdrawals: item.withdrawals,
      })),
    },
  ]);
}

export function createTransfersOverviewAnalyticsJson(data: {
  generatedAt: string;
  kpis: OverviewKpis;
  trend: Array<{ period: string; internal: number; external: number }>;
  reasons: Array<{ reason: string; percentage: number }>;
  byStage: Array<{ stage: string; transfers: number; withdrawals: number }>;
}) {
  return {
    generatedAt: data.generatedAt,
    type: "transfers_overview_analytics",
    kpis: data.kpis,
    trend: data.trend,
    reasons: data.reasons,
    byStage: data.byStage,
  };
}

export function formatWithdrawalsOverviewAnalyticsForExport(
  data: {
    kpis: OverviewKpis;
    trend: Array<{ period: string; withdrawals: number }>;
    byStage: Array<{
      stage: string;
      behaviorRelated: number;
      financialRelated: number;
      otherReasons: number;
    }>;
    reasons: Array<{ reason: string; count: number }>;
    behavior: Array<{ category: string; count: number }>;
  },
  locale: StudentsGuardiansExportLocale,
): ExportRecord[] {
  return flattenOverviewAnalytics(locale, [
    {
      name: "KPIs",
      rows: data.kpis.map((kpi) => ({
        Metric: kpi.label,
        Value: kpi.value,
        Subtitle: kpi.subtitle || "",
      })),
    },
    {
      name: "Trend Analysis",
      rows: data.trend.map((item) => ({
        Period: item.period,
        Withdrawals: item.withdrawals,
      })),
    },
    {
      name: "Stage Analysis",
      rows: data.byStage.map((item) => ({
        Stage: item.stage,
        "Behavior Related": item.behaviorRelated,
        "Financial Related": item.financialRelated,
        "Other Reasons": item.otherReasons,
      })),
    },
    {
      name: "Reason Analysis",
      rows: data.reasons.map((item) => ({
        Reason: item.reason,
        Count: item.count,
      })),
    },
    {
      name: "Behavior Analysis",
      rows: data.behavior.map((item) => ({
        Category: item.category,
        Count: item.count,
      })),
    },
  ]);
}

export function createWithdrawalsOverviewAnalyticsJson(data: {
  generatedAt: string;
  kpis: OverviewKpis;
  trend: Array<{ period: string; withdrawals: number }>;
  byStage: Array<{
    stage: string;
    behaviorRelated: number;
    financialRelated: number;
    otherReasons: number;
  }>;
  reasons: Array<{ reason: string; count: number }>;
  behavior: Array<{ category: string; count: number }>;
}) {
  return {
    generatedAt: data.generatedAt,
    type: "withdrawals_overview_analytics",
    kpis: data.kpis,
    trend: data.trend,
    byStage: data.byStage,
    reasons: data.reasons,
    behavior: data.behavior,
  };
}

export function formatStudentsGuardiansDashboardAnalyticsForExport(
  data: StudentsGuardiansDashboardAnalytics,
  locale: StudentsGuardiansExportLocale,
): ExportRecord[] {
  return flattenOverviewAnalytics(locale, [
    {
      name: "KPIs",
      rows: data.kpis.map((kpi) => ({
        Metric: kpi.label,
        Value: kpi.value,
        Subtitle: kpi.subtitle || "",
      })),
    },
    {
      name: "Risk Summary",
      rows: data.riskSummary.map((item) => ({
        Metric: item.label,
        Value: item.value,
      })),
    },
    {
      name: "Students by Status",
      rows: data.studentsByStatus.map((item) => ({
        Label: item.status,
        Value: item.count,
      })),
    },
    {
      name: "Students by Grade",
      rows: data.studentsByGrade.map((item) => ({
        Label: item.grade,
        Value: item.count,
      })),
    },
    {
      name: "Retention Cohort",
      rows: data.retentionCohort.map((item) => ({
        Label: item.year,
        Value: item.retained,
        Comparison: item.left,
        Notes: locale === "ar" ? "الاحتفاظ / المغادرة" : "Retained / Left",
      })),
    },
    {
      name: "Pass/Fail Ratio",
      rows: [
        { Label: data.passFailLabels.pass, Value: data.passFail.pass },
        { Label: data.passFailLabels.fail, Value: data.passFail.fail },
        { Label: data.passFailLabels.totalStudents, Value: data.passFail.total },
        { Label: data.passFailLabels.passRate, Value: data.passFail.passRate },
      ],
    },
    {
      name: "Absence Heatmap",
      rows: data.absenceHeatmap.map((item) => ({
        Label: item.week,
        Value: item.sat,
        Comparison: `${item.sun} | ${item.mon} | ${item.tue} | ${item.wed} | ${item.thu}`,
        Notes: locale === "ar" ? "أحد | اثنين | ثلاثاء | أربعاء | خميس" : "Sun | Mon | Tue | Wed | Thu",
      })),
    },
  ]);
}

export function createStudentsGuardiansDashboardAnalyticsJson(
  data: StudentsGuardiansDashboardAnalytics,
) {
  return {
    generatedAt: data.generatedAt,
    type: "students_guardians_dashboard_analytics",
    kpis: data.kpis,
    riskSummary: data.riskSummary,
    studentsByStatus: data.studentsByStatus,
    studentsByGrade: data.studentsByGrade,
    retentionCohort: data.retentionCohort,
    passFail: data.passFail,
    absenceHeatmap: data.absenceHeatmap,
  };
}
