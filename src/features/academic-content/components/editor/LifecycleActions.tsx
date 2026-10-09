"use client";

import { useState } from "react";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import {
  archiveAcademicContent,
  deleteAcademicContent,
  restoreAcademicContent,
} from "../../services/academicContentApi";
import { academicContentUiError } from "../../services/academicContentErrors";
import { isAcademicContentMutableStatus } from "../../model/academicContentPolicy";
import type {
  AcademicContentBase,
  AcademicContentDetail,
} from "../../types/contracts";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

type LifecycleAction = "archive" | "restore" | "delete";

interface LifecycleActionsProps {
  content: AcademicContentDetail;
  canManage: boolean;
  onChanged: (updatedContent: AcademicContentBase) => Promise<unknown>;
  onDeleted: () => void;
}

const DIALOG_COPY: Record<
  LifecycleAction,
  { titleKey: string; descriptionKey: string; confirmKey: string; severity: "warning" | "danger" }
> = {
  archive: {
    titleKey: "archive_title",
    descriptionKey: "archive_description",
    confirmKey: "archive_confirm",
    severity: "warning",
  },
  restore: {
    titleKey: "restore_title",
    descriptionKey: "restore_description",
    confirmKey: "restore_confirm",
    severity: "warning",
  },
  delete: {
    titleKey: "delete_title",
    descriptionKey: "delete_description",
    confirmKey: "delete_confirm",
    severity: "danger",
  },
};

export default function LifecycleActions({
  content,
  canManage,
  onChanged,
  onDeleted,
}: LifecycleActionsProps) {
  const [pendingAction, setPendingAction] = useState<LifecycleAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useAcademicContentTranslations("lifecycle");
  const commonT = useAcademicContentTranslations("common");
  const canArchive = isAcademicContentMutableStatus(content.status);
  const canDelete = content.status === "DRAFT";
  const canRestore = content.status === "ARCHIVED";

  if (!canManage || (!canArchive && !canRestore)) {
    return null;
  }

  const confirm = async () => {
    if (!pendingAction) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (pendingAction === "archive") {
        const updatedContent = await archiveAcademicContent(content.id);
        await onChanged(updatedContent);
      } else if (pendingAction === "restore") {
        const updatedContent = await restoreAcademicContent(content.id);
        await onChanged(updatedContent);
      } else {
        const response = await deleteAcademicContent(content.id);
        if (!response.ok) throw new Error(t("delete_failed"));
        onDeleted();
      }
      setPendingAction(null);
    } catch (actionError) {
      setError(academicContentUiError(actionError).message);
      setPendingAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogCopy = pendingAction ? DIALOG_COPY[pendingAction] : null;

  return (
    <div>
      {error && (
        <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {canArchive && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Archive aria-hidden="true" className="size-4" />}
            onClick={() => setPendingAction("archive")}
          >
            {t("archive")}
          </Button>
        )}
        {canDelete && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            leftIcon={<Trash2 aria-hidden="true" className="size-4" />}
            onClick={() => setPendingAction("delete")}
          >
            {t("delete")}
          </Button>
        )}
        {canRestore && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw aria-hidden="true" className="size-4" />}
            onClick={() => setPendingAction("restore")}
          >
            {t("restore")}
          </Button>
        )}
      </div>

      {dialogCopy && (
        <ConfirmDialog
          isOpen
          onClose={() => setPendingAction(null)}
          onConfirm={() => void confirm()}
          title={t(dialogCopy.titleKey)}
          description={t(dialogCopy.descriptionKey)}
          confirmLabel={t(dialogCopy.confirmKey)}
          cancelLabel={commonT("cancel")}
          loading={isSubmitting}
          severity={dialogCopy.severity}
        />
      )}
    </div>
  );
}
