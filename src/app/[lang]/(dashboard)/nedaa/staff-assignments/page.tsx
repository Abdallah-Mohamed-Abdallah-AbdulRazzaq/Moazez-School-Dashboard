import NedaaAccessGuard from "@/features/nedaa/components/NedaaAccessGuard";
import NedaaStaffAssignmentsPage from "@/features/nedaa/pages/NedaaStaffAssignmentsPage";

export default function Page() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <NedaaAccessGuard permission="dismissal.staff.view">
        <NedaaStaffAssignmentsPage />
      </NedaaAccessGuard>
    </main>
  );
}
