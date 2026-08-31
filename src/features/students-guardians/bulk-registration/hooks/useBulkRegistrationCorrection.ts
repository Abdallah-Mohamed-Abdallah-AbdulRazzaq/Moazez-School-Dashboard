"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast/Toast";
import {
  createBulkRegistration,
  downloadBulkRegistrationTemplate,
} from "../api/bulkRegistrationApi";
import type {
  BulkRegistrationBatchDetail,
  BulkRegistrationPlacementInput,
} from "../api/bulkRegistrationDtos";

interface CorrectionMessages {
  uploadSuccess: string;
  uploadFailed: string;
  downloadSuccess: string;
  downloadFailed: string;
}

interface CorrectionOptions {
  batchId: string;
  batch: BulkRegistrationBatchDetail | null;
  lang: string;
  messages: CorrectionMessages;
}

function placementInput(
  batch: BulkRegistrationBatchDetail,
): BulkRegistrationPlacementInput {
  return {
    academicYearId: batch.placement.academicYearId,
    ...(batch.placement.termId ? { termId: batch.placement.termId } : {}),
    classroomId: batch.placement.classroomId,
    enrollmentDate: batch.placement.enrollmentDate,
  };
}

export function useBulkRegistrationCorrection({
  batchId,
  batch,
  lang,
  messages,
}: CorrectionOptions) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  useEffect(() => {
    setSelectedFile(null);
  }, [batchId]);

  const downloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadBulkRegistrationTemplate();
      showSuccess(messages.downloadSuccess);
    } catch {
      showError(messages.downloadFailed);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const upload = async () => {
    if (!batch || !selectedFile) return;
    setUploading(true);
    try {
      const replacement = await createBulkRegistration(
        placementInput(batch),
        selectedFile,
      );
      showSuccess(messages.uploadSuccess);
      router.replace(
        `/${lang}/students-guardians/bulk-registration/${replacement.id}`,
      );
    } catch {
      showError(messages.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  return {
    selectedFile,
    uploading,
    downloadingTemplate,
    setSelectedFile,
    downloadTemplate,
    upload,
  };
}
