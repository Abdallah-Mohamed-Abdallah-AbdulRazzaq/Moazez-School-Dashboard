"use client";

import { useLocale, useTranslations } from "next-intl";
import { Download, Eye, FileText, Plus, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/hooks/use-auth";
import { Application, Document } from "@/features/admissions/types/admissions";
import StatusBadge from "../../../shared/StatusBadge";
import DocumentViewerModal from "../modals/DocumentViewerModal";
import {
  acceptApplicationDocument,
  fetchApplicationDocuments,
  rejectApplicationDocument,
  requestApplicationDocumentReplacement,
  uploadAdmissionsFile,
  createApplicationDocument,
  deleteApplicationDocument,
} from "@/features/admissions/applications/services/applicationDocumentsApiService";
import { useAdmissionDocumentRequirements } from "@/features/admissions/applications/hooks/useAdmissionDocumentRequirements";
import { isApiError } from "@/lib/api-error";
import { useToast } from "@/components/ui/toast/Toast";
import { AdmissionsAccessDenied } from "@/features/admissions/shared/components/AdmissionsAccessGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { downloadFileBlob } from "@/services/filesService";

interface DocumentsTabProps {
  application: Application;
  initialDocuments?: Document[];
}

type ReviewAction = "accept" | "reject" | "request_replacement";
type Translate = (key: string) => string;

function documentReviewErrorMessage(error: unknown, t: Translate): string {
  if (!isApiError(error)) {
    return t("documents.errors.review_failed");
  }

  if (error.status === 403) {
    return t("documents.errors.review_permission");
  }
  if (error.status === 404) {
    return t("documents.errors.not_found");
  }
  if (error.status === 409) {
    return t("documents.errors.already_reviewed");
  }
  if (error.status === 422) {
    return t("documents.errors.invalid_review_note");
  }

  return error.message || t("documents.errors.review_failed");
}

function documentLoadErrorMessage(error: unknown, t: Translate): string {
  if (!isApiError(error)) {
    return t("documents.errors.load_failed");
  }

  if (error.status === 403) {
    return t("documents.errors.view_permission");
  }
  if (error.status === 404) {
    return t("documents.errors.not_found");
  }

  return error.message || t("documents.errors.load_failed");
}

function documentMutationErrorMessage(
  error: unknown,
  fallback: string,
  t: Translate,
): string {
  if (!isApiError(error)) {
    return fallback;
  }

  if (error.status === 403) {
    return t("documents.errors.manage_permission");
  }
  if (error.status === 404) {
    return t("documents.errors.not_found");
  }
  if (error.status === 409) {
    return t("documents.errors.changed_status");
  }
  if (error.status === 422) {
    return t("documents.errors.invalid_details");
  }

  return error.message || fallback;
}

export default function DocumentsTab({
  application,
  initialDocuments,
}: DocumentsTabProps) {
  const t = useTranslations("admissions.application360");
  const tCommon = useTranslations("common");
  const translateRef = useRef(t);
  useEffect(() => {
    translateRef.current = t;
  }, [t]);
  const locale = useLocale();
  const { showToast } = useToast();
  const { user } = useAuth();
  const schoolId = user?.activeMembership?.schoolId ?? "";
  const { hasPermission } = usePermissions();
  const canViewDocuments = hasPermission("admissions.documents.view");
  const canManageDocuments = hasPermission("admissions.documents.manage");
  const canUploadFiles = hasPermission("files.uploads.manage");
  const documentRequirementsState = useAdmissionDocumentRequirements({
    enabled: canManageDocuments,
    schoolId,
    loadErrorMessage: t("documents.errors.load_failed"),
  });
  const {
    requirements: documentRequirements,
    isLoading: isLoadingRequirements,
    error: requirementsError,
    reload: reloadDocumentRequirements,
  } = documentRequirementsState;
  const [documents, setDocuments] = useState<Document[]>(
    initialDocuments ?? application.documents,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<{
    type: string;
    name: string;
    url?: string;
    fileType?: string;
  } | null>(null);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [reviewingDocumentId, setReviewingDocumentId] = useState<string | null>(
    null,
  );
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(null);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null);
  const viewerUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestDocumentsRequestId = useRef(0);

  const isEditable =
    canManageDocuments &&
    ["documents_pending", "submitted", "under_review"].includes(application.status);

  const loadDocuments = useCallback(async () => {
    const requestId = ++latestDocumentsRequestId.current;
    if (!canViewDocuments) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const nextDocuments = await fetchApplicationDocuments(application.id);
      if (requestId !== latestDocumentsRequestId.current) return;
      setDocuments(nextDocuments);
    } catch (loadError) {
      if (requestId !== latestDocumentsRequestId.current) return;
      console.error("Failed to load application documents:", loadError);
      setError(documentLoadErrorMessage(loadError, translateRef.current));
    } finally {
      if (requestId === latestDocumentsRequestId.current) {
        setIsLoading(false);
      }
    }
  }, [application.id, canViewDocuments]);

  useEffect(() => {
    void Promise.resolve().then(loadDocuments);
    return () => {
      latestDocumentsRequestId.current += 1;
    };
  }, [loadDocuments]);

  useEffect(() => {
    return () => {
      if (viewerUrlRef.current) URL.revokeObjectURL(viewerUrlRef.current);
    };
  }, []);

  const closeDocumentViewer = () => {
    setSelectedDocument(null);
    if (viewerUrlRef.current) {
      URL.revokeObjectURL(viewerUrlRef.current);
      viewerUrlRef.current = null;
    }
  };

  const viewDocument = async (document: Document) => {
    if (!document.fileId || viewingDocumentId) return;
    setViewingDocumentId(document.id);
    try {
      const blob = await downloadFileBlob(document.fileId);
      const blobUrl = URL.createObjectURL(blob);
      if (viewerUrlRef.current) URL.revokeObjectURL(viewerUrlRef.current);
      viewerUrlRef.current = blobUrl;
      setSelectedDocument({ ...document, url: blobUrl });
    } catch (viewError) {
      console.error("Failed to load document preview:", viewError);
      showToast(t("documents.errors.open_failed"), "error");
    } finally {
      setViewingDocumentId(null);
    }
  };

  const downloadDocument = async (document: Document) => {
    if (!document.fileId || downloadingDocumentId) return;
    setDownloadingDocumentId(document.id);
    try {
      const blob = await downloadFileBlob(document.fileId);
      const blobUrl = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = blobUrl;
      link.download = document.name || document.type;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (downloadError) {
      console.error("Failed to download document:", downloadError);
      showToast(t("documents.errors.download_failed"), "error");
    } finally {
      setDownloadingDocumentId(null);
    }
  };

  const handleAddClick = () => {
    if (!canManageDocuments) {
      showToast(t("documents.errors.manage_permission"), "error");
      return;
    }
    if (!canUploadFiles) {
      showToast(t("documents.errors.manage_permission"), "error");
      return;
    }
    if (isLoadingRequirements || requirementsError) {
      showToast(requirementsError || t("documents.loading"), "error");
      return;
    }
    setSelectedType("");
    setIsTypeModalOpen(true);
  };

  const handleTypeConfirm = () => {
    const docType = selectedType;
    if (!docType) {
      showToast(t("documents.errors.select_type"), "error");
      return;
    }
    setIsTypeModalOpen(false);
    fileInputRef.current?.click();
  };

  const getResolvedType = () => {
    return selectedType;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canManageDocuments) {
      showToast(t("documents.errors.manage_permission"), "error");
      return;
    }
    if (!canUploadFiles) {
      showToast(t("documents.errors.manage_permission"), "error");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const selectedRequirement = documentRequirements.find(
      (requirement) => requirement.title === getResolvedType(),
    );
    const allowedTypes = selectedRequirement?.acceptedFileTypes ?? [];
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      showToast(t("documents.errors.file_type"), "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast(t("documents.errors.file_size"), "error");
      return;
    }

    const docType = getResolvedType();
    if (!docType) {
      showToast(t("documents.errors.type_missing"), "error");
      return;
    }

    setIsUploading(true);
    try {
      const fileId = await uploadAdmissionsFile(file);
      await createApplicationDocument(application.id, {
        fileId,
        documentType: docType,
        status: "complete",
      });
      showToast(t("documents.errors.upload_success"), "success");
      await loadDocuments();
    } catch (uploadError) {
      console.error("Failed to upload document:", uploadError);
      showToast(
        documentMutationErrorMessage(
          uploadError,
          t("documents.errors.upload_failed"),
          t,
        ),
        "error",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!canManageDocuments) {
      showToast(t("documents.errors.manage_permission"), "error");
      return;
    }

    if (!window.confirm(t("documents.remove_confirm"))) {
      return;
    }

    setDeletingDocumentId(documentId);
    try {
      await deleteApplicationDocument(application.id, documentId);
      showToast(t("documents.errors.remove_success"), "success");
      await loadDocuments();
    } catch (deleteError) {
      console.error("Failed to delete document:", deleteError);
      showToast(
        documentMutationErrorMessage(
          deleteError,
          t("documents.errors.remove_failed"),
          t,
        ),
        "error",
      );
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const openReviewModal = (documentId: string, action: ReviewAction) => {
    if (!canManageDocuments) {
      showToast(t("documents.errors.manage_permission"), "error");
      return;
    }
    setReviewingDocumentId(documentId);
    setReviewAction(action);
    setReviewNote("");
  };

  const resetReviewState = () => {
    setReviewingDocumentId(null);
    setReviewAction(null);
    setReviewNote("");
  };

  const closeReviewModal = () => {
    if (isSubmittingReview) return;
    resetReviewState();
  };

  const reviewActionTitle = () => {
    if (reviewAction === "accept") return t("documents.review.accept_title");
    if (reviewAction === "reject") return t("documents.review.reject_title");
    if (reviewAction === "request_replacement") {
      return t("documents.review.request_replacement_title");
    }
    return t("documents.review.title");
  };

  const reviewActionDescription = () => {
    if (reviewAction === "accept") {
      return t("documents.review.approval_note");
    }
    if (reviewAction === "reject") {
      return t("documents.review.rejection_note");
    }
    return t("documents.review.replacement_note");
  };

  const reviewActionRequiresNote =
    reviewAction === "reject" || reviewAction === "request_replacement";

  const runReviewAction = async (
    documentId: string,
    action: ReviewAction,
    note: string,
  ) => {
    if (action === "accept") {
      await acceptApplicationDocument(
        application.id,
        documentId,
        note || undefined,
      );
      return;
    }

    if (action === "reject") {
      await rejectApplicationDocument(application.id, documentId, note);
      return;
    }

    await requestApplicationDocumentReplacement(application.id, documentId, note);
  };

  const submitReviewAction = async () => {
    if (isSubmittingReview) return;
    if (!reviewingDocumentId || !reviewAction) return;
    if (!canManageDocuments) {
      showToast(t("documents.errors.manage_permission"), "error");
      return;
    }

    const trimmedNote = reviewNote.trim();
    if (reviewActionRequiresNote && !trimmedNote) {
      showToast(t("documents.review.required_note"), "error");
      return;
    }
    if (trimmedNote.length > 2000) {
      showToast(t("documents.errors.invalid_review_note"), "error");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await runReviewAction(reviewingDocumentId, reviewAction, trimmedNote);
      showToast(t("documents.errors.review_success"), "success");
      resetReviewState();
      await loadDocuments();
    } catch (reviewError) {
      console.error("Failed to update document review:", reviewError);
      showToast(documentReviewErrorMessage(reviewError, t), "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const resolveLabel = (doc: Document) => {
    if (locale === "ar") return doc.labelAr || doc.type;
    return doc.labelEn || doc.type;
  };

  const typeCounts = documents.reduce((counts, document) => {
    counts.set(document.type, (counts.get(document.type) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const documentTypeOptions = documentRequirements
    .slice()
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((requirement) => ({
      value: requirement.title,
      label: requirement.title,
      isAtLimit:
        (typeCounts.get(requirement.title) ?? 0) >= requirement.maxFiles,
    }));
  const selectedRequirement = documentRequirements.find(
    (requirement) => requirement.title === selectedType,
  );

  if (!canViewDocuments) {
    return <AdmissionsAccessDenied />;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {t("documents.title")}
          </h3>
          {isEditable && canUploadFiles && (
            <Button
              size="sm"
              onClick={handleAddClick}
              disabled={
                isUploading ||
                isLoadingRequirements ||
                Boolean(requirementsError)
              }
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <Upload className="h-4 w-4 animate-pulse" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {isUploading ? t("documents.uploading") : t("documents.add")}
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={
            selectedRequirement?.acceptedFileTypes.length
              ? selectedRequirement.acceptedFileTypes.join(",")
              : undefined
          }
          className="hidden"
          onChange={handleFileChange}
        />

        {isLoading ? (
          <p className="text-sm text-gray-500">{t("documents.loading")}</p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {canManageDocuments && requirementsError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p>{requirementsError}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="mt-2 text-red-800"
              onClick={() => void reloadDocumentRequirements()}
            >
              {tCommon("retry")}
            </Button>
          </div>
        ) : null}

        {documents.length === 0 && !isLoading ? (
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              {t("documents.empty")}
            </p>
            {isEditable && canUploadFiles && !requirementsError && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddClick}
                className="mt-3"
              >
                <Upload className="h-4 w-4 mr-2" />
                {t("documents.upload_first")}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {resolveLabel(doc)}
                    </p>
                    {doc.name && (
                      <p className="text-xs text-gray-500">{doc.name}</p>
                    )}
                    {doc.uploadedDate && (
                      <p className="text-xs text-gray-400">
                        {t("documents.uploaded_label")}{" "}
                        {new Date(doc.uploadedDate).toLocaleDateString()}
                      </p>
                    )}
                    <p className="mt-1 max-w-xl text-xs text-gray-500">
                      {doc.status === "pending_review"
                        ? t("documents.status_pending_review")
                        : doc.status === "complete"
                          ? t("documents.status_complete")
                          : t("documents.status_missing")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <StatusBadge status={doc.status} />
                  {isEditable && doc.canReview === true && (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => openReviewModal(doc.id, "accept")}
                        disabled={isSubmittingReview}
                      >
                        {t("documents.review.accept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openReviewModal(doc.id, "reject")}
                        disabled={isSubmittingReview}
                      >
                        {t("documents.review.reject")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openReviewModal(doc.id, "request_replacement")
                        }
                        disabled={isSubmittingReview}
                      >
                        {t("documents.review.request_replacement")}
                      </Button>
                    </div>
                  )}
                  {doc.status === "pending_review" && doc.canReview === false && doc.reviewEligibility ? (
                    <span className="text-xs text-amber-700" title={t(`documents.review.eligibility.${doc.reviewEligibility.reason}`)}>
                      {t(`documents.review.eligibility.${doc.reviewEligibility.reason}`)}
                    </span>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void viewDocument(doc)}
                    disabled={!doc.fileId || viewingDocumentId !== null}
                    loading={viewingDocumentId === doc.id}
                    title={t("documents.actions.view")}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canViewDocuments && doc.fileId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void downloadDocument(doc)}
                      disabled={downloadingDocumentId !== null}
                      loading={downloadingDocumentId === doc.id}
                      title={t("documents.actions.download")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {isEditable && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteDocument(doc.id)}
                      disabled={deletingDocumentId === doc.id}
                      title={t("documents.actions.remove")}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Type Selection Modal */}
      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title={t("documents.select_type")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsTypeModalOpen(false)}>
              {t("documents.cancel")}
            </Button>
            <Button
              onClick={handleTypeConfirm}
              disabled={!selectedType}
            >
              {t("documents.choose_file")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {documentTypeOptions.map((type) => (
              <label
                key={type.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedType === type.value
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                } ${type.isAtLimit ? "opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="documentType"
                  value={type.value}
                  checked={selectedType === type.value}
                  onChange={() => setSelectedType(type.value)}
                  disabled={type.isAtLimit}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-900">{type.label}</span>
                {type.isAtLimit && (
                  <span className="ml-auto text-xs text-gray-400">
                    {t("documents.already_uploaded")}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(reviewingDocumentId && reviewAction)}
        onClose={closeReviewModal}
        title={reviewActionTitle()}
        size="sm"
        closeOnOverlayClick={!isSubmittingReview}
        closeOnEscape={!isSubmittingReview}
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeReviewModal}
              disabled={isSubmittingReview}
            >
              {t("documents.review.cancel")}
            </Button>
            <Button
              onClick={() => void submitReviewAction()}
              loading={isSubmittingReview}
            >
              {t("documents.review.submit")}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">{reviewActionDescription()}</p>
          {reviewActionRequiresNote && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {t("documents.review.replacement_notice")}
            </div>
          )}
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="document-review-note"
          >
            {t("documents.review.note")} {reviewActionRequiresNote ? "" : `(${t("documents.review.optional")})`}
          </label>
          <textarea
            id="document-review-note"
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-primary"
            placeholder={
              reviewActionRequiresNote
                ? t("documents.review.required_note")
                : t("documents.review.optional_note")
            }
            disabled={isSubmittingReview}
            maxLength={2000}
          />
        </div>
      </Modal>

      <DocumentViewerModal
        isOpen={!!selectedDocument}
        onClose={closeDocumentViewer}
        document={selectedDocument}
      />
    </>
  );
}
