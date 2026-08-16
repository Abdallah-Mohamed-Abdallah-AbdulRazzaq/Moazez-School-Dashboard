"use client";

import Modal from "../modal/Modal";
import Button from "../button/Button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  severity?: "default" | "info" | "warning" | "danger";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  loading = false,
  severity = "default",
}: ConfirmDialogProps) {
  const getConfirmVariant = () => {
    switch (severity) {
      case "danger":
        return "danger";
      case "warning":
        return "danger";
      default:
        return "primary";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button onClick={onClose} variant="secondary" disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            variant={getConfirmVariant()}
            loading={loading}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600">{description}</p>
    </Modal>
  );
}
