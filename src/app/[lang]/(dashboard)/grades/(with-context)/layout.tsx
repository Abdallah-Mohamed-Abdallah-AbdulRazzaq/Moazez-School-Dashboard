import GradesContextLayout from "@/features/grades/components/layout/GradesContextLayout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GradesContextLayout>{children}</GradesContextLayout>;
}
