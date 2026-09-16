import CommunicationAccessGuard from "@/features/communication/components/CommunicationAccessGuard";
import MessageReportDetailsPage from "@/features/communication/pages/MessageReportDetailsPage";

interface PageProps {
  params: Promise<{
    reportId: string;
  }>;
}

export default async function CommunicationSafetyReportDetailsPage({
  params,
}: PageProps) {
  const { reportId } = await params;

  return (
    <CommunicationAccessGuard permission="communication.messages.moderate">
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6">
        <MessageReportDetailsPage reportId={reportId} />
      </main>
    </CommunicationAccessGuard>
  );
}
