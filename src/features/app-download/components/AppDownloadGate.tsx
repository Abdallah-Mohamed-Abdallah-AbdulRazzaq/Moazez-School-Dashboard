"use client";

import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import { getAppDownloadAudience } from "@/features/app-download/utils/appDownloadAudience";
import { AppDownloadScreen } from "./AppDownloadScreen";

export function AppDownloadGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <MainLoader />;
  }

  const audience = getAppDownloadAudience(user);

  return audience ? <AppDownloadScreen audience={audience} /> : <>{children}</>;
}
