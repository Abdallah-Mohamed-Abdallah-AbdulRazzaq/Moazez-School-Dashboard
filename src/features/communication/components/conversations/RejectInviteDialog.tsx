"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/ui/input/TextArea";
import Modal from "@/components/ui/modal/Modal";
import type { RejectConversationInviteValues } from "@/features/communication/hooks/useConversationInvites";
import type { ConversationInvite } from "@/features/communication/types/conversation.types";

export interface RejectInviteDialogLabels {
  title: string;
  description: string;
  reason: string;
  cancel: string;
  reject: string;
}

export interface RejectInviteDialogProps {
  open: boolean;
  invite?: ConversationInvite | null;
  labels: RejectInviteDialogLabels;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: RejectConversationInviteValues) => Promise<void> | void;
}

export default function RejectInviteDialog({
  isSubmitting,
  labels,
  onClose,
  onSubmit,
  open,
}: RejectInviteDialogProps) {
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    await onSubmit({ reason });
    setReason("");
  };

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
            onClick={() => void handleSubmit()}
          >
            {labels.reject}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        <p className="text-sm text-slate-600">{labels.description}</p>
        <TextArea
          label={labels.reason}
          value={reason}
          rows={3}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
    </Modal>
  );
}
