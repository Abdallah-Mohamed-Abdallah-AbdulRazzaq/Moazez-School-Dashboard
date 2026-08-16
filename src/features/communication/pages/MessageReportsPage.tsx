"use client";

import { useLocale } from "next-intl";
import { RefreshCw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import ReportFilters from "@/features/communication/components/safety/ReportFilters";
import ReportsTable from "@/features/communication/components/safety/ReportsTable";
import { useMessageReports } from "@/features/communication/hooks/useMessageReports";

const labels = {
  en: {
    title: "Safety Reports",
    description:
      "Review message reports, triage open cases, and track moderation outcomes.",
    refresh: "Refresh",
    loading: "Loading reports...",
    errorTitle: "Unable to load reports",
    retry: "Retry",
    status: "Status",
    open: "Open",
    inReview: "In review",
    resolved: "Resolved",
    reason: "Reason",
    reasonPlaceholder: "Filter by reason",
    clear: "Clear",
    emptyTitle: "No reports found",
    emptyDescription:
      "There are no message reports for this filter. New reports will appear here.",
    report: "Report",
    reporter: "Reporter",
    createdAt: "Created",
    view: "View",
    unknown: "Unknown",
    countLabel: "report",
    countLabelPlural: "reports",
  },
  ar: {
    title: "بلاغات الأمان",
    description: "راجع بلاغات الرسائل وفرز الحالات المفتوحة وتتبع قرارات الإشراف.",
    refresh: "تحديث",
    loading: "جار تحميل البلاغات...",
    errorTitle: "تعذر تحميل البلاغات",
    retry: "إعادة المحاولة",
    status: "الحالة",
    open: "مفتوح",
    inReview: "قيد المراجعة",
    resolved: "محلول",
    reason: "السبب",
    reasonPlaceholder: "التصفية حسب السبب",
    clear: "مسح",
    emptyTitle: "لا توجد بلاغات",
    emptyDescription: "لا توجد بلاغات رسائل لهذا المرشح. ستظهر البلاغات الجديدة هنا.",
    report: "البلاغ",
    reporter: "المبلغ",
    createdAt: "تاريخ الإنشاء",
    view: "عرض",
    unknown: "غير معروف",
    countLabel: "بلاغ",
    countLabelPlural: "بلاغات",
  },
};

type LocaleKey = keyof typeof labels;

const reportPageLabels = {
  en: {
    ...labels.en,
    allStatuses: "All statuses",
    pending: "Pending",
    dismissed: "Dismissed",
    allReasons: "All reasons",
    spam: "Spam",
    harassment: "Harassment",
    bullying: "Bullying",
    abusiveLanguage: "Abusive language",
    inappropriateContent: "Inappropriate content",
    safety: "Safety concern",
    privacy: "Privacy concern",
    other: "Other",
    reportedUser: "Reported user",
    message: "Message",
    descriptionLabel: "Description",
    previous: "Previous",
    next: "Next",
    page: "Page {page} of {totalPages}",
  },
  ar: {
    title: "بلاغات الأمان",
    description: "راجع بلاغات الرسائل وفرز الحالات المفتوحة وتابع نتائج الإشراف.",
    refresh: "تحديث",
    loading: "جارٍ تحميل البلاغات...",
    errorTitle: "تعذّر تحميل البلاغات",
    retry: "إعادة المحاولة",
    status: "الحالة",
    allStatuses: "كل الحالات",
    open: "مفتوح",
    pending: "قيد الانتظار",
    inReview: "قيد المراجعة",
    resolved: "تم الحل",
    dismissed: "مرفوض",
    reason: "السبب",
    reasonPlaceholder: "التصفية حسب السبب",
    allReasons: "كل الأسباب",
    spam: "رسائل مزعجة",
    harassment: "تحرش",
    bullying: "تنمر",
    abusiveLanguage: "لغة مسيئة",
    inappropriateContent: "محتوى غير مناسب",
    safety: "مشكلة تتعلق بالسلامة",
    privacy: "مشكلة تتعلق بالخصوصية",
    other: "أخرى",
    clear: "مسح",
    emptyTitle: "لا توجد بلاغات",
    emptyDescription: "لا توجد بلاغات رسائل مطابقة للمرشحات الحالية.",
    report: "البلاغ",
    reporter: "المُبلّغ",
    reportedUser: "المستخدم المُبلّغ عنه",
    message: "الرسالة",
    descriptionLabel: "الوصف",
    createdAt: "تاريخ الإنشاء",
    view: "عرض",
    unknown: "غير معروف",
    countLabel: "بلاغ",
    countLabelPlural: "بلاغات",
    previous: "السابق",
    next: "التالي",
    page: "الصفحة {page} من {totalPages}",
  },
} as const;

type ReportPageLabels = {
  [Key in keyof typeof reportPageLabels.en]: string;
};

export default function MessageReportsPage() {
  const locale = useLocale() as LocaleKey;
  const t: ReportPageLabels =
    locale === "ar" ? reportPageLabels.ar : reportPageLabels.en;
  const {
    error,
    filters,
    isLoading,
    isRefreshing,
    refresh,
    reports,
    pageSize,
    setFilters,
    total,
  } = useMessageReports();
  if (isLoading) {
    return <CommunicationLoadingState label={t.loading} />;
  }

  return (
    <div className="space-y-6">
      <CommunicationPageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button
            type="button"
            variant="secondary"
            loading={isRefreshing}
            onClick={() => void refresh()}
            leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          >
            {t.refresh}
          </Button>
        }
      />
      <CommunicationTabs />

      <ReportFilters
        filters={filters}
        onChange={setFilters}
        labels={{
          status: t.status,
          allStatuses: t.allStatuses,
          open: t.open,
          pending: t.pending,
          inReview: t.inReview,
          resolved: t.resolved,
          dismissed: t.dismissed,
          reason: t.reason,
          allReasons: t.allReasons,
          spam: t.spam,
          harassment: t.harassment,
          bullying: t.bullying,
          abusiveLanguage: t.abusiveLanguage,
          inappropriateContent: t.inappropriateContent,
          safety: t.safety,
          privacy: t.privacy,
          other: t.other,
          clear: t.clear,
        }}
      />

      {error ? (
        <CommunicationErrorState
          title={t.errorTitle}
          message={error}
          action={
            <Button type="button" variant="secondary" onClick={() => void refresh()}>
              {t.retry}
            </Button>
          }
        />
      ) : null}

      <div className="text-sm text-slate-500">
        {total} {total === 1 ? t.countLabel : t.countLabelPlural}
      </div>

      <ReportsTable
        reports={reports}
        locale={locale}
        isLoading={isRefreshing}
        page={filters.page}
        pageSize={pageSize}
        total={total}
        onPageChange={(page) => setFilters({ ...filters, page })}
        onPageSizeChange={(limit) => setFilters({ ...filters, limit, page: 1 })}
        labels={{
          emptyTitle: t.emptyTitle,
          emptyDescription: t.emptyDescription,
          report: t.report,
          reporter: t.reporter,
          reportedUser: t.reportedUser,
          message: t.message,
          reason: t.reason,
          spam: t.spam,
          harassment: t.harassment,
          bullying: t.bullying,
          abusiveLanguage: t.abusiveLanguage,
          inappropriateContent: t.inappropriateContent,
          safety: t.safety,
          privacy: t.privacy,
          other: t.other,
          description: t.descriptionLabel,
          status: t.status,
          createdAt: t.createdAt,
          open: t.open,
          pending: t.pending,
          inReview: t.inReview,
          resolved: t.resolved,
          dismissed: t.dismissed,
          view: t.view,
          unknown: t.unknown,
        }}
      />
    </div>
  );
}
