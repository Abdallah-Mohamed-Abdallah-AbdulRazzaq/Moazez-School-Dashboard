"use client";

import ContextBar from "@/features/academics/components/shared/ContextBar";
import { GradesYearTermLayoutProvider } from "@/features/grades/hooks/GradesYearTermLayoutContext";
import { useGradesYearTermLayoutContext } from "@/features/grades/hooks/GradesYearTermLayoutContext";

function GradesContextLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    academicYearId,
    termId,
    termStatus,
    academicYears,
    terms,
    isInitializing,
    refreshAcademicYears,
    refreshTerms,
    changeAcademicYear,
    changeTerm,
  } = useGradesYearTermLayoutContext();

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-gray-50">
      {/* Workspace pages keep the shared grades ContextBar visible here. */}
      <ContextBar
        academicYearId={academicYearId}
        termId={termId}
        termStatus={termStatus}
        academicYears={academicYears}
        terms={terms}
        isLoadingYears={isInitializing}
        isLoadingTerms={false}
        onRefreshAcademicYears={refreshAcademicYears}
        onRefreshTerms={() => refreshTerms()}
        onAcademicYearChange={(yearId) => {
          void changeAcademicYear(yearId);
        }}
        onTermChange={changeTerm}
        isReadOnly={termStatus === "closed"}
        showPromoteCarryOver={false}
      />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

export default function GradesContextLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GradesYearTermLayoutProvider>
      <GradesContextLayoutContent>{children}</GradesContextLayoutContent>
    </GradesYearTermLayoutProvider>
  );
}
