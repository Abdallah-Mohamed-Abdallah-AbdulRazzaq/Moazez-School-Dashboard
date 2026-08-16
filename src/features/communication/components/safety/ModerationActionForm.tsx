"use client";

import { Eye, EyeOff, Trash2, UserX } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/ui/input/TextArea";
import type { ModerationActionType } from "@/features/communication/types/safety.types";

export interface ModerationActionFormLabels {
  title: string;
  reason: string;
  reasonPlaceholder: string;
  hide: string;
  unhide: string;
  delete: string;
  restrictSender: string;
  messageHidden: string;
  messageUnhidden: string;
  messageDeleted: string;
  userRestricted: string;
  reasonRequired: string;
}

export interface ModerationActionFormProps {
  disabled?: boolean;
  isSubmitting?: boolean;
  labels: ModerationActionFormLabels;
  onSubmit: (
    action: ModerationActionType,
    reason?: string,
  ) => Promise<void> | void;
}

export default function ModerationActionForm({
  disabled,
  isSubmitting,
  labels,
  onSubmit,
}: ModerationActionFormProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const actions = useMemo<
    Array<{
      action: ModerationActionType;
      label: string;
      variant?: "primary" | "secondary" | "danger";
      icon: React.ReactNode;
    }>
  >(
    () => [
      {
        action: "hide",
        label: labels.hide,
        variant: "secondary",
        icon: <EyeOff className="h-4 w-4" aria-hidden="true" />,
      },
      {
        action: "unhide",
        label: labels.unhide,
        icon: <Eye className="h-4 w-4" aria-hidden="true" />,
      },
      {
        action: "delete",
        label: labels.delete,
        variant: "danger",
        icon: <Trash2 className="h-4 w-4" aria-hidden="true" />,
      },
      {
        action: "restrict_sender",
        label: labels.restrictSender,
        variant: "secondary",
        icon: <UserX className="h-4 w-4" aria-hidden="true" />,
      },
      {
        action: "message_hidden",
        label: labels.messageHidden,
        variant: "secondary",
        icon: <EyeOff className="h-4 w-4" aria-hidden="true" />,
      },
      {
        action: "message_unhidden",
        label: labels.messageUnhidden,
        variant: "secondary",
        icon: <Eye className="h-4 w-4" aria-hidden="true" />,
      },
      {
        action: "message_deleted",
        label: labels.messageDeleted,
        variant: "danger",
        icon: <Trash2 className="h-4 w-4" aria-hidden="true" />,
      },
      {
        action: "user_restricted",
        label: labels.userRestricted,
        variant: "secondary",
        icon: <UserX className="h-4 w-4" aria-hidden="true" />,
      },
    ],
    [labels],
  );

  const submit = async (action: ModerationActionType) => {
    if (!reason.trim()) {
      setError(labels.reasonRequired);
      return;
    }
    setError(null);
    await onSubmit(action, reason);
    setReason("");
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{labels.title}</h2>
      <TextArea
        label={labels.reason}
        placeholder={labels.reasonPlaceholder}
        value={reason}
        rows={4}
        error={error ?? undefined}
        disabled={disabled || isSubmitting}
        onChange={(event) => setReason(event.target.value)}
      />
      <div className="flex flex-wrap justify-end gap-2">
        {actions.map((item) => (
          <Button
            key={item.action}
            type="button"
            variant={item.variant}
            disabled={disabled}
            loading={isSubmitting}
            leftIcon={item.icon}
            onClick={() => void submit(item.action)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
