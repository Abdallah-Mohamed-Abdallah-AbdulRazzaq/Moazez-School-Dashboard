import StudentReinforcementProgressPage from "@/features/reinforcement/pages/StudentReinforcementProgressPage";
import ReinforcementAccessGuard from "@/features/reinforcement/components/ReinforcementAccessGuard";

interface PageProps {
  params: Promise<{
    studentId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { studentId } = await params;

  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <ReinforcementAccessGuard permission="reinforcement.overview.view">
        <StudentReinforcementProgressPage studentId={studentId} />
      </ReinforcementAccessGuard>
    </main>
  );
}
