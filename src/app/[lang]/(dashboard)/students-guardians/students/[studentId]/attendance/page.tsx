import StudentTabLoader from "@/features/students-guardians/students/components/StudentTabLoader";

export default async function StudentAttendancePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <StudentTabLoader studentId={studentId} tab="attendance" />;
}
