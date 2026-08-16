// FILE: src/utils/admissionsExportUtils.ts

import { Lead } from "@/features/admissions/leads/types/lead";
import { Application } from "@/features/admissions/types/admissions";
import type { StudentEnrollment } from "@/features/students-guardians/students/types";
import {
  FunnelData,
  WeeklyInquiry,
  GradeDistribution,
} from "@/features/admissions/dashboard/services/admissionsAnalytics";

type ExportableTestRow = {
  id: string;
  applicationId: string;
  studentName: string;
  type: string;
  subject: string;
  date: string;
  time: string;
  location: string;
  proctor?: string;
  status: string;
  score?: number | null;
  maxScore?: number;
  notes?: string;
  gradeRequested?: string;
};

type ExportableInterviewRow = {
  id: string;
  applicationId: string;
  studentName: string;
  date: string;
  time: string;
  interviewer: string;
  location: string;
  status: string;
  rating?: number;
  notes?: string;
  gradeRequested?: string;
};

type ExportableDecisionRow = {
  applicationId: string;
  studentName: string;
  grade?: string;
  decision: string;
  reason: string;
  decisionDate: string;
  decidedBy: string;
};

type ExportableEnrollmentRow = {
  id: string;
  applicationId: string;
  studentName: string;
  grade: string;
  section: string;
  academicYear: string;
  startDate: string;
  enrolledDate: string;
  guardianName?: string;
  guardianPhone?: string;
  classroom?: string;
};

type ExportLocale = "en" | "ar";

function resolveExportLocale(locale?: string): ExportLocale {
  return locale === "ar" ? "ar" : "en";
}

function toLocaleDate(value: string, locale: ExportLocale) {
  return new Date(value).toLocaleDateString(locale === "ar" ? "ar" : "en-US");
}

function toLocaleDateTime(value: string, locale: ExportLocale) {
  return new Date(value).toLocaleString(locale === "ar" ? "ar" : "en-US");
}

function localizeRowKeys(
  row: Record<string, unknown>,
  locale: ExportLocale,
  labels: Record<string, string>,
): Record<string, unknown> {
  if (locale !== "ar") return row;

  const localized: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    localized[labels[key] || key] = value;
  });
  return localized;
}

function localizeLeadChannel(channel: string, locale: ExportLocale): string {
  if (locale !== "ar") return channel;
  const map: Record<string, string> = {
    "In-app": "داخل التطبيق",
    Referral: "إحالة",
    "Walk-in": "زيارة مباشرة",
    Other: "أخرى",
  };
  return map[channel] || channel;
}

function localizeLeadStatus(status: string, locale: ExportLocale): string {
  if (locale !== "ar") return status;
  const map: Record<string, string> = {
    New: "جديد",
    Contacted: "تم التواصل",
    Converted: "تم التحويل",
    Closed: "مغلق",
  };
  return map[status] || status;
}

function localizeAppStatus(status: string, locale: ExportLocale): string {
  if (locale !== "ar") return status;
  const map: Record<string, string> = {
    submitted: "مُرسل",
    documents_pending: "مستندات ناقصة",
    under_review: "قيد المراجعة",
    accepted: "مقبول",
    waitlisted: "قائمة انتظار",
    rejected: "مرفوض",
  };
  return map[status] || status;
}

function localizeSource(source: string, locale: ExportLocale): string {
  if (locale !== "ar") return source;
  const map: Record<string, string> = {
    in_app: "داخل التطبيق",
    referral: "إحالة",
    walk_in: "زيارة مباشرة",
    other: "أخرى",
  };
  return map[source] || source;
}

function localizeDecision(decision: string, locale: ExportLocale): string {
  if (locale !== "ar") return decision;
  const map: Record<string, string> = {
    accept: "قبول",
    waitlist: "قائمة انتظار",
    reject: "رفض",
  };
  return map[decision] || decision;
}

function localizeYesNo(value: boolean, locale: ExportLocale): string {
  if (locale !== "ar") return value ? "Yes" : "No";
  return value ? "نعم" : "لا";
}

/**
 * Convert data to CSV format with UTF-8 BOM for proper Excel Arabic support
 */
export function convertToCSV(
  data: Record<string, unknown>[],
  headers?: string[],
): string {
  if (data.length === 0) return "";

  const keys = headers || Object.keys(data[0]);

  // Create header row
  const headerRow = keys.join(",");

  // Create data rows
  const dataRows = data.map((row) =>
    keys
      .map((key) => {
        const value = row[key];
        // Handle null/undefined
        if (value === null || value === undefined) return "";
        // Handle strings with commas or quotes
        const stringValue = String(value);
        if (
          stringValue.includes(",") ||
          stringValue.includes('"') ||
          stringValue.includes("\n")
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(","),
  );

  // Add UTF-8 BOM for proper Excel Arabic support
  const BOM = "\uFEFF";
  return BOM + [headerRow, ...dataRows].join("\n");
}

/**
 * Format leads data for export
 */
export function formatLeadsForExport(leads: Lead[], locale?: string) {
  const exportLocale = resolveExportLocale(locale);
  return leads.map((lead) =>
    localizeRowKeys(
      {
        ID: lead.id,
        "Student Name": lead.studentName || "",
        "Guardian/Parent Name": lead.primaryContactName || lead.name || "",
        Phone: lead.phone,
        Email: lead.email || "",
        Channel: localizeLeadChannel(lead.channel, exportLocale),
        Status: localizeLeadStatus(lead.status, exportLocale),
        "Created At": toLocaleDateTime(lead.createdAt, exportLocale),
        Notes: lead.notes || "",
      },
      exportLocale,
      {
        ID: "المعرّف",
        "Student Name": "اسم الطالب",
        "Guardian/Parent Name": "اسم ولي الأمر",
        Phone: "الهاتف",
        Email: "البريد الإلكتروني",
        Channel: "القناة",
        Status: "الحالة",
        "Created At": "تاريخ الإنشاء",
        Notes: "ملاحظات",
      },
    ),
  );
}

/**
 * Format applications data for export
 */
export function formatApplicationsForExport(
  applications: Application[],
  locale?: string,
) {
  const exportLocale = resolveExportLocale(locale);
  return applications.map((app) =>
    localizeRowKeys(
      {
        "Application ID": app.id,
        "Lead ID": app.leadId || "",
        "Student Name":
          exportLocale === "ar"
            ? app.full_name_ar || app.studentName
            : app.studentName,
        "Student Name (Arabic)": app.full_name_ar,
        "Date of Birth": app.dateOfBirth || app.date_of_birth || "",
        Gender: app.gender,
        Nationality: app.nationality,
        "Grade Requested": app.gradeRequested,
        "Previous School": app.previousSchool || app.previous_school || "",
        "Guardian Name": app.guardianName,
        "Guardian Phone": app.guardianPhone,
        "Guardian Email": app.guardianEmail,
        Source: localizeSource(app.source || "", exportLocale),
        Status: localizeAppStatus(app.status, exportLocale),
        "Submitted Date": toLocaleDateTime(app.submittedDate, exportLocale),
        "Documents Complete": localizeYesNo(
          app.documents?.every((d) => d.status === "complete") ?? false,
          exportLocale,
        ),
        "Tests Count": app.tests?.length || 0,
        "Interviews Count": app.interviews?.length || 0,
        "Has Decision": localizeYesNo(!!app.decision, exportLocale),
      },
      exportLocale,
      {
        "Application ID": "رقم الطلب",
        "Lead ID": "رقم الاستفسار",
        "Student Name": "اسم الطالب",
        "Student Name (Arabic)": "اسم الطالب (عربي)",
        "Date of Birth": "تاريخ الميلاد",
        Gender: "الجنس",
        Nationality: "الجنسية",
        "Grade Requested": "الصف المطلوب",
        "Previous School": "المدرسة السابقة",
        "Guardian Name": "اسم ولي الأمر",
        "Guardian Phone": "هاتف ولي الأمر",
        "Guardian Email": "بريد ولي الأمر",
        Source: "المصدر",
        Status: "الحالة",
        "Submitted Date": "تاريخ التقديم",
        "Documents Complete": "اكتمال المستندات",
        "Tests Count": "عدد الاختبارات",
        "Interviews Count": "عدد المقابلات",
        "Has Decision": "يوجد قرار",
      },
    ),
  );
}

/**
 * Format decisions data for export
 */
export function formatDecisionsForExport(
  applications: Application[],
  decisions?: {
    id: string;
    applicationId: string;
    decision: string;
    reason: string;
    decisionDate: string;
    decidedBy: string;
  }[],
  locale?: string,
): Record<string, unknown>[] {
  const exportLocale = resolveExportLocale(locale);
  // If decisions array is provided (new linked structure), use it
  if (decisions) {
    return decisions.map((decision) => {
      const app = applications.find((a) => a.id === decision.applicationId);
      return localizeRowKeys(
        {
          "Application ID": decision.applicationId,
          "Student Name":
            exportLocale === "ar"
              ? app?.full_name_ar || app?.studentName || ""
              : app?.studentName || "",
          "Grade Requested": app?.gradeRequested || "",
          Decision: localizeDecision(decision.decision, exportLocale),
          Reason: decision.reason,
          "Decision Date": toLocaleDateTime(decision.decisionDate, exportLocale),
          "Decided By": decision.decidedBy,
        },
        exportLocale,
        {
          "Application ID": "رقم الطلب",
          "Student Name": "اسم الطالب",
          "Grade Requested": "الصف المطلوب",
          Decision: "القرار",
          Reason: "السبب",
          "Decision Date": "تاريخ القرار",
          "Decided By": "متخذ القرار",
        },
      );
    });
  }

  // Fallback to old structure (app.decision)
  return applications
    .filter((app) => app.decision)
    .map((app) =>
      localizeRowKeys(
        {
          "Application ID": app.id,
          "Student Name":
            exportLocale === "ar"
              ? app.full_name_ar || app.studentName
              : app.studentName,
          "Grade Requested": app.gradeRequested,
          Decision: localizeDecision(app.decision!.decision, exportLocale),
          Reason: app.decision!.reason,
          "Decision Date": toLocaleDateTime(
            app.decision!.decisionDate,
            exportLocale,
          ),
          "Decided By": app.decision!.decidedBy,
        },
        exportLocale,
        {
          "Application ID": "رقم الطلب",
          "Student Name": "اسم الطالب",
          "Grade Requested": "الصف المطلوب",
          Decision: "القرار",
          Reason: "السبب",
          "Decision Date": "تاريخ القرار",
          "Decided By": "متخذ القرار",
        },
      ),
    );
}

/**
 * Format enrollments data for export
 */
export function formatEnrollmentsForExport(
  enrollments: StudentEnrollment[],
  locale?: string,
): Record<string, unknown>[] {
  const exportLocale = resolveExportLocale(locale);
  return enrollments.map((enrollment) =>
      localizeRowKeys(
        {
          "Enrollment ID": enrollment.enrollmentId,
          "Student ID": enrollment.studentId,
          Grade: enrollment.grade,
          Section: enrollment.section,
          Classroom: enrollment.classroom || "",
          "Academic Year": enrollment.academicYear,
          "Enrolled Date": toLocaleDateTime(
            enrollment.enrollmentDate,
            exportLocale,
          ),
          Status: enrollment.status,
        },
        exportLocale,
        {
          "Enrollment ID": "رقم التسجيل",
          "Student ID": "رقم الطالب",
          Grade: "الصف",
          Section: "الشعبة",
          Classroom: "الفصل",
          "Academic Year": "السنة الدراسية",
          "Enrolled Date": "تاريخ التسجيل",
          Status: "الحالة",
        },
      ),
    );
}

/**
 * Format funnel data for export
 */
export function formatFunnelForExport(funnel: FunnelData, locale?: string) {
  const exportLocale = resolveExportLocale(locale);
  const leadsToApps =
    funnel.leads > 0
      ? ((funnel.applications / funnel.leads) * 100).toFixed(1)
      : "0.0";
  const appsToAccepted =
    funnel.applications > 0
      ? ((funnel.accepted / funnel.applications) * 100).toFixed(1)
      : "0.0";
  const acceptedToEnrolled =
    funnel.accepted > 0
      ? ((funnel.enrolled / funnel.accepted) * 100).toFixed(1)
      : "0.0";
  const overallConversion =
    funnel.leads > 0
      ? ((funnel.enrolled / funnel.leads) * 100).toFixed(1)
      : "0.0";

  return [
    localizeRowKeys({
      Stage: exportLocale === "ar" ? "الاستفسارات" : "Leads",
      Count: funnel.leads,
      "Conversion to Next": `${leadsToApps}%`,
    }, exportLocale, { Stage: "المرحلة", Count: "العدد", "Conversion to Next": "التحويل للمرحلة التالية" }),
    localizeRowKeys({
      Stage: exportLocale === "ar" ? "الطلبات" : "Applications",
      Count: funnel.applications,
      "Conversion to Next": `${appsToAccepted}%`,
    }, exportLocale, { Stage: "المرحلة", Count: "العدد", "Conversion to Next": "التحويل للمرحلة التالية" }),
    localizeRowKeys({
      Stage: exportLocale === "ar" ? "المقبولون" : "Accepted",
      Count: funnel.accepted,
      "Conversion to Next": `${acceptedToEnrolled}%`,
    }, exportLocale, { Stage: "المرحلة", Count: "العدد", "Conversion to Next": "التحويل للمرحلة التالية" }),
    localizeRowKeys({
      Stage: exportLocale === "ar" ? "المسجلون" : "Enrolled",
      Count: funnel.enrolled,
      "Conversion to Next": exportLocale === "ar" ? "غير متاح" : "N/A",
    }, exportLocale, { Stage: "المرحلة", Count: "العدد", "Conversion to Next": "التحويل للمرحلة التالية" }),
    localizeRowKeys({
      Stage: exportLocale === "ar" ? "التحويل الكلي" : "Overall Conversion",
      Count: `${overallConversion}%`,
      "Conversion to Next":
        exportLocale === "ar"
          ? `${funnel.enrolled} من ${funnel.leads}`
          : `${funnel.enrolled} of ${funnel.leads}`,
    }, exportLocale, { Stage: "المرحلة", Count: "العدد", "Conversion to Next": "التحويل للمرحلة التالية" }),
  ];
}

/**
 * Format weekly inquiries for export
 */
export function formatWeeklyInquiriesForExport(
  data: WeeklyInquiry[],
  locale?: string,
) {
  const exportLocale = resolveExportLocale(locale);
  return data.map((item) =>
    localizeRowKeys(
      {
        "Week Starting": item.weekStart,
        "Lead Count": item.count,
      },
      exportLocale,
      {
        "Week Starting": "بداية الأسبوع",
        "Lead Count": "عدد الاستفسارات",
      },
    ),
  );
}

/**
 * Format grade distribution for export
 */
export function formatGradeDistributionForExport(
  data: GradeDistribution[],
  locale?: string,
) {
  const exportLocale = resolveExportLocale(locale);
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return data.map((item) =>
    localizeRowKeys(
      {
        Grade: item.grade,
        "Application Count": item.count,
        Percentage:
          total > 0 ? `${((item.count / total) * 100).toFixed(1)}%` : "0%",
      },
      exportLocale,
      {
        Grade: "الصف",
        "Application Count": "عدد الطلبات",
        Percentage: "النسبة",
      },
    ),
  );
}

/**
 * Generate filename with date range
 */
export function generateExportFilename(
  type: string,
  format: string,
  startDate?: string,
  endDate?: string,
): string {
  const timestamp = new Date().toISOString().split("T")[0];

  if (startDate && endDate) {
    const start = new Date(startDate).toISOString().split("T")[0];
    const end = new Date(endDate).toISOString().split("T")[0];
    return `admissions-${type}-${start}_to_${end}.${format}`;
  }

  return `admissions-${type}-${timestamp}.${format}`;
}

/**
 * Create analytics JSON export
 */
export function createAnalyticsJSON(
  funnel: FunnelData,
  weeklyInquiries: WeeklyInquiry[],
  gradeDistribution: GradeDistribution[],
  dateRange: { from: string; to: string },
) {
  return {
    exportDate: new Date().toISOString(),
    dateRange,
    funnel: {
      leads: funnel.leads,
      applications: funnel.applications,
      accepted: funnel.accepted,
      enrolled: funnel.enrolled,
      conversions: {
        leadsToApplications:
          funnel.leads > 0
            ? ((funnel.applications / funnel.leads) * 100).toFixed(1) + "%"
            : "0%",
        applicationsToAccepted:
          funnel.applications > 0
            ? ((funnel.accepted / funnel.applications) * 100).toFixed(1) + "%"
            : "0%",
        acceptedToEnrolled:
          funnel.accepted > 0
            ? ((funnel.enrolled / funnel.accepted) * 100).toFixed(1) + "%"
            : "0%",
        overall:
          funnel.leads > 0
            ? ((funnel.enrolled / funnel.leads) * 100).toFixed(1) + "%"
            : "0%",
      },
    },
    weeklyInquiries: weeklyInquiries.map((item) => ({
      weekStart: item.weekStart,
      count: item.count,
    })),
    gradeDistribution: gradeDistribution.map((item) => ({
      grade: item.grade,
      count: item.count,
      percentage:
        gradeDistribution.reduce((sum, g) => sum + g.count, 0) > 0
          ? (
              (item.count /
                gradeDistribution.reduce((sum, g) => sum + g.count, 0)) *
              100
            ).toFixed(1) + "%"
          : "0%",
    })),
  };
}

/**
 * Format tests data for export
 */
export function formatTestsForExport(
  applications: Application[],
  locale?: string,
): Record<string, unknown>[] {
  const exportLocale = resolveExportLocale(locale);
  const tests: Record<string, unknown>[] = [];

  applications.forEach((app) => {
    app.tests?.forEach((test) => {
      tests.push(
        localizeRowKeys(
          {
            "Test ID": test.id,
            "Application ID": app.id,
            "Student Name":
              exportLocale === "ar"
                ? app.full_name_ar || app.studentName
                : app.studentName,
            "Grade Requested": app.gradeRequested,
            Type: test.type,
            Subject: test.subject,
            Date: toLocaleDate(test.date, exportLocale),
            Time: test.time,
            Location: test.location,
            Proctor: test.proctor || "",
            Status: test.status,
            Score: test.score != null ? test.score : "",
            "Max Score": test.maxScore !== undefined ? test.maxScore : "",
            Percentage:
              test.score != null && test.maxScore
                ? `${((test.score / test.maxScore) * 100).toFixed(1)}%`
                : "",
            Notes: test.notes || "",
          },
          exportLocale,
          {
            "Test ID": "رقم الاختبار",
            "Application ID": "رقم الطلب",
            "Student Name": "اسم الطالب",
            "Grade Requested": "الصف المطلوب",
            Type: "النوع",
            Subject: "المادة",
            Date: "التاريخ",
            Time: "الوقت",
            Location: "الموقع",
            Proctor: "المراقب",
            Status: "الحالة",
            Score: "النتيجة",
            "Max Score": "الدرجة القصوى",
            Percentage: "النسبة",
            Notes: "ملاحظات",
          },
        ),
      );
    });
  });

  return tests;
}

/**
 * Format interviews data for export
 */
export function formatInterviewsForExport(
  applications: Application[],
  locale?: string,
): Record<string, unknown>[] {
  const exportLocale = resolveExportLocale(locale);
  const interviews: Record<string, unknown>[] = [];

  applications.forEach((app) => {
    app.interviews?.forEach((interview) => {
      interviews.push(
        localizeRowKeys(
          {
            "Interview ID": interview.id,
            "Application ID": app.id,
            "Student Name":
              exportLocale === "ar"
                ? app.full_name_ar || app.studentName
                : app.studentName,
            "Grade Requested": app.gradeRequested,
            Date: toLocaleDate(interview.date, exportLocale),
            Time: interview.time,
            Interviewer: interview.interviewer,
            Location: interview.location,
            Status: interview.status,
            Rating:
              interview.rating !== undefined ? `${interview.rating}/5` : "",
            Notes: interview.notes || "",
          },
          exportLocale,
          {
            "Interview ID": "رقم المقابلة",
            "Application ID": "رقم الطلب",
            "Student Name": "اسم الطالب",
            "Grade Requested": "الصف المطلوب",
            Date: "التاريخ",
            Time: "الوقت",
            Interviewer: "المقابل",
            Location: "الموقع",
            Status: "الحالة",
            Rating: "التقييم",
            Notes: "ملاحظات",
          },
        ),
      );
    });
  });

  return interviews;
}

export function formatVisibleTestsForExport(
  tests: ExportableTestRow[],
  locale?: string,
): Record<string, unknown>[] {
  const exportLocale = resolveExportLocale(locale);
  return tests.map((test) =>
    localizeRowKeys(
      {
        "Test ID": test.id,
        "Application ID": test.applicationId,
        "Student Name": test.studentName,
        "Grade Requested": test.gradeRequested || "",
        Type: test.type,
        Subject: test.subject,
        Date: toLocaleDate(test.date, exportLocale),
        Time: test.time,
        Location: test.location,
        Proctor: test.proctor || "",
        Status: test.status,
        Score: test.score != null ? test.score : "",
        "Max Score": test.maxScore !== undefined ? test.maxScore : "",
        Percentage:
          test.score != null && test.maxScore
            ? `${((test.score / test.maxScore) * 100).toFixed(1)}%`
            : "",
        Notes: test.notes || "",
      },
      exportLocale,
      {
        "Test ID": "رقم الاختبار",
        "Application ID": "رقم الطلب",
        "Student Name": "اسم الطالب",
        "Grade Requested": "الصف المطلوب",
        Type: "النوع",
        Subject: "المادة",
        Date: "التاريخ",
        Time: "الوقت",
        Location: "الموقع",
        Proctor: "المراقب",
        Status: "الحالة",
        Score: "النتيجة",
        "Max Score": "الدرجة القصوى",
        Percentage: "النسبة",
        Notes: "ملاحظات",
      },
    ),
  );
}

export function formatVisibleInterviewsForExport(
  interviews: ExportableInterviewRow[],
  locale?: string,
): Record<string, unknown>[] {
  const exportLocale = resolveExportLocale(locale);
  return interviews.map((interview) =>
    localizeRowKeys(
      {
        "Interview ID": interview.id,
        "Application ID": interview.applicationId,
        "Student Name": interview.studentName,
        "Grade Requested": interview.gradeRequested || "",
        Date: toLocaleDate(interview.date, exportLocale),
        Time: interview.time,
        Interviewer: interview.interviewer,
        Location: interview.location,
        Status: interview.status,
        Rating:
          interview.rating !== undefined ? `${interview.rating}/5` : "",
        Notes: interview.notes || "",
      },
      exportLocale,
      {
        "Interview ID": "رقم المقابلة",
        "Application ID": "رقم الطلب",
        "Student Name": "اسم الطالب",
        "Grade Requested": "الصف المطلوب",
        Date: "التاريخ",
        Time: "الوقت",
        Interviewer: "المقابل",
        Location: "الموقع",
        Status: "الحالة",
        Rating: "التقييم",
        Notes: "ملاحظات",
      },
    ),
  );
}

export function formatVisibleDecisionsForExport(
  decisions: ExportableDecisionRow[],
  locale?: string,
): Record<string, unknown>[] {
  const exportLocale = resolveExportLocale(locale);
  return decisions.map((decision) =>
    localizeRowKeys(
      {
        "Application ID": decision.applicationId,
        "Student Name": decision.studentName,
        "Grade Requested": decision.grade || "",
        Decision: localizeDecision(decision.decision, exportLocale),
        Reason: decision.reason,
        "Decision Date": toLocaleDateTime(decision.decisionDate, exportLocale),
        "Decided By": decision.decidedBy,
      },
      exportLocale,
      {
        "Application ID": "رقم الطلب",
        "Student Name": "اسم الطالب",
        "Grade Requested": "الصف المطلوب",
        Decision: "القرار",
        Reason: "السبب",
        "Decision Date": "تاريخ القرار",
        "Decided By": "متخذ القرار",
      },
    ),
  );
}

export function formatVisibleEnrollmentsForExport(
  enrollments: ExportableEnrollmentRow[],
  locale?: string,
): Record<string, unknown>[] {
  const exportLocale = resolveExportLocale(locale);
  return enrollments.map((enrollment) =>
    localizeRowKeys(
      {
        "Enrollment ID": enrollment.id,
        "Application ID": enrollment.applicationId,
        "Student Name": enrollment.studentName,
        Grade: enrollment.grade,
        Section: enrollment.section,
        Classroom: enrollment.classroom || "",
        "Academic Year": enrollment.academicYear,
        "Start Date": toLocaleDate(enrollment.startDate, exportLocale),
        "Enrolled Date": toLocaleDate(enrollment.enrolledDate, exportLocale),
        "Guardian Name": enrollment.guardianName || "",
        "Guardian Phone": enrollment.guardianPhone || "",
      },
      exportLocale,
      {
        "Enrollment ID": "رقم التسجيل",
        "Application ID": "رقم الطلب",
        "Student Name": "اسم الطالب",
        Grade: "الصف",
        Section: "الشعبة",
        Classroom: "الفصل",
        "Academic Year": "السنة الدراسية",
        "Start Date": "تاريخ البداية",
        "Enrolled Date": "تاريخ التسجيل",
        "Guardian Name": "اسم ولي الأمر",
        "Guardian Phone": "هاتف ولي الأمر",
      },
    ),
  );
}
