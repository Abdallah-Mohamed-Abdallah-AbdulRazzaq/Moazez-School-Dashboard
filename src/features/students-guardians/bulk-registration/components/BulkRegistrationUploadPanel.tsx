"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";

export const BULK_REGISTRATION_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const BULK_REGISTRATION_FILE_ACCEPT =
  ".csv,text/csv,application/vnd.ms-excel";

interface BulkRegistrationUploadPanelProps {
  enabled: boolean;
  selectedFile: File | null;
  downloadingTemplate: boolean;
  uploading: boolean;
  onDownloadTemplate: () => void;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
}

const copy = {
  en: {
    title: "Template and CSV upload",
    description:
      "Download the backend template, complete it, then upload one CSV file up to 10 MiB.",
    download: "Download CSV template",
    uploadTitle: "Select CSV file",
    uploadSubtitle: "Drag and drop one completed CSV here.",
    select: "Choose file",
    helper: "CSV only · Maximum 10 MiB",
    multipleFiles: "Select exactly one CSV file.",
    invalidExtension: "Only CSV files are allowed.",
    selected: "Selected file",
    upload: "Upload and start validation",
  },
  ar: {
    title: "القالب ورفع ملف CSV",
    description:
      "نزّل قالب الخادم، أكمله، ثم ارفع ملف CSV واحدًا بحد أقصى 10 ميجابايت.",
    download: "تنزيل قالب CSV",
    uploadTitle: "اختر ملف CSV",
    uploadSubtitle: "اسحب ملف CSV المكتمل وأفلته هنا.",
    select: "اختيار ملف",
    helper: "CSV فقط · الحد الأقصى 10 ميجابايت",
    multipleFiles: "اختر ملف CSV واحدًا فقط.",
    invalidExtension: "يُسمح بملفات CSV فقط.",
    selected: "الملف المحدد",
    upload: "رفع وبدء التحقق",
  },
} as const;

export default function BulkRegistrationUploadPanel({
  enabled,
  selectedFile,
  downloadingTemplate,
  uploading,
  onDownloadTemplate,
  onFileChange,
  onUpload,
}: BulkRegistrationUploadPanelProps) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  const [fileError, setFileError] = useState("");

  const selectFile = (files: File[]) => {
    if (files.length !== 1) {
      setFileError(text.multipleFiles);
      onFileChange(null);
      return;
    }
    const file = files[0];
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError(text.invalidExtension);
      onFileChange(null);
      return;
    }
    setFileError("");
    onFileChange(file);
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{text.title}</h2>
          <p className="mt-1 text-sm text-gray-600">{text.description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          loading={downloadingTemplate}
          disabled={!enabled}
          onClick={onDownloadTemplate}
        >
          {text.download}
        </Button>
      </div>

      <div className="mt-5">
        <DragDropUploadArea
          title={text.uploadTitle}
          subtitle={text.uploadSubtitle}
          buttonLabel={text.select}
          helperText={text.helper}
          disabled={!enabled}
          multiple={false}
          accept={BULK_REGISTRATION_FILE_ACCEPT}
          maxSizeBytes={BULK_REGISTRATION_MAX_FILE_SIZE}
          isUploading={uploading}
          onFilesSelected={selectFile}
        />
      </div>

      {fileError ? (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {fileError}
        </p>
      ) : null}

      {selectedFile ? (
        <p className="mt-3 text-sm text-gray-700">
          <span className="font-medium">{text.selected}:</span>{" "}
          <span>{selectedFile.name}</span>
        </p>
      ) : null}

      <div className="mt-5 flex justify-end">
        <Button
          type="button"
          leftIcon={<Upload className="h-4 w-4" />}
          loading={uploading}
          disabled={!enabled || !selectedFile}
          onClick={onUpload}
        >
          {text.upload}
        </Button>
      </div>
    </section>
  );
}
