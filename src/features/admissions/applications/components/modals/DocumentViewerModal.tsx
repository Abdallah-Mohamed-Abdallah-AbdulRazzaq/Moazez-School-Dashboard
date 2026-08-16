"use client";

import { FileText, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    type: string;
    name: string;
    url?: string;
    fileType?: string;
  } | null;
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  document,
}: DocumentViewerModalProps) {
  const t = useTranslations("admissions.application360");
  if (!isOpen || !document) return null;

  const handleDownload = () => {
    if (document.url) {
      const link = window.document.createElement("a");
      link.href = document.url;
      link.download = document.name;
      link.click();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{document.type}</h2>
            <p className="text-sm text-gray-500">{document.name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("documents.actions.close")}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body - Document Preview */}
        <div className="flex-1 overflow-auto p-6">
          {document.url ? (
            <div className="bg-gray-50 rounded-lg overflow-hidden h-[600px]">
              {document.fileType === "pdf" ? (
                <iframe
                  src={document.url}
                  className="w-full h-full border-0"
                  title={document.name}
                />
              ) : document.fileType === "image" ? (
                // Blob URLs come from authenticated downloads and cannot be optimized by next/image.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={document.url}
                  alt={document.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      {t("documents.preview_unavailable")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t("documents.download_hint")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 min-h-[500px] flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">{t("documents.url_unavailable")}</p>
                <p className="text-sm text-gray-500">{document.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            {t("documents.actions.close")}
          </Button>
          {document.url && (
            <Button
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleDownload}
            >
              {t("documents.actions.download")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
