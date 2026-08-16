"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getApplicationRegistrationHandoff } from "@/features/admissions/applications/api/applicationRegistrationApi";
import type {
  RegistrationHandoffResponseDto,
  RegistrationStudentRequest,
} from "@/features/admissions/applications/api/registrationDtos";
import type { Guardian } from "@/features/admissions/applications/types/guardian";
import type { Document } from "@/features/admissions/applications/types/document";

interface ApplicationRelatedData {
  handoff: RegistrationHandoffResponseDto | null;
  guardians: Guardian[];
  documents: Document[];
  studentDraft: Partial<RegistrationStudentRequest> | null;
  previousSchool: string | null;
  isLoadingHandoff: boolean;
  handoffError: string | null;
  reloadHandoff: () => Promise<void>;
}

export function useApplicationRelatedData(
  applicationId: string | null | undefined,
  enabled = true,
): ApplicationRelatedData {
  const [handoff, setHandoff] = useState<RegistrationHandoffResponseDto | null>(
    null,
  );
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [isLoadingHandoff, setIsLoadingHandoff] = useState(false);

  const reloadHandoff = useCallback(async () => {
    if (!enabled || !applicationId) {
      setHandoff(null);
      setHandoffError(null);
      setIsLoadingHandoff(false);
      return;
    }

    setIsLoadingHandoff(true);
    setHandoffError(null);
    try {
      setHandoff(await getApplicationRegistrationHandoff(applicationId));
    } catch (error) {
      console.error("Failed to load application registration handoff:", error);
      setHandoff(null);
      setHandoffError("Unable to load registration draft data.");
    } finally {
      setIsLoadingHandoff(false);
    }
  }, [applicationId, enabled]);

  useEffect(() => {
    void Promise.resolve().then(reloadHandoff);
  }, [reloadHandoff]);

  const studentDraft = handoff?.wizardDraft?.student ?? null;
  const previousSchool = handoff?.source?.applicantRequest?.previousSchool ?? null;

  const guardians = useMemo(() => {
    return (handoff?.wizardDraft?.guardians ?? []).map(
      (guardian, index): Guardian => ({
        id: `handoff-guardian-${index}`,
        full_name: guardian.profile.full_name ?? "",
        relation: guardian.profile.relation ?? "",
        phone_primary: guardian.profile.phone_primary ?? "",
        phone_secondary: guardian.profile.phone_secondary ?? "",
        email: guardian.profile.email ?? "",
        national_id: guardian.profile.national_id ?? "",
        job_title: guardian.profile.job_title ?? "",
        workplace: guardian.profile.workplace ?? "",
        is_primary: guardian.relationship?.is_primary ?? index === 0,
        can_pickup: guardian.profile.can_pickup ?? false,
        can_receive_notifications:
          guardian.profile.can_receive_notifications ?? false,
      }),
    );
  }, [handoff]);

  const documents = useMemo(() => {
    return (handoff?.documents ?? []).map(
      (document): Document => ({
        id: document.applicationDocumentId,
        type: document.documentType,
        name: document.file.originalName,
        status: document.status,
        uploadedDate: undefined,
        url: document.file.id ? `/api/files/${document.file.id}/download` : undefined,
        fileType: document.file.mimeType.includes("pdf")
          ? "pdf"
          : document.file.mimeType.startsWith("image/")
            ? "image"
            : undefined,
        fileId: document.file.id,
        labelEn: document.documentType,
        notes: document.notes ?? undefined,
      }),
    );
  }, [handoff]);

  return {
    handoff,
    guardians,
    documents,
    studentDraft,
    previousSchool,
    isLoadingHandoff,
    handoffError,
    reloadHandoff,
  };
}
