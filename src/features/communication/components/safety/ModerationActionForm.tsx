"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/ui/input/TextArea";
import type { SupportedModerationAction } from "@/features/communication/types/safety.types";
import { normalizeStatus } from "@/features/communication/utils/communication-errors";

export interface ModerationActionFormLabels {
  title: string;
  reason: string;
  reasonPlaceholder: string;
  hide: string;
  unhide: string;
  delete: string;
  reasonRequired: string;
}

export interface ModerationActionFormProps {
  disabled?: boolean;
  isSubmitting?: boolean;
  labels: ModerationActionFormLabels;
  messageStatus?: string;
  onSubmit: (
    action: SupportedModerationAction,
    reason?: string,
  ) => Promise<void> | void;
}

export default function ModerationActionForm({
  disabled,
  isSubmitting,
  labels,
  messageStatus,
  onSubmit,
}: ModerationActionFormProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const normalizedMessageStatus = normalizeStatus(messageStatus);
  const isDeleted = normalizedMessageStatus === "deleted";
  const actions = useMemo<
    Array<{
      action: SupportedModerationAction;
      label: string;
      variant?: "primary" | "secondary" | "danger";
      icon: React.ReactNode;
    }>
  >(
    () => [
      {
        action: "hide" as const,
        label: labels.hide,
        variant: "secondary" as const,
        icon: <EyeOff className="h-4 w-4" aria-hidden="true" />,
      },
      {
        action: "unhide" as const,
        label: labels.unhide,
        icon: <Eye className="h-4 w-4" aria-hidden="true" />,
      },
      {
        action: "delete" as const,
        label: labels.delete,
        variant: "danger" as const,
        icon: <Trash2 className="h-4 w-4" aria-hidden="true" />,
      },
    ].filter(({ action }) => {
      if (normalizedMessageStatus === "hidden") return action !== "hide";
      return action !== "unhide";
    }),
    [labels, normalizedMessageStatus],
  );

  const submit = async (action: SupportedModerationAction) => {
    if (!reason.trim()) {
      setError(labels.reasonRequired);
      return;
    }
    setError(null);
    try {
      await onSubmit(action, reason.trim());
      setReason("");
    } catch {
      // The page owns error presentation; keep the reason for retry.
    }
  };

  if (isDeleted) {
    return null;
  }

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
