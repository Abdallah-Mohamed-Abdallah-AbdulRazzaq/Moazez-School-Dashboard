"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/ui/input/TextArea";
import Modal from "@/components/ui/modal/Modal";
import type { SupportedModerationAction } from "@/features/communication/types/safety.types";

interface MessageModerationDialogProps {
  action: SupportedModerationAction | null;
  isSubmitting: boolean;
  labels: {
    cancel: string;
    confirm: string;
    reason: string;
    reasonRequired: string;
    title: string;
  };
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export default function MessageModerationDialog({
  action,
  isSubmitting,
  labels,
  onClose,
  onConfirm,
}: MessageModerationDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setReason("");
    setError(null);
    onClose();
  };

  const submit = async () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError(labels.reasonRequired);
      return;
    }
    try {
      await onConfirm(trimmedReason);
      setReason("");
      setError(null);
    } catch {
      // The caller presents the domain error; keep the reason for retry.
    }
  };

  return (
    <Modal
      isOpen={Boolean(action)}
      onClose={close}
      title={labels.title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" disabled={isSubmitting} onClick={close}>
            {labels.cancel}
          </Button>
          <Button
            variant={action === "delete" ? "danger" : "primary"}
            loading={isSubmitting}
            onClick={() => void submit()}
          >
            {labels.confirm}
          </Button>
        </>
      }
    >
      <TextArea
        label={labels.reason}
        value={reason}
        error={error ?? undefined}
        disabled={isSubmitting}
        onChange={(event) => setReason(event.target.value)}
      />
    </Modal>
  );
}
