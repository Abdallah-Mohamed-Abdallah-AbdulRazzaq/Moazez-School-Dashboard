"use client";

import BehaviorYearTermContextBar from "@/features/behavior/shared/components/BehaviorYearTermContextBar";
import {
  BehaviorYearTermProvider,
  useBehaviorYearTermContext,
} from "@/features/behavior/shared/hooks/useBehaviorYearTermContext";

function BehaviorLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    academicYears,
    terms,
    yearId,
    termId,
    termStatus,
    isLoading,
    setYearId,
    setTermId,
  } = useBehaviorYearTermContext();

  return (
    <div className="min-w-0">
      <BehaviorYearTermContextBar
        academicYearId={yearId}
        termId={termId}
        termStatus={termStatus}
        academicYears={academicYears}
        terms={terms}
        isLoading={isLoading}
        onAcademicYearChange={setYearId}
        onTermChange={setTermId}
      />
      {children}
    </div>
  );
}

export default function BehaviorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BehaviorYearTermProvider>
      <BehaviorLayoutContent>{children}</BehaviorLayoutContent>
    </BehaviorYearTermProvider>
  );
}
