"use client";

import { useMemo } from "react";
import { Eye, RefreshCw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import NotificationDeliveryFilters from "@/features/communication/components/notifications/NotificationDeliveryFilters";
import NotificationDeliveryDetailsDrawer from "@/features/communication/components/notifications/NotificationDeliveryDetailsDrawer";
import { useNotificationDeliveries } from "@/features/communication/hooks/useNotificationDeliveries";
import { useNotificationDeliveryDetails } from "@/features/communication/hooks/useNotificationDeliveryDetails";
import type { NotificationDelivery } from "@/features/communication/types/notification.types";
import { useLocale } from "next-intl";

const labels = {
  en: {
    title: "Notification Deliveries",
    description:
      "Review delivery attempts, provider status, and failure details for dispatched notifications.",
    refresh: "Refresh",
    loading: "Loading delivery records...",
    errorTitle: "Unable to load delivery records",
    retry: "Retry",
    notificationId: "Notification",
    recipientUserId: "Recipient",
    channel: "Channel",
    status: "Status",
    provider: "Provider",
    providerMessageId: "Provider message ID",
    errorCode: "Error code",
    attemptedAt: "Attempted at",
    sentAt: "Sent",
    deliveredAt: "Delivered",
    failedAt: "Failed",
    errorMessage: "Error message",
    createdAt: "Created at",
    updatedAt: "Updated at",
    viewDetails: "View details",
    emptyTitle: "No delivery records",
    emptyDescription:
      "Delivery records will appear when notifications are dispatched.",
    detailsTitle: "Delivery details",
    close: "Close",
    id: "ID",
    all: "All",
    clearFilters: "Clear filters",
    exactProvider: "Exact provider value",
    createdFrom: "Created from",
    createdTo: "Created to",
    notificationSearch: "Search loaded notifications...",
    notificationLoadError: "Unable to load notification options",
    noNotifications: "No loaded notifications match",
    loadingNotifications: "Loading notifications...",
  },
  ar: {
    title: "سجلات تسليم الإشعارات",
    description:
      "راجع محاولات التسليم وحالة المزود وتفاصيل الفشل للإشعارات المرسلة.",
    refresh: "تحديث",
    loading: "جاري تحميل سجلات التسليم...",
    errorTitle: "تعذر تحميل سجلات التسليم",
    retry: "إعادة المحاولة",
    notificationId: "الإشعار",
    recipientUserId: "المستلم",
    channel: "القناة",
    status: "الحالة",
    provider: "المزود",
    providerMessageId: "معرف رسالة المزود",
    errorCode: "رمز الخطأ",
    attemptedAt: "وقت المحاولة",
    sentAt: "تم الإرسال",
    deliveredAt: "تم التسليم",
    failedAt: "فشل في",
    errorMessage: "رسالة الخطأ",
    createdAt: "تم الإنشاء في",
    updatedAt: "تم التحديث في",
    viewDetails: "عرض التفاصيل",
    emptyTitle: "لا توجد سجلات تسليم",
    emptyDescription: "ستظهر سجلات التسليم عند إرسال الإشعارات.",
    detailsTitle: "تفاصيل التسليم",
    close: "إغلاق",
    id: "المعرف",
    all: "الكل",
    clearFilters: "مسح عوامل التصفية",
    exactProvider: "قيمة المزود المطابقة تمامًا",
    createdFrom: "تاريخ الإنشاء من",
    createdTo: "تاريخ الإنشاء إلى",
    notificationSearch: "البحث في الإشعارات المحملة...",
    notificationLoadError: "تعذر تحميل خيارات الإشعارات",
    noNotifications: "لا توجد إشعارات محملة مطابقة",
    loadingNotifications: "جاري تحميل الإشعارات...",
  },
};

type LocaleKey = keyof typeof labels;

type DeliveryRow = {
  id: string;
  notificationId: string;
  channel: string;
  status: string;
  provider: string;
  attemptedAt: string;
  sentAt: string;
  deliveredAt: string;
  failedAt: string;
  createdAt: string;
  delivery: NotificationDelivery;
  [key: string]: unknown;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusTone(status?: string) {
  if (status === "delivered") return "success" as const;
  if (status === "failed") return "error" as const;
  if (status === "sent") return "info" as const;
  return "warning" as const;
}

function rowFromDelivery(delivery: NotificationDelivery): DeliveryRow {
  return {
    id: delivery.id,
    notificationId: delivery.notificationId ?? "-",
    channel: delivery.channel ?? "-",
    status: delivery.status ?? "-",
    provider: delivery.provider ?? "-",
    attemptedAt: formatDate(delivery.attemptedAt),
    sentAt: formatDate(delivery.sentAt),
    deliveredAt: formatDate(delivery.deliveredAt),
    failedAt: formatDate(delivery.failedAt),
    createdAt: formatDate(delivery.createdAt),
    delivery,
  };
}

export default function NotificationDeliveriesPage() {
  const locale = useLocale() as LocaleKey;
  const t = labels[locale] ?? labels.en;
  const deliveriesState = useNotificationDeliveries();
  const deliveryDetailsState = useNotificationDeliveryDetails();

  const rows = useMemo(
    () => deliveriesState.deliveries.map(rowFromDelivery),
    [deliveriesState.deliveries],
  );

  const columns = useMemo<Array<Column<DeliveryRow>>>(
    () => [
      {
        key: "notificationId",
        label: t.notificationId,
        render: (value) => (
          <span className="block max-w-48 text-slate-700">
            {String(value || "-")}
          </span>
        ),
      },
      { key: "channel", label: t.channel },
      {
        key: "status",
        label: t.status,
        render: (value) => (
          <CommunicationStatusChip
            label={String(value || "-")}
            tone={statusTone(String(value || ""))}
          />
        ),
      },
      { key: "provider", label: t.provider },
      { key: "attemptedAt", label: t.attemptedAt },
      { key: "sentAt", label: t.sentAt },
      { key: "deliveredAt", label: t.deliveredAt },
      { key: "failedAt", label: t.failedAt },
      { key: "createdAt", label: t.createdAt },
      {
        key: "actions",
        label: t.viewDetails,
        sortable: false,
        render: (_value, row) => (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => deliveryDetailsState.open(row.id)}
            leftIcon={<Eye className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            {t.viewDetails}
          </Button>
        ),
      },
    ],
    [deliveryDetailsState, t],
  );

  if (deliveriesState.isLoading) {
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
            loading={deliveriesState.isRefreshing}
            onClick={() => void deliveriesState.refresh()}
            leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          >
            {t.refresh}
          </Button>
        }
      />
      <CommunicationTabs />

      {deliveriesState.error ? (
        <CommunicationErrorState
          title={t.errorTitle}
          message={deliveriesState.error}
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => void deliveriesState.refresh()}
            >
              {t.retry}
            </Button>
          }
        />
      ) : null}

      <NotificationDeliveryFilters
        filters={deliveriesState.filters}
        onChange={deliveriesState.setFilters}
        labels={{
          notification: t.notificationId,
          recipient: t.recipientUserId,
          channel: t.channel,
          status: t.status,
          provider: t.provider,
          createdFrom: t.createdFrom,
          createdTo: t.createdTo,
          all: t.all,
          clear: t.clearFilters,
          exactProvider: t.exactProvider,
          notificationSearch: t.notificationSearch,
          notificationLoadError: t.notificationLoadError,
          noNotifications: t.noNotifications,
          loadingNotifications: t.loadingNotifications,
        }}
      />

      <DataTable<DeliveryRow>
        columns={columns}
        data={rows}
        isLoading={deliveriesState.isRefreshing}
        emptyTitle={t.emptyTitle}
        emptyDescription={t.emptyDescription}
        itemsPerPage={deliveriesState.pagination.limit}
        virtualize
        serverPagination={{
          enabled: true,
          currentPage: deliveriesState.pagination.page,
          pageSize: deliveriesState.pagination.limit,
          totalItems: deliveriesState.pagination.total,
          onPageChange: deliveriesState.setPage,
          onPageSizeChange: deliveriesState.setLimit,
        }}
      />

      <NotificationDeliveryDetailsDrawer
        open={Boolean(deliveryDetailsState.selectedDeliveryId)}
        delivery={deliveryDetailsState.delivery}
        isLoading={deliveryDetailsState.isLoading}
        error={deliveryDetailsState.error}
        onClose={deliveryDetailsState.close}
        labels={{
          title: t.detailsTitle,
          close: t.close,
          loading: t.loading,
          errorTitle: t.errorTitle,
          id: t.id,
          notificationId: t.notificationId,
          channel: t.channel,
          status: t.status,
          provider: t.provider,
          providerMessageId: t.providerMessageId,
          errorCode: t.errorCode,
          errorMessage: t.errorMessage,
          attemptedAt: t.attemptedAt,
          sentAt: t.sentAt,
          deliveredAt: t.deliveredAt,
          failedAt: t.failedAt,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }}
      />
    </div>
  );
}
