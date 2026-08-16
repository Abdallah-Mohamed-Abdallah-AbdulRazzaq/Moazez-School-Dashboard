"use client";

import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import type { PreviewEmailTemplateResponse } from "@/features/settings/email/templates/types";

interface TemplatePreviewModalProps {
  isOpen: boolean;
  preview: PreviewEmailTemplateResponse | null;
  onClose: () => void;
  labels: {
    title: string;
    subject: string;
    html: string;
    text: string;
    unknownVariables: string;
    missingVariables: string;
    none: string;
    close: string;
  };
}

function VariableList({
  label,
  values,
  none,
}: {
  label: string;
  values: string[];
  none: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      {values.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <code key={value} className="rounded bg-white px-2 py-1 text-xs">
              {value}
            </code>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm text-gray-500">{none}</p>
      )}
    </div>
  );
}

export default function TemplatePreviewModal({
  isOpen,
  preview,
  onClose,
  labels,
}: TemplatePreviewModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={labels.title}
      size="xl"
      footer={
        <Button variant="primary" onClick={onClose}>
          {labels.close}
        </Button>
      }
    >
      {preview ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm font-semibold text-gray-900">
              {labels.subject}
            </p>
            <p className="mt-1 text-sm text-gray-700">{preview.subject}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <VariableList
              label={labels.unknownVariables}
              values={preview.unknownVariables}
              none={labels.none}
            />
            <VariableList
              label={labels.missingVariables}
              values={preview.missingVariables}
              none={labels.none}
            />
          </div>
          <div className="rounded-lg border border-gray-200">
            <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
              {labels.html}
            </div>
            <iframe
              title={labels.html}
              sandbox=""
              srcDoc={preview.html}
              className="h-96 w-full bg-white"
            />
          </div>
          {preview.text ? (
            <div className="rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
                {labels.text}
              </div>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap p-3 text-sm text-gray-700">
                {preview.text}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
