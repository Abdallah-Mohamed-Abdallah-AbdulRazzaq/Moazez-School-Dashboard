export type HealthCheckStatus = "ok" | "degraded" | "error" | "skipped";

export interface HealthDependencyCheck {
  status: HealthCheckStatus;
  durationMs: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface HealthQueueReadiness {
  name: string;
  status: HealthCheckStatus;
  counts?: {
    waiting?: number;
    active?: number;
    delayed?: number;
    failed?: number;
  };
}

export interface HealthReport {
  status: "ok" | "degraded";
  timestamp: string;
  version: string;
  checks: {
    db: HealthDependencyCheck;
    redis: HealthDependencyCheck;
    storage: HealthDependencyCheck;
    queues: HealthDependencyCheck;
    email: HealthDependencyCheck;
    push: HealthDependencyCheck;
  };
}

export type HealthCheckKey = keyof HealthReport["checks"];
