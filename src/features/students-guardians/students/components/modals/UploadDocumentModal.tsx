// FILE: src/components/students-guardians/modals/UploadDocumentModal.tsx

"use client";

import { useState, useRef } from "react";
import { XCircle, Upload, FileText, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, Modal, Select, TextArea } from "@/components/ui";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (documentData: DocumentUploadData) => void;
}

export interface DocumentUploadData {
  type: string;
  file: File;
  notes?: string;
}

const DOCUMENT_TYPES = [
  "Birth Certificate",
  "National ID",
  "Passport",
  "Medical Records",
  "Vaccination Card",
  "Previous School Records",
  "Photo",
  "Other",
];

export default function UploadDocumentModal({
  isOpen,
  onClose,
  onSubmit,
}: UploadDocumentModalProps) {
  const t = useTranslations("students_guardians.students.documents");
  const [formData, setFormData] = useState({
    type: "",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }
    if (!formData.type) {
      alert("Please select a document type");
      return;
    }

    onSubmit({
      type: formData.type,
      file: selectedFile,
      notes: formData.notes || undefined,
    });
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      type: "",
      notes: "",
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Upload Document"
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" form="upload-document-form">
            Upload Document
          </Button>
        </>
      }
    >
        <form id="upload-document-form" onSubmit={handleSubmit}>
          <div className="space-y-6 pb-4">
            {/* Document Type */}
              <Select
                label="Document Type"
                required
                value={formData.type}
                onChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
                placeholder="Select document type"
                options={DOCUMENT_TYPES.map((type) => ({ value: type, label: type }))}
              />

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File <span className="text-red-500">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />

                {!selectedFile ? (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Drop your file here, or{" "}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-0 text-primary underline"
                      >
                        browse
                      </Button>
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                    </p>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="p-1 text-red-600"
                    >
                      <XCircle className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
              <TextArea
                label="Notes (Optional)"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                placeholder="Add any additional notes about this document..."
                resize="none"
              />

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    Document Upload Guidelines
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>{t("guidelines.clearAndReadable")}</li>
                    <li>{t("guidelines.maxSize")}</li>
                    <li>{t("guidelines.acceptedFormats")}</li>
                    <li>{t("guidelines.reviewedByAdmin")}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>
    </Modal>
  );
}
