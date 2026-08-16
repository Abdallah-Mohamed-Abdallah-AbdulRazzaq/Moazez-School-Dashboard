"use client";

import {
  downloadAdmissionsExportResponse,
  getServerExportFormat,
  type AdmissionsExportFormat,
} from "@/features/admissions/shared/utils/admissionsExport";
import type { Application } from "@/features/admissions/types/admissions";
import type { Lead } from "@/features/admissions/leads/types/lead";
import { fetchEnrollments } from "@/features/students-guardians/enrollments/services/enrollmentsApiService";

type DashboardExportType = "data" | "analytics";
type DashboardDataset = "leads" | "applications" | "decisions" | "enrollments";

interface DashboardDateRange {
  value: string;
  customStart?: string;
  customEnd?: string;
}

function getDateRange(currentDateRange?: DashboardDateRange) {
  if (!currentDateRange) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      daysBack: 30,
    };
  }

  if (currentDateRange.value === "custom") {
    return {
      startDate: currentDateRange.customStart || "",
      endDate: currentDateRange.customEnd || "",
      daysBack: undefined,
    };
  }

  if (currentDateRange.value === "all") {
    return {
      startDate: undefined,
      endDate: undefined,
      daysBack: 365,
    };
  }

  return {
    startDate: undefined,
    endDate: undefined,
    daysBack: parseInt(currentDateRange.value, 10),
  };
}

export function createAdmissionsDashboardExportHandler(
  locale: string,
  currentDateRange?: DashboardDateRange,
  data?: {
    applications: Application[];
    leads: Lead[];
  },
) {
  return async ({
    format,
    exportType,
    datasets,
  }: {
    format: AdmissionsExportFormat;
    exportType?: DashboardExportType;
    datasets?: DashboardDataset[];
  }) => {
    const dateRange = getDateRange(currentDateRange);
    const requestFormat = getServerExportFormat(format);

    if (exportType === "analytics") {
      const response = await fetch("/api/exports/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: requestFormat,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          daysBack: dateRange.daysBack,
          locale,
          data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      await downloadAdmissionsExportResponse(
        response,
        "admissions-analytics",
        format,
      );
      return;
    }

    const enrollments = datasets?.includes("enrollments")
      ? await fetchEnrollments()
      : [];
    const response = await fetch("/api/exports/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        datasets,
        format: requestFormat,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        locale,
        data: {
          ...data,
          enrollments,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Export failed");
    }

    await downloadAdmissionsExportResponse(response, "admissions-data", format);
  };
}
