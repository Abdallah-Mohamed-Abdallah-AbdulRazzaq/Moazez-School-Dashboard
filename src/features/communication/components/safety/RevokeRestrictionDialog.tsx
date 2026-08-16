"use client";

import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import type { Restriction } from "@/features/communication/types/safety.types";

export interface RevokeRestrictionDialogLabels {
  title: string;
  description: string;
  cancel: string;
  revoke: string;
}

export interface RevokeRestrictionDialogProps {
  open: boolean;
  restriction?: Restriction | null;
  labels: RevokeRestrictionDialogLabels;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function RevokeRestrictionDialog({
  isSubmitting,
  labels,
  onClose,
  onConfirm,
  open,
  restriction,
}: RevokeRestrictionDialogProps) {
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
            disabled={!restriction}
            onClick={() => void onConfirm()}
          >
            {labels.revoke}
          </Button>
        </>
      }
    >
      <p className="pb-4 text-sm text-slate-600">{labels.description}</p>
    </Modal>
  );
}
