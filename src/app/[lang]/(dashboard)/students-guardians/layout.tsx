"use client";

import { usePathname } from "next/navigation";
import StudentsGuardiansYearTermContextBar from "@/features/students-guardians/shared/components/StudentsGuardiansYearTermContextBar";
import {
  StudentsGuardiansYearTermProvider,
  useStudentsGuardiansYearTermContext,
} from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";

function StudentsGuardiansLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname().replace(/\/+$/, "");
  const usesYearOnlyStudentContext =
    pathname.endsWith("/students-guardians") ||
    pathname.endsWith("/students-guardians/students");
  const {
    academicYears,
    terms,
    yearId,
    termId,
    termStatus,
    isLoading,
    setYearId,
    setTermId,
  } = useStudentsGuardiansYearTermContext();

  return (
    <div className="min-w-0">
      <StudentsGuardiansYearTermContextBar
        academicYearId={yearId}
        termId={termId}
        termStatus={termStatus}
        academicYears={academicYears}
        terms={terms}
        isLoading={isLoading}
        onAcademicYearChange={setYearId}
        onTermChange={setTermId}
        showTermSelector={!usesYearOnlyStudentContext}
      />
      {children}
    </div>
  );
}

export default function StudentsGuardiansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentsGuardiansYearTermProvider>
      <StudentsGuardiansLayoutContent>{children}</StudentsGuardiansLayoutContent>
    </StudentsGuardiansYearTermProvider>
  );
}
