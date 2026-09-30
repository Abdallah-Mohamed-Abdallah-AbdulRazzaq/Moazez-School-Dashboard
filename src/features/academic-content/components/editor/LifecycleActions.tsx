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
import type {
  AcademicContentBase,
  AcademicContentDetail,
} from "../../types/contracts";

type LifecycleAction = "archive" | "restore" | "delete";

interface LifecycleActionsProps {
  content: AcademicContentDetail;
  canManage: boolean;
  onChanged: (updatedContent: AcademicContentBase) => Promise<unknown>;
  onDeleted: () => void;
}

const DIALOG_COPY: Record<
  LifecycleAction,
  { title: string; description: string; confirmLabel: string; severity: "warning" | "danger" }
> = {
  archive: {
    title: "Archive academic content",
    description: "Archive this draft and make its editor read-only? Unsaved local changes are not included.",
    confirmLabel: "Confirm archive",
    severity: "warning",
  },
  restore: {
    title: "Restore academic content",
    description: "Restore this archived content to a draft? The backend will verify eligibility.",
    confirmLabel: "Confirm restore",
    severity: "warning",
  },
  delete: {
    title: "Delete draft",
    description: "Permanently delete this draft? This action cannot be undone.",
    confirmLabel: "Confirm delete",
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

  if (!canManage || (content.status !== "DRAFT" && content.status !== "ARCHIVED")) {
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
        if (!response.ok) throw new Error("The draft was not deleted.");
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
        {content.status === "DRAFT" ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Archive aria-hidden="true" className="size-4" />}
              onClick={() => setPendingAction("archive")}
            >
              Archive
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              leftIcon={<Trash2 aria-hidden="true" className="size-4" />}
              onClick={() => setPendingAction("delete")}
            >
              Delete draft
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw aria-hidden="true" className="size-4" />}
            onClick={() => setPendingAction("restore")}
          >
            Restore
          </Button>
        )}
      </div>

      {dialogCopy && (
        <ConfirmDialog
          isOpen
          onClose={() => setPendingAction(null)}
          onConfirm={() => void confirm()}
          title={dialogCopy.title}
          description={dialogCopy.description}
          confirmLabel={dialogCopy.confirmLabel}
          cancelLabel="Cancel"
          loading={isSubmitting}
          severity={dialogCopy.severity}
        />
      )}
    </div>
  );
}
