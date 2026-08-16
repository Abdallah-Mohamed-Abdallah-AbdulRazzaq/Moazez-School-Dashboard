// Utility functions for filtering and processing applications

import type { Application, ApplicationStatus } from "@/features/admissions/types/admissions";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import type { DateRangeValue } from "@/features/admissions/shared/DateRangeFilter";

export interface ApplicationFilterValues {
  searchQuery: string;
  statusFilter: ApplicationStatus | "all";
  gradeFilter: string;
  genderFilter: string;
  nationalityFilter: string;
  dateRange: DateRangeValue;
  customStartDate: string;
  customEndDate: string;
}

export interface ApplicationKPIs {
  newInPeriod: number;
  newToday: number;
  newThisWeek: number;
  pendingReview: number;
  missingDocuments: number;
  approved: number;
  rejected: number;
  avgProcessingDisplay: string;
}

export function filterApplications(
  applications: Application[],
  filters: ApplicationFilterValues
): Application[] {
  const {
    searchQuery,
    statusFilter,
    gradeFilter,
    genderFilter,
    nationalityFilter,
    dateRange,
  } = filters;

  const now = new Date();
  const cutoffDate = dateRange !== "all" ? new Date(now) : null;
  if (cutoffDate) {
    cutoffDate.setDate(now.getDate() - parseInt(dateRange));
    cutoffDate.setHours(0, 0, 0, 0);
  }

  return applications.filter((app) => {
    // Normalize search query for better Arabic support
    const normalizedQuery = searchQuery.trim();
    
    const matchesSearch =
      normalizedQuery === "" ||
      app.studentName.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
      app.full_name_en.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
      app.full_name_ar.includes(normalizedQuery) ||
      app.guardianName.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
      app.guardianEmail.toLowerCase().includes(normalizedQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesGrade = gradeFilter === "all" || app.gradeRequested === gradeFilter;
    const matchesGender = genderFilter === "all" || app.gender === genderFilter;
    const matchesNationality =
      nationalityFilter === "all" || app.nationality === nationalityFilter;
    const matchesDateRange =
      !cutoffDate || new Date(app.submittedDate) >= cutoffDate;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesGrade &&
      matchesGender &&
      matchesNationality &&
      matchesDateRange
    );
  });
}

export function calculateApplicationKPIs(
  applications: Application[],
  dateRange: DateRangeValue,
  customStartDate: string,
  customEndDate: string
): ApplicationKPIs {
  const now = new Date();
  const filterResult = getDateFilterBoundaries(
    dateRange,
    customStartDate,
    customEndDate
  );

  const applicationsInRange = applications.filter((app) =>
    isDateInRange(app.submittedDate, filterResult)
  );

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const newInPeriod = applicationsInRange.length;

  const newToday = applicationsInRange.filter((app) => {
    const submittedDate = new Date(app.submittedDate);
    const submittedDay = new Date(
      submittedDate.getFullYear(),
      submittedDate.getMonth(),
      submittedDate.getDate()
    );
    return submittedDay.getTime() === today.getTime();
  }).length;

  const newThisWeek = applicationsInRange.filter((app) => {
    const submittedDate = new Date(app.submittedDate);
    return submittedDate >= weekStart;
  }).length;

  const pendingReview = applicationsInRange.filter(
    (app) => app.status === "submitted" || app.status === "documents_pending"
  ).length;

  const missingDocuments = applicationsInRange.filter((app) =>
    app.documents.some((doc) => doc.status === "missing")
  ).length;

  const approved = applicationsInRange.filter(
    (app) => app.status === "accepted"
  ).length;

  const rejected = applicationsInRange.filter(
    (app) => app.status === "rejected"
  ).length;

  const decidedApps = applicationsInRange.filter(
    (app) =>
      (app.status === "accepted" || app.status === "rejected") &&
      app.decision?.decisionDate,
  );

  let avgProcessingDisplay = "N/A";

  if (decidedApps.length > 0) {
    const totalProcessingTime = decidedApps.reduce((sum, app) => {
      const submitted = new Date(app.submittedDate);
      const decided = new Date(app.decision!.decisionDate);

      const diffMs = decided.getTime() - submitted.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return sum + diffHours;
    }, 0);

    const avgHours = totalProcessingTime / decidedApps.length;

    if (avgHours < 48) {
      avgProcessingDisplay = `${Math.round(avgHours)}h`;
    } else {
      const days = avgHours / 24;
      avgProcessingDisplay = `${days.toFixed(1)} days`;
    }
  }

  return {
    newInPeriod,
    newToday,
    newThisWeek,
    pendingReview,
    missingDocuments,
    approved,
    rejected,
    avgProcessingDisplay,
  };
}

export function extractFilterOptions(applications: Application[]): {
  uniqueGrades: string[];
  uniqueGenders: string[];
  uniqueNationalities: string[];
} {
  const grades = new Set(applications.map((app) => app.gradeRequested));
  const genders = new Set(
    applications
      .map((app) => app.gender)
      .filter((gender): gender is string => !!gender)
  );
  const nationalities = new Set(
    applications
      .map((app) => app.nationality)
      .filter((nationality): nationality is string => !!nationality)
  );

  return {
    uniqueGrades: Array.from(grades).sort(),
    uniqueGenders: Array.from(genders).sort(),
    uniqueNationalities: Array.from(nationalities).sort(),
  };
}

export function hasActiveFilters(filters: ApplicationFilterValues): boolean {
  return (
    filters.searchQuery !== "" ||
    filters.statusFilter !== "all" ||
    filters.gradeFilter !== "all" ||
    filters.genderFilter !== "all" ||
    filters.nationalityFilter !== "all"
  );
}
