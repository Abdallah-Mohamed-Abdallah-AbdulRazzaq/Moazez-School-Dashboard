"use client";

import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";

export interface PublishAnnouncementDialogLabels {
  title: string;
  description: string;
  cancel: string;
  publish: string;
}

export interface PublishAnnouncementDialogProps {
  open: boolean;
  labels: PublishAnnouncementDialogLabels;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function PublishAnnouncementDialog({
  isSubmitting,
  labels,
  onClose,
  onConfirm,
  open,
}: PublishAnnouncementDialogProps) {
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
            onClick={() => void onConfirm()}
          >
            {labels.publish}
          </Button>
        </>
      }
    >
      <p className="pb-4 text-sm text-slate-600">{labels.description}</p>
    </Modal>
  );
}
