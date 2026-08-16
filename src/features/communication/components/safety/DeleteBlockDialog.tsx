"use client";

import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import type { UserBlock } from "@/features/communication/types/safety.types";

export interface DeleteBlockDialogLabels {
  title: string;
  description: string;
  cancel: string;
  unblock: string;
}

export interface DeleteBlockDialogProps {
  open: boolean;
  block?: UserBlock | null;
  labels: DeleteBlockDialogLabels;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function DeleteBlockDialog({
  block,
  isSubmitting,
  labels,
  onClose,
  onConfirm,
  open,
}: DeleteBlockDialogProps) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={labels.title}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={isSubmitting}
            disabled={!block}
            onClick={() => void onConfirm()}
          >
            {labels.unblock}
          </Button>
        </>
      }
    >
      <p className="pb-4 text-sm text-slate-600">{labels.description}</p>
    </Modal>
  );
}
