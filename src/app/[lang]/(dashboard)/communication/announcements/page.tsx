import AnnouncementsPage from "@/features/communication/pages/AnnouncementsPage";
import CommunicationAccessGuard from "@/features/communication/components/CommunicationAccessGuard";

export default function Page() {
  return (
    <CommunicationAccessGuard permission="communication.announcements.view">
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <AnnouncementsPage />
      </main>
    </CommunicationAccessGuard>
  );
}
