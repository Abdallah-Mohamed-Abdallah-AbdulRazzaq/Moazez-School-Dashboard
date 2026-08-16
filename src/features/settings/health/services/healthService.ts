import { apiGet } from "@/lib/api";
import type {
  HealthCheckKey,
  HealthDependencyCheck,
  HealthReport,
} from "@/features/settings/health/types";

const requiredHealthCheckKeys: HealthCheckKey[] = [
  "db",
  "redis",
  "storage",
  "queues",
  "email",
  "push",
];

export async function fetchHealthReport(): Promise<HealthReport> {
  const report = await apiGet<HealthReport>("/health");
  return normalizeHealthReport(report);
}

export function normalizeHealthReport(report: HealthReport): HealthReport {
  const checks = { ...report.checks };

  requiredHealthCheckKeys.forEach((key) => {
    checks[key] = normalizeHealthCheck(checks[key]);
  });

  return {
    ...report,
    status: report.status === "ok" ? "ok" : "degraded",
    checks,
  };
}

function normalizeHealthCheck(
  check: HealthDependencyCheck | undefined,
): HealthDependencyCheck {
  if (!check) {
    return {
      status: "error",
      durationMs: 0,
      message: "health_check_missing",
    };
  }

  return {
    ...check,
    status: check.status ?? "error",
    durationMs: Number.isFinite(check.durationMs) ? check.durationMs : 0,
  };
}
