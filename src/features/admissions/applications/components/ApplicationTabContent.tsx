"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Application } from "@/features/admissions/types/admissions";
import { fetchApplicationById } from "@/features/admissions/applications/services/applicationsApiService";
import { AdmissionsAccessDenied } from "@/features/admissions/shared/components/AdmissionsAccessGuard";
import { usePermissions } from "@/hooks/usePermissions";
import DetailsTab from "@/features/admissions/applications/components/tabs/DetailsTab";
import GuardiansTab from "@/features/admissions/applications/components/tabs/GuardiansTab";
import DocumentsTab from "@/features/admissions/applications/components/tabs/DocumentsTab";
import TestsTab from "@/features/admissions/applications/components/tabs/TestsTab";
import InterviewsTab from "@/features/admissions/applications/components/tabs/InterviewsTab";
import ApplicationReadinessPanel from "@/features/admissions/applications/components/tabs/ApplicationReadinessPanel";
import { useApplicationRelatedData } from "@/features/admissions/applications/hooks/useApplicationRelatedData";

type ApplicationTab =
  | "details"
  | "readiness"
  | "guardians"
  | "documents"
  | "tests"
  | "interviews";

interface ApplicationTabContentProps {
  applicationId: string;
  tab: ApplicationTab;
}

export default function ApplicationTabContent({
  applicationId,
  tab,
}: ApplicationTabContentProps) {
  const t = useTranslations("admissions.application360");
  const { hasPermission } = usePermissions();
  const canViewApplications = hasPermission("admissions.applications.view");
  const canManageApplications = hasPermission("admissions.applications.manage");
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const needsRegistrationHandoff = tab === "guardians" && canManageApplications;
  const relatedData = useApplicationRelatedData(
    applicationId,
    needsRegistrationHandoff,
  );

  useEffect(() => {
    if (!canViewApplications) return;
    let cancelled = false;
    void fetchApplicationById(applicationId)
      .then((nextApplication) => {
        if (!cancelled) setApplication(nextApplication);
      })
      .catch((error) => {
        console.error("Failed to load application tab:", error);
        if (!cancelled) setApplication(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applicationId, canViewApplications]);

  if (
    !canViewApplications ||
    (tab === "guardians" && !canManageApplications)
  ) {
    return <AdmissionsAccessDenied />;
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">{t("loading")}</p>;
  }

  if (!application) {
    return <p className="text-sm text-gray-500">{t("not_found")}</p>;
  }

  if (tab === "details") {
    return (
      <DetailsTab application={application} />
    );
  }
  if (tab === "readiness") {
    return <ApplicationReadinessPanel application={application} />;
  }
  if (tab === "guardians") {
    return (
      <GuardiansTab
        application={application}
        guardians={relatedData.guardians}
        isLoading={relatedData.isLoadingHandoff}
        error={relatedData.handoffError}
        onRetry={relatedData.reloadHandoff}
      />
    );
  }
  if (tab === "documents") {
    return (
      <DocumentsTab
        application={application}
        initialDocuments={relatedData.documents}
      />
    );
  }
  if (tab === "tests") {
    return <TestsTab application={application} />;
  }
  if (tab === "interviews") {
    return <InterviewsTab application={application} />;
  }
  return null;
}
