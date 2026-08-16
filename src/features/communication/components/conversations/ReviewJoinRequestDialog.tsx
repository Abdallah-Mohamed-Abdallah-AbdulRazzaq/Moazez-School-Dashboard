"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/ui/input/TextArea";
import Modal from "@/components/ui/modal/Modal";
import type { ReviewConversationJoinRequestValues } from "@/features/communication/hooks/useConversationJoinRequests";
import type { ConversationJoinRequest } from "@/features/communication/types/conversation.types";

export type ReviewJoinRequestMode = "approve" | "reject";

export interface ReviewJoinRequestDialogLabels {
  approveTitle: string;
  rejectTitle: string;
  approveDescription: string;
  rejectDescription: string;
  reason: string;
  cancel: string;
  approve: string;
  reject: string;
}

export interface ReviewJoinRequestDialogProps {
  open: boolean;
  mode: ReviewJoinRequestMode;
  joinRequest?: ConversationJoinRequest | null;
  labels: ReviewJoinRequestDialogLabels;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: ReviewConversationJoinRequestValues) => Promise<void> | void;
}

export default function ReviewJoinRequestDialog({
  isSubmitting,
  labels,
  mode,
  onClose,
  onSubmit,
  open,
}: ReviewJoinRequestDialogProps) {
  const [reason, setReason] = useState("");
  const isReject = mode === "reject";

  const handleSubmit = async () => {
    await onSubmit({ reason });
    setReason("");
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isReject ? labels.rejectTitle : labels.approveTitle}
      variant={isReject ? "danger" : "default"}
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            type="button"
            variant={isReject ? "danger" : "primary"}
            loading={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {isReject ? labels.reject : labels.approve}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        <p className="text-sm text-slate-600">
          {isReject ? labels.rejectDescription : labels.approveDescription}
        </p>
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
