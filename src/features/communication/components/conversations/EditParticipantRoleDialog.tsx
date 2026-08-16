"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import Modal from "@/components/ui/modal/Modal";
import type {
  ParticipantFormValues,
  ParticipantRoleChangeValues,
} from "@/features/communication/hooks/useConversationParticipants";
import type {
  ConversationParticipant,
  ParticipantRole,
  ParticipantStatus,
} from "@/features/communication/types/conversation.types";
import {
  targetRoleForTransition,
  type ParticipantRoleTransition,
} from "@/features/communication/utils/participant-role-transitions";
import {
  participantRoleOptions,
  participantStatusOptions,
  type ParticipantDialogOptionLabels,
} from "./AddParticipantDialog";

export type ParticipantDialogMode = "edit" | "promote" | "demote";

export interface EditParticipantRoleDialogLabels
  extends ParticipantDialogOptionLabels {
  editTitle: string;
  promoteTitle: string;
  demoteTitle: string;
  role: string;
  targetRole: string;
  status: string;
  mutedUntil: string;
  cancel: string;
  save: string;
  promote: string;
  demote: string;
}

export interface EditParticipantRoleDialogProps {
  open: boolean;
  mode: ParticipantDialogMode;
  participant?: ConversationParticipant | null;
  labels: EditParticipantRoleDialogLabels;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (
    values: ParticipantFormValues | ParticipantRoleChangeValues,
  ) => Promise<void> | void;
}

function datetimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function titleForMode(
  mode: ParticipantDialogMode,
  labels: EditParticipantRoleDialogLabels,
) {
  if (mode === "promote") return labels.promoteTitle;
  if (mode === "demote") return labels.demoteTitle;
  return labels.editTitle;
}

function submitLabelForMode(
  mode: ParticipantDialogMode,
  labels: EditParticipantRoleDialogLabels,
) {
  if (mode === "promote") return labels.promote;
  if (mode === "demote") return labels.demote;
  return labels.save;
}

export default function EditParticipantRoleDialog({
  isSubmitting,
  labels,
  mode,
  onClose,
  onSubmit,
  open,
  participant,
}: EditParticipantRoleDialogProps) {
  const [values, setValues] = useState<ParticipantFormValues>({
    role: participant?.role ?? "member",
    status: participant?.status ?? "active",
    mutedUntil: datetimeLocalValue(participant?.mutedUntil),
  });
  const transition =
    mode === "edit" ? null : (mode as ParticipantRoleTransition);
  const targetRole = transition
    ? targetRoleForTransition(participant?.role, transition)
    : null;
  const roleOptions = targetRole
    ? participantRoleOptions(labels).filter((option) => option.value === targetRole)
    : participantRoleOptions(labels);

  const handleSubmit = async () => {
    if (mode === "edit") {
      await onSubmit(values);
      return;
    }

    if (targetRole) await onSubmit({ targetRole });
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={titleForMode(mode, labels)}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            type="button"
            loading={isSubmitting}
            disabled={mode !== "edit" && !targetRole}
            onClick={() => void handleSubmit()}
          >
            {submitLabelForMode(mode, labels)}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        <Select
          label={mode === "edit" ? labels.role : labels.targetRole}
          value={targetRole ?? values.role ?? "member"}
          options={roleOptions}
          onChange={(value) =>
            setValues((current) => ({
              ...current,
              role: value as ParticipantRole,
            }))
          }
        />
        {mode === "edit" ? (
          <>
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
          </>
        ) : null}
      </div>
    </Modal>
  );
}
