import AcademicsContextLayout from "@/features/academics/components/layout/AcademicsContextLayout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AcademicsContextLayout>{children}</AcademicsContextLayout>;
}
