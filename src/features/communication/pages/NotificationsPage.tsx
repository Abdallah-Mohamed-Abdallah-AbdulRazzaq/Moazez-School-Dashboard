"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { CheckCheck, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import { useToast } from "@/components/ui/toast/Toast";
import NotificationDetailsDrawer from "@/features/communication/components/notifications/NotificationDetailsDrawer";
import NotificationFilters from "@/features/communication/components/notifications/NotificationFilters";
import NotificationList from "@/features/communication/components/notifications/NotificationList";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationDetails } from "@/features/communication/hooks/useNotificationDetails";
import { useNotifications } from "@/features/communication/hooks/useNotifications";

const labels = {
  en: {
    title: "Notifications",
    description:
      "Review notification inbox items across communication channels.",
    refresh: "Refresh",
    markAllRead: "Mark All Read",
    loading: "Loading notifications...",
    errorTitle: "Unable to load notifications",
    retry: "Retry",
    status: "Status",
    all: "All",
    unread: "Unread",
    read: "Read",
    archived: "Archived",
    priority: "Priority",
    low: "Low",
    normal: "Normal",
    high: "High",
    urgent: "Urgent",
    sourceModule: "Source module",
    sourceType: "Source type",
    sourceId: "Source",
    recipientUserId: "Recipient",
    selectSourceTypeFirst: "Select a source type first",
    createdFrom: "Created from",
    createdTo: "Created to",
    clear: "Clear",
    emptyTitle: "No notifications found",
    emptyDescription:
      "There are no notifications for this filter yet. New communication updates will appear here.",
    untitled: "Untitled notification",
    noBody: "No notification body.",
    type: "Type",
    viewDetails: "View details",
    notificationDetails: "Notification details",
    close: "Close",
    advanced: "Advanced",
    metadata: "Metadata",
    source: "Source",
    recipient: "Recipient",
    provider: "Provider",
    errorMessage: "Error message",
    id: "ID",
    createdAt: "Created at",
    readAt: "Read at",
    notificationTitle: "Title",
    body: "Body",
    deliveryStatus: "Delivery status",
    failedAt: "Failed",
    archivedAt: "Archived",
    archive: "Archive",
    markRead: "Mark read",
    countLabel: "notification",
    countLabelPlural: "notifications",
    unreadLabel: "unread",
    pageLabel: "Page",
    previousPage: "Previous",
    nextPage: "Next",
    rowsPerPage: "Rows per page",
    defaultLimit: "Default",
    markedAllRead: "All notifications marked read.",
    markedRead: "Notification marked read.",
    archivedNotification: "Notification archived.",
    mutationFailed: "Action failed. Please try again.",
  },
  ar: {
    title: "الإشعارات",
    description: "راجع إشعارات التواصل عبر القنوات.",
    refresh: "تحديث",
    markAllRead: "تعليم الكل كمقروء",
    loading: "جار تحميل الإشعارات...",
    errorTitle: "تعذر تحميل الإشعارات",
    retry: "إعادة المحاولة",
    status: "الحالة",
    all: "الكل",
    unread: "غير مقروء",
    read: "مقروء",
    archived: "مؤرشف",
    priority: "الأولوية",
    low: "منخفضة",
    normal: "عادية",
    high: "عالية",
    urgent: "عاجلة",
    sourceModule: "وحدة المصدر",
    sourceType: "نوع المصدر",
    sourceId: "المصدر",
    recipientUserId: "المستلم",
    selectSourceTypeFirst: "اختر نوع المصدر أولاً",
    createdFrom: "أنشئت من",
    createdTo: "أنشئت إلى",
    clear: "مسح",
    emptyTitle: "لا توجد إشعارات",
    emptyDescription:
      "لا توجد إشعارات لهذا المرشح بعد. ستظهر تحديثات التواصل هنا.",
    untitled: "إشعار بدون عنوان",
    noBody: "لا يوجد محتوى للإشعار.",
    type: "النوع",
    viewDetails: "عرض التفاصيل",
    notificationDetails: "تفاصيل الإشعار",
    close: "إغلاق",
    advanced: "متقدم",
    metadata: "البيانات الإضافية",
    source: "المصدر",
    recipient: "المستلم",
    provider: "المزود",
    errorMessage: "رسالة الخطأ",
    id: "المعرف",
    createdAt: "تم الإنشاء في",
    readAt: "تمت القراءة في",
    notificationTitle: "العنوان",
    body: "المحتوى",
    deliveryStatus: "حالة التسليم",
    failedAt: "فشل في",
    archivedAt: "تمت الأرشفة",
    archive: "أرشفة",
    markRead: "تعليم كمقروء",
    countLabel: "إشعار",
    countLabelPlural: "إشعارات",
    unreadLabel: "غير مقروء",
    pageLabel: "الصفحة",
    previousPage: "السابق",
    nextPage: "التالي",
    rowsPerPage: "عدد الصفوف لكل صفحة",
    defaultLimit: "الافتراضي",
    markedAllRead: "تم تعليم كل الإشعارات كمقروءة.",
    markedRead: "تم تعليم الإشعار كمقروء.",
    archivedNotification: "تمت أرشفة الإشعار.",
    mutationFailed: "فشل الإجراء. حاول مرة أخرى.",
  },
};

type LocaleKey = keyof typeof labels;

export default function NotificationsPage() {
  const locale = useLocale() as LocaleKey;
  const searchParams = useSearchParams();
  const t = labels[locale] ?? labels.en;
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const notificationsState = useNotifications();
  const notificationDetailsState = useNotificationDetails();

  const allLoadedNotificationsOwned =
    notificationsState.notifications.length > 0 &&
    notificationsState.notifications.every(
      (n) =>
        user?.id &&
        (n.recipientUserId === user.id || n.userId === user.id)
    );
  const { open: openNotificationDetails } = notificationDetailsState;
  const openedRouteNotificationIdRef = useRef<string | null>(null);
  const routeNotificationId = searchParams.get("notificationId");
  const notificationPage = notificationsState.pagination.page;
  const notificationLimit = notificationsState.pagination.limit;
  const notificationTotalPages = notificationsState.pagination.totalPages;
  const canGoPrevious = notificationPage > 1;
  const canGoNext =
    typeof notificationTotalPages === "number"
      ? notificationPage < notificationTotalPages
      : notificationsState.notifications.length > 0;

  useEffect(() => {
    if (
      !routeNotificationId ||
      openedRouteNotificationIdRef.current === routeNotificationId
    ) {
      return;
    }

    openedRouteNotificationIdRef.current = routeNotificationId;
    openNotificationDetails(routeNotificationId);
  }, [openNotificationDetails, routeNotificationId]);

  const refreshAll = () => {
    void notificationsState.refresh();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsState.markAllRead();
      showSuccess(t.markedAllRead);
    } catch {
      showError(t.mutationFailed);
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    try {
      await notificationsState.markRead(notificationId);
      showSuccess(t.markedRead);
    } catch {
      showError(t.mutationFailed);
    }
  };

  const handleArchive = async (notificationId: string) => {
    try {
      await notificationsState.archive(notificationId);
      showSuccess(t.archivedNotification);
    } catch {
      showError(t.mutationFailed);
    }
  };

  const handleDrawerMarkRead = async (notificationId: string) => {
    await handleMarkRead(notificationId);
    await notificationDetailsState.refresh().catch(() => undefined);
  };

  const handleDrawerArchive = async (notificationId: string) => {
    await handleArchive(notificationId);
    await notificationDetailsState.refresh().catch(() => undefined);
  };

  if (notificationsState.isLoading) {
    return <CommunicationLoadingState label={t.loading} />;
  }

  return (
    <div className="space-y-6">
      <CommunicationPageHeader
        title={t.title}
        description={t.description}
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              loading={notificationsState.isRefreshing}
              onClick={refreshAll}
              leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              {t.refresh}
            </Button>
            {allLoadedNotificationsOwned && (
              <Button
                type="button"
                disabled={notificationsState.unreadCount === 0}
                loading={notificationsState.isMutating}
                onClick={() => void handleMarkAllRead()}
                leftIcon={<CheckCheck className="h-4 w-4" aria-hidden="true" />}
              >
                {t.markAllRead}
              </Button>
            )}
          </>
        }
      />
      <CommunicationTabs />

      <NotificationFilters
        filters={notificationsState.filters}
        onChange={notificationsState.setFilters}
        labels={{
          status: t.status,
          all: t.all,
          unread: t.unread,
          read: t.read,
          archived: t.archived,
          priority: t.priority,
          low: t.low,
          normal: t.normal,
          high: t.high,
          urgent: t.urgent,
          type: t.type,
          sourceModule: t.sourceModule,
          sourceType: t.sourceType,
          sourceId: t.sourceId,
          recipientUserId: t.recipientUserId,
          selectSourceTypeFirst: t.selectSourceTypeFirst,
          createdFrom: t.createdFrom,
          createdTo: t.createdTo,
          clear: t.clear,
        }}
      />

      {notificationsState.error ? (
        <CommunicationErrorState
          title={t.errorTitle}
          message={notificationsState.error}
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => void notificationsState.refresh()}
            >
              {t.retry}
            </Button>
          }
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <span>
          {notificationsState.total}{" "}
          {notificationsState.total === 1 ? t.countLabel : t.countLabelPlural}
        </span>
        <span>
          {notificationsState.unreadCount} {t.unreadLabel}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="text-sm font-medium text-slate-600">
          {t.pageLabel} {notificationPage}
          {notificationTotalPages ? ` / ${notificationTotalPages}` : ""}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-44">
            <Select
              label={t.rowsPerPage}
              selectSize="sm"
              value={notificationLimit ? String(notificationLimit) : ""}
              onChange={(value) =>
                notificationsState.setLimit(value ? Number(value) : undefined)
              }
              options={[
                { value: "", label: t.defaultLimit },
                { value: "25", label: "25" },
                { value: "50", label: "50" },
                { value: "100", label: "100" },
              ]}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={!canGoPrevious || notificationsState.isRefreshing}
            onClick={() => notificationsState.setPage(notificationPage - 1)}
            leftIcon={<ChevronLeft className="h-4 w-4" aria-hidden="true" />}
          >
            {t.previousPage}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!canGoNext || notificationsState.isRefreshing}
            onClick={() => notificationsState.setPage(notificationPage + 1)}
            rightIcon={<ChevronRight className="h-4 w-4" aria-hidden="true" />}
          >
            {t.nextPage}
          </Button>
        </div>
      </div>

      <NotificationList
        notifications={notificationsState.notifications}
        locale={locale}
        currentUserId={user?.id}
        labels={{
          emptyTitle: t.emptyTitle,
          emptyDescription: t.emptyDescription,
          unread: t.unread,
          read: t.read,
          untitled: t.untitled,
          noBody: t.noBody,
          type: t.type,
          viewDetails: t.viewDetails,
          archive: t.archive,
          markRead: t.markRead,
          archived: t.archived,
        }}
        isMutating={notificationsState.isMutating}
        onArchive={(notificationId) => void handleArchive(notificationId)}
        onMarkRead={(notificationId) => void handleMarkRead(notificationId)}
        onViewDetails={notificationDetailsState.open}
      />

      <NotificationDetailsDrawer
        open={Boolean(notificationDetailsState.selectedNotificationId)}
        notification={notificationDetailsState.notification}
        currentUserId={user?.id}
        isLoading={notificationDetailsState.isLoading}
        isMutating={notificationsState.isMutating}
        error={notificationDetailsState.error}
        onClose={notificationDetailsState.close}
        onMarkRead={(notificationId) =>
          void handleDrawerMarkRead(notificationId)
        }
        onArchive={(notificationId) => void handleDrawerArchive(notificationId)}
        labels={{
          title: t.notificationDetails,
          close: t.close,
          markRead: t.markRead,
          archive: t.archive,
          loading: t.loading,
          errorTitle: t.errorTitle,
          id: t.id,
          notificationTitle: t.notificationTitle,
          body: t.body,
          type: t.type,
          status: t.status,
          priority: t.priority,
          sourceModule: t.sourceModule,
          sourceType: t.sourceType,
          sourceId: t.sourceId,
          recipientUserId: t.recipientUserId,
          createdAt: t.createdAt,
          readAt: t.readAt,
          archivedAt: t.archivedAt,
          advanced: t.advanced,
          metadata: t.metadata,
        }}
      />
    </div>
  );
}
