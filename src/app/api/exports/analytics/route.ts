// FILE: src/app/api/exports/analytics/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAdmissionsAnalytics } from "@/features/admissions/dashboard/services/admissionsAnalytics";
import {
  convertToCSV,
  formatFunnelForExport,
  formatWeeklyInquiriesForExport,
  formatGradeDistributionForExport,
  createAnalyticsJSON,
  generateExportFilename,
} from "@/features/admissions/applications/utils/admissionsExportUtils";
import type { Lead } from "@/features/admissions/leads/types/lead";
import type { Application } from "@/features/admissions/types/admissions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format, startDate, endDate, daysBack, locale, data } = body as {
      format: string;
      startDate?: string;
      endDate?: string;
      daysBack?: number;
      locale?: string;
      data?: {
        leads?: Lead[];
        applications?: Application[];
      };
    };
    const exportLocale = locale === "ar" ? "ar" : "en";

    // Validate format
    if (!["csv", "json"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Use 'csv' or 'json'" },
        { status: 400 },
      );
    }

    // Calculate days back from date range or use provided value
    let days = daysBack || 30;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Get analytics data using existing aggregation logic
    const analyticsData = getAdmissionsAnalytics(days, {
      leads: data?.leads ?? [],
      applications: data?.applications ?? [],
    });

    // Prepare date range for export
    const dateRange = {
      from:
        startDate ||
        new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      to: endDate || new Date().toISOString().split("T")[0],
    };

    if (format === "json") {
      // Create comprehensive JSON export
      const jsonData = createAnalyticsJSON(
        analyticsData.funnel,
        analyticsData.weeklyInquiries,
        analyticsData.gradeDistribution,
        dateRange,
      );

      const filename = generateExportFilename(
        "analytics",
        "json",
        dateRange.from,
        dateRange.to,
      );

      return NextResponse.json(jsonData, {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // CSV format - combine all analytics into sections
    let csvContent = "";

    // Add date range header
    csvContent +=
      exportLocale === "ar"
        ? `تقرير تحليلات القبول\n`
        : `Admissions Analytics Report\n`;
    csvContent +=
      exportLocale === "ar"
        ? `النطاق الزمني: ${dateRange.from} إلى ${dateRange.to}\n`
        : `Date Range: ${dateRange.from} to ${dateRange.to}\n`;
    csvContent +=
      exportLocale === "ar"
        ? `تاريخ الإنشاء: ${new Date().toLocaleString("ar")}\n\n`
        : `Generated: ${new Date().toLocaleString()}\n\n`;

    // Funnel data
    csvContent +=
      exportLocale === "ar" ? "قمع التحويل\n" : "CONVERSION FUNNEL\n";
    const funnelData = formatFunnelForExport(analyticsData.funnel, exportLocale);
    csvContent += convertToCSV(funnelData);
    csvContent += "\n\n";

    // Weekly inquiries
    csvContent += exportLocale === "ar" ? "الاستفسارات الأسبوعية\n" : "WEEKLY LEADS\n";
    const weeklyData = formatWeeklyInquiriesForExport(
      analyticsData.weeklyInquiries,
      exportLocale,
    );
    csvContent += convertToCSV(weeklyData);
    csvContent += "\n\n";

    // Grade distribution
    csvContent +=
      exportLocale === "ar" ? "الطلبات حسب الصف\n" : "APPLICATIONS BY GRADE\n";
    const gradeData = formatGradeDistributionForExport(
      analyticsData.gradeDistribution,
      exportLocale,
    );
    csvContent += convertToCSV(gradeData);

    const filename = generateExportFilename(
      "analytics",
      "csv",
      dateRange.from,
      dateRange.to,
    );

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Analytics export error:", error);
    return NextResponse.json(
      { error: "Export failed. Please try again." },
      { status: 500 },
    );
  }
}
