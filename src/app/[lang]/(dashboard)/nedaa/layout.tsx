import AcademicsContextLayout from "@/features/academics/components/layout/AcademicsContextLayout";

export default function NedaaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AcademicsContextLayout>{children}</AcademicsContextLayout>;
}
