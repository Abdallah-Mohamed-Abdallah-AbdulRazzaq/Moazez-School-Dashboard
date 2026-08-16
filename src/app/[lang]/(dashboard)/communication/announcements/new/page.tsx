import CreateAnnouncementPage from "@/features/communication/pages/CreateAnnouncementPage";
import CommunicationAccessGuard from "@/features/communication/components/CommunicationAccessGuard";

export default function Page() {
  return (
    <CommunicationAccessGuard permission="communication.announcements.manage">
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <CreateAnnouncementPage />
      </main>
    </CommunicationAccessGuard>
  );
}
