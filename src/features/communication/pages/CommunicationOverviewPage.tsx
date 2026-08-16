"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import {
  AlertTriangle,
  Ban,
  BellRing,
  Flag,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import CommunicationEmptyState from "@/features/communication/components/layout/CommunicationEmptyState";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import { useCommunicationOverview } from "@/features/communication/hooks/useCommunicationOverview";
import type { CommunicationPolicy } from "@/features/communication/types/communication.types";
import type { Conversation } from "@/features/communication/types/conversation.types";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";
import type { MessageReport, Restriction } from "@/features/communication/types/safety.types";

const labels = {
  en: {
    title: "Communication Overview",
    description:
      "Monitor conversation activity, notifications, safety signals, and communication policy status.",
    refresh: "Refresh",
    loading: "Loading communication overview...",
    emptyTitle: "No communication data yet",
    emptyDescription:
      "Communication activity will appear here after conversations, announcements, or notifications are created.",
    errorTitle: "Some communication data could not be loaded",
    enabled: "Enabled",
    disabled: "Disabled",
    policy: "Policy",
    policySummary: "Policy Summary",
    recentConversations: "Recent Conversations",
    recentNotifications: "Recent Notifications",
    noConversations: "No recent conversations.",
    noNotifications: "No recent notifications.",
    activeConversations: "Active Conversations",
    openReports: "Open Reports",
    activeRestrictions: "Active Restrictions",
    unreadNotifications: "Unread Notifications",
    allowAnnouncements: "Announcements",
    allowConversations: "Conversations",
    allowAttachments: "Attachments",
    allowReactions: "Reactions",
    moderation: "Moderation",
    updated: "Updated",
    unknown: "Unknown",
  },
  ar: {
    title: "نظرة عامة على التواصل",
    description:
      "تابع نشاط المحادثات والإشعارات ومؤشرات الأمان وحالة سياسات التواصل.",
    refresh: "تحديث",
    loading: "جار تحميل نظرة التواصل...",
    emptyTitle: "لا توجد بيانات تواصل بعد",
    emptyDescription:
      "سيظهر نشاط التواصل هنا بعد إنشاء المحادثات أو الإعلانات أو الإشعارات.",
    errorTitle: "تعذر تحميل بعض بيانات التواصل",
    enabled: "مفعل",
    disabled: "معطل",
    policy: "السياسة",
    policySummary: "ملخص السياسة",
    recentConversations: "أحدث المحادثات",
    recentNotifications: "أحدث الإشعارات",
    noConversations: "لا توجد محادثات حديثة.",
    noNotifications: "لا توجد إشعارات حديثة.",
    activeConversations: "المحادثات النشطة",
    openReports: "البلاغات المفتوحة",
    activeRestrictions: "القيود النشطة",
    unreadNotifications: "الإشعارات غير المقروءة",
    allowAnnouncements: "الإعلانات",
    allowConversations: "المحادثات",
    allowAttachments: "المرفقات",
    allowReactions: "التفاعلات",
    moderation: "الإشراف",
    updated: "آخر تحديث",
    unknown: "غير معروف",
  },
};

type LocaleKey = keyof typeof labels;

const arabicOverviewLabels = {
  title: "نظرة عامة على التواصل",
  description: "تابع نشاط المحادثات والإشعارات ومؤشرات الأمان وحالة سياسة التواصل.",
  refresh: "تحديث",
  loading: "جارٍ تحميل نظرة عامة على التواصل...",
  emptyTitle: "لا توجد بيانات تواصل بعد",
  emptyDescription: "سيظهر نشاط التواصل هنا بعد إنشاء المحادثات أو الإعلانات أو الإشعارات.",
  errorTitle: "تعذّر تحميل بعض بيانات التواصل",
  enabled: "مفعّل",
  disabled: "معطّل",
  policy: "السياسة",
  policySummary: "ملخص السياسة",
  recentConversations: "أحدث المحادثات",
  recentNotifications: "أحدث الإشعارات",
  noConversations: "لا توجد محادثات حديثة.",
  noNotifications: "لا توجد إشعارات حديثة.",
  activeConversations: "المحادثات النشطة",
  openReports: "البلاغات المفتوحة",
  activeRestrictions: "القيود النشطة",
  unreadNotifications: "الإشعارات غير المقروءة",
  allowAnnouncements: "الإعلانات",
  allowConversations: "المحادثات",
  allowAttachments: "المرفقات",
  allowReactions: "التفاعلات",
  moderation: "الإشراف",
  updated: "آخر تحديث",
  unknown: "غير معروف",
  activeBlocks: "عمليات الحظر النشطة",
  totalParticipants: "إجمالي المشاركين",
  totalMessages: "إجمالي الرسائل",
  readReceipts: "إيصالات القراءة",
  deliveredNotifications: "الإشعارات المُسلّمة",
  studentDirectMessages: "رسائل الطلاب المباشرة",
  teacherCreatedGroups: "مجموعات أنشأها المعلمون",
  studentCreatedGroups: "مجموعات أنشأها الطلاب",
  deliveryReceipts: "إيصالات التسليم",
  onlinePresence: "الحضور المتصل",
  studentDirectMode: "وضع رسائل الطلاب المباشرة",
  safetyQueue: "قائمة الأمان",
  safetyQueueDescription: "البلاغات والقيود النشطة",
  noReports: "لا توجد بلاغات مفتوحة. التواصل آمن.",
  noRestrictions: "لا توجد قيود نشطة.",
  expires: "ينتهي",
  noExpiry: "بلا انتهاء",
  messageReport: "بلاغ رسالة",
  restriction: "قيد",
} as const;

const englishOverviewLabels = {
  ...labels.en,
  activeBlocks: "Active Blocks",
  totalParticipants: "Total Participants",
  totalMessages: "Total Messages",
  readReceipts: "Read Receipts",
  deliveredNotifications: "Delivered Notifications",
  studentDirectMessages: "Student direct messages",
  teacherCreatedGroups: "Teacher-created groups",
  studentCreatedGroups: "Student-created groups",
  deliveryReceipts: "Delivery receipts",
  onlinePresence: "Online presence",
  studentDirectMode: "Student direct-message mode",
  safetyQueue: "Safety queue",
  safetyQueueDescription: "Reports and active restrictions",
  noReports: "No open reports. Communication is clear.",
  noRestrictions: "No active restrictions.",
  expires: "Expires",
  noExpiry: "No expiry",
  messageReport: "Message report",
  restriction: "Restriction",
} as const;

type OverviewLabels = {
  [Key in keyof typeof englishOverviewLabels]: string;
};

function overviewLabels(locale: LocaleKey): OverviewLabels {
  return locale === "ar" ? arabicOverviewLabels : englishOverviewLabels;
}

function numberOrFallback(...values: Array<unknown>): number {
  const value = values.find(
    (candidate) => typeof candidate === "number" && Number.isFinite(candidate),
  );
  return typeof value === "number" ? value : 0;
}

function policyFlag(
  policy: CommunicationPolicy | null,
  key: keyof CommunicationPolicy,
): boolean | null {
  const value = policy?.[key];
  return typeof value === "boolean" ? value : null;
}

function isCommunicationEnabled(
  policy: CommunicationPolicy | null,
): boolean | null {
  if (!policy) return null;

  const record = policy as Record<string, unknown>;
  const explicit =
    record.enabled ?? record.isEnabled ?? record.communicationEnabled;
  if (typeof explicit === "boolean") return explicit;

  const flags = [
    policy.allowAnnouncements,
    policy.allowConversations,
    policy.allowAttachments,
    policy.allowReactions,
  ].filter((value): value is boolean => typeof value === "boolean");

  if (flags.length === 0) return null;
  return flags.some(Boolean);
}

function localizedText(
  locale: LocaleKey,
  item: Record<string, unknown>,
  keys: { ar?: string; en?: string; fallback?: string },
): string {
  const preferredKey = locale === "ar" ? keys.ar : keys.en;
  const fallbackKey = locale === "ar" ? keys.en : keys.ar;
  const preferred = preferredKey ? item[preferredKey] : undefined;
  const fallback = fallbackKey ? item[fallbackKey] : undefined;
  const generic = keys.fallback ? item[keys.fallback] : undefined;

  return (
    [preferred, fallback, generic].find(
      (value): value is string =>
        typeof value === "string" && value.trim() !== "",
    ) ?? ""
  );
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number | string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <div className="h-full rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function PolicyLine({
  label,
  value,
}: {
  label: string;
  value: boolean | null;
}) {
  const locale = useLocale() as LocaleKey;
  const t = overviewLabels(locale);

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <CommunicationStatusChip
        label={value === null ? t.unknown : value ? t.enabled : t.disabled}
        tone={value === null ? "default" : value ? "success" : "warning"}
      />
    </div>
  );
}

function ConversationRow({
  conversation,
  locale,
}: {
  conversation: Conversation;
  locale: LocaleKey;
}) {
  const title =
    localizedText(locale, conversation, {
      ar: "titleAr",
      en: "titleEn",
      fallback: "title",
    }) || conversation.id;
  const href = `/${locale}/communication/conversations/${conversation.id}`;
  const updatedAt = formatDate(
    conversation.lastMessageAt ??
      conversation.updatedAt ??
      conversation.createdAt,
    locale,
  );

  return (
    <Link
      href={href}
      className="block rounded-lg border border-slate-100 p-3 transition-colors hover:border-primary-200 hover:bg-primary-50/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">
            {title}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {conversation.type ?? conversation.status ?? "conversation"}
          </p>
        </div>
        {typeof conversation.unreadCount === "number" &&
        conversation.unreadCount > 0 ? (
          <CommunicationStatusChip
            label={String(conversation.unreadCount)}
            tone="info"
          />
        ) : null}
      </div>
      {updatedAt ? (
        <p className="mt-2 text-xs text-slate-500">{updatedAt}</p>
      ) : null}
    </Link>
  );
}

function NotificationRow({
  notification,
  locale,
}: {
  notification: CommunicationNotification;
  locale: LocaleKey;
}) {
  const title =
    localizedText(locale, notification, {
      ar: "titleAr",
      en: "titleEn",
      fallback: "title",
    }) ||
    notification.type ||
    notification.id;
  const body = localizedText(locale, notification, {
    ar: "bodyAr",
    en: "bodyEn",
    fallback: "body",
  });
  const createdAt = formatDate(notification.createdAt, locale);

  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          {body ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
              {body}
            </p>
          ) : null}
        </div>
        {notification.status ? (
          <CommunicationStatusChip
            label={notification.status}
            tone={notification.status === "unread" ? "info" : "default"}
          />
        ) : null}
      </div>
      {createdAt ? (
        <p className="mt-2 text-xs text-slate-500">{createdAt}</p>
      ) : null}
    </div>
  );
}

function ReportRow({
  report,
  locale,
}: {
  report: MessageReport;
  locale: LocaleKey;
}) {
  const reporter =
    localizedText(locale, report.reporter ?? {}, {
      ar: "nameAr",
      en: "nameEn",
      fallback: "name",
    }) || report.reporterId;
  const detail = report.description ?? report.details ?? report.comment;
  const t = overviewLabels(locale);

  return (
    <div className="rounded-lg border border-rose-100 bg-rose-50/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold capitalize text-slate-950">
            {report.reason?.replaceAll("_", " ") ?? t.messageReport}
          </p>
          {reporter ? <p className="mt-1 text-xs text-slate-600">{reporter}</p> : null}
          {detail ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{detail}</p> : null}
        </div>
        <CommunicationStatusChip label={report.status ?? "open"} tone="error" />
      </div>
      {report.createdAt ? <p className="mt-2 text-xs text-slate-500">{formatDate(report.createdAt, locale)}</p> : null}
    </div>
  );
}

function RestrictionRow({
  restriction,
  locale,
}: {
  restriction: Restriction;
  locale: LocaleKey;
}) {
  const target =
    localizedText(locale, restriction.targetUser ?? {}, {
      ar: "nameAr",
      en: "nameEn",
      fallback: "name",
    }) || restriction.targetUserId;
  const expiry = restriction.expiresAt
    ? `${overviewLabels(locale).expires} ${formatDate(restriction.expiresAt, locale)}`
    : overviewLabels(locale).noExpiry;
  const t = overviewLabels(locale);

  return (
    <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold capitalize text-slate-950">
            {restriction.type?.replaceAll("_", " ") ?? t.restriction}
          </p>
          {target ? <p className="mt-1 text-xs text-slate-600">{target}</p> : null}
          {restriction.reason ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{restriction.reason}</p> : null}
        </div>
        <CommunicationStatusChip label={restriction.status ?? "active"} tone="warning" />
      </div>
      <p className="mt-2 text-xs text-slate-500">{expiry}</p>
    </div>
  );
}

export default function CommunicationOverviewPage() {
  const locale = useLocale() as LocaleKey;
  const t = overviewLabels(locale);
  const { data, error, hasAnyContent, isLoading, isRefreshing, refresh } =
    useCommunicationOverview();
  const enabled = isCommunicationEnabled(data.policy);
  const activeConversationsCount = numberOrFallback(
    data.adminOverview?.conversations.active,
    data.conversations.total,
    data.conversations.items.length,
  );
  const openReportsCount = numberOrFallback(
    data.adminOverview?.safety.openReports,
    data.reports.total,
    data.reports.items.length,
  );
  const activeRestrictionsCount = numberOrFallback(
    data.adminOverview?.safety.activeRestrictions,
    data.restrictions.total,
    data.restrictions.items.length,
  );
  const unreadNotificationsCount = numberOrFallback(
    data.adminOverview?.unreadNotificationsCount,
    data.notifications.items.filter((item) => item.status === "unread").length,
  );
  const activeBlocksCount = numberOrFallback(data.adminOverview?.safety.activeBlocks);
  const totalParticipantsCount = numberOrFallback(data.adminOverview?.participants.total);
  const totalMessagesCount = numberOrFallback(data.adminOverview?.messages.total);
  const readReceiptsCount = numberOrFallback(data.adminOverview?.receipts.reads);
  const deliveredNotificationsCount = numberOrFallback(
    data.adminOverview?.receipts.deliveredDeliveries,
  );

  if (isLoading) {
    return <CommunicationLoadingState label={t.loading} />;
  }

  if (!hasAnyContent && error) {
    return (
      <CommunicationErrorState
        title={t.errorTitle}
        message={error}
        action={
          <Button variant="outline" onClick={() => void refresh()}>
            {t.refresh}
          </Button>
        }
      />
    );
  }

  if (!hasAnyContent) {
    return (
      <CommunicationEmptyState
        title={t.emptyTitle}
        description={t.emptyDescription}
        icon={<MessageSquare className="h-7 w-7" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <CommunicationPageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refresh()}
            disabled={isRefreshing}
            leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          >
            {t.refresh}
          </Button>
        }
      />
      <CommunicationTabs />

      {error ? (
        <CommunicationErrorState title={t.errorTitle} message={error} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title={t.activeConversations}
          value={activeConversationsCount}
          icon={MessageSquare}
          tone="bg-primary-100 text-primary-700"
        />
        <SummaryCard
          title={t.openReports}
          value={openReportsCount}
          icon={AlertTriangle}
          tone="bg-rose-100 text-rose-700"
        />
        <SummaryCard
          title={t.activeRestrictions}
          value={activeRestrictionsCount}
          icon={ShieldCheck}
          tone="bg-amber-100 text-amber-800"
        />
        <SummaryCard
          title={t.unreadNotifications}
          value={unreadNotificationsCount}
          icon={BellRing}
          tone="bg-emerald-100 text-emerald-700"
        />
        <SummaryCard
          title={t.activeBlocks}
          value={activeBlocksCount}
          icon={Ban}
          tone="bg-slate-200 text-slate-700"
        />
        <SummaryCard
          title={t.totalParticipants}
          value={totalParticipantsCount}
          icon={Users}
          tone="bg-sky-100 text-sky-700"
        />
        <SummaryCard
          title={t.totalMessages}
          value={totalMessagesCount}
          icon={MessageSquare}
          tone="bg-indigo-100 text-indigo-700"
        />
        <SummaryCard
          title={t.readReceipts}
          value={readReceiptsCount}
          icon={ShieldCheck}
          tone="bg-teal-100 text-teal-700"
        />
        <SummaryCard
          title={t.deliveredNotifications}
          value={deliveredNotificationsCount}
          icon={Send}
          tone="bg-cyan-100 text-cyan-700"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.recentConversations}
            </h2>
            <div className="mt-4 space-y-3">
              {data.conversations.items.length > 0 ? (
                data.conversations.items.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    locale={locale}
                  />
                ))
              ) : (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  {t.noConversations}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {t.recentNotifications}
            </h2>
            <div className="mt-4 space-y-3">
              {data.notifications.items.length > 0 ? (
                data.notifications.items.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    locale={locale}
                  />
                ))
              ) : (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  {t.noNotifications}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">{t.policy}</p>
              <h2 className="mt-1 text-base font-semibold text-slate-950">
                {t.policySummary}
              </h2>
            </div>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-4">
            <CommunicationStatusChip
              label={
                enabled === null ? t.unknown : enabled ? t.enabled : t.disabled
              }
              tone={
                enabled === null ? "default" : enabled ? "success" : "error"
              }
            />
          </div>

          <div className="my-4 border-t border-slate-200" />

          <div className="divide-y divide-slate-100">
            <PolicyLine
              label={t.allowAnnouncements}
              value={policyFlag(data.policy, "allowAnnouncements")}
            />
            <PolicyLine
              label={t.allowConversations}
              value={policyFlag(data.policy, "allowConversations")}
            />
            <PolicyLine
              label={t.allowAttachments}
              value={policyFlag(data.policy, "allowAttachments")}
            />
            <PolicyLine
              label={t.allowReactions}
              value={policyFlag(data.policy, "allowReactions")}
            />
            <PolicyLine
              label={t.moderation}
              value={policyFlag(data.policy, "moderationEnabled")}
            />
            <PolicyLine
              label={t.studentDirectMessages}
              value={
                data.policy?.studentDirectMode
                  ? data.policy.studentDirectMode !== "disabled"
                  : null
              }
            />
            <PolicyLine
              label={t.teacherCreatedGroups}
              value={policyFlag(data.policy, "allowTeacherCreatedGroups")}
            />
            <PolicyLine
              label={t.studentCreatedGroups}
              value={policyFlag(data.policy, "allowStudentCreatedGroups")}
            />
            <PolicyLine
              label={t.readReceipts}
              value={policyFlag(data.policy, "allowReadReceipts")}
            />
            <PolicyLine
              label={t.deliveryReceipts}
              value={policyFlag(data.policy, "allowDeliveryReceipts")}
            />
            <PolicyLine
              label={t.onlinePresence}
              value={policyFlag(data.policy, "allowOnlinePresence")}
            />
          </div>

          {data.policy?.studentDirectMode ? (
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {t.studentDirectMode}: <span className="font-semibold capitalize">{data.policy.studentDirectMode.replaceAll("_", " ")}</span>
            </p>
          ) : null}

          {data.policy?.updatedAt ? (
            <p className="mt-4 text-xs text-slate-500">
              {t.updated}: {formatDate(data.policy.updatedAt, locale)}
            </p>
          ) : null}
        </div>
      </div>

      <section aria-labelledby="communication-safety-queue" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-rose-100 p-2 text-rose-700">
            <Flag className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{t.safetyQueue}</p>
            <h2 id="communication-safety-queue" className="text-base font-semibold text-slate-950">{t.safetyQueueDescription}</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{t.openReports}</h3>
            <div className="mt-3 space-y-3">
              {data.reports.items.length > 0 ? data.reports.items.map((report) => (
                <ReportRow key={report.id} report={report} locale={locale} />
              )) : (
                <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">{t.noReports}</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{t.activeRestrictions}</h3>
            <div className="mt-3 space-y-3">
              {data.restrictions.items.length > 0 ? data.restrictions.items.map((restriction) => (
                <RestrictionRow key={restriction.id} restriction={restriction} locale={locale} />
              )) : (
                <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">{t.noRestrictions}</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
