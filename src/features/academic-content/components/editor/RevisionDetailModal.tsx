"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/modal/Modal";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { getAcademicContentRevision } from "../../services/academicContentApi";
import { academicContentUiError } from "../../services/academicContentErrors";
import type { AcademicContentRevisionDetail } from "../../types/contracts";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import RevisionSnapshotView from "./RevisionSnapshotView";

interface RevisionDetailModalProps {
  contentId: string;
  revisionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RevisionDetailModal({
  contentId,
  revisionId,
  isOpen,
  onClose,
}: RevisionDetailModalProps) {
  const [revision, setRevision] = useState<AcademicContentRevisionDetail | null>(null);
  const [loadError, setLoadError] = useState<{
    revisionId: string;
    message: string;
  } | null>(null);
  const t = useAcademicContentTranslations("revisions");

  useEffect(() => {
    if (!isOpen || !revisionId) return;
    let active = true;
    void getAcademicContentRevision(contentId, revisionId)
      .then((loadedRevision) => {
        if (!active) return;
        if (loadedRevision.id !== revisionId) {
          setLoadError({
            revisionId,
            message: t("mismatch"),
          });
          return;
        }
        setRevision(loadedRevision);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setLoadError({
            revisionId,
            message: academicContentUiError(loadError).message,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [contentId, isOpen, revisionId, t]);

  const currentRevision = revision?.id === revisionId ? revision : null;
  const currentError = loadError?.revisionId === revisionId ? loadError.message : null;
  const isLoading = isOpen && Boolean(revisionId) && !currentRevision && !currentError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentRevision ? t("modal_number", { number: currentRevision.revisionNumber }) : t("modal_title")}
      size="xl"
    >
      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center">
          <PartialLoader />
        </div>
      ) : currentError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {currentError}
        </div>
      ) : currentRevision ? (
        <RevisionSnapshotView revision={currentRevision} />
      ) : null}
    </Modal>
  );
}
