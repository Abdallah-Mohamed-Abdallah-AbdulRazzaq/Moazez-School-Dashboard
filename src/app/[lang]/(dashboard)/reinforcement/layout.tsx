import AcademicsContextLayout from "@/features/academics/components/layout/AcademicsContextLayout";

export default function ReinforcementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AcademicsContextLayout
      contextOptions={{
        yearParamKey: "academicYearId",
        termParamKey: "termId",
      }}
    >
      {children}
    </AcademicsContextLayout>
  );
}
