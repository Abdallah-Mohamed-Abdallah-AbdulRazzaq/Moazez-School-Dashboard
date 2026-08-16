"use client";

import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import type { ConversationParticipant } from "@/features/communication/types/conversation.types";

export interface RemoveParticipantDialogLabels {
  title: string;
  description: string;
  cancel: string;
  remove: string;
}

export interface RemoveParticipantDialogProps {
  open: boolean;
  participant?: ConversationParticipant | null;
  labels: RemoveParticipantDialogLabels;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function RemoveParticipantDialog({
  isSubmitting,
  labels,
  onClose,
  onConfirm,
  open,
}: RemoveParticipantDialogProps) {
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
            {labels.remove}
          </Button>
        </>
      }
    >
      <p className="pb-4 text-sm text-slate-600">{labels.description}</p>
    </Modal>
  );
}
