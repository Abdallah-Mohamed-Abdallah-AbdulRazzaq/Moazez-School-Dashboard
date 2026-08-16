import AcademicsContextLayout from "@/features/academics/components/layout/AcademicsContextLayout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Academics workspace pages keep the default shared year/term query contract.
  return <AcademicsContextLayout>{children}</AcademicsContextLayout>;
}
