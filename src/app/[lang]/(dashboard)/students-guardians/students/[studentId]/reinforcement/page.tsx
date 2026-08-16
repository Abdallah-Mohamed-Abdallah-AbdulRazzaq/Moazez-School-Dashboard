import StudentTabLoader from "@/features/students-guardians/students/components/StudentTabLoader";
import ReinforcementAccessGuard from "@/features/reinforcement/components/ReinforcementAccessGuard";

export default async function Page({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return (
    <ReinforcementAccessGuard permission="reinforcement.overview.view">
      <StudentTabLoader studentId={studentId} tab="reinforcement" />
    </ReinforcementAccessGuard>
  );
}
