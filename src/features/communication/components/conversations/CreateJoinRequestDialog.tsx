"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/ui/input/TextArea";
import Modal from "@/components/ui/modal/Modal";
import type { CreateConversationJoinRequestValues } from "@/features/communication/hooks/useConversationJoinRequests";

export interface CreateJoinRequestDialogLabels {
  title: string;
  note: string;
  cancel: string;
  create: string;
}

export interface CreateJoinRequestDialogProps {
  open: boolean;
  labels: CreateJoinRequestDialogLabels;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: CreateConversationJoinRequestValues) => Promise<void> | void;
}

export default function CreateJoinRequestDialog({
  isSubmitting,
  labels,
  onClose,
  onSubmit,
  open,
}: CreateJoinRequestDialogProps) {
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    await onSubmit({ note });
    setNote("");
  };

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
            loading={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {labels.create}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        <TextArea
          label={labels.note}
          value={note}
          rows={3}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
    </Modal>
  );
}
