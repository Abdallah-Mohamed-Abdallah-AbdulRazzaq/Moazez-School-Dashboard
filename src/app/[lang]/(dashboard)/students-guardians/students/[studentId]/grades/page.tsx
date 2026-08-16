import StudentTabLoader from "@/features/students-guardians/students/components/StudentTabLoader";
import GradesAccessGuard from "@/features/grades/shared/components/GradesAccessGuard";

export default async function StudentGradesPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return (
    <GradesAccessGuard permission="grades.snapshots.view">
      <StudentTabLoader studentId={studentId} tab="grades" />
    </GradesAccessGuard>
  );
}
