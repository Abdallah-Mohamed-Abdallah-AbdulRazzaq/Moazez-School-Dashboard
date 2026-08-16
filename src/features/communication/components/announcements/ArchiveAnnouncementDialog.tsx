"use client";

import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";

export interface ArchiveAnnouncementDialogLabels {
  title: string;
  description: string;
  cancel: string;
  archive: string;
}

export interface ArchiveAnnouncementDialogProps {
  open: boolean;
  labels: ArchiveAnnouncementDialogLabels;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function ArchiveAnnouncementDialog({
  isSubmitting,
  labels,
  onClose,
  onConfirm,
  open,
}: ArchiveAnnouncementDialogProps) {
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
            variant="danger"
            loading={isSubmitting}
            onClick={() => void onConfirm()}
          >
            {labels.archive}
          </Button>
        </>
      }
    >
      <p className="pb-4 text-sm text-slate-600">{labels.description}</p>
    </Modal>
  );
}
