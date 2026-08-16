// FILE: src/components/students-guardians/modals/BulkUploadModal.tsx

"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

export default function BulkUploadModal({
  isOpen,
  onClose,
  onUpload,
}: BulkUploadModalProps) {
  const t = useTranslations("students_guardians.students.bulk_upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (
        !validTypes.includes(file.type) &&
        !file.name.endsWith(".csv") &&
        !file.name.endsWith(".xlsx")
      ) {
        setErrorMessage(t("invalid_file_type"));
        setUploadStatus("error");
        return;
      }

      setSelectedFile(file);
      setUploadStatus("idle");
      setErrorMessage("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus("idle");
    setErrorMessage("");

    try {
      await onUpload(selectedFile);
      setUploadStatus("success");
      setTimeout(() => {
        onClose();
        setSelectedFile(null);
        setUploadStatus("idle");
      }, 2000);
    } catch (error) {
      setUploadStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : t("upload_failed"),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template
    const headers = [
      "student_id",
      "full_name_en",
      "full_name_ar",
      "gender",
      "date_of_birth",
      "nationality",
      "grade",
      "section",
      "email",
      "phone",
      "address",
      "guardian_name",
      "guardian_phone",
      "guardian_email",
      "guardian_relation",
    ];

    const csvContent = headers.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "students_bulk_upload_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setUploadStatus("idle");
      setErrorMessage("");
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("title")}
      description={t("subtitle")}
      icon={<Upload className="w-5 h-5" />}
      size="lg"
      showCloseButton={!uploading}
      closeOnOverlayClick={!uploading}
      closeOnEscape={!uploading}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={uploading}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile}
            loading={uploading}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            {uploading ? t("uploading") : t("upload")}
          </Button>
        </>
      }
    >
        <div className="space-y-6 pb-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              {t("instructions_title")}
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>{t("instruction_1")}</li>
              <li>{t("instruction_2")}</li>
              <li>{t("instruction_3")}</li>
            </ol>
          </div>

          {/* Download Template */}
          <div>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={handleDownloadTemplate}
              leftIcon={<Download className="w-4 h-4" />}
            >
              {t("download_template")}
            </Button>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("select_file")}
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                {selectedFile ? selectedFile.name : t("drag_drop")}
              </p>
              <p className="text-xs text-gray-500">{t("supported_formats")}</p>
            </div>
          </div>

          {/* Status Messages */}
          {uploadStatus === "success" && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800">{t("upload_success")}</p>
            </div>
          )}

          {uploadStatus === "error" && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">
                {errorMessage || t("upload_failed")}
              </p>
            </div>
          )}
        </div>
    </Modal>
  );
}
