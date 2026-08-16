import MessageReportDetailsPage from "@/features/communication/pages/MessageReportDetailsPage";
import CommunicationAccessGuard from "@/features/communication/components/CommunicationAccessGuard";

interface PageProps {
  params: Promise<{
    reportId: string;
  }>;
}

export default async function CommunicationModerationDetailsPage({
  params,
}: PageProps) {
  const { reportId } = await params;

  return (
    <CommunicationAccessGuard permission="communication.messages.moderate">
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <MessageReportDetailsPage reportId={reportId} />
      </main>
    </CommunicationAccessGuard>
  );
}
