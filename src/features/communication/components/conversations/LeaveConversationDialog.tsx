"use client";

import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";

export interface LeaveConversationDialogLabels {
  title: string;
  description: string;
  cancel: string;
  leave: string;
}

export interface LeaveConversationDialogProps {
  open: boolean;
  labels: LeaveConversationDialogLabels;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function LeaveConversationDialog({
  isSubmitting,
  labels,
  onClose,
  onConfirm,
  open,
}: LeaveConversationDialogProps) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={labels.title}
      variant="danger"
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={isSubmitting}
            onClick={() => void onConfirm()}
          >
            {labels.leave}
          </Button>
        </>
      }
    >
      <p className="pb-4 text-sm text-slate-600">{labels.description}</p>
    </Modal>
  );
}
