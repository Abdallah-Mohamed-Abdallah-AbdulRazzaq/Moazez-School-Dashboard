"use client";

import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import type { CredentialStatusRecord } from "@/features/settings/credentials/types";

type CredentialModalUser = Pick<CredentialStatusRecord, "fullName" | "username" | "loginEmail">;

interface GenerateCredentialModalProps {
  isOpen: boolean;
  mode: "generate" | "regenerate";
  user: CredentialModalUser | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  labels: {
    generateTitle: string;
    regenerateTitle: string;
    description: string;
    cancel: string;
    generate: string;
    regenerate: string;
    generating: string;
  };
}

export default function GenerateCredentialModal({
  isOpen,
  mode,
  user,
  isSubmitting,
  onClose,
  onSubmit,
  labels,
}: GenerateCredentialModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "generate" ? labels.generateTitle : labels.regenerateTitle}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            variant="primary"
            loading={isSubmitting}
            onClick={() => void onSubmit()}
          >
            {isSubmitting
              ? labels.generating
              : mode === "generate"
                ? labels.generate
                : labels.regenerate}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{labels.description}</p>
        {user ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <p className="font-semibold text-gray-900">{user.fullName}</p>
            <p className="break-all text-gray-500">
              {user.username || user.loginEmail}
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
