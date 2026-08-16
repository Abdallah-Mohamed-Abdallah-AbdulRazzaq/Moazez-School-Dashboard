import NedaaAccessGuard from "@/features/nedaa/components/NedaaAccessGuard";
import NedaaSettingsPage from "@/features/nedaa/pages/NedaaSettingsPage";

export default function Page() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <NedaaAccessGuard permission="dismissal.settings.view">
        <NedaaSettingsPage />
      </NedaaAccessGuard>
    </main>
  );
}
