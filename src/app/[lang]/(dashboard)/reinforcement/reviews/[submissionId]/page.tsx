import ReinforcementReviewDetailPage from "@/features/reinforcement/pages/ReinforcementReviewDetailPage";
import ReinforcementAccessGuard from "@/features/reinforcement/components/ReinforcementAccessGuard";

interface PageProps {
  params: Promise<{
    submissionId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { submissionId } = await params;

  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <ReinforcementAccessGuard permission="reinforcement.reviews.view">
        <ReinforcementReviewDetailPage submissionId={submissionId} />
      </ReinforcementAccessGuard>
    </main>
  );
}
