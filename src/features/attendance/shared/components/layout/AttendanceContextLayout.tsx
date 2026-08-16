"use client";

import ContextBar from "@/features/academics/components/shared/ContextBar";
import {
  AttendanceYearTermLayoutProvider,
  useAttendanceYearTermLayoutContext,
} from "@/features/attendance/shared/hooks/AttendanceYearTermLayoutContext";

function AttendanceContextLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    yearId,
    termId,
    termStatus,
    academicYears,
    terms,
    isLoading,
    refresh,
    requestYearChange,
    requestTermChange,
    isReadOnly,
  } = useAttendanceYearTermLayoutContext();

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-gray-50">
      <ContextBar
        academicYearId={yearId || ""}
        termId={termId || ""}
        termStatus={termStatus || "open"}
        academicYears={academicYears}
        terms={terms}
        isLoadingYears={isLoading}
        isLoadingTerms={false}
        onRefreshAcademicYears={async () => {
          await refresh();
          return academicYears;
        }}
        onRefreshTerms={async () => { await refresh(); return terms; }}
        onAcademicYearChange={(nextYearId) => {
          void requestYearChange(nextYearId);
        }}
        onTermChange={(nextTermId) => {
          void requestTermChange(nextTermId);
        }}
        isReadOnly={isReadOnly}
        showPromoteCarryOver={false}
      />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

export default function AttendanceContextLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AttendanceYearTermLayoutProvider>
      <AttendanceContextLayoutContent>{children}</AttendanceContextLayoutContent>
    </AttendanceYearTermLayoutProvider>
  );
}
