// Container component for Students & Guardians Dashboard
// Handles data fetching, state management, and business logic

"use client";

import { useEffect, useMemo, useState } from "react";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import {
  calculateStudentStats,
  calculateRiskDistribution,
} from "@/features/students-guardians/dashboard/utils/studentStatsCalculator";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import StudentsGuardiansDashboardView from "../pages/StudentsGuardiansDashboardView";
import MainLoader from "@/components/ui/loaders/MainLoader";

export default function StudentsGuardiansDashboardContainer() {
  const {
    yearId,
    isLoading: isContextLoading,
    error: contextError,
  } = useStudentsGuardiansYearTermContext();
  const [allStudents, setAllStudents] = useState<
    studentsService.StudentWithEnrollmentContext[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (isContextLoading) {
      return () => {
        isCancelled = true;
      };
    }

    if (!yearId) {
      void Promise.resolve().then(() => setAllStudents([]));
    void Promise.resolve().then(() => setLoadError(null));
      void Promise.resolve().then(() => setIsLoading(false));

      return () => {
        isCancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      if (isCancelled) {
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const students =
          await studentsService.fetchStudentsWithEnrollmentForContext(yearId);
        if (!isCancelled) {
          setAllStudents(students);
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load dashboard");
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
  }, [isContextLoading, yearId]);

  // Calculate statistics
  const stats = useMemo(
    () => calculateStudentStats(allStudents),
    [allStudents]
  );

  // Calculate risk distribution
  const riskDistribution = useMemo(
    () => calculateRiskDistribution(allStudents),
    [allStudents]
  );

  if (isContextLoading || isLoading) {
    return <MainLoader />;
  }

  if (contextError || loadError || !yearId) {
    return (
      <div className="bg-white rounded-xl p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">
          {contextError || loadError || "Failed to load dashboard"}
        </p>
      </div>
    );
  }

  return (
    <StudentsGuardiansDashboardView
      stats={stats}
      riskDistribution={riskDistribution}
      students={allStudents}
    />
  );
}
