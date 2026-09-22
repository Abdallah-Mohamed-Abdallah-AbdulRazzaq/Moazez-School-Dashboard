"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePermissions } from "@/hooks/usePermissions";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import {
  DASHBOARD_ACTIVITY_PREVIEW_LIMIT,
  DASHBOARD_ALERT_PREVIEW_LIMIT,
} from "@/features/dashboard/constants/dashboardPreviewLimits";
import {
  mapDashboardActivityFeedToViewModel,
  mapDashboardAlertsToViewModel,
  mapDashboardSummaryToViewModel,
} from "@/features/dashboard/mappers/dashboardViewMapper";
import type {
  DashboardActivityFeedViewModel,
  DashboardAlertsViewModel,
  DashboardSummaryViewModel,
} from "@/features/dashboard/mappers/dashboardViewMapper";
import {
  fetchDashboardActivityFeed,
  fetchDashboardAlerts,
  fetchDashboardSummary,
  fetchDashboardModules,
  fetchDashboardModuleByKey,
} from "@/features/dashboard/services/dashboardApiService";
import type {
  DashboardModuleListItem,
  DashboardModulePage,
} from "@/features/dashboard/types/dashboardApi.types";
import SchoolDashboardView from "../views/SchoolDashboardView";
import type { DashboardSectionState } from "../views/SchoolDashboardView";

type DashboardLoadState = {
  summary: DashboardSectionState<DashboardSummaryViewModel>;
  alerts: DashboardSectionState<DashboardAlertsViewModel>;
  activityFeed: DashboardSectionState<DashboardActivityFeedViewModel>;
  isRefreshing: boolean;
};

const initialDashboardLoadState: DashboardLoadState = {
  summary: { status: "loading" },
  alerts: { status: "loading" },
  activityFeed: { status: "loading" },
  isRefreshing: false,
};

export default function SchoolDashboardContainer() {
  const { isInitializing } = useAcademicYearTermLayoutContext();
  const { hasPermission, isPermissionsReady } = usePermissions();
  const t = useTranslations("dashboard_new");
  const canViewSummary = hasPermission("dashboard.summary.view");
  const canViewAlerts = hasPermission("dashboard.alerts.view");
  const canViewActivityFeed = hasPermission("dashboard.activity_feed.view");
  const canViewModules = hasPermission("dashboard.modules.view");
  const [dashboardLoadState, setDashboardLoadState] =
    useState<DashboardLoadState>(initialDashboardLoadState);
  const [refreshSequence, setRefreshSequence] = useState(0);
  const [modules, setModules] = useState<DashboardModuleListItem[]>([]);
  const [cachedModules, setCachedModules] = useState<Record<string, DashboardModulePage>>({});
  const [moduleLoadingStates, setModuleLoadingStates] = useState<Record<string, "loading" | "success" | "error">>({});
  const [moduleErrors, setModuleErrors] = useState<Record<string, string>>({});
  const selectedTabRef = useRef("overview");
  const moduleGenerationRef = useRef(0);
  const pendingModulesRef = useRef(new Set<string>());

  const requestModuleDetails = useCallback((moduleKey: string) => {
    const generation = moduleGenerationRef.current;
    pendingModulesRef.current.add(moduleKey);
    setModuleLoadingStates((current) => ({ ...current, [moduleKey]: "loading" }));

    void fetchDashboardModuleByKey(moduleKey)
      .then((modulePage) => {
        if (generation !== moduleGenerationRef.current) return;
        setCachedModules((current) => ({ ...current, [moduleKey]: modulePage }));
        setModuleLoadingStates((current) => ({ ...current, [moduleKey]: "success" }));
      })
      .catch((error: unknown) => {
        if (generation !== moduleGenerationRef.current) return;
        setModuleErrors((current) => ({ ...current, [moduleKey]: dashboardErrorMessage(error, t) }));
        setModuleLoadingStates((current) => ({ ...current, [moduleKey]: "error" }));
      })
      .finally(() => {
        if (generation === moduleGenerationRef.current) {
          pendingModulesRef.current.delete(moduleKey);
        }
      });
  }, [t]);

  const refreshDashboard = useCallback(() => {
    setDashboardLoadState((currentState) => {
      return {
        summary: currentState.summary,
        alerts: currentState.alerts,
        activityFeed: currentState.activityFeed,
        isRefreshing: true,
      };
    });
    moduleGenerationRef.current += 1;
    pendingModulesRef.current.clear();
    const selectedModule = selectedTabRef.current;
    setCachedModules((current) => selectedModule !== "overview" && current[selectedModule]
      ? { [selectedModule]: current[selectedModule] }
      : {});
    setModuleLoadingStates({});
    setModuleErrors({});
    if (canViewModules && selectedTabRef.current !== "overview") {
      requestModuleDetails(selectedTabRef.current);
    }
    setRefreshSequence((currentSequence) => currentSequence + 1);
  }, [canViewModules, requestModuleDetails]);

  useEffect(() => {
    if (isInitializing || !isPermissionsReady) {
      return;
    }

    let shouldIgnoreResponse = false;
    let pendingDashboardRequests = [
      canViewSummary,
      canViewAlerts,
      canViewActivityFeed,
    ].filter(Boolean).length;

    if (pendingDashboardRequests === 0) {
      return;
    }

    const markDashboardRequestSettled = () => {
      pendingDashboardRequests -= 1;

      if (pendingDashboardRequests === 0) {
        setDashboardLoadState((currentState) => ({
          ...currentState,
          isRefreshing: false,
        }));
      }
    };

    if (canViewSummary) {
      fetchDashboardSummary()
      .then((summaryResponse) => {
        if (shouldIgnoreResponse) {
          return;
        }

        setDashboardLoadState((currentState) => ({
          ...currentState,
          summary: {
            status: "success",
            data: mapDashboardSummaryToViewModel(summaryResponse),
          },
        }));
      })
      .catch((summaryError: unknown) => {
        if (shouldIgnoreResponse) {
          return;
        }

        setDashboardLoadState((currentState) => ({
          ...currentState,
          summary: {
            status: "error",
            message: dashboardErrorMessage(summaryError, t),
          },
        }));
      })
      .finally(() => {
        if (shouldIgnoreResponse) {
          return;
        }

        markDashboardRequestSettled();
      });
    }

    if (canViewAlerts) {
      fetchDashboardAlerts({ limit: DASHBOARD_ALERT_PREVIEW_LIMIT })
      .then((alertsResponse) => {
        if (shouldIgnoreResponse) {
          return;
        }

        setDashboardLoadState((currentState) => ({
          ...currentState,
          alerts: {
            status: "success",
            data: mapDashboardAlertsToViewModel(alertsResponse),
          },
        }));
      })
      .catch((alertsError: unknown) => {
        if (shouldIgnoreResponse) {
          return;
        }

        setDashboardLoadState((currentState) => ({
          ...currentState,
          alerts: {
            status: "error",
            message: dashboardErrorMessage(alertsError, t),
          },
        }));
      })
      .finally(() => {
        if (shouldIgnoreResponse) {
          return;
        }

        markDashboardRequestSettled();
      });
    }

    if (canViewActivityFeed) {
      fetchDashboardActivityFeed({ limit: DASHBOARD_ACTIVITY_PREVIEW_LIMIT })
      .then((activityFeedResponse) => {
        if (shouldIgnoreResponse) {
          return;
        }

        setDashboardLoadState((currentState) => ({
          ...currentState,
          activityFeed: {
            status: "success",
            data: mapDashboardActivityFeedToViewModel(activityFeedResponse),
          },
        }));
      })
      .catch((activityFeedError: unknown) => {
        if (shouldIgnoreResponse) {
          return;
        }

        setDashboardLoadState((currentState) => ({
          ...currentState,
          activityFeed: {
            status: "error",
            message: dashboardErrorMessage(activityFeedError, t),
          },
        }));
      })
      .finally(() => {
        if (shouldIgnoreResponse) {
          return;
        }

        markDashboardRequestSettled();
      });
    }

    return () => {
      shouldIgnoreResponse = true;
    };
  }, [
    canViewActivityFeed,
    canViewAlerts,
    canViewSummary,
    isInitializing,
    isPermissionsReady,
    refreshSequence,
    t,
  ]);

  const loadModuleDetails = useCallback((moduleKey: string) => {
    if (
      !canViewModules ||
      cachedModules[moduleKey] ||
      pendingModulesRef.current.has(moduleKey)
    ) {
      return;
    }
    requestModuleDetails(moduleKey);
  }, [cachedModules, canViewModules, requestModuleDetails]);

  const onActiveTabChange = useCallback((tabKey: string) => {
    selectedTabRef.current = tabKey;
  }, []);

  useEffect(() => {
    if (isInitializing || !isPermissionsReady || !canViewModules) {
      return;
    }

    let shouldIgnoreResponse = false;
    fetchDashboardModules()
      .then((modulesResponse) => {
        if (!shouldIgnoreResponse) {
          const list = Array.isArray(modulesResponse)
            ? modulesResponse
            : modulesResponse?.modules || [];
          setModules(list);
        }
      })
      .catch((err) => {
        console.error("Failed to load dashboard modules", err);
      });

    return () => {
      shouldIgnoreResponse = true;
    };
  }, [canViewModules, isInitializing, isPermissionsReady, refreshSequence]);

  if (!isPermissionsReady) {
    return null;
  }

  return (
    <SchoolDashboardView
      activityFeedState={dashboardLoadState.activityFeed}
      alertsState={dashboardLoadState.alerts}
      isRefreshing={dashboardLoadState.isRefreshing}
      onRefresh={refreshDashboard}
      refreshSequence={refreshSequence}
      summaryState={
        isInitializing ? { status: "loading" } : dashboardLoadState.summary
      }
      modules={modules}
      cachedModules={cachedModules}
      moduleLoadingStates={moduleLoadingStates}
      moduleErrors={moduleErrors}
      onLoadModuleDetails={loadModuleDetails}
      onActiveTabChange={onActiveTabChange}
    />
  );
}

function dashboardErrorMessage(
  dashboardError: unknown,
  t: ReturnType<typeof useTranslations>,
) {
  if (dashboardError instanceof Error && dashboardError.message) {
    return dashboardError.message;
  }

  return t("dashboard.default_error");
}
