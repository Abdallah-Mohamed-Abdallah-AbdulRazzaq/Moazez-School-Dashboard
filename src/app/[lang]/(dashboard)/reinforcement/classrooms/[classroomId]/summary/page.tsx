import ClassroomReinforcementSummaryPage from "@/features/reinforcement/pages/ClassroomReinforcementSummaryPage";
import ReinforcementAccessGuard from "@/features/reinforcement/components/ReinforcementAccessGuard";

interface PageProps {
  params: Promise<{
    classroomId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { classroomId } = await params;

  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <ReinforcementAccessGuard permission="reinforcement.overview.view">
        <ClassroomReinforcementSummaryPage classroomId={classroomId} />
      </ReinforcementAccessGuard>
    </main>
  );
}
