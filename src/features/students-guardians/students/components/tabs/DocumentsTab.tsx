// FILE: src/components/students-guardians/profile-tabs/DocumentsTab.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileText,
  Upload,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  FileInput,
  Trash2,
} from "lucide-react";
import {
  Student,
  StudentDocument,
} from "@/features/students-guardians/students/types";
import { Button, ConfirmDialog, DataTable } from "@/components/ui";
import StudentTabSkeleton from "@/features/students-guardians/students/components/StudentTabSkeleton";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import UploadDocumentModal, {
  DocumentUploadData,
} from "@/features/students-guardians/students/components/modals/UploadDocumentModal";
import DocumentViewerModal from "@/features/admissions/applications/components/modals/DocumentViewerModal";
import ImportStudentDocumentsModal from "@/features/students-guardians/students/components/modals/ImportStudentDocumentsModal";
import { fetchApplicationDocuments } from "@/features/admissions/applications/services/applicationDocumentsApiService";
import type { Document } from "@/features/admissions/types/admissions";
import { useTranslations } from "next-intl";
import { downloadFileBlob, uploadFile } from "@/services/filesService";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { getStudentsGuardiansCapabilities } from "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities";

interface DocumentsTabProps {
  student: Student;
}

export default function DocumentsTab({ student }: DocumentsTabProps) {
  const t = useTranslations("students_guardians.profile.documents");
  const { showToast } = useToast();
  const permissions = usePermissions();
  const { canManageDocuments, canImportAdmissionsDocuments } =
    getStudentsGuardiansCapabilities(permissions);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [applicationDocuments, setApplicationDocuments] = useState<Document[]>([]);
  const [isLoadingImports, setIsLoadingImports] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<StudentDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<{
    type: string;
    name: string;
    url?: string;
    fileType?: string;
  } | null>(null);
  const [selectedObjectUrl, setSelectedObjectUrl] = useState<string | null>(
    null,
  );

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [uploadedDocuments, missingDocuments] = await Promise.all([
        studentsService.fetchStudentDocuments(student.id),
        studentsService.fetchMissingStudentDocuments(student.id),
      ]);
      const uploadedIds = new Set(uploadedDocuments.map((item) => item.id));
      setDocuments([
        ...uploadedDocuments,
        ...missingDocuments.filter((item) => !uploadedIds.has(item.id)),
      ]);
    } catch (loadError) {
      setDocuments([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load documents.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [student.id]);

  useEffect(() => {
    void Promise.resolve().then(loadDocuments);
  }, [loadDocuments]);

  const handleUploadDocument = async (documentData: DocumentUploadData) => {
    if (!canManageDocuments) return;

    try {
      const uploadedFile = await uploadFile(documentData.file);
      await studentsService.createStudentDocument(student.id, {
        type: documentData.type,
        status: "complete",
        fileId: uploadedFile.id,
        notes: documentData.notes,
      });
      setShowUploadModal(false);
      await loadDocuments();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload document.",
      );
    }
  };

  const handleUploadClick = () => {
    if (!canManageDocuments) return;
    setShowUploadModal(true);
  };

  const getDocumentFileId = (doc: Record<string, unknown>) =>
    typeof doc.fileId === "string" && doc.fileId.trim()
      ? doc.fileId.trim()
      : null;

  const getFileType = (name: string) => {
    if (name.endsWith(".pdf")) return "pdf";
    if (/\.(jpg|jpeg|png|gif)$/i.test(name)) return "image";
    return "other";
  };

  const handleOpenImport = async () => {
    if (!canImportAdmissionsDocuments || !student.applicationId) return;

    setShowImportModal(true);
    setIsLoadingImports(true);
    try {
      const sourceDocuments = await fetchApplicationDocuments(
        student.applicationId,
      );
      setApplicationDocuments(
        sourceDocuments.filter((document) => Boolean(document.fileId)),
      );
    } catch (importLoadError) {
      setApplicationDocuments([]);
      showToast(
        importLoadError instanceof Error
          ? importLoadError.message
          : t("import_load_error"),
        "error",
      );
    } finally {
      setIsLoadingImports(false);
    }
  };

  const handleImportDocuments = async (applicationDocumentIds: string[]) => {
    if (!canImportAdmissionsDocuments || !student.applicationId) return;

    setIsImporting(true);
    try {
      await studentsService.importStudentDocumentsFromApplication(student.id, {
        applicationId: student.applicationId,
        applicationDocumentIds,
      });
      setShowImportModal(false);
      showToast(t("import_success"), "success");
      await loadDocuments();
    } catch (importError) {
      showToast(
        importError instanceof Error ? importError.message : t("import_error"),
        "error",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!canManageDocuments || !documentToDelete) return;

    setIsDeleting(true);
    try {
      await studentsService.deleteStudentDocument(documentToDelete.id);
      setDocumentToDelete(null);
      showToast(t("delete_success"), "success");
      await loadDocuments();
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error ? deleteError.message : t("delete_error"),
        "error",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDocument = async (doc: Record<string, unknown>) => {
    const fileId = getDocumentFileId(doc);
    if (!fileId) {
      setError("Document file is unavailable from the backend response.");
      return;
    }

    try {
      const blob = await downloadFileBlob(fileId);
      const objectUrl = URL.createObjectURL(blob);
      if (selectedObjectUrl) {
        URL.revokeObjectURL(selectedObjectUrl);
      }
      setSelectedObjectUrl(objectUrl);
      const name = String(doc.name ?? "Document");
      setSelectedDocument({
        type: String(doc.type ?? ""),
        name,
        url: objectUrl,
        fileType: getFileType(name),
      });
    } catch (viewError) {
      setError(
        viewError instanceof Error
          ? viewError.message
          : "Unable to view document.",
      );
    }
  };

  const handleDownloadDocument = async (doc: Record<string, unknown>) => {
    const fileId = getDocumentFileId(doc);
    if (!fileId) {
      setError("Document file is unavailable from the backend response.");
      return;
    }

    try {
      const blob = await downloadFileBlob(fileId);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = String(doc.name ?? "document");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to download document.",
      );
    }
  };

  const handleCloseViewer = () => {
    if (selectedObjectUrl) {
      URL.revokeObjectURL(selectedObjectUrl);
    }
    setSelectedObjectUrl(null);
    setSelectedDocument(null);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      complete: {
        color: "bg-green-100 text-green-700",
        icon: <CheckCircle className="w-3 h-3" />,
        label: t("complete"),
      },
      missing: {
        color: "bg-red-100 text-red-700",
        icon: <AlertCircle className="w-3 h-3" />,
        label: t("missing"),
      },
    };

    const { color, icon, label } = config[status] || config.missing;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}
      >
        {icon}
        {label}
      </span>
    );
  };

  const columns = [
    {
      key: "type",
      label: t("document_type"),
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{value as string}</span>
        </div>
      ),
    },
    {
      key: "name",
      label: t("file_name"),
      render: (value: unknown) => (value as string) || "-",
    },
    {
      key: "status",
      label: t("status"),
      render: (value: unknown) => getStatusBadge(value as string),
    },
    {
      key: "uploadedDate",
      label: t("uploaded"),
      render: (value: unknown) => {
        if (!value) return "-";
        return new Date(value as string).toLocaleDateString();
      },
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center gap-1">
          {row.status !== "missing" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleViewDocument(row)}
                className="p-1.5 text-primary"
                title={t("view")}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleDownloadDocument(row)}
                className="p-1.5 text-gray-600"
                title={t("download")}
              >
                <Download className="w-4 h-4" />
              </Button>
            </>
          )}
          {row.status === "missing" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
                onClick={() => handleUploadClick()}
                className="p-1.5 text-green-600"
                title={t("upload")}
                disabled={!canManageDocuments}
            >
              <Upload className="w-4 h-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDocumentToDelete(row as unknown as StudentDocument)}
            className="p-1.5 text-red-600 hover:bg-red-50"
            title={t("delete")}
            disabled={!canManageDocuments}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const completeCount = documents.filter((d) => d.status === "complete").length;
  const missingCount = documents.filter((d) => d.status === "missing").length;

  if (isLoading) {
    return <StudentTabSkeleton variant="table" />;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {/* Alerts */}
      {missingCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">
                {t("missing_documents")}
              </h3>
              <p className="text-sm text-red-700">
                {missingCount === 1
                  ? t("missing_message", { count: missingCount })
                  : t("missing_message_plural", { count: missingCount })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t("complete")}</p>
              <p className="text-3xl font-bold text-gray-900">
                {completeCount}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t("missing")}</p>
              <p className="text-3xl font-bold text-gray-900">{missingCount}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {t("student_documents")}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{t("manage_track")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {student.applicationId ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleOpenImport()}
                leftIcon={<FileInput className="h-4 w-4" />}
                disabled={!canImportAdmissionsDocuments}
              >
                {t("import_from_admissions")}
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={() => handleUploadClick()}
              leftIcon={<Upload className="w-4 h-4" />}
              disabled={!canManageDocuments}
            >
              {t("upload_document")}
            </Button>
          </div>
        </div>
        <div className="p-6">
          <DataTable
            columns={columns}
            data={documents as unknown as Record<string, unknown>[]}
            showPagination={false}
          />
        </div>
      </div>

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
        }}
        onSubmit={handleUploadDocument}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!selectedDocument}
        onClose={handleCloseViewer}
        document={selectedDocument}
      />

      {showImportModal ? (
        <ImportStudentDocumentsModal
          isOpen
          documents={applicationDocuments}
          isLoading={isLoadingImports}
          isSubmitting={isImporting}
          onClose={() => setShowImportModal(false)}
          onSubmit={(documentIds) => void handleImportDocuments(documentIds)}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(documentToDelete)}
        onClose={() => setDocumentToDelete(null)}
        onConfirm={() => void handleDeleteDocument()}
        title={t("delete_title")}
        description={t("delete_description", {
          name: documentToDelete?.name || documentToDelete?.type || "",
        })}
        confirmLabel={t("confirm_delete")}
        cancelLabel={t("cancel")}
        loading={isDeleting}
        severity="danger"
      />
    </div>
  );
}
