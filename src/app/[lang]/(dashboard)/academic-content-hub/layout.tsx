import AcademicsContextLayout from "@/features/academics/components/layout/AcademicsContextLayout";
import {
  AcademicContentAccessGuard,
  AcademicContentShell,
} from "@/features/academic-content";

export default function AcademicContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AcademicsContextLayout>
      <AcademicContentAccessGuard>
        <AcademicContentShell>{children}</AcademicContentShell>
      </AcademicContentAccessGuard>
    </AcademicsContextLayout>
  );
}
