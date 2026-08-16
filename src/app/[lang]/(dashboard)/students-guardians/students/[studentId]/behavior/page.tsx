import StudentTabLoader from "@/features/students-guardians/students/components/StudentTabLoader";
import BehaviorAccessGuard from "@/features/behavior/shared/components/BehaviorAccessGuard";

export default async function StudentBehaviorPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return (
    <BehaviorAccessGuard permission="behavior.records.view">
      <StudentTabLoader studentId={studentId} tab="behavior" />
    </BehaviorAccessGuard>
  );
}
