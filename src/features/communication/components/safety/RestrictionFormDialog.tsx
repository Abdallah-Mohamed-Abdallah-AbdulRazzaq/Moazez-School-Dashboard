"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import Modal from "@/components/ui/modal/Modal";
import UserSearchSelect from "@/features/communication/components/selectors/UserSearchSelect";
import type {
  Restriction,
  RestrictionType,
} from "@/features/communication/types/safety.types";
import type { RestrictionFormValues } from "@/features/communication/hooks/useRestrictions";

export interface RestrictionFormDialogLabels {
  createTitle: string;
  editTitle: string;
  targetUserId: string;
  type: string;
  groupCreateDisabled: string;
  messageSendDisabled: string;
  mute: string;
  readOnly: string;
  directMessageDisabled: string;
  reason: string;
  expiresAt: string;
  cancel: string;
  create: string;
  save: string;
  targetRequired: string;
  reasonRequired: string;
}

export interface RestrictionFormDialogProps {
  open: boolean;
  labels: RestrictionFormDialogLabels;
  restriction?: Restriction | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: RestrictionFormValues) => Promise<void> | void;
}

function datetimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function initialValues(restriction?: Restriction | null): RestrictionFormValues {
  return {
    targetUserId: restriction?.targetUserId ?? "",
    type: restriction?.type ?? "send_disabled",
    reason: restriction?.reason ?? "",
    expiresAt: datetimeLocalValue(restriction?.expiresAt),
  };
}

export default function RestrictionFormDialog({
  isSubmitting,
  labels,
  onClose,
  onSubmit,
  open,
  restriction,
}: RestrictionFormDialogProps) {
  const [values, setValues] = useState<RestrictionFormValues>(() =>
    initialValues(restriction),
  );
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(restriction);
  const typeOptions = useMemo(
    () => [
      {
        value: "group_create_disabled",
        label: labels.groupCreateDisabled,
      },
      {
        value: "send_disabled",
        label: labels.messageSendDisabled,
      },
      {
        value: "mute",
        label: labels.mute,
      },
      {
        value: "read_only",
        label: labels.readOnly,
      },
      {
        value: "direct_message_disabled",
        label: labels.directMessageDisabled,
      },
    ],
    [
      labels.directMessageDisabled,
      labels.groupCreateDisabled,
      labels.messageSendDisabled,
      labels.mute,
      labels.readOnly,
    ],
  );

  const handleSubmit = async () => {
    if (!values.targetUserId.trim()) {
      setError(labels.targetRequired);
      return;
    }
    if (!values.reason.trim()) {
      setError(labels.reasonRequired);
      return;
    }
    setError(null);
    await onSubmit(values);
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEditing ? labels.editTitle : labels.createTitle}
      size="lg"
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
            {isEditing ? labels.save : labels.create}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        <UserSearchSelect
          label={labels.targetUserId}
          value={values.targetUserId}
          placeholder={labels.targetUserId}
          error={error ?? undefined}
          onChange={(targetUserId) =>
            setValues((current) => ({
              ...current,
              targetUserId,
            }))
          }
        />
        <Select
          label={labels.type}
          value={values.type}
          options={typeOptions}
          onChange={(value) =>
            setValues((current) => ({ ...current, type: value as RestrictionType }))
          }
        />
        <TextArea
          label={labels.reason}
          value={values.reason}
          rows={3}
          onChange={(event) =>
            setValues((current) => ({ ...current, reason: event.target.value }))
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
