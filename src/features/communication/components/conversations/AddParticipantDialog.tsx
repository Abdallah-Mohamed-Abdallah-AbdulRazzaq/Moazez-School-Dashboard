"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import Modal from "@/components/ui/modal/Modal";
import UserSearchSelect from "@/features/communication/components/selectors/UserSearchSelect";
import type {
  ParticipantFormValues,
} from "@/features/communication/hooks/useConversationParticipants";
import type {
  ParticipantRole,
  ParticipantStatus,
} from "@/features/communication/types/conversation.types";

export interface ParticipantDialogOptionLabels {
  owner: string;
  admin: string;
  moderator: string;
  member: string;
  readOnly: string;
  system: string;
  active: string;
  invited: string;
  left: string;
  removed: string;
  muted: string;
  blocked: string;
}

export interface AddParticipantDialogLabels extends ParticipantDialogOptionLabels {
  title: string;
  userId: string;
  role: string;
  status: string;
  mutedUntil: string;
  cancel: string;
  add: string;
  userRequired: string;
}

export interface AddParticipantDialogProps {
  open: boolean;
  labels: AddParticipantDialogLabels;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: ParticipantFormValues) => Promise<void> | void;
}

export const participantRoleOptions = (
  labels: ParticipantDialogOptionLabels,
) => [
  { value: "owner", label: labels.owner },
  { value: "admin", label: labels.admin },
  { value: "moderator", label: labels.moderator },
  { value: "member", label: labels.member },
  { value: "read_only", label: labels.readOnly },
  { value: "system", label: labels.system },
];

export const participantStatusOptions = (
  labels: ParticipantDialogOptionLabels,
) => [
  { value: "active", label: labels.active },
  { value: "invited", label: labels.invited },
  { value: "left", label: labels.left },
  { value: "removed", label: labels.removed },
  { value: "muted", label: labels.muted },
  { value: "blocked", label: labels.blocked },
];

export default function AddParticipantDialog({
  isSubmitting,
  labels,
  onClose,
  onSubmit,
  open,
}: AddParticipantDialogProps) {
  const [values, setValues] = useState<ParticipantFormValues>({
    userId: "",
    role: "member",
    status: "active",
    mutedUntil: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!values.userId?.trim()) {
      setError(labels.userRequired);
      return;
    }

    setError(null);
    await onSubmit(values);
    setValues({ userId: "", role: "member", status: "active", mutedUntil: "" });
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
            {labels.add}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        <UserSearchSelect
          label={labels.userId}
          value={values.userId ?? ""}
          placeholder={labels.userId}
          error={error ?? undefined}
          onChange={(userId) =>
            setValues((current) => ({ ...current, userId }))
          }
        />
        <Select
          label={labels.role}
          value={values.role ?? "member"}
          options={participantRoleOptions(labels)}
          onChange={(value) =>
            setValues((current) => ({
              ...current,
              role: value as ParticipantRole,
            }))
          }
        />
        <Select
          label={labels.status}
          value={values.status ?? "active"}
          options={participantStatusOptions(labels)}
          onChange={(value) =>
            setValues((current) => ({
              ...current,
              status: value as ParticipantStatus,
            }))
          }
        />
        <Input
          label={labels.mutedUntil}
          type="datetime-local"
          value={values.mutedUntil ?? ""}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              mutedUntil: event.target.value,
            }))
          }
        />
      </div>
    </Modal>
  );
}
