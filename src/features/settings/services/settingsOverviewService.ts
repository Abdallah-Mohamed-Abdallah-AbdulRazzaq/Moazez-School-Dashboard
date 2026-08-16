import { apiGet } from "@/lib/api";
import type {
  AuditLogEntry,
  SettingsOverviewApiDto,
  SettingsOverviewMetrics,
} from "@/features/settings/types";

export interface SettingsOverviewViewModel {
  metrics: SettingsOverviewMetrics;
  recentAuditEvents: AuditLogEntry[];
}

function mapAuditEntries(
  entries: SettingsOverviewApiDto["recentAuditEvents"],
): AuditLogEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    actor: entry.actor,
    action: entry.action,
    module: entry.module,
    entity: entry.entity ?? undefined,
    severity: entry.severity,
    timestamp: entry.timestamp,
    ipAddress: entry.ipAddress,
  }));
}

export async function fetchSettingsOverview(): Promise<SettingsOverviewViewModel> {
  const response = await apiGet<SettingsOverviewApiDto>("/settings/overview");
  const recentAuditEvents = mapAuditEntries(response.recentAuditEvents);

  return {
    metrics: {
      profileCompleteness: response.profileCompleteness,
      activeUsers: response.activeUsersCount,
      pendingInvites: response.pendingInvitesCount,
      recentAuditEvents: recentAuditEvents.length,
    },
    recentAuditEvents,
  };
}
