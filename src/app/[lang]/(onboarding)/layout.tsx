import { ToastProvider } from "@/components/ui/toast/Toast";
import { SetupStatusProvider } from "@/features/onboarding/context/SetupStatusContext";
import { getTranslations } from "next-intl/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("onboarding");

  return (
    <ToastProvider>
      <SetupStatusProvider>
        <main aria-label={t("layout.label")} className="min-h-screen bg-gray-50">
          {children}
        </main>
      </SetupStatusProvider>
    </ToastProvider>
  );
}
