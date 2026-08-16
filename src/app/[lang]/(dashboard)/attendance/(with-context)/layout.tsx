import AttendanceContextLayout from "@/features/attendance/shared/components/layout/AttendanceContextLayout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AttendanceContextLayout>{children}</AttendanceContextLayout>;
}
