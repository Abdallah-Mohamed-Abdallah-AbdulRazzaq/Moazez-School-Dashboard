"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import UserSearchSelect from "@/features/communication/components/selectors/UserSearchSelect";
import type { CreateConversationInviteValues } from "@/features/communication/hooks/useConversationInvites";

export interface CreateInviteDialogLabels {
  title: string;
  invitedUserId: string;
  expiresAt: string;
  cancel: string;
  create: string;
  userRequired: string;
}

export interface CreateInviteDialogProps {
  open: boolean;
  labels: CreateInviteDialogLabels;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: CreateConversationInviteValues) => Promise<void> | void;
}

export default function CreateInviteDialog({
  isSubmitting,
  labels,
  onClose,
  onSubmit,
  open,
}: CreateInviteDialogProps) {
  const [values, setValues] = useState<CreateConversationInviteValues>({
    invitedUserId: "",
    expiresAt: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!values.invitedUserId.trim()) {
      setError(labels.userRequired);
      return;
    }

    setError(null);
    await onSubmit(values);
    setValues({ invitedUserId: "", expiresAt: "" });
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
        <UserSearchSelect
          label={labels.invitedUserId}
          value={values.invitedUserId}
          placeholder={labels.invitedUserId}
          error={error ?? undefined}
          onChange={(invitedUserId) =>
            setValues((current) => ({
              ...current,
              invitedUserId,
            }))
          }
        />
        <Input
          label={labels.expiresAt}
          type="datetime-local"
          value={values.expiresAt ?? ""}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              expiresAt: event.target.value,
            }))
          }
        />
      </div>
    </Modal>
  );
}
