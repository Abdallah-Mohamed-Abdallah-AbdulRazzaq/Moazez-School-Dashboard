"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, FileCheck, FileX, Plus, Upload } from "lucide-react";
import { useState } from "react";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { AdmissionsRequiredDocumentConfig } from "@/features/settings/types";

interface DocumentData {
  uploaded: boolean;
  file: File | null;
}

interface DocumentsStepProps {
  requirements: AdmissionsRequiredDocumentConfig[];
  documents: Record<string, DocumentData>;
  errors: Record<string, string>;
  isLoading: boolean;
  missingRequiredDocuments: AdmissionsRequiredDocumentConfig[];
  handleFileUpload: (docKey: string, file: File | null) => void;
  handleFileRemove: (docKey: string) => void;
  handleDragOver: (e: React.DragEvent<HTMLLabelElement>) => void;
  handleDragEnter: (e: React.DragEvent<HTMLLabelElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLLabelElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLLabelElement>, docKey: string) => void;
  onAddCustomDocument?: (id: string, nameEn: string) => void;
}

export default function DocumentsStep({
  requirements,
  documents,
  errors,
  isLoading,
  missingRequiredDocuments,
  handleFileUpload,
  handleFileRemove,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  onAddCustomDocument,
}: DocumentsStepProps) {
  const t = useTranslations("admissions.create_application");
  const locale = useLocale();
  const [customDocName, setCustomDocName] = useState("");

  const getLabel = (requirement: AdmissionsRequiredDocumentConfig) =>
    locale === "ar" ? requirement.nameAr : requirement.nameEn;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <PartialLoader />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="mb-4 font-semibold text-gray-900">{t("documents.title")}</h3>
      <p className="mb-4 text-sm text-gray-600">
        {t("documents.subtitle")} - {t("documents.file_types")}
      </p>

      {requirements.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          {t("documents.configured_empty")}
        </div>
      )}

      {missingRequiredDocuments.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{t("documents.pending_warning")}</p>
              <p className="mt-1">{t("documents.pending_submit_note")}</p>
              <p className="mt-2 text-xs">
                {missingRequiredDocuments.map((requirement) => getLabel(requirement)).join(" • ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {errors.documents && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{errors.documents}</span>
        </div>
      )}

      <div className="space-y-3">
        {requirements.map((requirement) => {
          const docData = documents[requirement.id] || { uploaded: false, file: null };
          const hasError = errors[requirement.id];

          return (
            <div
              key={requirement.id}
              className={`rounded-lg border p-4 ${hasError ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{getLabel(requirement)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      requirement.required ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {requirement.required ? t("documents.required") : t("documents.optional")}
                  </span>
                  {docData.uploaded && <FileCheck className="h-4 w-4 text-green-600" />}
                </div>
                {docData.uploaded ? (
                  <button
                    type="button"
                    onClick={() => handleFileRemove(requirement.id)}
                    className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    <FileX className="h-4 w-4" />
                    {t("documents.remove")}
                  </button>
                ) : null}
              </div>

              {docData.uploaded ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileCheck className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{docData.file?.name}</span>
                  <span className="text-xs text-gray-500">
                    ({((docData.file?.size || 0) / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ) : (
                <label
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-3 transition-colors hover:border-primary hover:bg-gray-50"
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, requirement.id)}
                >
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{t("documents.drag_drop")}</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(requirement.id, file);
                    }}
                    className="hidden"
                  />
                </label>
              )}

              {hasError && (
                <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>{hasError}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Document Type */}
      {onAddCustomDocument && (
        <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {t("documents.add_custom")}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customDocName}
              onChange={(e) => setCustomDocName(e.target.value)}
              placeholder={t("documents.custom_placeholder")}
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => {
                if (customDocName.trim()) {
                  const id = `custom-${Date.now()}`;
                  onAddCustomDocument(id, customDocName.trim());
                  setCustomDocName("");
                }
              }}
              disabled={!customDocName.trim()}
              className="flex items-center gap-1 px-3 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              {t("documents.add_btn")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
