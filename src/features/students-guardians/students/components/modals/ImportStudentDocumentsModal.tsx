"use client";

import { useState } from "react";
import { FileInput, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { Document } from "@/features/admissions/types/admissions";

interface ImportStudentDocumentsModalProps {
  isOpen: boolean;
  documents: Document[];
  isLoading: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (documentIds: string[]) => void;
}

export default function ImportStudentDocumentsModal({
  isOpen,
  documents,
  isLoading,
  isSubmitting,
  onClose,
  onSubmit,
}: ImportStudentDocumentsModalProps) {
  const t = useTranslations("students_guardians.profile.documents");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleDocument = (documentId: string) => {
    setSelectedIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("import_title")}
      description={t("import_description")}
      icon={<FileInput className="h-6 w-6" />}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => onSubmit(selectedIds)}
            disabled={selectedIds.length === 0 || isSubmitting}
            loading={isSubmitting}
          >
            {t("import_selected")}
          </Button>
        </>
      }
    >
      <div className="py-3">
        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <PartialLoader size={28} />
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              {t("no_importable_documents")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((document) => (
              <label
                key={document.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(document.id)}
                  onChange={() => toggleDocument(document.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">
                    {document.type}
                  </span>
                  <span className="block truncate text-xs text-gray-600">
                    {document.name}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
