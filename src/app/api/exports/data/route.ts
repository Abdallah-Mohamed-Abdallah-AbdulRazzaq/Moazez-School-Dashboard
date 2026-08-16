// FILE: src/app/api/exports/data/route.ts

import { NextRequest, NextResponse } from "next/server";
import type { Lead } from "@/features/admissions/leads/types/lead";
import type { Application } from "@/features/admissions/types/admissions";
import type { StudentEnrollment } from "@/features/students-guardians/students/types";
import {
  convertToCSV,
  formatLeadsForExport,
  formatApplicationsForExport,
  formatDecisionsForExport,
  formatEnrollmentsForExport,
  generateExportFilename,
} from "@/features/admissions/applications/utils/admissionsExportUtils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { datasets, format, startDate, endDate, locale, data } = body as {
      datasets: string[];
      format: string;
      startDate?: string;
      endDate?: string;
      locale?: string;
      data?: {
        leads?: Lead[];
        applications?: Application[];
        enrollments?: StudentEnrollment[];
      };
    };
    const leads = data?.leads ?? [];
    const applications = data?.applications ?? [];
    const enrollments = data?.enrollments ?? [];

    // Validate inputs
    if (!datasets || !Array.isArray(datasets) || datasets.length === 0) {
      return NextResponse.json(
        { error: "No datasets specified" },
        { status: 400 },
      );
    }

    if (!["csv", "json"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Use 'csv' or 'json'" },
        { status: 400 },
      );
    }

    // Filter data by date range if provided
    const filterByDate = <T extends Record<string, unknown>>(
      items: T[],
      dateField: string,
    ): T[] => {
      if (!startDate || !endDate) return items;

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      return items.filter((item) => {
        const itemDate = new Date(item[dateField] as string);
        return itemDate >= start && itemDate <= end;
      });
    };

    const exportLocale = format === "json" ? "en" : locale === "ar" ? "ar" : "en";

    // Prepare data for each dataset
    const exportData: Record<string, Array<Record<string, unknown>>> = {};

    if (datasets.includes("leads")) {
      const filteredLeads = filterByDate(leads, "createdAt");
      exportData.leads = formatLeadsForExport(filteredLeads, exportLocale);
    }

    if (datasets.includes("applications")) {
      const filteredApps = filterByDate(applications, "submittedDate");
      exportData.applications = formatApplicationsForExport(
        filteredApps,
        exportLocale,
      );
    }

    if (datasets.includes("decisions")) {
      const filteredApps = filterByDate(applications, "submittedDate");
      exportData.decisions = formatDecisionsForExport(
        filteredApps,
        undefined,
        exportLocale,
      );
    }

    if (datasets.includes("enrollments")) {
      exportData.enrollments = formatEnrollmentsForExport(
        enrollments,
        exportLocale,
      );
    }

    // Generate export based on format
    if (format === "csv") {
      // For single dataset, return CSV directly
      if (datasets.length === 1) {
        const datasetName = datasets[0];
        const data = exportData[datasetName];

        if (!data || data.length === 0) {
          return NextResponse.json(
            { error: "No data found for the selected criteria" },
            { status: 404 },
          );
        }

        const csv = convertToCSV(data);
        const filename = generateExportFilename(
          datasetName,
          "csv",
          startDate,
          endDate,
        );

        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      }

      // For multiple datasets, combine into one CSV with sections
      let combinedCSV = "";
      for (const datasetName of datasets) {
        const data = exportData[datasetName];
        if (data && data.length > 0) {
          combinedCSV += `\n${datasetName.toUpperCase()}\n`;
          combinedCSV += convertToCSV(data);
          combinedCSV += "\n";
        }
      }

      if (!combinedCSV.trim()) {
        return NextResponse.json(
          { error: "No data found for the selected criteria" },
          { status: 404 },
        );
      }

      const filename = generateExportFilename(
        "data",
        "csv",
        startDate,
        endDate,
      );

      return new NextResponse(combinedCSV, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // JSON format
    const filename = generateExportFilename("data", "json", startDate, endDate);

    return NextResponse.json(exportData, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Export failed. Please try again." },
      { status: 500 },
    );
  }
}
