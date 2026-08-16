"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  AtSign,
  Building2,
  ClipboardList,
  Download,
  FileText,
  KeyRound,
  Mail,
  Send,
  ShieldAlert,
  Users,
  MessageSquare,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import MainLoader from "@/components/ui/loaders/MainLoader";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import SettingsStatusBadge from "@/features/settings/components/SettingsStatusBadge";
import SettingsGlobalExportModal from "@/features/settings/shared/components/export/SettingsGlobalExportModal";
import {
  exportSettingsData,
  formatSettingsExportDate,
  type ExportColumn,
  type SettingsExportFormat,
} from "@/features/settings/shared/utils/settingsExport";
import type {
  AuditLogEntry,
  SettingsOverviewMetrics,
} from "@/features/settings/types";
import { fetchSettingsOverview } from "@/features/settings/services/settingsOverviewService";
import { usePermissions, type PermissionKey } from "@/hooks/usePermissions";

const emptyMetrics: SettingsOverviewMetrics = {
  profileCompleteness: 0,
  activeUsers: 0,
  pendingInvites: 0,
  recentAuditEvents: 0,
};

export default function SettingsOverviewPage() {
  const locale = useLocale();
  const t = useTranslations("settings.overview");
  const tExport = useTranslations("settings.export");
  const { hasPermission } = usePermissions();
  const [metrics, setMetrics] = useState<SettingsOverviewMetrics>(emptyMetrics);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<"summary" | "audit">(
    "summary",
  );

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const overview = await fetchSettingsOverview();

        if (isCancelled) {
          return;
        }

        setMetrics(overview.metrics);
        setAuditEntries(overview.recentAuditEvents);
      } catch (loadError) {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("messages.load_failed"),
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [t]);

  const datasetCount = useMemo(() => {
    if (selectedDataset === "summary") return 3;
    return auditEntries.length;
  }, [auditEntries.length, selectedDataset]);

  const datasetOptions = [
    {
      value: "summary",
      label: tExport("datasets.summary.label"),
      description: tExport("datasets.summary.description"),
    },
    {
      value: "audit",
      label: tExport("datasets.audit.label"),
      description: tExport("datasets.audit.description"),
    },
  ];

  const sprint11Links: Array<{
    key: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
    permission: PermissionKey;
  }> = [
    {
      key: "users",
      href: `/${locale}/settings/users`,
      icon: Users,
      permission: "settings.users.view",
    },
    {
      key: "login_identity",
      href: `/${locale}/settings/login-identity`,
      icon: AtSign,
      permission: "settings.users.view",
    },
    {
      key: "credentials",
      href: `/${locale}/settings/credentials`,
      icon: KeyRound,
      permission: "settings.users.view",
    },
    {
      key: "email_connection",
      href: `/${locale}/settings/email/connection`,
      icon: Mail,
      permission: "settings.email.connection.view",
    },
    {
      key: "email_templates",
      href: `/${locale}/settings/email/templates`,
      icon: FileText,
      permission: "settings.email.templates.view",
    },
    {
      key: "credential_delivery",
      href: `/${locale}/settings/email/credential-deliveries`,
      icon: Send,
      permission: "settings.email.credential_deliveries.view",
    },
    {
      key: "email_deliveries",
      href: `/${locale}/settings/email/deliveries`,
      icon: ClipboardList,
      permission: "settings.email.deliveries.view",
    },
    {
      key: "email_campaigns",
      href: `/${locale}/settings/email/campaigns`,
      icon: MessageSquare,
      permission: "settings.email.campaigns.view",
    },
  ];

  const visibleSprint11Links = sprint11Links.filter((item) =>
    hasPermission(item.permission),
  );

  const handleExport = (format: SettingsExportFormat) => {
    const metadata = {
      viewName: t("title"),
      datasetName:
        selectedDataset === "summary"
          ? tExport("datasets.summary.label")
          : tExport("datasets.audit.label"),
      exportDate: formatSettingsExportDate(locale),
      visibleCount: datasetCount,
    };

    if (selectedDataset === "summary") {
      const columns: ExportColumn[] = [
        { key: "metric", label: locale === "ar" ? "المؤشر" : "Metric" },
        { key: "value", label: locale === "ar" ? "القيمة" : "Value" },
        { key: "hint", label: locale === "ar" ? "الوصف" : "Hint" },
      ];
      const rows = [
        {
          metric: t("cards.profile_completeness"),
          value: `${metrics.profileCompleteness}%`,
          hint: t("cards.profile_completeness_hint"),
        },
        {
          metric: t("cards.active_users"),
          value: metrics.activeUsers,
          hint: t("cards.pending_invites", { count: metrics.pendingInvites }),
        },
        {
          metric: t("cards.audit_events"),
          value: metrics.recentAuditEvents,
          hint: t("cards.audit_events_hint"),
        },
      ];

      exportSettingsData({
        title: t("title"),
        metadata,
        filename: "settings-overview-summary",
        format,
        columns,
        rows,
        locale,
        emptyMessage: tExport("errors.noData"),
        jsonData: {
          title: "Settings Overview Summary",
          metadata,
          summary: {
            profileCompleteness: metrics.profileCompleteness,
            activeUsers: metrics.activeUsers,
            activeUsersCount: metrics.activeUsers,
            pendingInvites: metrics.pendingInvites,
            pendingInvitesCount: metrics.pendingInvites,
            recentAuditEvents: metrics.recentAuditEvents,
          },
        },
      });
      return;
    }

    if (selectedDataset === "audit") {
      const columns: ExportColumn[] = [
        {
          key: "timestamp",
          label: locale === "ar" ? "التاريخ والوقت" : "Timestamp",
        },
        { key: "actor", label: locale === "ar" ? "المنفذ" : "Actor" },
        { key: "action", label: locale === "ar" ? "الإجراء" : "Action" },
        { key: "module", label: locale === "ar" ? "الوحدة" : "Module" },
        { key: "severity", label: locale === "ar" ? "الخطورة" : "Severity" },
        {
          key: "ipAddress",
          label: locale === "ar" ? "عنوان IP" : "IP address",
        },
      ];
      const rows = auditEntries.map((entry) => ({
        timestamp: new Date(entry.timestamp).toLocaleString(),
        actor: entry.actor,
        action: entry.action,
        module: entry.module,
        severity: entry.severity,
        ipAddress: entry.ipAddress,
      }));

      exportSettingsData({
        title: t("recent_audit.title"),
        metadata,
        filename: "settings-overview-audit",
        format,
        columns,
        rows,
        locale,
        emptyMessage: tExport("errors.noData"),
        jsonData: {
          title: "Settings Overview Audit",
          metadata,
          auditEntries,
        },
      });
      return;
    }
  };

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.overview.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => setIsExportModalOpen(true)}
            >
              {tExport("button")}
            </Button>
          }
        />

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <KPICardV2
            title={t("cards.profile_completeness")}
            value={`${metrics.profileCompleteness}%`}
            subtitle={t("cards.profile_completeness_hint")}
            icon={Building2}
            iconColor="#0f766e"
            iconBgColor="#ccfbf1"
          />
          <KPICardV2
            title={t("cards.active_users")}
            value={metrics.activeUsers}
            subtitle={t("cards.pending_invites", {
              count: metrics.pendingInvites,
            })}
            icon={Users}
            iconColor="#7c3aed"
            iconBgColor="#ede9fe"
          />
          <KPICardV2
            title={t("cards.audit_events")}
            value={metrics.recentAuditEvents}
            subtitle={t("cards.audit_events_hint")}
            icon={ShieldAlert}
            iconColor="#dc2626"
            iconBgColor="#fee2e2"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6">
          {visibleSprint11Links.length > 0 ? (
            <SettingsSectionCard
              title={t("sprint11.title")}
              description={t("sprint11.description")}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {visibleSprint11Links.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:border-primary hover:bg-white"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-white p-2 text-primary shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {t(`sprint11.links.${item.key}.title`)}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {t(`sprint11.links.${item.key}.description`)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </SettingsSectionCard>
          ) : null}

          <SettingsSectionCard
            title={t("recent_audit.title")}
            description={t("recent_audit.description")}
          >
            <div className="space-y-3">
              {auditEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 md:flex-row md:items-start md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {entry.action}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {entry.actor} • {entry.module} •{" "}
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {entry.ipAddress ?? "-"}
                    </span>
                    <SettingsStatusBadge status={entry.severity} />
                  </div>
                </div>
              ))}
            </div>
          </SettingsSectionCard>
        </div>
        <SettingsGlobalExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
          datasetCount={datasetCount}
          datasetOptions={datasetOptions}
          selectedDataset={selectedDataset}
          onDatasetChange={(value) =>
            setSelectedDataset(value as "summary" | "audit")
          }
          emptyStateMessage={tExport("errors.noData")}
        />
      </main>
    </SettingsAccessGuard>
  );
}
