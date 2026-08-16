import AnnouncementDetailsPage from "@/features/communication/pages/AnnouncementDetailsPage";
import CommunicationAccessGuard from "@/features/communication/components/CommunicationAccessGuard";

interface PageProps {
  params: Promise<{
    announcementId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { announcementId } = await params;

  return (
    <CommunicationAccessGuard
      permissions={[
        "communication.announcements.view",
        "communication.announcements.manage",
        "communication.policies.view",
        "communication.admin.view",
      ]}
    >
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <AnnouncementDetailsPage announcementId={announcementId} />
      </main>
    </CommunicationAccessGuard>
  );
}
